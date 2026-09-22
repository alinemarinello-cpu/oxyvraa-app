// PMOC — Plano de Manutenção, Operação e Controle de climatização (Lei 13.589/2018).
// Equipamentos de ar-condicionado por ambiente/quarto e histórico de manutenções.
import { supabase } from "@/integrations/supabase/client";
import { diasAte } from "@/lib/biosseguranca-db";

export const TIPOS_CLIMA = [
  { valor: "split", label: "Split (hi-wall / piso-teto)" },
  { valor: "cassete", label: "Cassete" },
  { valor: "janela", label: "Janela / ACJ" },
  { valor: "central", label: "Central / Chiller" },
  { valor: "vrf", label: "VRF / Multi-split" },
  { valor: "fancoil", label: "Fancoil" },
] as const;

export const SERVICOS_PMOC = [
  { valor: "limpeza_filtro", label: "Limpeza / troca de filtro" },
  { valor: "higienizacao", label: "Higienização completa (serpentina e bandeja)" },
  { valor: "manutencao_corretiva", label: "Manutenção corretiva" },
  { valor: "manutencao_preventiva", label: "Manutenção preventiva" },
  { valor: "laudo", label: "Emissão de laudo técnico (PMOC)" },
] as const;

export type EquipamentoClima = {
  id: string;
  organizacao_id: string | null;
  unit_id: string;
  identificacao: string;
  ambiente: string;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  capacidade_btus: number | null;
  instalado_em: string | null;
  frequencia_limpeza_dias: number;
  ultima_limpeza: string | null;
  responsavel_tecnico: string;
  registro_crea: string | null;
  laudo_url: string | null;
  laudo_nome: string | null;
  laudo_emitido_em: string | null;
  laudo_expira_em: string | null;
  ativo: boolean;
  observacoes: string;
};

export type ManutencaoClima = {
  id: string;
  organizacao_id: string | null;
  equipamento_id: string;
  tipo_servico: string;
  executado_em: string;
  proxima_em: string | null;
  executante: string;
  registro_executante: string | null;
  foto: string | null;
  laudo_url: string | null;
  observacoes: string;
};

export async function listarEquipamentos(): Promise<EquipamentoClima[]> {
  const { data, error } = await supabase
    .from("equipamentos_climatizacao")
    .select("*")
    .order("ambiente");
  if (error) throw error;
  return (data ?? []) as EquipamentoClima[];
}

export async function salvarEquipamento(
  organizacaoId: string,
  e: Omit<EquipamentoClima, "id" | "organizacao_id"> & { id?: string },
) {
  if (!e.unit_id) throw new Error("Selecione a unidade do equipamento.");
  if (!e.identificacao.trim()) throw new Error("Informe a identificação (ex.: Quarto 204).");
  const linha = { ...e, organizacao_id: organizacaoId };
  const { error } = e.id
    ? await supabase.from("equipamentos_climatizacao").update(linha).eq("id", e.id)
    : await supabase.from("equipamentos_climatizacao").insert(linha);
  if (error) throw error;
}

export async function listarManutencoes(equipamentoId?: string): Promise<ManutencaoClima[]> {
  let q = supabase
    .from("manutencoes_climatizacao")
    .select("*")
    .order("executado_em", { ascending: false })
    .limit(400);
  if (equipamentoId) q = q.eq("equipamento_id", equipamentoId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ManutencaoClima[];
}

/** Registra o serviço e adianta a data da última limpeza do aparelho. */
export async function registrarManutencao(
  organizacaoId: string,
  m: Omit<ManutencaoClima, "id" | "organizacao_id">,
) {
  if (!m.equipamento_id) throw new Error("Selecione o equipamento.");
  if (!m.executante.trim()) throw new Error("Informe quem executou o serviço.");
  const { error } = await supabase
    .from("manutencoes_climatizacao")
    .insert({ ...m, organizacao_id: organizacaoId });
  if (error) throw error;

  if (m.tipo_servico === "limpeza_filtro" || m.tipo_servico === "higienizacao") {
    await supabase
      .from("equipamentos_climatizacao")
      .update({ ultima_limpeza: m.executado_em })
      .eq("id", m.equipamento_id);
  }
}

/** Data prevista da próxima limpeza a partir da frequência cadastrada. */
export function proximaLimpeza(e: EquipamentoClima): string | null {
  if (!e.ultima_limpeza) return null;
  const d = new Date(`${e.ultima_limpeza}T12:00:00`);
  d.setDate(d.getDate() + (e.frequencia_limpeza_dias || 90));
  return d.toISOString().slice(0, 10);
}

export type StatusPmoc = { label: string; tom: string; atrasado: boolean };

/** Status operacional do aparelho: limpeza vencida, próxima ou em dia. */
export function statusEquipamento(e: EquipamentoClima): StatusPmoc {
  const prox = proximaLimpeza(e);
  if (!prox)
    return { label: "Sem limpeza registrada", tom: "text-destructive", atrasado: true };
  const dias = diasAte(prox) ?? 0;
  if (dias < 0)
    return { label: `Limpeza atrasada há ${Math.abs(dias)} dia(s)`, tom: "text-destructive", atrasado: true };
  if (dias <= 15)
    return { label: `Limpeza em ${dias} dia(s)`, tom: "text-amber-600", atrasado: false };
  return { label: `Em dia — próxima em ${dias} dias`, tom: "text-muted-foreground", atrasado: false };
}

/** Abre plano de ação para o aparelho com limpeza vencida ou laudo expirado. */
export async function abrirTarefaPmoc(
  organizacaoId: string,
  e: EquipamentoClima,
  motivo: string,
) {
  const prazo = new Date();
  prazo.setDate(prazo.getDate() + 7);
  const { error } = await supabase.from("planos_acao").insert({
    organizacao_id: organizacaoId,
    unit_id: e.unit_id,
    titulo: `PMOC — ${e.identificacao} (${e.ambiente || "ambiente"})`,
    descricao: motivo,
    criticidade: "alta",
    responsavel: e.responsavel_tecnico || "Manutenção",
    prazo: prazo.toISOString().slice(0, 10),
  });
  if (error) throw error;
}
