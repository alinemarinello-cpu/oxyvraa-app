import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

export type AcessoLogisticaResolvido = {
  id: string;
  nome: string;
  email: string;
  organizacao_id: string;
  organizacao_nome: string | null;
};

/**
 * Vincula convites de logística pendentes ao usuário logado (pelo e-mail)
 * e devolve o acesso ativo, se existir.
 */
export async function resolverAcessoLogistica(
  userId: string,
  email: string | null,
  supabase: Db,
): Promise<AcessoLogisticaResolvido | null> {
  if (email) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("acessos_logistica")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("email", email);
  }

  const { data } = await supabase
    .from("acessos_logistica")
    .select("id, nome, email, organizacao_id")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: org } = await supabase
    .from("organizacoes")
    .select("nome")
    .eq("id", data.organizacao_id)
    .maybeSingle();

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    organizacao_id: data.organizacao_id,
    organizacao_nome: org?.nome ?? null,
  };
}
