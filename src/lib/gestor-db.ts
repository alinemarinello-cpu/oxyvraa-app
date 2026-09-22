// Leitura do painel do gestor do cliente (somente leitura, protegida por RLS).
import { supabase } from "@/integrations/supabase/client";

export type EscopoGestor = { prefeituraId: string | null; unitId: string | null };

export async function unidadesDoEscopo(escopo: EscopoGestor) {
  let q = supabase.from("units").select("id, nome, bairro, tipo, cidade, uf").order("nome");
  if (escopo.unitId) q = q.eq("id", escopo.unitId);
  else if (escopo.prefeituraId) q = q.eq("prefeitura_id", escopo.prefeituraId);
  const { data } = await q;
  return data ?? [];
}

export async function execucoesDoEscopo(unitIds: string[], dias = 30) {
  if (unitIds.length === 0) return [];
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data } = await supabase
    .from("execucoes")
    .select(
      "id, unit_id, executor_nome, iniciada_em, concluida_em, total_itens, total_conformes, total_nao_conformes",
    )
    .in("unit_id", unitIds)
    .gte("iniciada_em", desde)
    .order("iniciada_em", { ascending: false })
    .limit(500);
  return data ?? [];
}

export async function limpezasDoEscopo(unitIds: string[], limite = 24) {
  if (unitIds.length === 0) return [];
  const { data } = await supabase
    .from("cleanings")
    .select("id, unit_id, ambiente, servente, executado_em, foto_depois, status, fora_da_area")
    .in("unit_id", unitIds)
    .order("executado_em", { ascending: false })
    .limit(limite);
  return data ?? [];
}

export async function planosDoEscopo(unitIds: string[]) {
  if (unitIds.length === 0) return [];
  const { data } = await supabase
    .from("planos_acao")
    .select("id, unit_id, titulo, descricao, criticidade, status, responsavel, prazo")
    .in("unit_id", unitIds)
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function alertasDoEscopo(unitIds: string[]) {
  if (unitIds.length === 0) return [];
  const { data } = await supabase
    .from("alertas")
    .select("id, unit_id, titulo, mensagem, severidade, lido, created_at")
    .in("unit_id", unitIds)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
