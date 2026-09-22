// Geração de Relatório PDF Mensal por Prefeitura (Onda 2).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getCleanings,
  getIncidentes,
  getUnits,
  getPrefeituraById,
  computeUnitScore,
  formatDuracao,
  INCIDENTE_META,
  UNIT_TIPO_META,
  type Prefeitura,
} from "./oxyvra-store";

function nomeMes(mes: number): string {
  return ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][mes] ?? "";
}

export function gerarRelatorioMensalPref(prefeituraId: string, ano: number, mes: number): void {
  const pref = getPrefeituraById(prefeituraId);
  if (!pref) throw new Error("Prefeitura não encontrada.");
  const inicio = new Date(ano, mes, 1).getTime();
  const fim = new Date(ano, mes + 1, 1).getTime();
  const units = getUnits().filter((u) => u.prefeituraId === prefeituraId);
  const cleanings = getCleanings().filter(
    (c) => c.prefeituraId === prefeituraId && c.timestamp >= inicio && c.timestamp < fim,
  );
  const incidentes = getIncidentes().filter(
    (i) => i.prefeituraId === prefeituraId && i.timestamp >= inicio && i.timestamp < fim,
  );

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Cabeçalho
  doc.setFillColor(11, 34, 56);
  doc.rect(0, 0, 595, 90, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(10);
  doc.text("OXYVRA BIOSSEGURANÇA — RELATÓRIO MENSAL", 40, 34);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`${pref.nome}/${pref.uf}`, 40, 58);
  doc.setFontSize(11);
  doc.text(`${nomeMes(mes)} de ${ano}`, 40, 76);

  let y = 120;
  doc.setTextColor(11, 34, 56);
  doc.setFontSize(13);
  doc.text("Resumo Executivo", 40, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const totalLimpezas = cleanings.length;
  const aprov = cleanings.filter((c) => c.status === "aprovada").length;
  const reprov = cleanings.filter((c) => c.status === "reprovada").length;
  const foraArea = cleanings.filter((c) => c.foraDaArea).length;
  doc.text(
    [
      `Unidades atendidas: ${units.length}`,
      `Total de higienizações: ${totalLimpezas}   Aprovadas: ${aprov}   Reprovadas: ${reprov}   Fora da área: ${foraArea}`,
      `Intercorrências reportadas: ${incidentes.length}`,
    ],
    40,
    y,
  );
  y += 56;

  // Tabela: performance por unidade
  autoTable(doc, {
    startY: y,
    head: [["Unidade", "Tipo", "Bairro", "Higienizações", "Reprov.", "Score atual"]],
    body: units.map((u) => {
      const doUnit = cleanings.filter((c) => c.unitId === u.id);
      const s = computeUnitScore(u.id);
      return [
        u.nome,
        UNIT_TIPO_META[u.tipo].label,
        u.bairro,
        String(doUnit.length),
        String(doUnit.filter((c) => c.status === "reprovada").length),
        `${s.score}/100`,
      ];
    }),
    headStyles: { fillColor: [11, 34, 56], textColor: [212, 175, 55], fontStyle: "bold" },
    styles: { fontSize: 9 },
    theme: "grid",
  });

  // Intercorrências
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y = finalY + 24;
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 56);
  doc.text("Intercorrências do período", 40, y);
  y += 8;
  autoTable(doc, {
    startY: y + 6,
    head: [["Data", "Unidade", "Tipo", "Qtd", "Descrição"]],
    body: incidentes.length
      ? incidentes.map((i) => {
          const u = units.find((x) => x.id === i.unitId);
          return [
            new Date(i.timestamp).toLocaleDateString("pt-BR"),
            u?.nome ?? "—",
            INCIDENTE_META[i.tipo].label,
            String(i.quantidade),
            i.descricao || "—",
          ];
        })
      : [["—", "Sem intercorrências no período", "", "", ""]],
    headStyles: { fillColor: [11, 34, 56], textColor: [212, 175, 55], fontStyle: "bold" },
    styles: { fontSize: 9 },
    theme: "grid",
  });

  // Últimas higienizações
  const finalY2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  if (finalY2 > 700) doc.addPage();
  y = finalY2 > 700 ? 60 : finalY2 + 24;
  doc.setFontSize(13);
  doc.setTextColor(11, 34, 56);
  doc.text("Últimas higienizações registradas", 40, y);
  autoTable(doc, {
    startY: y + 10,
    head: [["Data / hora", "Unidade", "Ambiente", "Servente", "Duração", "Status"]],
    body: cleanings
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40)
      .map((c) => {
        const u = units.find((x) => x.id === c.unitId);
        return [
          new Date(c.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
          u?.nome ?? "—",
          c.ambiente,
          c.servente,
          c.duracaoSeg != null ? formatDuracao(c.duracaoSeg) : "—",
          (c.status ?? "pendente").toUpperCase(),
        ];
      }),
    headStyles: { fillColor: [11, 34, 56], textColor: [212, 175, 55], fontStyle: "bold" },
    styles: { fontSize: 8 },
    theme: "grid",
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Oxyvra Biossegurança • ${pref.nome}/${pref.uf} • ${nomeMes(mes)}/${ano} • pág. ${i}/${pages}`,
      40,
      820,
    );
  }

  const nomeSlug = `${pref.nome}-${pref.uf}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`oxyvra-relatorio-${nomeSlug}-${ano}-${String(mes + 1).padStart(2, "0")}.pdf`);
}

// Re-export type for callers
export type { Prefeitura };
