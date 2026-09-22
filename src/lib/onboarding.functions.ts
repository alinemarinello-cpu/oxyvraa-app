// Onboarding: dados e criação da primeira unidade com PIN de acesso da equipe.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PINS_FRACOS = new Set([
  "0000", "1111", "2222", "3333", "4444",
  "5555", "6666", "7777", "8888", "9999",
  "1234", "4321", "0123", "3210",
]);

const schemaPrimeiraUnidade = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome da unidade (mínimo 3 letras).")
    .max(100, "Nome da unidade muito longo."),
  pin: z.string().regex(/^\d{4}$/, "O PIN deve ter exatamente 4 números."),
});

async function organizacaoDoUsuario(supabase: any, userId: string) {
  const { data: membro } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();

  if (!membro?.organizacao_id) {
    // Conta recém-criada: cria a organização e o vínculo automaticamente.
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome, email")
      .eq("id", userId)
      .maybeSingle();
    const { garantirOrganizacao } = await import("@/lib/compliance.server");
    const nova = await garantirOrganizacao(
      userId,
      perfil?.nome || perfil?.email || "Minha organização",
      supabase,
    );
    return { id: nova.id, nome: nova.nome };
  }

  const { data: org } = await supabase
    .from("organizacoes")
    .select("id, nome")
    .eq("id", membro.organizacao_id)
    .maybeSingle();
  return org as { id: string; nome: string } | null;
}

const SEGMENTOS = new Set(["odonto", "escola", "ilpi"]);

const schemaSegmento = z.object({
  segmento: z.enum(["odonto", "escola", "ilpi"]),
  /** Porte informado por escolas (alunos/salas) e lares de idosos (residentes/alas). */
  porte: z
    .object({
      alunos: z.number().int().min(0).max(100000).optional(),
      salas: z.number().int().min(0).max(10000).optional(),
      residentes: z.number().int().min(0).max(100000).optional(),
      alas: z.number().int().min(0).max(10000).optional(),
    })
    .optional(),
});

/** Grava o segmento escolhido na criação da conta (e o porte, quando informado). */
export const salvarSegmentoConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schemaSegmento.parse(data))
  .handler(async ({ data, context }) => {
    const org = await organizacaoDoUsuario(context.supabase, context.userId);
    if (!org) throw new Error("Organização não encontrada.");
    const temPorte = data.porte && Object.keys(data.porte).length > 0;
    const patch = temPorte
      ? { segmento: data.segmento, porte_dados: data.porte }
      : { segmento: data.segmento };
    const { error } = await context.supabase
      .from("organizacoes")
      .update(patch)
      .eq("id", org.id);
    if (error) throw error;
    return { ok: true };
  });

/** Segmento e porte já gravados na organização (fonte de verdade após o cadastro). */
export const lerSegmentoConta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membro } = await context.supabase
      .from("organizacao_membros")
      .select("organizacao_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (!membro?.organizacao_id) return { segmento: null as string | null, porte: {} as Record<string, number> };
    const { data: org } = await context.supabase
      .from("organizacoes")
      .select("segmento, porte_dados")
      .eq("id", membro.organizacao_id)
      .maybeSingle();
    const segmento = org?.segmento && SEGMENTOS.has(org.segmento) ? org.segmento : null;
    return { segmento, porte: (org?.porte_dados ?? {}) as Record<string, number> };
  });

/** Dados para o passo de PIN: nome da clínica e se já existe unidade cadastrada. */
export const dadosOnboardingPin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const org = await organizacaoDoUsuario(supabase, userId);
    if (!org) return { temUnidade: false, nomeClinica: "" };

    const { data: clientes } = await supabase
      .from("prefeituras")
      .select("id")
      .eq("organizacao_id", org.id);
    const ids = (clientes ?? []).map((c: { id: string }) => c.id);

    let temUnidade = false;
    if (ids.length > 0) {
      const { count } = await supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .in("prefeitura_id", ids);
      temUnidade = (count ?? 0) > 0;
    }
    return { temUnidade, nomeClinica: org.nome ?? "" };
  });

/**
 * Cria a primeira unidade da organização já com o PIN de acesso da equipe.
 * Idempotente: se a organização já tiver unidade, devolve a existente sem duplicar.
 */
export const criarPrimeiraUnidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schemaPrimeiraUnidade.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const org = await organizacaoDoUsuario(supabase, userId);
    if (!org) throw new Error("Organização não encontrada para esta conta.");

    if (PINS_FRACOS.has(data.pin)) {
      throw new Error("PIN muito fácil de adivinhar. Escolha 4 números menos óbvios.");
    }

    // Garante o "cliente" (registro da clínica) da organização.
    let { data: cliente } = await supabase
      .from("prefeituras")
      .select("id")
      .eq("organizacao_id", org.id)
      .limit(1)
      .maybeSingle();

    if (!cliente) {
      const { data: novo, error } = await supabase
        .from("prefeituras")
        .insert({ organizacao_id: org.id, nome: org.nome || data.nome })
        .select("id")
        .single();
      if (error) throw error;
      cliente = novo;
    }

    // Não duplica: se já existe unidade, apenas devolve.
    const { data: existente } = await supabase
      .from("units")
      .select("id, nome")
      .eq("prefeitura_id", cliente.id)
      .limit(1)
      .maybeSingle();
    if (existente) {
      return { id: existente.id as string, nome: existente.nome as string, criada: false };
    }

    const { data: unidade, error: erroUnidade } = await supabase
      .from("units")
      .insert({
        prefeitura_id: cliente.id,
        tipo: "clinica",
        nome: data.nome,
        pin: data.pin,
      })
      .select("id, nome")
      .single();
    if (erroUnidade) throw erroUnidade;

    return { id: unidade.id as string, nome: unidade.nome as string, criada: true };
  });
