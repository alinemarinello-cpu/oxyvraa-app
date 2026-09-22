import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Assinatura da organização logada (cria o trial de 7 dias na primeira chamada). */
export const obterAssinatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data ?? {})
  .handler(async ({ context }) => {
    const { garantirAssinatura } = await import("@/lib/assinatura.server");
    return garantirAssinatura(context.userId, context.supabase);
  });

export const salvarEnderecoEntrega = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, string | null>) => data ?? {})
  .handler(async ({ data, context }) => {
    const { gravarEnderecoEntrega } = await import("@/lib/assinatura.server");
    return gravarEnderecoEntrega(context.userId, data, context.supabase);
  });

export const salvarCadeiras = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cadeiras: number }) => {
    const qtd = Math.max(1, Math.round(Number(data.cadeiras) || 1));
    return { cadeiras: qtd };
  })
  .handler(async ({ data, context }) => {
    const { gravarCadeiras } = await import("@/lib/assinatura.server");
    return gravarCadeiras(context.userId, data.cadeiras, context.supabase);
  });

/** Porte da clínica coletado no onboarding: cadeiras/equipos e autoclaves. */
export const salvarPorteClinica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cadeiras: number; autoclaves: number }) => ({
    cadeiras: Math.max(1, Math.min(200, Math.round(Number(data.cadeiras) || 1))),
    autoclaves: Math.max(0, Math.min(200, Math.round(Number(data.autoclaves) || 0))),
  }))
  .handler(async ({ data, context }) => {
    const { gravarPorte } = await import("@/lib/assinatura.server");
    return gravarPorte(context.userId, data, context.supabase);
  });

/** Ativa (ou confirma) o teste grátis de 7 dias sem cartão. */
export const ativarTrialGratis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data ?? {})
  .handler(async ({ context }) => {
    const { garantirAssinatura } = await import("@/lib/assinatura.server");
    return garantirAssinatura(context.userId, context.supabase);
  });

export const listarRemessasInsumos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data ?? {})
  .handler(async ({ context }) => {
    const { listarRemessas } = await import("@/lib/assinatura.server");
    return listarRemessas(context.userId, context.supabase);
  });
