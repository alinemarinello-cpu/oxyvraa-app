import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Todos os clientes do SaaS com responsável, porte, plano e entrega. Só conta master. */
export const listarClientesSaasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { busca?: string; pagina?: number; porPagina?: number }) => ({
    busca: String(data?.busca ?? "").slice(0, 120),
    pagina: Math.max(1, Math.round(Number(data?.pagina) || 1)),
    porPagina: Math.min(100, Math.max(5, Math.round(Number(data?.porPagina) || 25))),
  }))
  .handler(async ({ data, context }) => {
    const { listarClientesSaas } = await import("@/lib/superadmin.server");
    return listarClientesSaas(context.userId, context.supabase, data);
  });

/** Estende o período de teste de um cliente. */
export const estenderTrialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizacaoId: string; dias?: number }) => ({
    organizacaoId: String(data.organizacaoId),
    dias: Math.max(1, Math.min(90, Math.round(Number(data.dias) || 7))),
  }))
  .handler(async ({ data, context }) => {
    const { estenderTrial } = await import("@/lib/superadmin.server");
    return estenderTrial(context.userId, data.organizacaoId, data.dias, context.supabase);
  });
