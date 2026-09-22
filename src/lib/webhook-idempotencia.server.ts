// Garante que o mesmo evento de pagamento não seja processado duas vezes.
// O gateway reenvia eventos quando não recebe resposta; sem isso, uma remessa de
// kit ou uma mudança de status poderia ser aplicada em duplicidade.

/** Marca o evento como em processamento. Retorna false quando já foi tratado antes. */
export async function registrarEvento(
  origem: string,
  eventoId: string,
  tipo?: string,
): Promise<boolean> {
  if (!eventoId) return true; // sem identificador não há como deduplicar
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("eventos_webhook")
    .insert({ origem, evento_id: eventoId, tipo: tipo ?? null } as never);
  if (!error) return true;
  // 23505 = violação de chave única → evento repetido
  if ((error as any).code === "23505") return false;
  throw new Error(error.message);
}

/** Libera o evento para nova tentativa quando o processamento falhou. */
export async function liberarEvento(origem: string, eventoId: string): Promise<void> {
  if (!eventoId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("eventos_webhook")
    .delete()
    .eq("origem", origem)
    .eq("evento_id", eventoId);
}
