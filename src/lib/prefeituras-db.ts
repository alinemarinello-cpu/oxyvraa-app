// Gestão municipal: prefeitura (nível 1) → secretarias (nível 2) → equipamentos públicos
// (nível 3) → ambientes (nível 4). Todas as leituras respeitam a RLS da organização.
import { supabase } from "@/integrations/supabase/client";

export type SecretariaTipo = "educacao" | "saude" | "assistencia" | "outra";

export const SECRETARIA_META: Record<
  SecretariaTipo,
  { label: string; emoji: string; exemplos: string }
> = {
  educacao: {
    label: "Secretaria de Educação",
    emoji: "🏫",
    exemplos: "Escolas municipais, creches e berçários",
  },
  saude: {
    label: "Secretaria de Saúde",
    emoji: "🏥",
    exemplos: "Postos de saúde, odontologia, CAPS e centros de especialidades",
  },
  assistencia: {
    label: "Secretaria de Assistência Social",
    emoji: "🤝",
    exemplos: "Centros TEA/autismo, CRAS e CREAS",
  },
  outra: { label: "Outra secretaria", emoji: "🏛️", exemplos: "Obras, esportes, cultura" },
};

export type Secretaria = {
  id: string;
  prefeitura_id: string;
  organizacao_id: string | null;
  tipo: SecretariaTipo;
  nome: string;
  responsavel: string;
  email: string | null;
  telefone: string | null;
  observacoes: string;
  ativo: boolean;
};

export type EquipamentoPublico = {
  id: string;
  prefeitura_id: string;
  secretaria_id: string | null;
  nome: string;
  bairro: string;
  cidade: string;
  tipo: string;
  ambientes: string[];
  locais: { id: string; nome: string }[];
};

export async function listarSecretarias(prefeituraId?: string): Promise<Secretaria[]> {
  let q = supabase
    .from("secretarias")
    .select("id, prefeitura_id, organizacao_id, tipo, nome, responsavel, email, telefone, observacoes, ativo")
    .order("nome");
  if (prefeituraId) q = q.eq("prefeitura_id", prefeituraId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Secretaria[];
}

export async function salvarSecretaria(
  s: Partial<Secretaria> & { prefeitura_id: string; nome: string; tipo: SecretariaTipo },
  organizacaoId?: string | null,
) {
  const payload = {
    prefeitura_id: s.prefeitura_id,
    organizacao_id: organizacaoId ?? s.organizacao_id ?? null,
    tipo: s.tipo,
    nome: s.nome,
    responsavel: s.responsavel ?? "",
    email: s.email ?? null,
    telefone: s.telefone ?? null,
    observacoes: s.observacoes ?? "",
    ativo: s.ativo ?? true,
  };
  if (s.id) {
    const { error } = await supabase.from("secretarias").update(payload).eq("id", s.id);
    if (error) throw error;
    return s.id;
  }
  const { data, error } = await supabase.from("secretarias").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function excluirSecretaria(id: string) {
  const { error } = await supabase.from("secretarias").delete().eq("id", id);
  if (error) throw error;
}

export async function listarEquipamentos(): Promise<EquipamentoPublico[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id, prefeitura_id, secretaria_id, nome, bairro, cidade, tipo, ambientes, locais")
    .order("nome");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    prefeitura_id: u.prefeitura_id,
    secretaria_id: (u as { secretaria_id: string | null }).secretaria_id ?? null,
    nome: u.nome,
    bairro: u.bairro ?? "",
    cidade: u.cidade ?? "",
    tipo: u.tipo,
    ambientes: Array.isArray(u.ambientes) ? (u.ambientes as string[]) : [],
    locais: Array.isArray(u.locais) ? (u.locais as { id: string; nome: string }[]) : [],
  }));
}

export async function vincularSecretaria(unitId: string, secretariaId: string | null) {
  const { error } = await supabase
    .from("units")
    .update({ secretaria_id: secretariaId })
    .eq("id", unitId);
  if (error) throw error;
}

// ---------------- Panorama de conformidade ----------------

export type ExecucaoResumo = {
  unit_id: string;
  concluida_em: string | null;
  total_itens: number;
  total_conformes: number;
  total_nao_conformes: number;
};

export async function listarExecucoesMunicipais(dias = 30): Promise<ExecucaoResumo[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("execucoes")
    .select("unit_id, concluida_em, total_itens, total_conformes, total_nao_conformes")
    .gte("iniciada_em", desde)
    .order("iniciada_em", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as ExecucaoResumo[];
}

export type AlertaMunicipal = {
  id: string;
  unit_id: string | null;
  tipo: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  lido: boolean;
  created_at: string;
};

export async function listarAlertasMunicipais(): Promise<AlertaMunicipal[]> {
  const { data, error } = await supabase
    .from("alertas")
    .select("id, unit_id, tipo, severidade, titulo, mensagem, lido, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AlertaMunicipal[];
}

/** Percentual de conformidade (0-100) de um conjunto de execuções. */
export function conformidade(execucoes: ExecucaoResumo[]): number | null {
  const itens = execucoes.reduce((s, e) => s + (e.total_itens ?? 0), 0);
  if (!itens) return null;
  const conformes = execucoes.reduce((s, e) => s + (e.total_conformes ?? 0), 0);
  return Math.round((conformes / itens) * 100);
}

export type Agrupamento = {
  chave: string;
  rotulo: string;
  unidades: number;
  execucoes: number;
  naoConformes: number;
  conformidade: number | null;
};

export function agrupar(
  equipamentos: EquipamentoPublico[],
  execucoes: ExecucaoResumo[],
  chaveDe: (e: EquipamentoPublico) => { chave: string; rotulo: string },
): Agrupamento[] {
  const mapa = new Map<string, { rotulo: string; units: Set<string>; execs: ExecucaoResumo[] }>();
  for (const eq of equipamentos) {
    const { chave, rotulo } = chaveDe(eq);
    const atual = mapa.get(chave) ?? { rotulo, units: new Set<string>(), execs: [] };
    atual.units.add(eq.id);
    atual.execs.push(...execucoes.filter((x) => x.unit_id === eq.id));
    mapa.set(chave, atual);
  }
  return [...mapa.entries()]
    .map(([chave, v]) => ({
      chave,
      rotulo: v.rotulo,
      unidades: v.units.size,
      execucoes: v.execs.length,
      naoConformes: v.execs.reduce((s, e) => s + (e.total_nao_conformes ?? 0), 0),
      conformidade: conformidade(v.execs),
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}
