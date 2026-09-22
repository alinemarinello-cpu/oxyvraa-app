// Leituras do módulo de compliance feitas pelo navegador (RLS aplica-se ao usuário logado).
import { supabase } from "@/integrations/supabase/client";
import type { ItemChecklist, TipoResposta } from "@/lib/compliance-types";

export type Organizacao = {
  id: string;
  nome: string;
  plano: string;
  status: string;
  trial_expira_em: string;
  cnpj: string | null;
};

export type Checklist = {
  id: string;
  titulo: string;
  norma: string;
  descricao: string;
  ativo: boolean;
  organizacao_id: string;
  origem_template_id: string | null;
  created_at: string;
};

export async function carregarOrganizacao(): Promise<Organizacao | null> {
  const { data } = await supabase
    .from("organizacoes")
    .select("id, nome, plano, status, trial_expira_em, cnpj")
    .limit(1)
    .maybeSingle();
  return (data as Organizacao) ?? null;
}

export async function listarTemplates() {
  const { data } = await supabase
    .from("checklist_templates")
    .select("id, codigo, norma, titulo, descricao, categoria")
    .order("codigo");
  const { data: itens } = await supabase
    .from("checklist_template_itens")
    .select("id, template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, dwell_segundos")
    .order("ordem");
  return (data ?? []).map((t) => ({
    ...t,
    itens: (itens ?? []).filter((i) => i.template_id === t.id),
  }));
}

export async function listarChecklists(): Promise<Checklist[]> {
  const { data } = await supabase
    .from("checklists")
    .select("id, titulo, norma, descricao, ativo, organizacao_id, origem_template_id, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as Checklist[];
}

export async function listarItens(checklistId: string): Promise<ItemChecklist[]> {
  const { data } = await supabase
    .from("checklist_itens")
    .select("*")
    .eq("checklist_id", checklistId)
    .order("ordem");
  return (data ?? []).map((i) => ({
    id: i.id,
    ordem: i.ordem,
    pergunta: i.pergunta,
    tipo: i.tipo as TipoResposta,
    critico: i.critico,
    foto_obrigatoria: i.foto_obrigatoria,
    valor_min: i.valor_min,
    valor_max: i.valor_max,
    unidade_medida: i.unidade_medida,
    opcoes: Array.isArray(i.opcoes) ? (i.opcoes as string[]) : [],
    ajuda: i.ajuda,
    dwell_segundos: i.dwell_segundos,
  }));
}

export async function duplicarTemplate(templateId: string, organizacaoId: string) {
  const { data: tpl, error } = await supabase
    .from("checklist_templates")
    .select("id, titulo, norma, descricao")
    .eq("id", templateId)
    .single();
  if (error) throw error;

  const { data: novo, error: e2 } = await supabase
    .from("checklists")
    .insert({
      organizacao_id: organizacaoId,
      origem_template_id: tpl.id,
      titulo: tpl.titulo,
      norma: tpl.norma,
      descricao: tpl.descricao,
    })
    .select("id")
    .single();
  if (e2) throw e2;

  const { data: itens } = await supabase
    .from("checklist_template_itens")
    .select("*")
    .eq("template_id", templateId)
    .order("ordem");

  if (itens?.length) {
    const { error: e3 } = await supabase.from("checklist_itens").insert(
      itens.map((i) => ({
        checklist_id: novo.id,
        ordem: i.ordem,
        pergunta: i.pergunta,
        tipo: i.tipo,
        critico: i.critico,
        foto_obrigatoria: i.foto_obrigatoria,
        valor_min: i.valor_min,
        valor_max: i.valor_max,
        unidade_medida: i.unidade_medida,
        opcoes: i.opcoes,
        ajuda: i.ajuda,
        dwell_segundos: i.dwell_segundos,
      })),
    );
    if (e3) throw e3;
  }
  return novo.id;
}

export async function criarChecklistVazio(organizacaoId: string, titulo: string) {
  const { data, error } = await supabase
    .from("checklists")
    .insert({ organizacao_id: organizacaoId, titulo, norma: "" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function salvarItens(checklistId: string, itens: ItemChecklist[]) {
  const { error: del } = await supabase
    .from("checklist_itens")
    .delete()
    .eq("checklist_id", checklistId);
  if (del) throw del;
  if (!itens.length) return;
  const { error } = await supabase.from("checklist_itens").insert(
    itens.map((i, idx) => ({
      checklist_id: checklistId,
      ordem: idx,
      pergunta: i.pergunta,
      tipo: i.tipo,
      critico: i.critico,
      foto_obrigatoria: i.foto_obrigatoria,
      valor_min: i.valor_min,
      valor_max: i.valor_max,
      unidade_medida: i.unidade_medida,
      opcoes: i.opcoes,
      ajuda: i.ajuda,
      dwell_segundos: i.dwell_segundos ?? null,
    })),
  );
  if (error) throw error;
}

export async function atualizarChecklist(
  id: string,
  campos: Partial<Pick<Checklist, "titulo" | "norma" | "descricao" | "ativo">>,
) {
  const { error } = await supabase.from("checklists").update(campos).eq("id", id);
  if (error) throw error;
}

export async function excluirChecklist(id: string) {
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) throw error;
}

export async function listarUnidades() {
  const { data } = await supabase.from("units").select("id, nome, bairro, tipo").order("nome");
  return data ?? [];
}

export async function listarAtribuicoes() {
  const { data } = await supabase
    .from("checklist_atribuicoes")
    .select("id, checklist_id, unit_id, frequencia, ativo");
  return data ?? [];
}

export async function atribuir(checklistId: string, unitId: string, frequencia: string) {
  const { error } = await supabase
    .from("checklist_atribuicoes")
    .upsert(
      { checklist_id: checklistId, unit_id: unitId, frequencia },
      { onConflict: "checklist_id,unit_id" },
    );
  if (error) throw error;
}

export async function removerAtribuicao(id: string) {
  const { error } = await supabase.from("checklist_atribuicoes").delete().eq("id", id);
  if (error) throw error;
}

export async function listarExecucoes(dias = 30) {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data } = await supabase
    .from("execucoes")
    .select(
      "id, checklist_id, unit_id, executor_nome, iniciada_em, concluida_em, total_itens, total_conformes, total_nao_conformes",
    )
    .gte("iniciada_em", desde)
    .order("iniciada_em", { ascending: false })
    .limit(500);
  return data ?? [];
}

export async function listarRespostas(execucaoId: string) {
  const { data } = await supabase
    .from("respostas")
    .select("*")
    .eq("execucao_id", execucaoId)
    .order("registrado_em");
  return data ?? [];
}

export async function listarPlanosAcao() {
  const { data } = await supabase
    .from("planos_acao")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type CamposPlanoAcao = {
  status?: string;
  responsavel?: string;
  prazo?: string | null;
  causa_raiz?: string | null;
  acao_corretiva?: string | null;
  foto_evidencia?: string | null;
  concluida_em?: string | null;
};

export async function atualizarPlanoAcao(id: string, campos: CamposPlanoAcao) {
  const { error } = await supabase.from("planos_acao").update(campos).eq("id", id);
  if (error) throw error;
}

export async function listarAlertas() {
  const { data } = await supabase
    .from("alertas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function marcarAlertaLido(id: string) {
  await supabase.from("alertas").update({ lido: true }).eq("id", id);
}
