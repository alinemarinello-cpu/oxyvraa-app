import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

export type AcessoGestor = {
  id: string;
  nome: string;
  email: string;
  escopo: "cliente" | "unidade";
  prefeitura_id: string | null;
  unit_id: string | null;
  cliente_nome: string | null;
  unidade_nome: string | null;
};

/**
 * Vincula convites pendentes ao usuário logado (pelo e-mail) e devolve
 * o acesso de gestor do cliente, se existir.
 */
export async function resolverAcessoGestor(
  userId: string,
  email: string | null,
  supabase: Db,
): Promise<AcessoGestor | null> {
  if (email) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("acessos_gestor")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("email", email);
  }

  const { data } = await supabase
    .from("acessos_gestor")
    .select("id, nome, email, escopo, prefeitura_id, unit_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  let cliente_nome: string | null = null;
  let unidade_nome: string | null = null;

  if (data.unit_id) {
    const { data: u } = await supabase
      .from("units")
      .select("nome, prefeitura_id")
      .eq("id", data.unit_id)
      .maybeSingle();
    unidade_nome = u?.nome ?? null;
    if (u?.prefeitura_id) {
      const { data: p } = await supabase
        .from("prefeituras")
        .select("nome")
        .eq("id", u.prefeitura_id)
        .maybeSingle();
      cliente_nome = p?.nome ?? null;
    }
  } else if (data.prefeitura_id) {
    const { data: p } = await supabase
      .from("prefeituras")
      .select("nome")
      .eq("id", data.prefeitura_id)
      .maybeSingle();
    cliente_nome = p?.nome ?? null;
  }

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    escopo: data.escopo as "cliente" | "unidade",
    prefeitura_id: data.prefeitura_id,
    unit_id: data.unit_id,
    cliente_nome,
    unidade_nome,
  };
}
