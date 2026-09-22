// Dossiê PPOH de Biossegurança — exportação PDF e Excel (ANVISA / MAPA / FSSC 22000).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getCleanings,
  getUnitById,
  getPrefeituraById,
  formatDuracao,
  type Cleaning,
  type Unit,
} from "./oxyvra-store";
import {
  ALERGENO_META,
  TIPO_LIMPEZA_META,
  getNaoConformidades,
  getVerticalType,
  VERTICAL_TYPE_META,
  type TipoLimpeza,
} from "./oxyvra-industrial";

export type DossieParams = {
  unitId: string;
  inicio: number; // ms epoch
  fim: number; // ms epoch
  responsavelTecnico?: string;
  registroRt?: string; // CRQ / CRMV / CRF
  incluirFotos?: boolean;
};

type CleaningPpoh = Cleaning & { tipoLimpeza?: TipoLimpeza; dwellCumpridoSeg?: number };

function coletar(params: DossieParams) {
  const unit = getUnitById(params.unitId);
  if (!unit) throw new Error("Unidade não encontrada.");
  const pref = getPrefeituraById(unit.prefeituraId);
  const vt = getVerticalType(unit, pref);
  const cleanings = (getCleanings() as CleaningPpoh[])
    .filter((c) => c.unitId === unit.id && c.timestamp >= params.inicio && c.timestamp <= params.fim)
    .sort((a, b) => a.timestamp - b.timestamp);
  const ncs = getNaoConformidades(unit.id).filter(
    (n) => n.abertaEm >= params.inicio && n.abertaEm <= params.fim,
  );
  return { unit, pref, vt, cleanings, ncs };
}

function nomeLocal(unit: Unit, localId?: string): string {
  return (unit.locais ?? []).find((l) => l.id === localId)?.nome ?? "—";
}

function alergenosDoLocal(unit: Unit, localId?: string): string {
  const local = (unit.locais ?? []).find((l) => l.id === localId) as
    | { alergenos?: (keyof typeof ALERGENO_META)[] }
    | undefined;
  const tags = local?.alergenos ?? [];
  return tags.length ? tags.map((a) => ALERGENO_META[a].label).join(", ") : "—";
}

function periodoLabel(p: DossieParams) {
  const f = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");
  return `${f(p.inicio)} a ${f(p.fim)}`;
}

