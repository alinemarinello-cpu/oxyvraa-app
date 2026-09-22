// Módulo de Gestão da Adequação à RDC Anvisa nº 1.002/2025.
// Catálogo de requisitos (editável pelo administrador), diagnóstico condicional,
// plano de adequação, evidências, matriz de riscos e histórico do índice de conformidade.
import { supabase } from "@/integrations/supabase/client";

export const AVISO_RDC =
  "Conteúdo de apoio à gestão baseado na RDC Anvisa nº 1.002/2025 e normas correlatas. " +
  "Não substitui a análise da vigilância sanitária local nem a responsabilidade técnica do serviço.";

export const CATEGORIAS_RDC = [
  "Documentação",
  "Biossegurança",
  "Segurança do Paciente",
  "Processamento/Esterilização",
  "Higiene das Mãos",
  "Resíduos/PGRSS",
  "Equipamentos",
  "Estrutura Física",
  "Medicamentos",
  "Treinamentos",
  "Gerenciamento de Riscos",
  "Prevenção e Controle de Infecções",
] as const;

export type CategoriaRdc = (typeof CATEGORIAS_RDC)[number];

export const STATUS_RDC = [
  "CONFORME",
  "PENDENTE",
  "EM ADEQUAÇÃO",
  "NÃO CONFORME",
  "NÃO SE APLICA",
] as const;

export type StatusRdc = (typeof STATUS_RDC)[number];

export const CORES_STATUS: Record<StatusRdc, string> = {
  CONFORME: "bg-emerald-100 text-emerald-800",
  PENDENTE: "bg-amber-100 text-amber-900",
  "EM ADEQUAÇÃO": "bg-sky-100 text-sky-900",
  "NÃO CONFORME": "bg-destructive/10 text-destructive",
  "NÃO SE APLICA": "bg-muted text-muted-foreground",
};

/** Peso de cada status no cálculo do índice de conformidade. */
const PESO: Record<StatusRdc, number | null> = {
  CONFORME: 1,
  "EM ADEQUAÇÃO": 0.5,
  PENDENTE: 0,
  "NÃO CONFORME": 0,
  "NÃO SE APLICA": null,
};

export type Requisito = {
  id: string;
  organizacao_id: string | null;
  codigo: string;
  categoria: string;
  titulo: string;
  artigo: string | null;
  referencia: string;
  descricao: string;
  como_fazer: string;
  evidencia: string;
  condicao: string;
  prazo_dias: number;
  ordem: number;
  ativo: boolean;
};

export type ItemPlano = {
  id: string;
  unit_id: string | null;
  requisito_id: string | null;
  codigo: string;
  categoria: string;
  titulo: string;
  artigo: string | null;
  status: StatusRdc;
  responsavel: string | null;
  prazo: string | null;
  observacoes: string | null;
  evidencia_url: string | null;
  concluido_em: string | null;
  historico: { em: string; de: string; para: string; por: string }[];
};

export type Evidencia = {
  id: string;
  unit_id: string | null;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  vinculo_tipo: string;
  requisito_codigo: string | null;
  artigo: string | null;
  responsavel: string | null;
  status: string;
  created_at: string;
};

export type Risco = {
  id: string;
  unit_id: string | null;
  risco: string;
  setor: string | null;
  probabilidade: number;
  impacto: number;
  criticidade: number;
  responsavel: string | null;
  acao_preventiva: string | null;
  acao_corretiva: string | null;
  prazo: string | null;
  evidencia_url: string | null;
  status: string;
  created_at: string;
};

export type Snapshot = {
  id: string;
  unit_id: string | null;
  score: number;
  por_categoria: Record<string, number>;
  referencia: string;
};

/* ------------------------------------------------------------------ */
/* Diagnóstico                                                         */
/* ------------------------------------------------------------------ */

export type Respostas = Record<string, string | number | boolean>;

export type Pergunta = {
  chave: string;
  texto: string;
  ajuda?: string;
  tipo: "numero" | "sim_nao";
  /** Só aparece quando a função devolve true. */
  quando?: (r: Respostas) => boolean;
};

