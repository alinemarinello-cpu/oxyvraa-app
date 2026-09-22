// Módulos ANVISA: documentos SDBPF, POPs, ciclos de autoclave, treinamentos,
// insumos com lote/validade e caixas de perfurocortantes. Tudo via RLS por organização.
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIAS_DOC = [
  { valor: "alvara", label: "Alvará de Funcionamento Sanitário" },
  { valor: "projeto", label: "Projeto Arquitetônico aprovado" },
  { valor: "pgrss", label: "Plano de Gerenciamento de Resíduos (PGRSS)" },
  { valor: "laudo_autoclave", label: "Laudo de calibração/manutenção da autoclave" },
  { valor: "treinamento", label: "Certificado de treinamento da equipe" },
  { valor: "mbp", label: "Manual de Boas Práticas (MBP)" },
  { valor: "pop_assinado", label: "POP assinado pelo Responsável Técnico" },
  { valor: "rt", label: "Responsabilidade técnica / registro no conselho" },
  { valor: "dedetizacao", label: "Certificado de Desinsetização e Desratização (pragas)" },
  { valor: "caixa_dagua", label: "Laudo de limpeza das caixas d'água (semestral)" },
  { valor: "analise_agua", label: "Análise microbiológica e físico-química da água" },
  { valor: "pmoc", label: "PMOC — laudo de climatização (Lei 13.589/2018)" },
  { valor: "auto_vistoria", label: "AVCB / Auto de vistoria do Corpo de Bombeiros" },
  { valor: "licenca_hospedagem", label: "Alvará / Licença Sanitária de hospedagem e motel" },
  { valor: "analise_hidro", label: "Análise bacteriológica da água de hidromassagens" },
  {
    valor: "alvara_educacao_infantil",
    label: "Alvará Sanitário de Educação Infantil (berçário/creche)",
  },
  { valor: "vacinacao_alunos", label: "Carteira de vacinação dos alunos" },
  { valor: "vacinacao_funcionarios", label: "Carteira de vacinação dos funcionários" },
  { valor: "outro", label: "Outro documento" },
] as const;

export type Documento = {
  id: string;
  organizacao_id: string | null;
  unit_id: string | null;
  categoria: string;
  titulo: string;
  numero: string | null;
  orgao_emissor: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  emitido_em: string | null;
  expires_at: string | null;
  observacoes: string;
};

export type Pop = {
  id: string;
  organizacao_id: string | null;
  codigo: string;
  titulo: string;
  norma: string;
  versao: string;
  descricao: string;
  arquivo_url: string | null;
  revisado_em: string | null;
};

export type CicloAutoclave = {
  id: string;
  unit_id: string;
  equipamento: string;
  lote: string;
  ciclo: string;
  iniciado_em: string;
  finalizado_em: string | null;
  temperatura: number | null;
  tempo_exposicao_min: number | null;
  indicador_fisico: boolean;
  indicador_quimico: boolean;
  indicador_biologico: string;
  foto_integrador: string | null;
  operador_nome: string;
  status: string;
  observacoes: string;
};

export type Treinamento = {
  id: string;
  organizacao_id: string | null;
  unit_id: string | null;
  participante: string;
  funcao: string;
  tema: string;
  pop_id: string | null;
  realizado_em: string;
  validade: string | null;
  carga_horaria: number | null;
  instrutor: string;
  certificado_url: string | null;
};

export type InsumoLote = {
  id: string;
  organizacao_id: string | null;
  unit_id: string | null;
  nome: string;
  categoria: string;
  fabricante: string;
  codigo_barras: string | null;
  lote: string;
  validade: string;
  quantidade: number;
  unidade: string;
  registro_anvisa: string | null;
  observacoes: string;
  marca: string;
  aberto_em: string | null;
  validade_apos_aberto_dias: number | null;
  foto_frasco: string | null;
};

export type AplicacaoInsumo = {
  id: string;
  organizacao_id: string | null;
  unit_id: string;
  insumo_id: string | null;
  execucao_id: string | null;
  procedimento: string;
  cliente_iniciais: string;
  produto: string;
  marca: string;
  lote: string;
  validade: string | null;
  registro_anvisa: string | null;
  quantidade_utilizada: number | null;
  unidade_medida: string;
  foto_frasco: string | null;
  profissional_nome: string;
  profissional_registro: string | null;
  aplicado_em: string;
  lat: number | null;
  lng: number | null;
  observacoes: string;
};

