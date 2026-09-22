import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Indicadores do SaaS (clientes, MRR, conversões). Só conta master. */
export const metricasSaasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { periodoDias?: number }) => ({
    periodoDias: Math.min(365, Math.max(1, Math.round(Number(data?.periodoDias) || 30))),
  }))
  .handler(async ({ data, context }) => {
    const { metricasSaas } = await import("@/lib/metricas.server");
    return metricasSaas(context.userId, context.supabase, data.periodoDias);
  });
