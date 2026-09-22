// Visão global do proprietário (acesso "complice"): organizações, execuções, diagnósticos e leads.
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient<any, any, any>;

async function exigirMaster(userId: string, supabase: Db) {
  const { data, error } = await supabase.rpc("is_master", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Acesso restrito à conta administradora geral.");
}

function limpar(t: string): string {
  return t.replace(/[%,()]/g, " ").trim();
}

export type ResumoComplice = {
  organizacoes: number;
  unidades: number;
  execucoes: number;
  leads: number;
  leadsConvertidos: number;
  assinaturasAtivas: number;
};

export async function resumoComplice(userId: string, supabase: Db): Promise<ResumoComplice> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const db = supabaseAdmin as unknown as Db;
  const contar = async (tabela: string, filtro?: (q: any) => any) => {
    let q = db.from(tabela).select("id", { count: "exact", head: true });
    if (filtro) q = filtro(q);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };

  const [organizacoes, unidades, execucoes, leads, leadsConvertidos, assinaturasAtivas] =
    await Promise.all([
      contar("organizacoes"),
      contar("units"),
      contar("execucoes"),
      contar("rdc_leads"),
      contar("rdc_leads", (q) => q.not("convertido_em", "is", null)),
      contar("assinaturas", (q) => q.eq("status", "ACTIVE")),
    ]);

  return { organizacoes, unidades, execucoes, leads, leadsConvertidos, assinaturasAtivas };
}

export type OrganizacaoComplice = {
  id: string;
  nome: string;
  cnpj: string | null;
  segmento: string;
  status: string | null;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  created_at: string;
  unidades: number;
  membros: number;
};

