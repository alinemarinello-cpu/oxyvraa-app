// Dossiê Sanitário de academias e centros esportivos, para apresentação imediata à VISA.
import jsPDF from "jspdf";
import { aplicarMarcaDaguaTeste } from "@/lib/marca-dagua-pdf";
import autoTable from "jspdf-autotable";
import {
  AREAS_ACADEMIA,
  FAIXA_CLORO,
  FAIXA_PH,
  statusLaudo,
  type AreaAcademia,
  type HigienizacaoAcademia,
  type LaudoAr,
  type MedicaoAgua,
  type TipoAreaAcademia,
} from "@/lib/academias-db";

export type DossieAcademiaParams = {
  unidade: string;
  cidade: string;
  periodoDias: number;
  areas: AreaAcademia[];
  higienizacoes: HigienizacaoAcademia[];
  medicoes: MedicaoAgua[];
  laudos: LaudoAr[];
  responsavel?: string;
  marcaDagua?: boolean;
};

const dataHora = (v: string | null) => (v ? new Date(v).toLocaleString("pt-BR") : "sem registro");

export function gerarDossieAcademia(p: DossieAcademiaParams): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const agora = new Date();

  doc.setFillColor(11, 34, 56);
  doc.rect(0, 0, largura, 92, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18);
  doc.text("DOSSIÊ SANITÁRIO — ACADEMIA / CENTRO ESPORTIVO", 40, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${p.unidade}${p.cidade ? ` · ${p.cidade}` : ""} · últimos ${p.periodoDias} dias`, 40, 62);
  doc.setFontSize(9);
  doc.text(
    `Emitido em ${agora.toLocaleString("pt-BR")} — documento para Vigilância Sanitária (VISA)`,
    40,
    80,
  );

  const foraFaixa = p.medicoes.filter((m) => m.fora_faixa).length;
  const laudosCriticos = p.laudos.filter((l) => statusLaudo(l).critico).length;

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(
    [
      `Áreas monitoradas: ${p.areas.length}`,
      `Higienizações registradas no período: ${p.higienizacoes.length}`,
      `Medições de água no período: ${p.medicoes.length} (${foraFaixa} fora da faixa)`,
      `Faixas exigidas: cloro ${FAIXA_CLORO.min}–${FAIXA_CLORO.max} mg/L · pH ${FAIXA_PH.min}–${FAIXA_PH.max}`,
      `Laudos do ar vencidos ou a vencer em 30 dias: ${laudosCriticos}`,
      p.responsavel ? `Responsável pelas informações: ${p.responsavel}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    40,
    122,
  );

  autoTable(doc, {
    startY: 220,
    head: [["Área", "Divisão", "Produto obrigatório", "Kit", "Última higienização", "Responsável"]],
    body: p.areas.map((a) => [
      a.nome,
      AREAS_ACADEMIA[a.tipo as TipoAreaAcademia]?.label ?? a.tipo,
      a.produto_obrigatorio,
      a.cor_kit,
      dataHora(a.ultima_higienizacao),
      a.ultimo_responsavel || "—",
    ]),
    headStyles: { fillColor: [11, 34, 56] },
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    head: [["Data", "Local", "Cloro (mg/L)", "pH", "Temp. (°C)", "Responsável", "Situação"]],
    body: p.medicoes
      .slice(0, 60)
      .map((m) => [
        new Date(m.medido_em).toLocaleString("pt-BR"),
        m.corpo_dagua,
        m.cloro_mg_l ?? "—",
        m.ph ?? "—",
        m.temperatura ?? "—",
        m.responsavel || "—",
        m.fora_faixa ? "FORA DA FAIXA" : "conforme",
      ]),
    headStyles: { fillColor: [13, 148, 136] },
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    head: [["Laudo do ar", "Responsável técnico", "ART", "Emissão", "Validade", "Situação"]],
    body: p.laudos.map((l) => [
      l.tipo === "art" ? "ART / laudo técnico" : "Análise microbiológica do ar",
      l.responsavel_tecnico,
      l.registro_art || "—",
      new Date(`${l.emitido_em}T12:00:00`).toLocaleDateString("pt-BR"),
      l.expira_em ? new Date(`${l.expira_em}T12:00:00`).toLocaleDateString("pt-BR") : "—",
      statusLaudo(l).label,
    ]),
    headStyles: { fillColor: [120, 53, 15] },
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    head: [["Data", "Área", "Produto", "Kit", "Tempo de contato", "Responsável"]],
    body: p.higienizacoes
      .slice(0, 80)
      .map((h) => [
        new Date(h.concluida_em).toLocaleString("pt-BR"),
        p.areas.find((a) => a.id === h.area_id)?.nome ?? "—",
        h.produto || "—",
        h.cor_kit || "—",
        h.dwell_segundos ? `${Math.round(h.dwell_segundos / 60)} min` : "—",
        h.responsavel || "—",
      ]),
    headStyles: { fillColor: [11, 34, 56] },
    styles: { fontSize: 8 },
  });

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Oxyvra Biossegurança — registros com data, hora e responsável · página ${i}/${paginas}`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  if (p.marcaDagua) aplicarMarcaDaguaTeste(doc);
  doc.save(`dossie-academia-${p.unidade.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
