// Módulo de suítes de alta rotatividade (motéis e meios de hospedagem):
// cadastro, QR Code de serviço, status em tempo real e histórico de higienizações.
import { supabase } from "@/integrations/supabase/client";

export type StatusSuite = "disponivel" | "em_higienizacao" | "bloqueada";

export const STATUS_SUITE: Record<StatusSuite, { label: string; cor: string }> = {
  disponivel: { label: "Disponível", cor: "bg-teal/15 text-teal" },
  em_higienizacao: { label: "Em higienização", cor: "bg-amber-500/15 text-amber-600" },
  bloqueada: { label: "Bloqueada por não conformidade", cor: "bg-destructive/10 text-destructive" },
};

export type Suite = {
  id: string;
  organizacao_id: string | null;
  unit_id: string;
  identificacao: string;
  bloco: string;
  categoria: string;
  tem_hidro: boolean;
  tem_sauna: boolean;
  qr_token: string;
  status: string;
  status_atualizado_em: string;
  ultima_higienizacao: string | null;
  ultima_sanitizacao_hidro: string | null;
  ativo: boolean;
  observacoes: string;
};

export type HigienizacaoSuite = {
  id: string;
  suite_id: string;
  unit_id: string;
  execucao_id: string | null;
  colaboradora_nome: string;
  qr_validado: boolean;
  iniciada_em: string;
  concluida_em: string | null;
  hidro_sanitizada: boolean;
  hidro_dwell_segundos: number | null;
  cloro_residual: number | null;
  status_final: string;
  observacoes: string;
};

const CAMPOS =
  "id, organizacao_id, unit_id, identificacao, bloco, categoria, tem_hidro, tem_sauna, qr_token, status, status_atualizado_em, ultima_higienizacao, ultima_sanitizacao_hidro, ativo, observacoes";

export async function listarSuites(unitId?: string): Promise<Suite[]> {
  let q = supabase.from("suites").select(CAMPOS).order("identificacao");
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Suite[];
}

export type NovaSuite = {
  organizacao_id: string | null;
  unit_id: string;
  identificacao: string;
  bloco?: string;
  categoria?: string;
  tem_hidro?: boolean;
  tem_sauna?: boolean;
  observacoes?: string;
};

export async function criarSuite(s: NovaSuite): Promise<Suite> {
  const { data, error } = await supabase.from("suites").insert(s).select(CAMPOS).single();
  if (error) throw error;
  return data as Suite;
}

export async function atualizarSuite(id: string, campos: Partial<Suite>) {
  const { error } = await supabase.from("suites").update(campos).eq("id", id);
  if (error) throw error;
}

export async function definirStatus(id: string, status: StatusSuite) {
  await atualizarSuite(id, { status, status_atualizado_em: new Date().toISOString() });
}

export async function listarHigienizacoes(dias = 30, unitId?: string) {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  let q = supabase
    .from("suite_higienizacoes")
    .select(
      "id, suite_id, unit_id, execucao_id, colaboradora_nome, qr_validado, iniciada_em, concluida_em, hidro_sanitizada, hidro_dwell_segundos, cloro_residual, status_final, observacoes",
    )
    .gte("iniciada_em", desde)
    .order("iniciada_em", { ascending: false });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as HigienizacaoSuite[];
}

/** Payload do QR fixado no hall de serviço da suíte. */
export function payloadQrSuite(s: Pick<Suite, "id" | "qr_token">) {
  return `OXV-SUITE:${s.id}:${s.qr_token}`;
}

/** Lê um QR de suíte e devolve o id, quando o formato for válido. */
export function lerQrSuite(raw: string): { suiteId: string; token: string } | null {
  const partes = raw.trim().split(":");
  if (partes.length !== 3 || partes[0] !== "OXV-SUITE") return null;
  return { suiteId: partes[1], token: partes[2] };
}

/** Tempo desde a última higienização, em horas (null quando nunca higienizada). */
export function horasDesdeHigienizacao(s: Suite): number | null {
  if (!s.ultima_higienizacao) return null;
  return Math.floor((Date.now() - new Date(s.ultima_higienizacao).getTime()) / 3_600_000);
}
