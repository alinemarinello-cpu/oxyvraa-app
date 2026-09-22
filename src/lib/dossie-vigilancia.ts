// Gerador da "Pasta da Vigilância": dossiê PDF com POPs, checklists, ciclos de
// autoclave, testes biológicos e pendências do período.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import {
  AVISO_LEGAL,
  ROTULO_FREQUENCIA,
  ZONAS,
  biologicoAtrasado,
  listarChecklists,
  listarDocumentosPasta,
  situacaoLicenca,
  type DocumentoPasta,
  listarCiclosAutoclave,
  listarTestesBiologicos,
  listarCheckpoints,
  guardarPdfDossie,
  obterPerfil,
  registrarDocumento,
  resumirConformidade,
  sha256,
  urlAssinada,
  type Frequency,
  type ZoneType,
} from "@/lib/saude-conformidade-db";

export type PlanoDossie = "TRIAL_14" | "BLINDADO";

export type DateRange = { start: string; end: string };

/** POPs padrão vigentes anexados ao dossiê (Seção B). */
export const POPS_PADRAO: { codigo: string; titulo: string; resumo: string }[] = [
  {
    codigo: "POP-01",
    titulo: "Higienização das mãos",
    resumo:
      "Higienizar com água e sabonete líquido por 40–60 s ou fricção antisséptica por 20–30 s antes e depois de cada atendimento, antes de calçar e após retirar luvas.",
  },
  {
    codigo: "POP-02",
    titulo: "Limpeza e desinfecção de superfícies e equipo",
    resumo:
      "Retirar barreiras descartáveis, limpar com detergente, desinfetar com saneante regularizado respeitando o tempo de contato indicado no rótulo, secar e recolocar barreiras.",
  },
  {
    codigo: "POP-03",
    titulo: "Processamento de produtos para saúde (expurgo → área limpa)",
    resumo:
      "Fluxo unidirecional sujo→limpo: limpeza com detergente enzimático, enxágue, secagem, inspeção, embalagem com identificação de lote e data, esterilização e guarda em área limpa e seca.",
  },
  {
    codigo: "POP-04",
    titulo: "Operação e monitoramento da autoclave (RDC 1.002/2025)",
    resumo:
      "Registrar em cada ciclo: data/hora, lote, identificação do equipamento, parâmetros físicos, indicador químico Tipo 5/6, relação de pacotes e operador, com foto do integrador. Lote reprovado é bloqueado e reprocessado.",
  },
  {
    codigo: "POP-05",
    titulo: "Monitoramento biológico semanal",
    resumo:
      "Realizar teste biológico ao menos uma vez por semana, registrar lote do indicador e resultado. Resultado positivo interdita o equipamento até nova validação.",
  },
  {
    codigo: "POP-06",
    titulo: "Gerenciamento de resíduos (PGRSS — RDC 222/2018)",
    resumo:
      "Segregação na origem, saco branco leitoso para o grupo A, caixa rígida para perfurocortantes preenchida até 2/3, abrigo externo trancado e comprovantes de coleta arquivados.",
  },
];

const navy: [number, number, number] = [11, 34, 56];
const gold: [number, number, number] = [212, 175, 55];

const dataBr = (v: string | null | undefined) =>
  v ? new Date(v.length <= 10 ? `${v}T12:00:00` : v).toLocaleString("pt-BR") : "—";

async function caminhoParaDataUrl(caminho: string): Promise<string | null> {
  try {
    const url = await urlAssinada(caminho);
    if (!url) return null;
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function marcaDaguaTeste(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    // @ts-expect-error GState existe em runtime no jsPDF
    doc.setGState(new doc.GState({ opacity: 0.16 }));
    doc.setTextColor(200, 0, 0);
    doc.setFontSize(34);
    doc.text("TESTE — SEM VALIDADE SANITÁRIA", w / 2, h / 2, { align: "center", angle: 35 });
    doc.restoreGraphicsState();
  }
}

function rodape(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(AVISO_LEGAL, 40, doc.internal.pageSize.getHeight() - 28, { maxWidth: 500 });
    doc.text(
      `página ${i}/${total}`,
      doc.internal.pageSize.getWidth() - 70,
      doc.internal.pageSize.getHeight() - 20,
    );
  }
}

/**
 * Compila a Pasta da Vigilância do período e baixa o PDF.
 * Retorna o código de autenticidade (SHA-256) do documento.
 */
