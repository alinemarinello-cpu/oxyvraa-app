// Dossiê consolidado do município para TCE, Ministério Público e Vigilância Sanitária.
import jsPDF from "jspdf";
import { aplicarMarcaDaguaTeste } from "@/lib/marca-dagua-pdf";
import autoTable from "jspdf-autotable";
import type { Agrupamento, AlertaMunicipal, EquipamentoPublico } from "@/lib/prefeituras-db";

export type DossieMunicipalParams = {
  municipio: string;
  periodoDias: number;
  conformidadeGeral: number | null;
  totalExecucoes: number;
  totalNaoConformes: number;
  porSecretaria: Agrupamento[];
  porBairro: Agrupamento[];
  equipamentos: (EquipamentoPublico & { secretaria: string; conformidade: number | null })[];
  alertas: AlertaMunicipal[];
  responsavel?: string;
  marcaDagua?: boolean;
};

const pct = (v: number | null) => (v === null ? "sem execuções" : `${v}%`);

export function gerarDossieMunicipal(p: DossieMunicipalParams): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const agora = new Date();
  const largura = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 34, 56);
  doc.rect(0, 0, largura, 90, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18);
  doc.text("DOSSIÊ DE GESTÃO SANITÁRIA MUNICIPAL", 40, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${p.municipio} · últimos ${p.periodoDias} dias`, 40, 62);
  doc.setFontSize(9);
  doc.text(
    `Emitido em ${agora.toLocaleString("pt-BR")} — documento para TCE, Ministério Público e Vigilância Sanitária`,
    40,
    78,
  );

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(
    [
      `Conformidade sanitária geral: ${pct(p.conformidadeGeral)}`,
      `Checklists executados no período: ${p.totalExecucoes}`,
      `Itens não conformes registrados: ${p.totalNaoConformes}`,
      `Equipamentos públicos monitorados: ${p.equipamentos.length}`,
      p.responsavel ? `Responsável pelas informações: ${p.responsavel}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    40,
    120,
  );

  autoTable(doc, {
    startY: 210,
    head: [["Secretaria", "Equipamentos", "Execuções", "Não conformes", "Conformidade"]],
    body: p.porSecretaria.map((s) => [
      s.rotulo,
      String(s.unidades),
      String(s.execucoes),
      String(s.naoConformes),
      pct(s.conformidade),
    ]),
    headStyles: { fillColor: [11, 34, 56] },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    head: [["Bairro", "Equipamentos", "Execuções", "Não conformes", "Conformidade"]],
    body: p.porBairro.map((s) => [
      s.rotulo,
      String(s.unidades),
      String(s.execucoes),
      String(s.naoConformes),
      pct(s.conformidade),
    ]),
    headStyles: { fillColor: [11, 34, 56] },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    head: [["Equipamento público", "Secretaria", "Bairro", "Ambientes", "Conformidade"]],
    body: p.equipamentos.map((e) => [
      e.nome,
      e.secretaria,
      e.bairro || "—",
      String(e.locais.length || e.ambientes.length),
      pct(e.conformidade),
    ]),
    headStyles: { fillColor: [11, 34, 56] },
    styles: { fontSize: 8 },
  });

  if (p.alertas.length) {
    autoTable(doc, {
      head: [["Data", "Severidade", "Alerta", "Detalhe"]],
      body: p.alertas
        .slice(0, 40)
        .map((a) => [
          new Date(a.created_at).toLocaleString("pt-BR"),
          a.severidade,
          a.titulo,
          a.mensagem,
        ]),
      headStyles: { fillColor: [153, 27, 27] },
      styles: { fontSize: 8 },
    });
  }

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Oxyvra Biossegurança — registros com data, hora, GPS e responsável · página ${i}/${paginas}`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  if (p.marcaDagua) aplicarMarcaDaguaTeste(doc);
  doc.save(
    `dossie-municipal-${p.municipio.toLowerCase().replace(/\s+/g, "-")}-${agora.toISOString().slice(0, 10)}.pdf`,
  );
}