export type CaixaPerfuro = {
  id: string;
  unit_id: string;
  local: string;
  capacidade_litros: number;
  montada_em: string;
  nivel_percentual: number;
  status: string;
  trocada_em: string | null;
  foto_troca: string | null;
  responsavel: string;
};

/* ----------------------------- arquivos ----------------------------- */

export async function enviarArquivo(pasta: string, arquivo: File): Promise<string> {
  const ext = arquivo.name.split(".").pop() ?? "bin";
  const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("evidencias").upload(caminho, arquivo, {
    contentType: arquivo.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return caminho;
}

export async function urlAssinada(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from("evidencias").createSignedUrl(caminho, 3600);
  return data?.signedUrl ?? null;
}

/* ---------------------------- documentos ---------------------------- */

export async function listarDocumentos(): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos_sdbpf")
    .select("*")
    .order("expires_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Documento[];
}

export async function salvarDocumento(
  organizacaoId: string,
  d: Omit<Documento, "id" | "organizacao_id"> & { id?: string },
) {
  const linha = { ...d, organizacao_id: organizacaoId };
  const { error } = d.id
    ? await supabase.from("documentos_sdbpf").update(linha).eq("id", d.id)
    : await supabase.from("documentos_sdbpf").insert(linha);
  if (error) throw error;
}

export async function excluirDocumento(id: string) {
  const { error } = await supabase.from("documentos_sdbpf").delete().eq("id", id);
  if (error) throw error;
}

export function diasAte(data: string | null): number | null {
  if (!data) return null;
  return Math.ceil((new Date(`${data}T12:00:00`).getTime() - Date.now()) / 86_400_000);
}

/** Documentos vencidos ou dentro das janelas de aviso (60, 30 e 15 dias). */
export function documentosEmAlerta(docs: Documento[]) {
  return docs
    .map((d) => ({ doc: d, dias: diasAte(d.expires_at) }))
    .filter((x) => x.dias !== null && x.dias <= 60)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
}

export function faixaAviso(dias: number): { label: string; tom: string } {
  if (dias < 0) return { label: "Vencido", tom: "text-destructive" };
  if (dias <= 15) return { label: `Vence em ${dias} dia(s)`, tom: "text-destructive" };
  if (dias <= 30) return { label: `Vence em ${dias} dias`, tom: "text-amber-600" };
  if (dias <= 60) return { label: `Vence em ${dias} dias`, tom: "text-amber-600/80" };
  return { label: `Vence em ${dias} dias`, tom: "text-muted-foreground" };
}

/* -------------------------------- POPs ------------------------------- */

export async function listarPops(): Promise<Pop[]> {
  const { data, error } = await supabase.from("pops").select("*").order("codigo");
  if (error) throw error;
  return (data ?? []) as Pop[];
}

export async function salvarPop(
  organizacaoId: string,
  p: Omit<Pop, "id" | "organizacao_id"> & { id?: string },
) {
  const linha = { ...p, organizacao_id: organizacaoId };
  const { error } = p.id
    ? await supabase.from("pops").update(linha).eq("id", p.id)
    : await supabase.from("pops").insert(linha);
  if (error) throw error;
}

export async function excluirPop(id: string) {
  const { error } = await supabase.from("pops").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------- ciclos de autoclave ---------------------- */

export type EntradaCiclo = {
  unit_id: string;
  equipamento: string;
  lote: string;
  ciclo: string;
  iniciado_em: string;
  finalizado_em: string | null;
  temperatura: number | null;
  tempo_exposicao_min: number | null;
  indicador_fisico: boolean;
  indicador_quimico: boolean;
  indicador_biologico: string;
  foto_integrador: string | null;
  operador_nome: string;
  operador_pin: string | null;
  observacoes: string;
};

/** Um lote só é "apto para uso" com foto da fita e indicadores aprovados. */
export function situacaoLote(c: {
  foto_integrador: string | null;
  indicador_fisico: boolean;
  indicador_quimico: boolean;
  indicador_biologico: string;
}): "liberado" | "reprovado" | "pendente" {
  if (c.indicador_biologico === "reprovado") return "reprovado";
  if (!c.indicador_fisico || !c.indicador_quimico) return "reprovado";
  if (!c.foto_integrador) return "pendente";
  return "liberado";
}

export const ROTULO_LOTE: Record<string, string> = {
  liberado: "Apto para uso",
  reprovado: "Reprovado — reprocessar",
  pendente: "Pendente de evidência",
};

export async function listarCiclos(dias = 60): Promise<CicloAutoclave[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("ciclos_autoclave")
    .select("*")
    .gte("iniciado_em", desde)
    .order("iniciado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CicloAutoclave[];
}

export async function registrarCiclo(organizacaoId: string, c: EntradaCiclo) {
  const status = situacaoLote(c);
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase.from("ciclos_autoclave").insert({
    ...c,
    organizacao_id: organizacaoId,
    registrado_por: sessao.user?.id ?? null,
    status,
  });
  if (error) throw error;
  return status;
}

export async function atualizarCiclo(id: string, campos: Partial<EntradaCiclo>) {
  const { data: atual, error: e1 } = await supabase
    .from("ciclos_autoclave")
    .select("foto_integrador, indicador_fisico, indicador_quimico, indicador_biologico")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  const status = situacaoLote({ ...atual, ...campos } as CicloAutoclave);
  const { error } = await supabase
    .from("ciclos_autoclave")
    .update({ ...campos, status })
    .eq("id", id);
  if (error) throw error;
  return status;
}

/* ---------------------------- treinamentos --------------------------- */

export async function listarTreinamentos(): Promise<Treinamento[]> {
  const { data, error } = await supabase
    .from("treinamentos")
    .select("*")
    .order("realizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Treinamento[];
}

export async function salvarTreinamento(
  organizacaoId: string,
  t: Omit<Treinamento, "id" | "organizacao_id"> & { id?: string },
) {
  const linha = { ...t, organizacao_id: organizacaoId };
  const { error } = t.id
    ? await supabase.from("treinamentos").update(linha).eq("id", t.id)
    : await supabase.from("treinamentos").insert(linha);
  if (error) throw error;
}

export async function excluirTreinamento(id: string) {
  const { error } = await supabase.from("treinamentos").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------- insumos ----------------------------- */

export const CATEGORIAS_INSUMO = [
  "injetável",
  "preenchedor",
  "bioestimulador",
  "dermocosmético",
  "pigmento",
  "anestésico",
  "resina",
  "medicamento",
  "material de consumo",
  "químico",
  "geral",
];

export async function listarInsumos(): Promise<InsumoLote[]> {
  const { data, error } = await supabase
    .from("insumos_lotes")
    .select("*")
    .order("validade", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InsumoLote[];
}

export async function salvarInsumo(
  organizacaoId: string,
  i: Omit<InsumoLote, "id" | "organizacao_id"> & { id?: string },
) {
  const linha = { ...i, organizacao_id: organizacaoId };
  const { error } = i.id
    ? await supabase.from("insumos_lotes").update(linha).eq("id", i.id)
    : await supabase.from("insumos_lotes").insert(linha);
  if (error) throw error;
}

export async function excluirInsumo(id: string) {
  const { error } = await supabase.from("insumos_lotes").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------ caixas de perfurocortantes ------------------ */

export async function listarCaixas(): Promise<CaixaPerfuro[]> {
  const { data, error } = await supabase
    .from("caixas_perfurocortantes")
    .select("*")
    .order("nivel_percentual", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaixaPerfuro[];
}

export async function salvarCaixa(
  organizacaoId: string,
  c: Omit<CaixaPerfuro, "id" | "trocada_em" | "foto_troca" | "status"> & {
    id?: string;
    status?: string;
  },
) {
  const status = c.nivel_percentual >= 66 ? "troca_pendente" : "em_uso";
  const linha = { ...c, organizacao_id: organizacaoId, status };
  const { error } = c.id
    ? await supabase.from("caixas_perfurocortantes").update(linha).eq("id", c.id)
    : await supabase.from("caixas_perfurocortantes").insert(linha);
  if (error) throw error;
  return status;
}

/** Troca só é aceita com foto da substituição (exigência do PGRSS). */
export async function registrarTrocaCaixa(id: string, fotoTroca: string, responsavel: string) {
  if (!fotoTroca) throw new Error("Anexe a foto da caixa substituída.");
  const { error } = await supabase
    .from("caixas_perfurocortantes")
    .update({
      foto_troca: fotoTroca,
      trocada_em: new Date().toISOString(),
      nivel_percentual: 0,
      montada_em: new Date().toISOString().slice(0, 10),
      status: "em_uso",
      responsavel,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function excluirCaixa(id: string) {
  const { error } = await supabase.from("caixas_perfurocortantes").delete().eq("id", id);
  if (error) throw error;
}

/** Abre a tarefa de troca imediata quando a caixa passa de 2/3. */
export async function abrirTarefaTroca(
  organizacaoId: string,
  caixa: { unit_id: string; local: string; nivel_percentual: number; responsavel: string },
) {
  const prazo = new Date();
  prazo.setDate(prazo.getDate() + 1);
  const { error } = await supabase.from("planos_acao").insert({
    organizacao_id: organizacaoId,
    unit_id: caixa.unit_id,
    titulo: `Trocar caixa de perfurocortantes — ${caixa.local || "sala clínica"}`,
    descricao: `Caixa rígida em ${caixa.nivel_percentual}% da capacidade (limite de 2/3). Substituir imediatamente e anexar foto da caixa nova lacrada.`,
    criticidade: "alta",
    responsavel: caixa.responsavel || "Responsável técnico",
    prazo: prazo.toISOString().slice(0, 10),
  });
  if (error) throw error;
}

/* ------------------- validade secundária (pós-abertura) ------------------ */

/** Data-limite de uso depois de aberto o frasco (séruns, ácidos, cremes). */
export function validadeSecundaria(i: {
  aberto_em: string | null;
  validade_apos_aberto_dias: number | null;
  validade: string;
}): string | null {
  if (!i.aberto_em || !i.validade_apos_aberto_dias) return null;
  const d = new Date(`${i.aberto_em}T12:00:00`);
  d.setDate(d.getDate() + i.validade_apos_aberto_dias);
  const pos = d.toISOString().slice(0, 10);
  return pos < i.validade ? pos : i.validade;
}

/** Validade que realmente vale hoje: a menor entre a do rótulo e a pós-abertura. */
export function validadeEfetiva(i: {
  aberto_em: string | null;
  validade_apos_aberto_dias: number | null;
  validade: string;
}): { data: string; porAbertura: boolean } {
  const sec = validadeSecundaria(i);
  return sec && sec < i.validade
    ? { data: sec, porAbertura: true }
    : { data: i.validade, porAbertura: false };
}

/* ------------------------- alvará sanitário ------------------------- */

export const MARCOS_ALVARA = [60, 30, 15];

/** Aviso escalonado do alvará: 60, 30 e 15 dias antes do vencimento. */
export function alertaAlvara(expiracao: string | null): {
  dias: number;
  marco: number | null;
  tom: string;
  label: string;
} | null {
  if (!expiracao) return null;
  const dias = diasAte(expiracao) ?? 0;
  if (dias < 0)
    return { dias, marco: 0, tom: "text-destructive", label: "Alvará sanitário vencido" };
  const marco = MARCOS_ALVARA.find((m) => dias <= m) ?? null;
  if (marco === null) return null;
  return {
    dias,
    marco,
    tom: dias <= 15 ? "text-destructive" : "text-amber-600",
    label: `Alvará vence em ${dias} dia(s)`,
  };
}

/* --------------------- aplicações em cliente --------------------- */

export async function listarAplicacoes(dias = 180): Promise<AplicacaoInsumo[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("aplicacoes_insumo")
    .select("*")
    .gte("aplicado_em", desde)
    .order("aplicado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AplicacaoInsumo[];
}

/** Registro rastreável do lote aplicado no cliente (injetáveis e invasivos). */
export async function registrarAplicacao(
  organizacaoId: string,
  a: Omit<AplicacaoInsumo, "id" | "organizacao_id"> & { id?: string },
) {
  if (!a.unit_id) throw new Error("Escolha a unidade do atendimento.");
  if (!a.lote.trim()) throw new Error("Informe o lote do produto aplicado.");
  if (!a.foto_frasco) throw new Error("Anexe a foto do frasco/ampola utilizado.");
  const linha = { ...a, organizacao_id: organizacaoId };
  const { error } = a.id
    ? await supabase.from("aplicacoes_insumo").update(linha).eq("id", a.id)
    : await supabase.from("aplicacoes_insumo").insert(linha);
  if (error) throw error;
}