// ============================================================
// PDF
// ============================================================
export function gerarDossiePdf(params: DossieParams): void {
  const { unit, pref, vt, cleanings, ncs } = coletar(params);
  const meta = VERTICAL_TYPE_META[vt];
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFillColor(11, 34, 56);
  doc.rect(0, 0, 595, 96, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(10);
  doc.text("OXYVRA — DOSSIÊ PPOH DE BIOSSEGURANÇA", 40, 32);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`${unit.nomeCompleto || unit.nome}`, 40, 56);
  doc.setFontSize(10);
  doc.text(
    `${meta.label} • ${pref ? `${pref.nome}/${pref.uf}` : "—"} • Período: ${periodoLabel(params)}`,
    40,
    76,
  );

  let y = 124;
  doc.setTextColor(11, 34, 56);
  doc.setFontSize(13);
  doc.text("1. Resumo de conformidade", 40, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const aprov = cleanings.filter((c) => c.status === "aprovada").length;
  const reprov = cleanings.filter((c) => c.status === "reprovada").length;
  doc.text(
    [
      `Higienizações auditadas: ${cleanings.length}   Aprovadas: ${aprov}   Reprovadas: ${reprov}`,
      `Não-conformidades no período: ${ncs.length}   Linhas ainda bloqueadas: ${ncs.filter((n) => n.status !== "liberada").length}`,
      `Referência normativa: ANVISA RDC / MAPA-SIF / FSSC 22000 — registros com GPS, PIN e tempo de contato.`,
    ],
    40,
    y,
  );
  y += 56;

  doc.setFontSize(13);
  doc.setTextColor(11, 34, 56);
  doc.text("2. Timeline de higienizações por equipamento/linha", 40, y);
  autoTable(doc, {
    startY: y + 12,
    head: [["Data/hora UTC", "Equipamento/Zona", "Tipo", "Alérgenos", "Dwell", "Operador (PIN)", "GPS", "Status"]],
    body: cleanings.length
      ? cleanings.map((c) => [
          new Date(c.timestamp).toISOString().replace("T", " ").slice(0, 16),
          nomeLocal(unit, c.localId),
          c.tipoLimpeza ? TIPO_LIMPEZA_META[c.tipoLimpeza].label : c.ambiente,
          alergenosDoLocal(unit, c.localId),
          c.duracaoSeg != null ? formatDuracao(c.duracaoSeg) : "—",
          `${c.colaboradoraNome ?? c.servente} (${c.pinOperadora ? "••" + c.pinOperadora.slice(-2) : "—"})`,
          c.lat != null && c.lng != null ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : "—",
          (c.status ?? "pendente").toUpperCase(),
        ])
      : [["—", "Sem registros no período", "", "", "", "", "", ""]],
    headStyles: { fillColor: [11, 34, 56], textColor: [212, 175, 55], fontStyle: "bold" },
    styles: { fontSize: 7.5 },
    theme: "grid",
  });

  let last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = last + 24;
  if (y > 700) {
    doc.addPage();
    y = 60;
  }
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 56);
  doc.text("3. Não-conformidades e ações corretivas", 40, y);
  autoTable(doc, {
    startY: y + 12,
    head: [["Aberta em", "Equipamento", "Origem", "Ação corretiva", "Status", "Liberação"]],
    body: ncs.length
      ? ncs.map((n) => [
          new Date(n.abertaEm).toLocaleString("pt-BR"),
          n.localNome,
          n.origem,
          n.acaoCorretiva ?? "—",
          n.status.toUpperCase(),
          n.liberadaEm ? `${new Date(n.liberadaEm).toLocaleString("pt-BR")} (PIN ••)` : "—",
        ])
      : [["—", "Sem não-conformidades no período", "", "", "", ""]],
    headStyles: { fillColor: [11, 34, 56], textColor: [212, 175, 55], fontStyle: "bold" },
    styles: { fontSize: 8 },
    theme: "grid",
  });

  // 4. Anexo fotográfico com marca d'água (as fotos já são gravadas com overlay)
  if (params.incluirFotos !== false) {
    const comFoto = cleanings.filter((c) => c.fotoAntes || c.fotoDepois).slice(0, 12);
    if (comFoto.length) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(11, 34, 56);
      doc.text("4. Anexo fotográfico auditável (marca d'água: data/hora UTC, GPS, ID operador)", 40, 50);
      let py = 70;
      for (const c of comFoto) {
        if (py > 660) {
          doc.addPage();
          py = 60;
        }
        doc.setFontSize(8);
        doc.setTextColor(80);
        doc.text(
          `${nomeLocal(unit, c.localId)} • ${new Date(c.timestamp).toLocaleString("pt-BR")} • ${c.colaboradoraNome ?? c.servente}`,
          40,
          py,
        );
        py += 8;
        const imgs = [c.fotoAntes, c.fotoDepois].filter(Boolean) as string[];
        imgs.forEach((src, i) => {
          try {
            doc.addImage(src, "JPEG", 40 + i * 250, py, 230, 150);
          } catch {
            /* formato não suportado — ignora */
          }
        });
        py += 168;
      }
    }
  }

  // 5. Assinatura do RT
  doc.addPage();
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 56);
  doc.text("5. Declaração e assinatura do Responsável Técnico", 40, 60);
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(
    doc.splitTextToSize(
      `Declaro, para fins de auditoria sanitária, que os procedimentos padronizados de higiene operacional (PPOH) registrados neste dossiê foram executados e auditados eletronicamente pela plataforma Oxyvra, com quádrupla verificação antifraude (QR/NFC, registro fotográfico, tempo de contato e identificação por PIN do operador).`,
      515,
    ),
    40,
    86,
  );
  const hash = simpleHash(
    `${unit.id}|${params.inicio}|${params.fim}|${cleanings.length}|${ncs.length}`,
  );
  doc.text(`Responsável Técnico: ${params.responsavelTecnico || "____________________________"}`, 40, 190);
  doc.text(`Registro profissional: ${params.registroRt || "____________________"}`, 40, 212);
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 40, 234);
  doc.text(`Hash de integridade do documento: ${hash}`, 40, 256);
  doc.line(40, 320, 300, 320);
  doc.text("Assinatura digital / carimbo", 40, 334);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Oxyvra • Dossiê PPOH • ${unit.nome} • ${periodoLabel(params)} • pág. ${i}/${pages}`, 40, 820);
  }

  doc.save(`oxyvra-dossie-ppoh-${slug(unit.nome)}.pdf`);
}

// ============================================================
// Excel
// ============================================================
export function gerarDossieExcel(params: DossieParams): void {
  const { unit, pref, vt, cleanings, ncs } = coletar(params);
  const wb = XLSX.utils.book_new();

  const resumo = [
    ["Dossiê PPOH de Biossegurança — Oxyvra"],
    ["Unidade", unit.nomeCompleto || unit.nome],
    ["Organização", pref ? `${pref.nome}/${pref.uf}` : "—"],
    ["Vertical", VERTICAL_TYPE_META[vt].label],
    ["Período", periodoLabel(params)],
    ["Higienizações", cleanings.length],
    ["Aprovadas", cleanings.filter((c) => c.status === "aprovada").length],
    ["Reprovadas", cleanings.filter((c) => c.status === "reprovada").length],
    ["Não-conformidades", ncs.length],
    ["Responsável Técnico", params.responsavelTecnico ?? ""],
    ["Registro RT", params.registroRt ?? ""],
    ["Emitido em", new Date().toLocaleString("pt-BR")],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");

  const timeline = cleanings.map((c) => ({
    "Data/hora UTC": new Date(c.timestamp).toISOString(),
    "Equipamento/Zona": nomeLocal(unit, c.localId),
    "Tipo de limpeza": c.tipoLimpeza ? TIPO_LIMPEZA_META[c.tipoLimpeza].label : c.ambiente,
    Alérgenos: alergenosDoLocal(unit, c.localId),
    "Dwell-time (s)": c.duracaoSeg ?? "",
    "Checklist itens": (c.itensFeitos ?? []).length,
    Operador: c.colaboradoraNome ?? c.servente,
    "PIN confirmado": c.pinOperadora ? "SIM" : "NÃO",
    "QR/NFC validado": c.qrValidado ? "SIM" : "NÃO",
    Latitude: c.lat ?? "",
    Longitude: c.lng ?? "",
    "Fora da área": c.foraDaArea ? "SIM" : "NÃO",
    "Foto antes": c.fotoAntes ? "SIM" : "NÃO",
    "Foto depois": c.fotoDepois ? "SIM" : "NÃO",
    Status: (c.status ?? "pendente").toUpperCase(),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timeline), "Timeline");

  const nc = ncs.map((n) => ({
    "Aberta em": new Date(n.abertaEm).toLocaleString("pt-BR"),
    Equipamento: n.localNome,
    Origem: n.origem,
    Descrição: n.descricao,
    "Ação corretiva": n.acaoCorretiva ?? "",
    Status: n.status.toUpperCase(),
    "Responsável QA": n.responsavelQa ?? "",
    "Liberada em": n.liberadaEm ? new Date(n.liberadaEm).toLocaleString("pt-BR") : "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nc.length ? nc : [{ Info: "Sem não-conformidades" }]), "Nao-Conformidades");

  XLSX.writeFile(wb, `oxyvra-dossie-ppoh-${slug(unit.nome)}.xlsx`);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function simpleHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}
