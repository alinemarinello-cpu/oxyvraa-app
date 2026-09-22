// Consulta de clientes do SaaS para o proprietário (conta master). Só roda no servidor.
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, any, any>;

export type ClienteSaas = {
  organizacao_id: string;
  clinica: string;
  cnpj: string | null;
  criada_em: string;
  segmento: string;
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  responsavel_cpf: string | null;
  cadeiras: number;
  autoclaves: number;
  plano: string | null;
  ciclo: string | null;
  status: string;
  kit_insumos: boolean;
  trial_fim: string | null;
  entrega: string | null;
};

async function exigirMaster(userId: string, supabase: Db) {
  const { data, error } = await supabase.rpc("is_master", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Acesso restrito à conta administradora geral.");
}

function montarEndereco(a: Record<string, any> | undefined): string | null {
  if (!a) return null;
  const partes = [
    [a.entrega_rua, a.entrega_numero].filter(Boolean).join(", "),
    a.entrega_complemento,
    a.entrega_cidade,
    a.entrega_uf,
    a.entrega_cep,
  ].filter((p) => p && String(p).trim().length > 0);
  return partes.length ? partes.join(" — ") : null;
}

export type PaginaClientes = {
  itens: ClienteSaas[];
  total: number;
  pagina: number;
  porPagina: number;
};

function escaparBusca(t: string): string {
  return t.replace(/[%,()]/g, " ").trim();
}

export async function listarClientesSaas(
  userId: string,
  supabase: Db,
  opcoes: { busca?: string; pagina?: number; porPagina?: number } = {},
): Promise<PaginaClientes> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pagina = Math.max(1, Math.round(opcoes.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(5, Math.round(opcoes.porPagina ?? 25)));
  const de = (pagina - 1) * porPagina;
  const termo = escaparBusca(opcoes.busca ?? "");

  let consulta = supabaseAdmin
    .from("organizacoes")
    .select(
      "id, nome, cnpj, created_at, segmento, responsavel_nome, responsavel_cargo, responsavel_email, responsavel_telefone, responsavel_cpf",
      { count: "exact" },
    );

  if (termo) {
    const like = `%${termo}%`;
    const filtros = [
      `nome.ilike.${like}`,
      `cnpj.ilike.${like}`,
      `responsavel_nome.ilike.${like}`,
      `responsavel_email.ilike.${like}`,
      `responsavel_telefone.ilike.${like}`,
    ];

    // Status do plano mora na tabela assinaturas: resolve as organizações
    // cujo status combina com o termo (ex.: "trial", "ativa", "atrasada").
    const { data: assinPorStatus } = await supabaseAdmin
      .from("assinaturas")
      .select("organizacao_id")
      .ilike("status", like);
    const idsPorStatus = (assinPorStatus ?? []).map((a: any) => a.organizacao_id);
    if (idsPorStatus.length) filtros.push(`id.in.(${idsPorStatus.join(",")})`);

    // Busca exata pelo status "SEM_ASSINATURA" (evita coincidências com letras isoladas).
    const termoNormalizado = termo.toLowerCase().replace(/\s+/g, "_");
    if (termoNormalizado === "sem_assinatura") {
      const { data: todasAssin } = await supabaseAdmin.from("assinaturas").select("organizacao_id");
      const comAssin = (todasAssin ?? []).map((a: any) => a.organizacao_id);
      if (comAssin.length) filtros.push(`id.not.in.(${comAssin.join(",")})`);
    }

    consulta = consulta.or(filtros.join(","));
  }

  const {
    data: orgs,
    error,
    count,
  } = await consulta.order("created_at", { ascending: false }).range(de, de + porPagina - 1);
  if (error) throw error;

  const ids = (orgs ?? []).map((o: any) => o.id);
  const { data: assinaturas } = await supabaseAdmin
    .from("assinaturas")
    .select("*")
    .in("organizacao_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const porOrg = new Map<string, any>();
  (assinaturas ?? []).forEach((a: any) => porOrg.set(a.organizacao_id, a));

  const itens = (orgs ?? []).map((o: any) => {
    const a = porOrg.get(o.id);
    return {
      organizacao_id: o.id,
      clinica: o.nome ?? "Sem nome",
      cnpj: o.cnpj ?? null,
      criada_em: o.created_at,
      segmento: o.segmento ?? "odonto",
      responsavel_nome: o.responsavel_nome ?? null,
      responsavel_cargo: o.responsavel_cargo ?? null,
      responsavel_email: o.responsavel_email ?? null,
      responsavel_telefone: o.responsavel_telefone ?? null,
      responsavel_cpf: o.responsavel_cpf ?? null,
      cadeiras: a?.cadeiras ?? 1,
      autoclaves: a?.autoclaves ?? 0,
      plano: a?.plano ?? null,
      ciclo: a?.ciclo ?? null,
      status: a?.status ?? "SEM_ASSINATURA",
      kit_insumos: Boolean(a?.kit_insumos),
      trial_fim: a?.trial_fim ?? null,
      entrega: montarEndereco(a),
    };
  });

  return { itens, total: count ?? itens.length, pagina, porPagina };
}


/** Estende o teste grátis da organização em N dias (a partir do fim atual ou de hoje). */
export async function estenderTrial(
  userId: string,
  organizacaoId: string,
  dias: number,
  supabase: Db,
): Promise<{ trial_fim: string }> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: atual, error } = await supabaseAdmin
    .from("assinaturas")
    .select("id, trial_fim")
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();
  if (error) throw error;
  if (!atual) throw new Error("Esta conta ainda não possui assinatura registrada.");

  const base = atual.trial_fim ? new Date(atual.trial_fim) : new Date();
  const inicio = base.getTime() > Date.now() ? base : new Date();
  const novo = new Date(inicio.getTime() + dias * 86_400_000).toISOString();

  const { error: err2 } = await supabaseAdmin
    .from("assinaturas")
    .update({ trial_fim: novo, status: "TRIALING" })
    .eq("id", atual.id);
  if (err2) throw err2;
  return { trial_fim: novo };
}
