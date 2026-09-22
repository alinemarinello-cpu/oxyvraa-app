// Relatório PDF "Gestão da Adequação — RDC Anvisa nº 1.002/2025".
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AVISO_RDC,
  type Evidencia,
  type ItemPlano,
  type ResumoScore,
  type Risco,
  type Snapshot,
} from "@/lib/rdc-db";

const navy: [number, number, number] = [11, 34, 56];
const gold: [number, number, number] = [212, 175, 55];

const dataBr = (v: string | null | undefined) =>
  v ? new Date(v.length <= 10 ? `${v}T12:00:00` : v).toLocaleDateString("pt-BR") : "—";

export type DadosRelatorio = {
  clinica: string;
  unidade: string;
  responsavel: string;
  resumo: ResumoScore;
  itens: ItemPlano[];
  evidencias: Evidencia[];
  riscos: Risco[];
  historico: Snapshot[];
  marcaDagua?: boolean;
};

export function gerarRelatorioRdc(d: DadosRelatorio): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const larg = doc.internal.pageSize.getWidth();

  doc.setFillColor(...navy);
  doc.rect(0, 0, larg, 96, "F");
  doc.setTextColor(...gold);
  doc.setFontSize(10);
  doc.text("OXYVRA CONFORMIDADE", 40, 34);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("RELATÓRIO DE GESTÃO DA ADEQUAÇÃO", 40, 58);
  doc.setFontSize(12);
  doc.text("RDC ANVISA Nº 1.002/2025", 40, 78);

  let y = 126;
  doc.setTextColor(...navy);
  doc.setFontSize(11);
  doc.text(d.clinica, 40, y);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  y += 14;
  doc.text(`Unidade: ${d.unidade}`, 40, y);
  y += 12;
  doc.text(`Responsável: ${d.responsavel || "—"}`, 40, y);
  y += 12;
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 40, y);

  y += 26;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, y - 16, larg - 80, 54, 8, 8, "F");
  doc.setTextColor(...navy);
  doc.setFontSize(22);
  doc.text(`${d.resumo.score}%`, 56, y + 14);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Índice de conformidade — ${d.resumo.avaliados} requisitos aplicáveis avaliados`,
    120,
    y + 4,
  );
  doc.text(
    `Pendências: ${d.resumo.pendencias} · Não conformes: ${d.resumo.naoConformes} · Ações atrasadas: ${d.resumo.atrasadas}`,
    120,
    y + 20,
  );
  y += 60;

  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Requisitos", "Conformes", "Score"]],
    body: d.resumo.categorias.map((c) => [
      c.categoria,
      String(c.total),
      String(c.conformes),
      `${c.score}%`,
    ]),
    headStyles: { fillColor: navy, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: 40, right: 40 },
  });

  autoTable(doc, {
    head: [["Cód.", "Requisito", "Artigo", "Status", "Responsável", "Prazo"]],
    body: d.itens.map((i) => [
      i.codigo,
      i.titulo,
      i.artigo ?? "—",
      i.status,
      i.responsavel ?? "—",
      dataBr(i.prazo),
    ]),
    headStyles: { fillColor: navy, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: { 1: { cellWidth: 190 } },
    margin: { left: 40, right: 40 },
  });

  if (d.riscos.length) {
    autoTable(doc, {
      head: [["Risco", "Setor", "Criticidade", "Ação preventiva", "Prazo", "Status"]],
      body: d.riscos.map((r) => [
        r.risco,
        r.setor ?? "—",
        String(r.criticidade),
        r.acao_preventiva ?? "—",
        dataBr(r.prazo),
        r.status,
      ]),
      headStyles: { fillColor: navy, textColor: 255 },
      styles: { fontSize: 7.5, cellPadding: 3 },
      margin: { left: 40, right: 40 },
    });
  }

  if (d.evidencias.length) {
    autoTable(doc, {
      head: [["Evidência", "Vínculo", "Requisito", "Responsável", "Data"]],
      body: d.evidencias
        .slice(0, 120)
        .map((e) => [
          e.titulo,
          e.vinculo_tipo,
          e.requisito_codigo ?? "—",
          e.responsavel ?? "—",
          dataBr(e.created_at),
        ]),
      headStyles: { fillColor: navy, textColor: 255 },
      styles: { fontSize: 7.5, cellPadding: 3 },
      margin: { left: 40, right: 40 },
    });
  }

  if (d.historico.length) {
    autoTable(doc, {
      head: [["Mês de referência", "Índice de conformidade"]],
      body: d.historico.map((s) => [dataBr(s.referencia), `${s.score}%`]),
      headStyles: { fillColor: navy, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 40, right: 40 },
    });
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    const alt = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(AVISO_RDC, 40, alt - 28, { maxWidth: larg - 80 });
    doc.text(`Página ${p} de ${total}`, larg - 90, alt - 12);
    if (d.marcaDagua) {
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(28);
      doc.text("TESTE — SEM VALIDADE SANITÁRIA", larg / 2, alt / 2, {
        align: "center",
        angle: 32,
      });
    }
  }

  doc.save(`oxyvra-rdc-1002-2025-${new Date().toISOString().slice(0, 10)}.pdf`);
}