export async function generateVigilanciaDossierPDF(
  organizationId: string,
  dateRange: DateRange,
  plan: PlanoDossie = "TRIAL_14",
): Promise<string> {
  const inicio = new Date(`${dateRange.start}T00:00:00`).getTime();
  const fim = new Date(`${dateRange.end}T23:59:59`).getTime();
  const dias = Math.max(1, Math.ceil((Date.now() - inicio) / 86_400_000));

  const [perfil, checkpoints, logsTodos, ciclosTodos, testes, documentos] = await Promise.all([
    obterPerfil(),
    listarCheckpoints(),
    listarChecklists(Math.max(30, dias)),
    listarCiclosAutoclave(Math.max(90, dias)),
    listarTestesBiologicos(8),
    listarDocumentosPasta().catch((): DocumentoPasta[] => []),
  ]);

  const anexos = documentos.filter((d) => d.kind === "ANEXO");

  const noPeriodo = <T>(lista: T[], campo: (x: T) => string) =>
    lista.filter((x) => {
      const t = new Date(campo(x)).getTime();
      return t >= inicio && t <= fim;
    });

  const logs = noPeriodo(logsTodos, (l) => l.timestamp_gps);
  const ciclos = noPeriodo(ciclosTodos, (c) => c.cycle_date_time);
  const resumo = resumirConformidade(logs, ciclos, testes, anexos);

  const geradoEm = new Date();
  const assinaturaTexto = JSON.stringify({
    organizationId,
    dateRange,
    geradoEm: geradoEm.toISOString(),
    logs: logs.map((l) => l.id),
    ciclos: ciclos.map((c) => c.id),
    testes: testes.map((t) => t.id),
  });
  const hash = await sha256(assinaturaTexto);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();

  /* -------------------------------- Capa -------------------------------- */
  doc.setFillColor(...navy);
  doc.rect(0, 0, largura, 160, "F");
  doc.setTextColor(...gold);
  doc.setFontSize(11);
  doc.text("OXYVRA CONFORMIDADE — SAÚDE E ESTÉTICA", 40, 46);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("PASTA DA VIGILÂNCIA", 40, 80);
  doc.setFontSize(12);
  doc.text(perfil?.clinic_name ?? "Estabelecimento", 40, 104);
  doc.setFontSize(10);
  doc.text(
    `${perfil?.address ?? ""}${perfil?.city ? ` — ${perfil.city}/${perfil.uf}` : ""}`,
    40,
    122,
  );
  doc.text(
    `Período: ${new Date(`${dateRange.start}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${dateRange.end}T12:00:00`).toLocaleDateString("pt-BR")} · gerado em ${geradoEm.toLocaleString("pt-BR")}`,
    40,
    140,
  );

  if (plan === "BLINDADO") {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/validar/${hash}`;
    const qr = await QRCode.toDataURL(url, { margin: 0, width: 240 });
    doc.addImage(qr, "PNG", largura - 130, 32, 90, 90);
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("Validar autenticidade", largura - 130, 134);
  }

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(
    [
      `Responsável técnico: ${perfil?.rt_name ?? "—"} (${perfil?.rt_council ?? "CRO"} ${perfil?.rt_number ?? "—"})`,
      `CNPJ: ${perfil?.cnpj ?? "—"}`,
      `Autoclave: ${perfil?.autoclave_brand_model ?? "—"} · série ${perfil?.autoclave_serial ?? "—"}`,
      `Estações com QR Code: ${checkpoints.length}`,
      `Código de autenticidade (SHA-256): ${hash.slice(0, 32)}…`,
    ].join("\n"),
    40,
    200,
  );

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(AVISO_LEGAL, 40, 300, { maxWidth: largura - 80 });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.text("Índice", 40, 360);
  doc.setFontSize(10);
  doc.text(
    [
      "Seção A — Dados do serviço e responsável técnico",
      "Seção B — POPs vigentes",
      "Seção C — Checklists do período (com fotos e GPS)",
      "Seção D — Ciclos de autoclave",
      "Seção E — Testes biológicos (últimas 8 semanas)",
      "Seção F — Anexos e licenças (alvará, PGRSS, Raio-X, dosimetria, dedetização, caixa d'água)",
      "Seção G — Pendências e alertas ativos",
    ].join("\n"),
    40,
    382,
  );

  /* ----------------------------- Seção A ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção A — Dados do serviço e responsável técnico", 40, 50);
  autoTable(doc, {
    startY: 70,
    head: [["Campo", "Informação"]],
    body: [
      ["Estabelecimento", perfil?.clinic_name ?? "—"],
      ["Tipo de perfil", perfil?.type ?? "—"],
      ["Endereço", `${perfil?.address ?? "—"} — ${perfil?.city ?? ""}/${perfil?.uf ?? ""}`],
      ["CNPJ", perfil?.cnpj ?? "—"],
      ["Responsável técnico", perfil?.rt_name ?? "—"],
      ["Conselho", `${perfil?.rt_council ?? "CRO"} ${perfil?.rt_number ?? "—"}`],
      ["Contato", perfil?.whatsapp ?? "—"],
      ["Autoclave", `${perfil?.autoclave_brand_model ?? "—"} (série ${perfil?.autoclave_serial ?? "—"})`],
    ],
    headStyles: { fillColor: navy },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    head: [["Estação", "Zona", "Produto / kit", "Tempo de contato"]],
    body: checkpoints.map((c) => [
      c.custom_name || c.name,
      ZONAS[c.zone_type as ZoneType]?.label ?? c.zone_type,
      `${ZONAS[c.zone_type as ZoneType]?.produto ?? "—"} (${ZONAS[c.zone_type as ZoneType]?.corKit ?? "—"})`,
      `${Math.round((ZONAS[c.zone_type as ZoneType]?.dwellSegundos ?? 0) / 60)} min`,
    ]),
    headStyles: { fillColor: [13, 148, 136] },
    styles: { fontSize: 8 },
  });

  /* ----------------------------- Seção B ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção B — POPs vigentes", 40, 50);
  autoTable(doc, {
    startY: 70,
    head: [["Código", "Procedimento", "Conteúdo resumido"]],
    body: POPS_PADRAO.map((p) => [p.codigo, p.titulo, p.resumo]),
    headStyles: { fillColor: navy },
    styles: { fontSize: 8, cellWidth: "wrap" },
    columnStyles: { 2: { cellWidth: 300 } },
  });

  /* ----------------------------- Seção C ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção C — Checklists do período", 40, 50);
  const nomeEstacao = (id: string | null) => {
    const c = checkpoints.find((x) => x.id === id);
    return c ? c.custom_name || c.name : "—";
  };
  autoTable(doc, {
    startY: 70,
    head: [["Data/hora", "Estação", "Frequência", "Itens OK", "GPS", "Operador"]],
    body: logs.slice(0, 200).map((l) => {
      const itens = Object.values(l.data_json ?? {});
      return [
        dataBr(l.timestamp_gps),
        nomeEstacao(l.checkpoint_id),
        ROTULO_FREQUENCIA[l.frequency as Frequency] ?? l.frequency,
        `${itens.filter(Boolean).length}/${itens.length}`,
        l.lat != null && l.lng != null ? `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}` : "—",
        l.operator_name || "—",
      ];
    }),
    headStyles: { fillColor: navy },
    styles: { fontSize: 8 },
  });

  const fotos = logs.flatMap((l) => (l.photo_urls ?? []).map((u) => ({ log: l, caminho: u }))).slice(0, 9);
  if (fotos.length) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Evidências fotográficas (carimbo de data/hora e GPS embutido)", 40, 50);
    let x = 40;
    let y = 70;
    for (const f of fotos) {
      const dataUrl = await caminhoParaDataUrl(f.caminho);
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", x, y, 160, 120);
        } catch {
          /* imagem inválida é ignorada */
        }
      }
      doc.setFontSize(7);
      doc.text(`${nomeEstacao(f.log.checkpoint_id)} — ${dataBr(f.log.timestamp_gps)}`, x, y + 132, {
        maxWidth: 160,
      });
      x += 175;
      if (x > 380) {
        x = 40;
        y += 155;
      }
    }
  }

  /* ----------------------------- Seção D ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção D — Ciclos de autoclave (RDC 1.002/2025)", 40, 50);
  autoTable(doc, {
    startY: 70,
    head: [["Data/hora", "Lote", "Equipamento", "Tempo/Temp/Pressão", "Químico", "Operador", "Situação"]],
    body: ciclos.map((c) => [
      dataBr(c.cycle_date_time),
      c.batch_number,
      `${c.equipment_brand_model} (${c.equipment_serial})`,
      `${c.time_minutes} min / ${c.temp_celsius} °C / ${c.pressure_bar} bar`,
      c.chemical_indicator_result,
      c.operator_name,
      c.reversal_of_id ? "ESTORNO" : c.status,
    ]),
    headStyles: { fillColor: navy },
    styles: { fontSize: 8 },
  });

  const integradores = ciclos.filter((c) => c.photo_integrator_url).slice(0, 6);
  if (integradores.length) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Fotos dos integradores químicos", 40, 50);
    let x = 40;
    let y = 70;
    for (const c of integradores) {
      const dataUrl = await caminhoParaDataUrl(c.photo_integrator_url);
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", x, y, 160, 120);
        } catch {
          /* ignora */
        }
      }
      doc.setFontSize(7);
      doc.text(`Lote ${c.batch_number} — ${dataBr(c.cycle_date_time)} — ${c.status}`, x, y + 132, {
        maxWidth: 160,
      });
      x += 175;
      if (x > 380) {
        x = 40;
        y += 155;
      }
    }
  }

  /* ----------------------------- Seção E ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção E — Testes biológicos (últimas 8 semanas)", 40, 50);
  autoTable(doc, {
    startY: 70,
    head: [["Data", "Lote do indicador", "Resultado", "Ciclo vinculado", "Operador"]],
    body: testes.map((t) => [
      new Date(`${t.test_date}T12:00:00`).toLocaleDateString("pt-BR"),
      t.indicator_batch_number,
      t.result,
      ciclosTodos.find((c) => c.id === t.autoclave_cycle_id)?.batch_number ?? "—",
      t.operator_name || "—",
    ]),
    headStyles: { fillColor: navy },
    styles: { fontSize: 8 },
  });

  /* ----------------------------- Seção F ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção F — Anexos e licenças", 40, 50);
  autoTable(doc, {
    startY: 70,
    head: [["Documento", "Categoria", "Validade", "Situação", "Observações"]],
    body: anexos.length
      ? anexos.map((a) => [
          a.title,
          a.category,
          a.valid_until ? new Date(`${a.valid_until}T12:00:00`).toLocaleDateString("pt-BR") : "—",
          situacaoLicenca(a.valid_until).label,
          a.notes ?? "—",
        ])
      : [["Nenhum anexo enviado à pasta da clínica.", "—", "—", "—", "—"]],
    headStyles: { fillColor: navy },
    styles: { fontSize: 8 },
  });

  /* ----------------------------- Seção G ----------------------------- */
  doc.addPage();
  doc.setFontSize(14);
  doc.text("Seção G — Pendências e alertas ativos", 40, 50);
  const pendencias = resumo.alertas.length ? resumo.alertas : ["Nenhuma pendência registrada no período."];
  autoTable(doc, {
    startY: 70,
    head: [["Situação geral", resumo.semaforo]],
    body: pendencias.map((a) => ["Alerta", a]),
    headStyles: { fillColor: biologicoAtrasado(testes) ? [180, 30, 30] : navy },
    styles: { fontSize: 9 },
  });


  rodape(doc);
  if (plan === "TRIAL_14") marcaDaguaTeste(doc);

  const nomeArquivo = `pasta-vigilancia-${dateRange.start}-a-${dateRange.end}.pdf`;
  let caminhoNuvem: string | null = null;
  try {
    caminhoNuvem = await guardarPdfDossie(
      organizationId,
      doc.output("blob"),
      `${hash.slice(0, 12)}-${nomeArquivo}`,
    );
  } catch {
    /* segue mesmo sem conseguir arquivar na nuvem */
  }

  try {
    await registrarDocumento({
      organizacao_id: organizationId,
      sha256: hash,
      clinic_name: perfil?.clinic_name ?? "",
      period_start: dateRange.start,
      period_end: dateRange.end,
      plan,
      title: `Pasta da Vigilância — ${dateRange.start} a ${dateRange.end}`,
      file_path: caminhoNuvem,
      mime_type: "application/pdf",
    });
  } catch {
    /* o PDF é entregue mesmo se o registro de autenticidade falhar */
  }

  doc.save(nomeArquivo);

  return hash;
}
