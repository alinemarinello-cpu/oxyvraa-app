import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolverAcessoGestor } from "@/lib/gestor.server";

/** Devolve o acesso de "gestor do cliente" do usuário logado (ou null). */
export const meuAcessoGestor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    return resolverAcessoGestor(context.userId, email, context.supabase);
  });