export const PERGUNTAS: Pergunta[] = [
  { chave: "consultorios", texto: "Quantos consultórios (cadeiras/equipos) a clínica possui?", tipo: "numero" },
  { chave: "profissionais", texto: "Quantos cirurgiões-dentistas atuam no serviço?", tipo: "numero" },
  { chave: "colaboradores", texto: "Quantos colaboradores no total (incluindo ASB, TSB e apoio)?", tipo: "numero" },
  {
    chave: "esterilizacao",
    texto: "A clínica processa e esteriliza instrumentais no próprio local?",
    ajuda: "Se você terceiriza 100% do processamento, responda Não e guarde o contrato do serviço terceirizado.",
    tipo: "sim_nao",
  },
  { chave: "cirurgia", texto: "São realizados procedimentos cirúrgicos (exodontias, implantes, enxertos)?", tipo: "sim_nao" },
  { chave: "radiologia", texto: "A clínica possui equipamentos de raios X odontológicos?", tipo: "sim_nao" },
  { chave: "sedacao", texto: "São realizados procedimentos com sedação?", tipo: "sim_nao" },
  { chave: "medicamentos", texto: "A clínica armazena medicamentos no estabelecimento?", tipo: "sim_nao" },
  {
    chave: "controlados",
    texto: "Há medicamentos sujeitos a controle especial?",
    tipo: "sim_nao",
    quando: (r) => r.medicamentos === true,
  },
  { chave: "protese", texto: "Há envio de moldagens ou peças para laboratório de prótese?", tipo: "sim_nao" },
];

export function perguntasVisiveis(r: Respostas): Pergunta[] {
  return PERGUNTAS.filter((p) => !p.quando || p.quando(r));
}

/** Um requisito é aplicável de acordo com a condição declarada no catálogo. */
export function aplicavel(req: Pick<Requisito, "condicao">, r: Respostas): boolean {
  switch (req.condicao) {
    case "sempre":
      return true;
    case "porte_grande":
      return Number(r.consultorios ?? 0) >= 5 || Number(r.colaboradores ?? 0) >= 15;
    default:
      return r[req.condicao] === true;
  }
}

/* ------------------------------------------------------------------ */
/* Score                                                               */
/* ------------------------------------------------------------------ */

export type ResumoCategoria = { categoria: string; total: number; conformes: number; score: number };

export type ResumoScore = {
  score: number;
  avaliados: number;
  categorias: ResumoCategoria[];
  pendencias: number;
  naoConformes: number;
  emAdequacao: number;
  atrasadas: number;
  semEvidencia: number;
};

export function calcularScore(itens: ItemPlano[], evidencias: Evidencia[] = []): ResumoScore {
  const validos = itens.filter((i) => PESO[i.status] !== null);
  const soma = validos.reduce((s, i) => s + (PESO[i.status] ?? 0), 0);
  const score = validos.length ? Math.round((soma / validos.length) * 100) : 0;

  const porCat = new Map<string, ItemPlano[]>();
  for (const i of validos) porCat.set(i.categoria, [...(porCat.get(i.categoria) ?? []), i]);

  const categorias: ResumoCategoria[] = [...porCat.entries()]
    .map(([categoria, lista]) => ({
      categoria,
      total: lista.length,
      conformes: lista.filter((i) => i.status === "CONFORME").length,
      score: Math.round(
        (lista.reduce((s, i) => s + (PESO[i.status] ?? 0), 0) / lista.length) * 100,
      ),
    }))
    .sort((a, b) => a.score - b.score);

  const hoje = new Date().toISOString().slice(0, 10);
  const comEvidencia = new Set(
    evidencias.map((e) => e.requisito_codigo).filter((c): c is string => Boolean(c)),
  );

  return {
    score,
    avaliados: validos.length,
    categorias,
    pendencias: validos.filter((i) => i.status === "PENDENTE").length,
    naoConformes: validos.filter((i) => i.status === "NÃO CONFORME").length,
    emAdequacao: validos.filter((i) => i.status === "EM ADEQUAÇÃO").length,
    atrasadas: validos.filter(
      (i) => i.status !== "CONFORME" && i.prazo !== null && i.prazo < hoje,
    ).length,
    semEvidencia: validos.filter(
      (i) => i.status === "CONFORME" && !i.evidencia_url && !comEvidencia.has(i.codigo),
    ).length,
  };
}

export function faixaScore(score: number): { rotulo: string; classe: string } {
  if (score >= 85) return { rotulo: "Adequação avançada", classe: "text-emerald-600" };
  if (score >= 60) return { rotulo: "Em adequação", classe: "text-sky-600" };
  if (score >= 35) return { rotulo: "Atenção", classe: "text-amber-600" };
  return { rotulo: "Situação crítica", classe: "text-destructive" };
}

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

export async function listarRequisitos(): Promise<Requisito[]> {
  const { data, error } = await supabase
    .from("rdc_requisitos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as Requisito[];
}

export async function obterDiagnostico(unitId: string | null) {
  let q = supabase
    .from("rdc_diagnosticos")
    .select("id, unit_id, respostas, total_aplicaveis, concluido_em")
    .order("created_at", { ascending: false })
    .limit(1);
  q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    unit_id: data.unit_id as string | null,
    respostas: (data.respostas ?? {}) as Respostas,
    total_aplicaveis: data.total_aplicaveis as number,
    concluido_em: data.concluido_em as string | null,
  };
}

