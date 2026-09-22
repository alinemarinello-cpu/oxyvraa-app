import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolverAcessoLogistica } from "@/lib/logistica.server";

/** Devolve o acesso independente de logística do usuário logado (ou null). */
export const meuAcessoLogistica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    return resolverAcessoLogistica(context.userId, email, context.supabase);
  });
