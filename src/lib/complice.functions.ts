import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const paginacao = (d: any) => ({
  pagina: Math.max(1, Math.round(Number(d?.pagina) || 1)),
  porPagina: Math.min(100, Math.max(5, Math.round(Number(d?.porPagina) || 25))),
});

/** Contadores globais da plataforma (só conta master). */
export const resumoCompliceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resumoComplice } = await import("@/lib/complice.server");
    return resumoComplice(context.userId, context.supabase);
  });

export const listarOrganizacoesCompliceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { busca?: string; pagina?: number; porPagina?: number }) => ({
    busca: String(data?.busca ?? "").slice(0, 120),
    ...paginacao(data),
  }))
  .handler(async ({ data, context }) => {
    const { listarOrganizacoesComplice } = await import("@/lib/complice.server");
    return listarOrganizacoesComplice(context.userId, context.supabase, data);
  });

export const listarExecucoesCompliceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { organizacaoId?: string; pagina?: number; porPagina?: number }) => ({
    organizacaoId: data?.organizacaoId ? String(data.organizacaoId) : undefined,
    ...paginacao(data),
  }))
  .handler(async ({ data, context }) => {
    const { listarExecucoesComplice } = await import("@/lib/complice.server");
    return listarExecucoesComplice(context.userId, context.supabase, data);
  });

export const listarLeadsCompliceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: {
    busca?: string;
    origem?: string;
    pagina?: number;
    porPagina?: number;
  }) => ({
    busca: String(data?.busca ?? "").slice(0, 120),
    origem: data?.origem ? String(data.origem).slice(0, 60) : undefined,
    ...paginacao(data),
  }))
  .handler(async ({ data, context }) => {
    const { listarLeadsComplice } = await import("@/lib/complice.server");
    return listarLeadsComplice(context.userId, context.supabase, data);
  });
