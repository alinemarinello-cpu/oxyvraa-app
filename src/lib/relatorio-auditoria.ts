// Relatório PDF de auditoria: consolida execuções de checklists, vincula cada registro
// ao POP cadastrado e agrega ciclos de autoclave e documentos SDBPF (prova para fiscalização).
import jsPDF from "jspdf";
import { aplicarMarcaDaguaTeste } from "@/lib/marca-dagua-pdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import {
  listarAplicacoes,
  listarCiclos,
  listarDocumentos,
  listarPops,
  ROTULO_LOTE,
} from "@/lib/biosseguranca-db";
import { listarExecucoes, listarRespostas, listarChecklists } from "@/lib/compliance-db";
import { listarUnidades } from "@/lib/painel-db";
import { listarEquipamentos, proximaLimpeza, statusEquipamento } from "@/lib/pmoc-db";
import { listarHigienizacoes, listarSuites, STATUS_SUITE, type StatusSuite } from "@/lib/suites-db";

export type OpcoesRelatorio = {
  organizacaoNome: string;
  dias: number;
  unitId?: string;
  marcaDagua?: boolean;
};

export async function gerarRelatorioAuditoria(op: OpcoesRelatorio) {
  const [execucoes, unidades, checklists, pops, ciclos, documentos, aplicacoes] = await Promise.all(
    [
      listarExecucoes(op.dias),
      listarUnidades(),
      listarChecklists(),
      listarPops(),
      listarCiclos(op.dias),
      listarDocumentos(),
      listarAplicacoes(op.dias),
    ],
  );

  const { data: checklistPops } = await supabase.from("checklists").select("id, pop_id");
  const popPorChecklist = new Map((checklistPops ?? []).map((c) => [c.id, c.pop_id]));

  const filtradas = op.unitId ? execucoes.filter((e) => e.unit_id === op.unitId) : execucoes;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const larg = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 34, 56);
  doc.rect(0, 0, larg, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text("Relatório de Auditoria Sanitária — Oxyvra", 40, 38);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(
    `${op.organizacaoNome} · últimos ${op.dias} dias · emitido em ${new Date().toLocaleString("pt-BR")}`,
    40,
    58,
  );
  doc.setTextColor(20, 20, 20);

  const itens = filtradas.reduce((s, e) => s + e.total_itens, 0);
  const conformes = filtradas.reduce((s, e) => s + e.total_conformes, 0);
  const conformidade = itens ? Math.round((conformes / itens) * 100) : 0;

  doc.setFontSize(11).setFont("helvetica", "bold");
  doc.text(
    `Execuções: ${filtradas.length}   |   Itens verificados: ${itens}   |   Conformidade: ${conformidade}%`,
    40,
    110,
  );

  autoTable(doc, {
    startY: 126,
    head: [["Data", "Unidade", "Checklist / POP", "Executor", "Conformes", "NC"]],
    body: filtradas.map((e) => {
      const unidade = unidades.find((u) => u.id === e.unit_id);
      const chk = checklists.find((c) => c.id === e.checklist_id);
      const pop = pops.find((p) => p.id === popPorChecklist.get(e.checklist_id));
      return [
        new Date(e.iniciada_em).toLocaleString("pt-BR"),
        unidade?.nome ?? "—",
        `${chk?.titulo ?? "Checklist"}${pop ? `\nPOP ${pop.codigo} — ${pop.titulo}` : ""}`,
        e.executor_nome || "—",
        String(e.total_conformes),
        String(e.total_nao_conformes),
      ];
    }),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [13, 148, 136] },
  });

  // Não conformidades detalhadas (com evidência e carimbo)
  const detalhes: string[][] = [];
  for (const e of filtradas.slice(0, 40)) {
    const respostas = await listarRespostas(e.id);
    for (const r of respostas) {
      if (r.conforme === false || r.fora_do_limite) {
        const unidade = unidades.find((u) => u.id === e.unit_id);
        detalhes.push([
          new Date(r.registrado_em).toLocaleString("pt-BR"),
          unidade?.nome ?? "—",
          r.pergunta,
          r.fora_do_limite ? `Fora da faixa (${r.valor_numero ?? "—"})` : "Não conforme",
          r.foto ? "Sim" : "Não",
        ]);
      }
    }
  }

  if (detalhes.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Não conformidades registradas", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Data/hora", "Unidade", "Item verificado", "Motivo", "Evidência"]],
      body: detalhes,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [190, 60, 60] },
    });
  }

  if (ciclos.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Ciclos de esterilização (RDC 15/2012)", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Data", "Lote", "Equipamento", "T (°C)", "Operador", "Situação do lote"]],
      body: ciclos.map((c) => [
        new Date(c.iniciado_em).toLocaleString("pt-BR"),
        c.lote,
        c.equipamento || "—",
        String(c.temperatura ?? "—"),
        c.operador_nome || "—",
        ROTULO_LOTE[c.status] ?? c.status,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [13, 148, 136] },
    });
  }

  if (documentos.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Documentos SDBPF vigentes", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Documento", "Categoria", "Número", "Emissor", "Validade"]],
      body: documentos.map((d) => [
        d.titulo,
        d.categoria,
        d.numero ?? "—",
        d.orgao_emissor ?? "—",
        d.expires_at
          ? new Date(`${d.expires_at}T12:00:00`).toLocaleDateString("pt-BR")
          : "Sem validade",
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [11, 34, 56] },
    });
  }

  const equipamentos = await listarEquipamentos().catch(() => []);
  if (equipamentos.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("PMOC — Climatização (Lei 13.589/2018)", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Unidade", "Tag / ambiente", "Tipo", "Última limpeza", "Próxima", "Status", "RT"]],
      body: equipamentos.map((e) => {
        const unidade = unidades.find((u) => u.id === e.unit_id);
        return [
          unidade?.nome ?? "—",
          `${e.identificacao} · ${e.ambiente}`,
          e.tipo,
          e.ultima_limpeza ?? "—",
          proximaLimpeza(e) ?? "—",
          statusEquipamento(e).label,
          e.responsavel_tecnico || "—",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [11, 34, 56] },
    });
  }

  const comAlvara = unidades.filter((u) => u.alvara_sanitario_expiracao || u.responsavel_tecnico);
  if (comAlvara.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Licenciamento sanitário e responsabilidade técnica", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Unidade", "Alvará nº", "Vencimento", "Responsável técnico", "Conselho"]],
      body: comAlvara.map((u) => [
        u.nome,
        u.alvara_sanitario_numero ?? "—",
        u.alvara_sanitario_expiracao
          ? new Date(`${u.alvara_sanitario_expiracao}T12:00:00`).toLocaleDateString("pt-BR")
          : "—",
        u.responsavel_tecnico ?? "—",
        u.conselho_rt ?? "—",
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [11, 34, 56] },
    });
  }

  if (aplicacoes.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Rastreabilidade de injetáveis e insumos aplicados", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [
        ["Data", "Unidade", "Procedimento", "Produto / marca", "Lote", "Validade", "Profissional"],
      ],
      body: aplicacoes.map((a) => {
        const unidade = unidades.find((u) => u.id === a.unit_id);
        return [
          new Date(a.aplicado_em).toLocaleString("pt-BR"),
          unidade?.nome ?? "—",
          a.procedimento,
          `${a.produto}${a.marca ? ` (${a.marca})` : ""}`,
          a.lote,
          a.validade
            ? new Date(`${a.validade}T12:00:00`).toLocaleDateString("pt-BR")
            : "—",
          `${a.profissional_nome}${a.profissional_registro ? ` · ${a.profissional_registro}` : ""}`,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [13, 148, 136] },
    });
  }

  const suites = await listarSuites(op.unitId).catch(() => []);
  const giros = await listarHigienizacoes(op.dias, op.unitId).catch(() => []);
  if (giros.length) {
    doc.addPage();
    doc.setFontSize(13).setFont("helvetica", "bold");
    doc.text("Sanitização de suítes e hidromassagens (Portaria MS 888/2021)", 40, 48);
    autoTable(doc, {
      startY: 64,
      head: [["Início", "Conclusão", "Suíte", "Responsável", "QR", "Hidro", "Cloro (mg/L)", "Status"]],
      body: giros.map((h) => {
        const s = suites.find((x) => x.id === h.suite_id);
        return [
          new Date(h.iniciada_em).toLocaleString("pt-BR"),
          h.concluida_em ? new Date(h.concluida_em).toLocaleString("pt-BR") : "—",
          s?.identificacao ?? "—",
          h.colaboradora_nome || "—",
          h.qr_validado ? "validado" : "manual",
          h.hidro_sanitizada ? "sim" : "—",
          h.cloro_residual ?? "—",
          STATUS_SUITE[(h.status_final as StatusSuite) ?? "disponivel"]?.label ?? h.status_final,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [13, 148, 136] },
    });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(120);
    doc.text(
      `Oxyvra Biossegurança · documento gerado eletronicamente · página ${i}/${total}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  if (op.marcaDagua) aplicarMarcaDaguaTeste(doc);
  doc.save(`auditoria-oxyvra-${new Date().toISOString().slice(0, 10)}.pdf`);
}
