// Leitura e escrita da assinatura da organização (executa apenas no servidor).
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  planoPorId,
  type AssinaturaResumo,
  type CicloCobranca,
  type PlanoId,
  type StatusAssinatura,
} from "@/lib/planos-oxyvra";

type Db = SupabaseClient<any, any, any>;

export type AssinaturaCompleta = AssinaturaResumo & {
  id: string;
  organizacao_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cadeiras: number;
  autoclaves: number;
  entrega_cep: string | null;
  entrega_rua: string | null;
  entrega_numero: string | null;
  entrega_complemento: string | null;
  entrega_cidade: string | null;
  entrega_uf: string | null;
  entrega_destinatario: string | null;
  entrega_documento: string | null;
};

export async function organizacaoDoUsuario(userId: string, supabase: Db): Promise<string> {
  const { data } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (data?.organizacao_id) return data.organizacao_id as string;

  // Conta nova ainda sem organização: cria a organização e o vínculo na hora.
  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, email")
    .eq("id", userId)
    .maybeSingle();
  const { garantirOrganizacao } = await import("@/lib/compliance.server");
  const nome = (perfil?.nome as string) || (perfil?.email as string) || "Minha organização";
  const org = await garantirOrganizacao(userId, nome, supabase as never);
  return org.id;
}

/** Garante a linha de assinatura da organização, criando o trial de 7 dias. */
export async function garantirAssinatura(
  userId: string,
  supabase: Db,
): Promise<AssinaturaCompleta> {
  const organizacaoId = await organizacaoDoUsuario(userId, supabase);

  const { data: existente } = await supabase
    .from("assinaturas")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existente) return normalizar(existente);

  const agora = new Date();
  const fimTrial = new Date(agora.getTime() + 7 * 86_400_000);
  // Criação do trial é bootstrap da conta: usa cliente administrativo porque a
  // política de RLS depende de minha_organizacao(), que pode ainda não enxergar
  // o vínculo recém-criado da organização.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: criada, error } = await supabaseAdmin
    .from("assinaturas")
    .insert({
      organizacao_id: organizacaoId,
      plano: "CONSULTORIO",
      ciclo: "MONTHLY",
      status: "TRIALING",
      unidades_permitidas: 1,
      cadeiras: 1,
      trial_inicio: agora.toISOString(),
      trial_fim: fimTrial.toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizar(criada);
}

export async function gravarEnderecoEntrega(
  userId: string,
  dados: Record<string, string | null>,
  supabase: Db,
): Promise<AssinaturaCompleta> {
  const atual = await garantirAssinatura(userId, supabase);
  const campos = [
    "entrega_destinatario",
    "entrega_documento",
    "entrega_cep",
    "entrega_rua",
    "entrega_numero",
    "entrega_complemento",
    "entrega_cidade",
    "entrega_uf",
  ] as const;
  const patch: Record<string, string | null> = {};
  for (const c of campos) if (c in dados) patch[c] = dados[c] ?? null;

  const { data, error } = await supabase
    .from("assinaturas")
    .update(patch)
    .eq("id", atual.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizar(data);
}

export async function gravarCadeiras(
  userId: string,
  cadeiras: number,
  supabase: Db,
): Promise<AssinaturaCompleta> {
  return gravarPorte(userId, { cadeiras }, supabase);
}

/** Porte da clínica: cadeiras/equipos e autoclaves. */
export async function gravarPorte(
  userId: string,
  dados: { cadeiras?: number; autoclaves?: number },
  supabase: Db,
): Promise<AssinaturaCompleta> {
  const atual = await garantirAssinatura(userId, supabase);
  const patch: Record<string, number> = {};
  if (dados.cadeiras !== undefined) patch.cadeiras = Math.max(1, Math.round(dados.cadeiras || 1));
  if (dados.autoclaves !== undefined)
    patch.autoclaves = Math.max(0, Math.round(dados.autoclaves || 0));
  if (Object.keys(patch).length === 0) return atual;

  const { data, error } = await supabase
    .from("assinaturas")
    .update(patch)
    .eq("id", atual.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalizar(data);
}

export async function listarRemessas(userId: string, supabase: Db) {
  const organizacaoId = await organizacaoDoUsuario(userId, supabase);
  const { data, error } = await supabase
    .from("remessas_insumos")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function normalizar(row: any): AssinaturaCompleta {
  const plano = (row.plano ?? "CONSULTORIO") as PlanoId;
  return {
    id: row.id,
    organizacao_id: row.organizacao_id,
    plano,
    status: (row.status ?? "TRIALING") as StatusAssinatura,
    ciclo: (row.ciclo ?? "MONTHLY") as CicloCobranca,
    kit_insumos: Boolean(row.kit_insumos),
    unidades_permitidas: row.unidades_permitidas ?? planoPorId(plano).unidadesPermitidas,
    cadeiras: row.cadeiras ?? 1,
    autoclaves: row.autoclaves ?? 1,
    trial_fim: row.trial_fim,
    periodo_fim: row.periodo_fim ?? null,
    stripe_customer_id: row.stripe_customer_id ?? null,
    stripe_subscription_id: row.stripe_subscription_id ?? null,
    entrega_cep: row.entrega_cep ?? null,
    entrega_rua: row.entrega_rua ?? null,
    entrega_numero: row.entrega_numero ?? null,
    entrega_complemento: row.entrega_complemento ?? null,
    entrega_cidade: row.entrega_cidade ?? null,
    entrega_uf: row.entrega_uf ?? null,
    entrega_destinatario: row.entrega_destinatario ?? null,
    entrega_documento: row.entrega_documento ?? null,
  };
}