/** Salva o diagnóstico e (re)gera o plano de adequação com os requisitos aplicáveis. */
export async function salvarDiagnosticoEGerarPlano(
  organizacaoId: string,
  unitId: string | null,
  respostas: Respostas,
): Promise<{ aplicaveis: number; criados: number }> {
  const requisitos = await listarRequisitos();
  const aplicaveis = requisitos.filter((r) => aplicavel(r, respostas));

  const anterior = await obterDiagnostico(unitId);
  if (anterior) {
    const { error } = await supabase
      .from("rdc_diagnosticos")
      .update({
        respostas,
        total_aplicaveis: aplicaveis.length,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", anterior.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("rdc_diagnosticos").insert({
      organizacao_id: organizacaoId,
      unit_id: unitId,
      respostas,
      total_aplicaveis: aplicaveis.length,
      concluido_em: new Date().toISOString(),
    });
    if (error) throw error;
  }

  const existentes = await listarPlano(unitId);
  const mapa = new Map(existentes.map((i) => [i.codigo, i]));
  const hoje = Date.now();
  const novos = aplicaveis
    .filter((r) => !mapa.has(r.codigo))
    .map((r) => ({
      organizacao_id: organizacaoId,
      unit_id: unitId,
      requisito_id: r.id,
      codigo: r.codigo,
      categoria: r.categoria,
      titulo: r.titulo,
      artigo: r.artigo,
      status: "PENDENTE",
      prazo: new Date(hoje + r.prazo_dias * 86_400_000).toISOString().slice(0, 10),
    }));
  if (novos.length) {
    const { error } = await supabase.from("rdc_plano_itens").insert(novos);
    if (error) throw error;
  }

  // Requisitos que deixaram de ser aplicáveis viram "NÃO SE APLICA" (histórico preservado).
  const codigosAplicaveis = new Set(aplicaveis.map((r) => r.codigo));
  const desativar = existentes.filter(
    (i) => !codigosAplicaveis.has(i.codigo) && i.status !== "NÃO SE APLICA",
  );
  for (const item of desativar) {
    await atualizarItemPlano(item, { status: "NÃO SE APLICA" }, "Diagnóstico");
  }

  return { aplicaveis: aplicaveis.length, criados: novos.length };
}

export async function listarPlano(unitId: string | null): Promise<ItemPlano[]> {
  let q = supabase.from("rdc_plano_itens").select("*").order("codigo");
  q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    unit_id: i.unit_id,
    requisito_id: i.requisito_id,
    codigo: i.codigo,
    categoria: i.categoria,
    titulo: i.titulo,
    artigo: i.artigo,
    status: i.status as StatusRdc,
    responsavel: i.responsavel,
    prazo: i.prazo,
    observacoes: i.observacoes,
    evidencia_url: i.evidencia_url,
    concluido_em: i.concluido_em,
    historico: Array.isArray(i.historico) ? (i.historico as ItemPlano["historico"]) : [],
  }));
}

/** Lista o plano de todas as unidades (visão de rede). */
export async function listarPlanoRede(): Promise<ItemPlano[]> {
  const { data, error } = await supabase.from("rdc_plano_itens").select("*");
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    unit_id: i.unit_id,
    requisito_id: i.requisito_id,
    codigo: i.codigo,
    categoria: i.categoria,
    titulo: i.titulo,
    artigo: i.artigo,
    status: i.status as StatusRdc,
    responsavel: i.responsavel,
    prazo: i.prazo,
    observacoes: i.observacoes,
    evidencia_url: i.evidencia_url,
    concluido_em: i.concluido_em,
    historico: [],
  }));
}

export type CamposItem = Partial<
  Pick<ItemPlano, "status" | "responsavel" | "prazo" | "observacoes" | "evidencia_url">
>;

/** Atualiza um item do plano preservando o histórico de alterações. */
export async function atualizarItemPlano(item: ItemPlano, campos: CamposItem, por: string) {
  const historico = [...item.historico];
  if (campos.status && campos.status !== item.status) {
    historico.push({
      em: new Date().toISOString(),
      de: item.status,
      para: campos.status,
      por: por || "Usuário",
    });
  }
  const { error } = await supabase
    .from("rdc_plano_itens")
    .update({
      ...campos,
      historico,
      concluido_em:
        campos.status === "CONFORME" ? new Date().toISOString() : (item.concluido_em ?? null),
    })
    .eq("id", item.id);
  if (error) throw error;
}

