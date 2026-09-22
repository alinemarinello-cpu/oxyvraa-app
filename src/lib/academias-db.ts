// Módulo Academias e Centros Esportivos: áreas por unidade, travas químicas Spartan,
// qualidade da água (cloro/pH), PMOC do ar e selo público de higienização.
import { supabase } from "@/integrations/supabase/client";

export type TipoAreaAcademia =
  | "musculacao"
  | "vestiario"
  | "aulas_coletivas"
  | "aquatica"
  | "climatizacao";

export type MetaArea = {
  label: string;
  emoji: string;
  descricao: string;
  produto: string;
  corKit: string;
  dwellSegundos: number;
};

/** Divisão nativa de áreas de uma academia, com produto e kit obrigatórios. */
export const AREAS_ACADEMIA: Record<TipoAreaAcademia, MetaArea> = {
  musculacao: {
    label: "Musculação e ergometria",
    emoji: "🏋️",
    descricao: "Estofados, halteres, esteiras, bikes e colchonetes.",
    produto: "Clean by Peroxy",
    corKit: "azul",
    dwellSegundos: 300,
  },
  vestiario: {
    label: "Vestiários e saunas",
    emoji: "🚿",
    descricao: "Vestiário masculino/feminino, chuveiros, sanitários e saunas.",
    produto: "Peroxy 4D",
    corKit: "vermelho",
    dwellSegundos: 300,
  },
  aulas_coletivas: {
    label: "Salas de aulas coletivas",
    emoji: "🤸",
    descricao: "Pilates, bike indoor, lutas e dança.",
    produto: "Clean by Peroxy",
    corKit: "azul",
    dwellSegundos: 300,
  },
  aquatica: {
    label: "Parque aquático e área molhada",
    emoji: "🏊",
    descricao: "Piscinas, jacuzzis, bordas, lava-pés e área molhada.",
    produto: "Peroxy 4D",
    corKit: "vermelho",
    dwellSegundos: 300,
  },
  climatizacao: {
    label: "Central de climatização (PMOC)",
    emoji: "❄️",
    descricao: "Climatizadores, casa de máquinas e filtros de ar.",
    produto: "Clean by Peroxy",
    corKit: "azul",
    dwellSegundos: 300,
  },
};

export const TIPOS_AREA = Object.keys(AREAS_ACADEMIA) as TipoAreaAcademia[];

export type AreaAcademia = {
  id: string;
  organizacao_id: string | null;
  unit_id: string;
  nome: string;
  tipo: string;
  detalhe: string;
  produto_obrigatorio: string;
  cor_kit: string;
  dwell_segundos: number;
  qr_token: string;
  ultima_higienizacao: string | null;
  ultimo_responsavel: string;
  ativo: boolean;
  observacoes: string;
};

const CAMPOS_AREA =
  "id, organizacao_id, unit_id, nome, tipo, detalhe, produto_obrigatorio, cor_kit, dwell_segundos, qr_token, ultima_higienizacao, ultimo_responsavel, ativo, observacoes";

export async function listarAreas(unitId?: string): Promise<AreaAcademia[]> {
  let q = supabase.from("academia_areas").select(CAMPOS_AREA).order("tipo").order("nome");
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AreaAcademia[];
}

export async function criarArea(a: {
  organizacao_id: string | null;
  unit_id: string;
  nome: string;
  tipo: TipoAreaAcademia;
  detalhe?: string;
}) {
  const meta = AREAS_ACADEMIA[a.tipo];
  if (!a.unit_id) throw new Error("Selecione a unidade da academia.");
  if (!a.nome.trim()) throw new Error("Informe o nome da área (ex.: Sala de Bike 1).");
  const { error } = await supabase.from("academia_areas").insert({
    organizacao_id: a.organizacao_id,
    unit_id: a.unit_id,
    nome: a.nome.trim(),
    tipo: a.tipo,
    detalhe: a.detalhe?.trim() ?? "",
    produto_obrigatorio: meta.produto,
    cor_kit: meta.corKit,
    dwell_segundos: meta.dwellSegundos,
  });
  if (error) throw error;
}

export async function atualizarArea(id: string, campos: Partial<AreaAcademia>) {
  const { error } = await supabase.from("academia_areas").update(campos).eq("id", id);
  if (error) throw error;
}

export async function removerArea(id: string) {
  const { error } = await supabase.from("academia_areas").delete().eq("id", id);
  if (error) throw error;
}

