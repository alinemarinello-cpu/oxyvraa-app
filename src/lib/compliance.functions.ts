import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ExecucaoPayload } from "@/lib/compliance-types";
import { garantirOrganizacao, gravarExecucao } from "@/lib/compliance.server";

/** Garante que o usuário logado tenha uma organização (com trial de 7 dias). */
export const bootstrapOrganizacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome?: string }) => data ?? {})
  .handler(async ({ data, context }) => {
    return garantirOrganizacao(context.userId, data.nome ?? "", context.supabase);
  });

/** Grava uma execução completa (idempotente), gerando alertas e planos de ação. */
export const submeterExecucao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ExecucaoPayload) => {
    if (!data?.idempotencyKey || !data.checklistId || !data.unitId) {
      throw new Error("Execução inválida.");
    }
    if (!Array.isArray(data.respostas)) throw new Error("Respostas ausentes.");
    return data;
  })
  .handler(async ({ data, context }) => {
    return gravarExecucao(data, context.userId, context.supabase);
  });

/** Dados do responsável pela conta (assinante) da organização logada. */
export const obterResponsavelConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data ?? {})
  .handler(async ({ context }) => {
    const { lerResponsavel } = await import("@/lib/compliance.server");
    return lerResponsavel(context.userId, context.supabase);
  });

export const salvarResponsavelConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, string | null>) => data ?? {})
  .handler(async ({ data, context }) => {
    const { gravarResponsavel } = await import("@/lib/compliance.server");
    return gravarResponsavel(context.userId, data, context.supabase);
  });

/** Lista de assinantes com o responsável de cada conta (somente conta master). */
export const listarAssinantesConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { busca?: string; pagina?: number; porPagina?: number }) => ({
    busca: String(data?.busca ?? "").slice(0, 120),
    pagina: Math.max(1, Math.round(Number(data?.pagina) || 1)),
    porPagina: Math.min(100, Math.max(5, Math.round(Number(data?.porPagina) || 25))),
  }))
  .handler(async ({ data, context }) => {
    const { listarAssinantes } = await import("@/lib/compliance.server");
    return listarAssinantes(context.userId, context.supabase, data);
  });