export async function listarOrganizacoesComplice(
  userId: string,
  supabase: Db,
  opcoes: { busca?: string; pagina?: number; porPagina?: number } = {},
): Promise<{ itens: OrganizacaoComplice[]; total: number }> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pagina = Math.max(1, Math.round(opcoes.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(5, Math.round(opcoes.porPagina ?? 25)));
  const de = (pagina - 1) * porPagina;
  const termo = limpar(opcoes.busca ?? "");

  let consulta = supabaseAdmin
    .from("organizacoes")
    .select(
      "id, nome, cnpj, segmento, status, responsavel_nome, responsavel_email, responsavel_telefone, created_at",
      { count: "exact" },
    );
  if (termo) {
    const like = `%${termo}%`;
    consulta = consulta.or(
      [
        `nome.ilike.${like}`,
        `cnpj.ilike.${like}`,
        `segmento.ilike.${like}`,
        `responsavel_nome.ilike.${like}`,
        `responsavel_email.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error, count } = await consulta
    .order("created_at", { ascending: false })
    .range(de, de + porPagina - 1);
  if (error) throw error;

  const ids = (data ?? []).map((o: any) => o.id);
  const vazio = ["00000000-0000-0000-0000-000000000000"];

  const [{ data: prefs }, { data: membros }] = await Promise.all([
    supabaseAdmin.from("prefeituras").select("id, organizacao_id").in("organizacao_id", ids.length ? ids : vazio),
    supabaseAdmin
      .from("organizacao_membros")
      .select("organizacao_id")
      .in("organizacao_id", ids.length ? ids : vazio),
  ]);

  const prefIds = (prefs ?? []).map((p: any) => p.id);
  const { data: unidades } = await supabaseAdmin
    .from("units")
    .select("id, prefeitura_id")
    .in("prefeitura_id", prefIds.length ? prefIds : vazio)
    .limit(5000);

  const orgDaPref = new Map<string, string>();
  (prefs ?? []).forEach((p: any) => orgDaPref.set(p.id, p.organizacao_id));

  const contUnidades = new Map<string, number>();
  (unidades ?? []).forEach((u: any) => {
    const org = orgDaPref.get(u.prefeitura_id);
    if (org) contUnidades.set(org, (contUnidades.get(org) ?? 0) + 1);
  });

  const contMembros = new Map<string, number>();
  (membros ?? []).forEach((m: any) =>
    contMembros.set(m.organizacao_id, (contMembros.get(m.organizacao_id) ?? 0) + 1),
  );

  const itens = (data ?? []).map((o: any) => ({
    id: o.id,
    nome: o.nome ?? "Sem nome",
    cnpj: o.cnpj ?? null,
    segmento: o.segmento ?? "odonto",
    status: o.status ?? null,
    responsavel_nome: o.responsavel_nome ?? null,
    responsavel_email: o.responsavel_email ?? null,
    responsavel_telefone: o.responsavel_telefone ?? null,
    created_at: o.created_at,
    unidades: contUnidades.get(o.id) ?? 0,
    membros: contMembros.get(o.id) ?? 0,
  }));

  return { itens, total: count ?? itens.length };
}

export type ExecucaoComplice = {
  id: string;
  organizacao: string;
  unidade: string;
  executor: string | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  total_itens: number;
  total_conformes: number;
  total_nao_conformes: number;
};

export async function listarExecucoesComplice(
  userId: string,
  supabase: Db,
  opcoes: { organizacaoId?: string; pagina?: number; porPagina?: number } = {},
): Promise<{ itens: ExecucaoComplice[]; total: number }> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pagina = Math.max(1, Math.round(opcoes.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(5, Math.round(opcoes.porPagina ?? 25)));
  const de = (pagina - 1) * porPagina;

  let consulta = supabaseAdmin
    .from("execucoes")
    .select(
      "id, organizacao_id, unit_id, executor_nome, pin_nome, iniciada_em, concluida_em, total_itens, total_conformes, total_nao_conformes",
      { count: "exact" },
    );
  if (opcoes.organizacaoId) consulta = consulta.eq("organizacao_id", opcoes.organizacaoId);

  const { data, error, count } = await consulta
    .order("iniciada_em", { ascending: false })
    .range(de, de + porPagina - 1);
  if (error) throw error;

  const vazio = ["00000000-0000-0000-0000-000000000000"];
  const orgIds = [...new Set((data ?? []).map((e: any) => e.organizacao_id).filter(Boolean))];
  const unitIds = [...new Set((data ?? []).map((e: any) => e.unit_id).filter(Boolean))];

  const [{ data: orgs }, { data: units }] = await Promise.all([
    supabaseAdmin.from("organizacoes").select("id, nome").in("id", orgIds.length ? orgIds : vazio),
    supabaseAdmin.from("units").select("id, nome").in("id", unitIds.length ? unitIds : vazio),
  ]);
  const nomeOrg = new Map((orgs ?? []).map((o: any) => [o.id, o.nome]));
  const nomeUnit = new Map((units ?? []).map((u: any) => [u.id, u.nome]));

  const itens = (data ?? []).map((e: any) => ({
    id: e.id,
    organizacao: nomeOrg.get(e.organizacao_id) ?? "—",
    unidade: nomeUnit.get(e.unit_id) ?? "—",
    executor: e.executor_nome ?? e.pin_nome ?? null,
    iniciada_em: e.iniciada_em,
    concluida_em: e.concluida_em,
    total_itens: e.total_itens ?? 0,
    total_conformes: e.total_conformes ?? 0,
    total_nao_conformes: e.total_nao_conformes ?? 0,
  }));

  return { itens, total: count ?? itens.length };
}

export type LeadComplice = {
  id: string;
  nome: string | null;
  clinica: string | null;
  email: string | null;
  whatsapp: string | null;
  cidade: string | null;
  uf: string | null;
  origem: string | null;
  etapa: string | null;
  score: number | null;
  pendencias: number | null;
  convertido_em: string | null;
  created_at: string;
};

export async function listarLeadsComplice(
  userId: string,
  supabase: Db,
  opcoes: { busca?: string; origem?: string; pagina?: number; porPagina?: number } = {},
): Promise<{ itens: LeadComplice[]; total: number }> {
  await exigirMaster(userId, supabase);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pagina = Math.max(1, Math.round(opcoes.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(5, Math.round(opcoes.porPagina ?? 25)));
  const de = (pagina - 1) * porPagina;
  const termo = limpar(opcoes.busca ?? "");

  let consulta = supabaseAdmin
    .from("rdc_leads")
    .select(
      "id, nome, clinica, email, whatsapp, cidade, uf, origem, etapa, score, pendencias, convertido_em, created_at",
      { count: "exact" },
    );
  if (opcoes.origem) consulta = consulta.eq("origem", opcoes.origem);
  if (termo) {
    const like = `%${termo}%`;
    consulta = consulta.or(
      [
        `nome.ilike.${like}`,
        `clinica.ilike.${like}`,
        `email.ilike.${like}`,
        `whatsapp.ilike.${like}`,
        `cidade.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error, count } = await consulta
    .order("created_at", { ascending: false })
    .range(de, de + porPagina - 1);
  if (error) throw error;

  return { itens: (data ?? []) as LeadComplice[], total: count ?? (data ?? []).length };
}