/** Registra a higienização concluída e carimba a área para o selo público. */
export async function registrarHigienizacao(a: AreaAcademia, responsavel: string, obs = "") {
  if (!responsavel.trim()) throw new Error("Informe quem executou a higienização.");
  const agora = new Date().toISOString();
  const { error } = await supabase.from("academia_higienizacoes").insert({
    organizacao_id: a.organizacao_id,
    area_id: a.id,
    unit_id: a.unit_id,
    responsavel: responsavel.trim(),
    produto: a.produto_obrigatorio,
    cor_kit: a.cor_kit,
    dwell_segundos: a.dwell_segundos,
    concluida_em: agora,
    observacoes: obs,
  });
  if (error) throw error;
  await atualizarArea(a.id, { ultima_higienizacao: agora, ultimo_responsavel: responsavel.trim() });
}

export type HigienizacaoAcademia = {
  id: string;
  area_id: string;
  unit_id: string;
  responsavel: string;
  produto: string;
  cor_kit: string;
  dwell_segundos: number | null;
  qr_validado: boolean;
  concluida_em: string;
  observacoes: string;
};

export async function listarHigienizacoesAcademia(unitId: string, dias = 30) {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("academia_higienizacoes")
    .select(
      "id, area_id, unit_id, responsavel, produto, cor_kit, dwell_segundos, qr_validado, concluida_em, observacoes",
    )
    .eq("unit_id", unitId)
    .gte("concluida_em", desde)
    .order("concluida_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HigienizacaoAcademia[];
}

// ================= Qualidade da água =================

export const FAIXA_CLORO = { min: 1.0, max: 3.0, unidade: "mg/L" };
export const FAIXA_PH = { min: 7.2, max: 7.8, unidade: "pH" };

export type MedicaoAgua = {
  id: string;
  unit_id: string;
  area_id: string | null;
  corpo_dagua: string;
  medido_em: string;
  cloro_mg_l: number | null;
  ph: number | null;
  temperatura: number | null;
  responsavel: string;
  fora_faixa: boolean;
  observacoes: string;
};

/** Lista os desvios de uma medição (cloro/pH fora da faixa sanitária). */
export function desviosDaMedicao(cloro: number | null, ph: number | null): string[] {
  const desvios: string[] = [];
  if (cloro !== null && (cloro < FAIXA_CLORO.min || cloro > FAIXA_CLORO.max))
    desvios.push(
      `Cloro ${cloro} mg/L fora da faixa ${FAIXA_CLORO.min}–${FAIXA_CLORO.max} mg/L`,
    );
  if (ph !== null && (ph < FAIXA_PH.min || ph > FAIXA_PH.max))
    desvios.push(`pH ${ph} fora da faixa ${FAIXA_PH.min}–${FAIXA_PH.max}`);
  return desvios;
}

export async function listarMedicoes(unitId: string, dias = 30): Promise<MedicaoAgua[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("medicoes_agua")
    .select(
      "id, unit_id, area_id, corpo_dagua, medido_em, cloro_mg_l, ph, temperatura, responsavel, fora_faixa, observacoes",
    )
    .eq("unit_id", unitId)
    .gte("medido_em", desde)
    .order("medido_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MedicaoAgua[];
}

export async function registrarMedicao(m: {
  organizacao_id: string | null;
  unit_id: string;
  area_id: string | null;
  corpo_dagua: string;
  cloro_mg_l: number | null;
  ph: number | null;
  temperatura: number | null;
  responsavel: string;
  observacoes?: string;
}): Promise<string[]> {
  if (!m.unit_id) throw new Error("Selecione a unidade.");
  if (m.cloro_mg_l === null && m.ph === null)
    throw new Error("Informe pelo menos o cloro ou o pH medido.");
  const desvios = desviosDaMedicao(m.cloro_mg_l, m.ph);
  const { error } = await supabase.from("medicoes_agua").insert({
    ...m,
    observacoes: m.observacoes ?? "",
    medido_em: new Date().toISOString(),
    fora_faixa: desvios.length > 0,
  });
  if (error) throw error;

  if (desvios.length) {
    await supabase.from("alertas").insert({
      organizacao_id: m.organizacao_id,
      unit_id: m.unit_id,
      tipo: "qualidade_agua",
      severidade: "alta",
      titulo: `Água fora da faixa — ${m.corpo_dagua}`,
      mensagem: desvios.join(" · "),
    });
  }
  return desvios;
}

/** Link de aviso no WhatsApp com o desvio medido (abre o app com a mensagem pronta). */
export function linkWhatsappDesvio(
  unidade: string,
  corpoDagua: string,
  desvios: string[],
  telefone?: string,
) {
  const texto = [
    `🚨 Oxyvra — desvio de qualidade da água`,
    `Unidade: ${unidade}`,
    `Local: ${corpoDagua}`,
    ...desvios.map((d) => `• ${d}`),
    `Faixas exigidas: cloro ${FAIXA_CLORO.min}–${FAIXA_CLORO.max} mg/L · pH ${FAIXA_PH.min}–${FAIXA_PH.max}`,
    `Medido em ${new Date().toLocaleString("pt-BR")}`,
  ].join("\n");
  const numero = (telefone ?? "").replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

// ================= PMOC: laudos do ar =================

export const TIPOS_LAUDO_AR = [
  { valor: "microbiologico", label: "Análise microbiológica do ar", meses: 6 },
  { valor: "art", label: "ART / laudo do responsável técnico", meses: 12 },
] as const;

export type LaudoAr = {
  id: string;
  unit_id: string;
  tipo: string;
  responsavel_tecnico: string;
  registro_art: string | null;
  emitido_em: string;
  validade_meses: number;
  expira_em: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  observacoes: string;
};

export function calcularExpiracao(emitidoEm: string, meses: number): string {
  const d = new Date(`${emitidoEm}T12:00:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function diasParaVencer(expiraEm: string | null): number | null {
  if (!expiraEm) return null;
  const alvo = new Date(`${expiraEm}T12:00:00`).getTime();
  return Math.ceil((alvo - Date.now()) / 86_400_000);
}

export type StatusLaudo = { label: string; tom: string; critico: boolean };

export function statusLaudo(l: LaudoAr): StatusLaudo {
  const dias = diasParaVencer(l.expira_em);
  if (dias === null) return { label: "Sem validade informada", tom: "text-muted-foreground", critico: false };
  if (dias < 0) return { label: `Vencido há ${Math.abs(dias)} dia(s)`, tom: "text-destructive", critico: true };
  if (dias <= 30) return { label: `Vence em ${dias} dia(s)`, tom: "text-amber-600", critico: true };
  return { label: `Vigente — ${dias} dias`, tom: "text-teal", critico: false };
}

export async function listarLaudosAr(unitId: string): Promise<LaudoAr[]> {
  const { data, error } = await supabase
    .from("academia_laudos_ar")
    .select(
      "id, unit_id, tipo, responsavel_tecnico, registro_art, emitido_em, validade_meses, expira_em, arquivo_url, arquivo_nome, observacoes",
    )
    .eq("unit_id", unitId)
    .order("expira_em");
  if (error) throw error;
  return (data ?? []) as LaudoAr[];
}

export async function salvarLaudoAr(l: {
  id?: string;
  organizacao_id: string | null;
  unit_id: string;
  tipo: string;
  responsavel_tecnico: string;
  registro_art: string | null;
  emitido_em: string;
  validade_meses: number;
  observacoes?: string;
}) {
  if (!l.unit_id) throw new Error("Selecione a unidade.");
  if (!l.responsavel_tecnico.trim()) throw new Error("Informe o responsável técnico.");
  const linha = {
    organizacao_id: l.organizacao_id,
    unit_id: l.unit_id,
    tipo: l.tipo,
    responsavel_tecnico: l.responsavel_tecnico.trim(),
    registro_art: l.registro_art,
    emitido_em: l.emitido_em,
    validade_meses: l.validade_meses,
    expira_em: calcularExpiracao(l.emitido_em, l.validade_meses),
    observacoes: l.observacoes ?? "",
  };
  const { error } = l.id
    ? await supabase.from("academia_laudos_ar").update(linha).eq("id", l.id)
    : await supabase.from("academia_laudos_ar").insert(linha);
  if (error) throw error;
}

// ================= QR Codes =================

/** QR fixado no equipamento/área para a equipe iniciar a rotina. */
export function payloadQrArea(a: Pick<AreaAcademia, "id" | "qr_token">) {
  return `OXV-ACAD:${a.id}:${a.qr_token}`;
}

/** URL pública do Selo de Academia Sanitizada (QR da recepção, visível ao aluno). */
export function urlSeloPublico(areaId: string, origem?: string) {
  const base = origem ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/selo/${areaId}`;
}