/** Envia um arquivo de evidência e devolve o caminho no armazenamento seguro. */
export async function enviarArquivoEvidencia(
  organizacaoId: string,
  file: File,
): Promise<string> {
  const caminho = `rdc/${organizacaoId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
  const { error } = await supabase.storage
    .from("evidencias")
    .upload(caminho, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return caminho;
}

export async function urlEvidencia(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from("evidencias").createSignedUrl(caminho, 3600);
  return data?.signedUrl ?? null;
}

export async function listarEvidencias(unitId: string | null): Promise<Evidencia[]> {
  let q = supabase
    .from("rdc_evidencias")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Evidencia[];
}

export async function criarEvidencia(entrada: {
  organizacao_id: string;
  unit_id: string | null;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  vinculo_tipo: string;
  requisito_codigo: string | null;
  artigo: string | null;
  responsavel: string | null;
}) {
  const { error } = await supabase.from("rdc_evidencias").insert(entrada);
  if (error) throw error;
}

export async function listarRiscos(unitId: string | null): Promise<Risco[]> {
  let q = supabase.from("rdc_riscos").select("*").order("criticidade", { ascending: false });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Risco[];
}

export async function salvarRisco(entrada: {
  id?: string;
  organizacao_id: string;
  unit_id: string | null;
  risco: string;
  setor: string | null;
  probabilidade: number;
  impacto: number;
  responsavel: string | null;
  acao_preventiva: string | null;
  acao_corretiva: string | null;
  prazo: string | null;
  status: string;
}) {
  const { id, ...campos } = entrada;
  if (id) {
    const { error } = await supabase.from("rdc_riscos").update(campos).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("rdc_riscos").insert(campos);
  if (error) throw error;
}

export function nivelCriticidade(v: number): { rotulo: string; classe: string } {
  if (v >= 15) return { rotulo: "Crítico", classe: "bg-destructive/10 text-destructive" };
  if (v >= 9) return { rotulo: "Alto", classe: "bg-amber-100 text-amber-900" };
  if (v >= 4) return { rotulo: "Moderado", classe: "bg-sky-100 text-sky-900" };
  return { rotulo: "Baixo", classe: "bg-emerald-100 text-emerald-800" };
}

export async function listarHistoricoScore(unitId: string | null): Promise<Snapshot[]> {
  let q = supabase
    .from("rdc_score_historico")
    .select("id, unit_id, score, por_categoria, referencia")
    .order("referencia")
    .limit(24);
  q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    unit_id: s.unit_id,
    score: s.score,
    por_categoria: (s.por_categoria ?? {}) as Record<string, number>,
    referencia: s.referencia,
  }));
}

/** Grava (ou atualiza) o snapshot do mês corrente para o gráfico de evolução. */
export async function registrarSnapshot(
  organizacaoId: string,
  unitId: string | null,
  resumo: ResumoScore,
) {
  const referencia = `${new Date().toISOString().slice(0, 7)}-01`;
  const porCategoria = Object.fromEntries(resumo.categorias.map((c) => [c.categoria, c.score]));
  let q = supabase.from("rdc_score_historico").select("id").eq("referencia", referencia).limit(1);
  q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
  const { data } = await q.maybeSingle();
  if (data?.id) {
    await supabase
      .from("rdc_score_historico")
      .update({ score: resumo.score, por_categoria: porCategoria })
      .eq("id", data.id);
    return;
  }
  await supabase.from("rdc_score_historico").insert({
    organizacao_id: organizacaoId,
    unit_id: unitId,
    score: resumo.score,
    por_categoria: porCategoria,
    referencia,
  });
}

/** Alertas em linguagem simples, montados a partir do plano e das evidências. */
export function montarAlertas(resumo: ResumoScore, historico: Snapshot[]): string[] {
  const avisos: string[] = [];
  if (resumo.atrasadas > 0)
    avisos.push(`Você possui ${resumo.atrasadas} ação(ões) corretiva(s) com prazo vencido.`);
  if (resumo.naoConformes > 0)
    avisos.push(`Existem ${resumo.naoConformes} requisito(s) marcados como não conformes.`);
  if (resumo.pendencias > 0)
    avisos.push(`Há ${resumo.pendencias} requisito(s) ainda sem tratativa iniciada.`);
  if (resumo.semEvidencia > 0)
    avisos.push(`Existem ${resumo.semEvidencia} requisito(s) conformes sem evidência anexada.`);
  if (historico.length >= 2) {
    const atual = historico[historico.length - 1]!.score;
    const anterior = historico[historico.length - 2]!.score;
    if (atual < anterior)
      avisos.push(`Seu índice de conformidade caiu de ${anterior}% para ${atual}%.`);
  }
  return avisos;
}
