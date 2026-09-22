// Logística: pedidos mensais de insumos (compra e entrega) por empresa cliente.
import { supabase } from "@/integrations/supabase/client";

export const STATUS_PEDIDO = [
  { id: "rascunho", label: "Rascunho" },
  { id: "solicitado", label: "Solicitado" },
  { id: "aprovado", label: "Aprovado" },
  { id: "em_compra", label: "Em compra" },
  { id: "em_transito", label: "Em trânsito" },
  { id: "entregue", label: "Entregue" },
  { id: "cancelado", label: "Cancelado" },
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number]["id"];

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  quantidade_entregue: number;
  preco_unitario: number;
  observacoes: string;
};

export type Pedido = {
  id: string;
  organizacao_id: string;
  prefeitura_id: string;
  unit_id: string | null;
  competencia: string;
  status: string;
  valor_total: number;
  fornecedor: string;
  transportadora: string;
  nota_fiscal: string | null;
  previsao_entrega: string | null;
  entregue_em: string | null;
  recebido_por: string;
  observacoes: string;
  created_at: string;
};

const CAMPOS =
  "id, organizacao_id, prefeitura_id, unit_id, competencia, status, valor_total, fornecedor, transportadora, nota_fiscal, previsao_entrega, entregue_em, recebido_por, observacoes, created_at";

export function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function rotuloStatus(status: string) {
  return STATUS_PEDIDO.find((s) => s.id === status)?.label ?? status;
}

export function corStatus(status: string) {
  switch (status) {
    case "entregue":
      return "bg-emerald-100 text-emerald-800";
    case "em_transito":
      return "bg-blue-100 text-blue-800";
    case "em_compra":
      return "bg-amber-100 text-amber-900";
    case "aprovado":
      return "bg-teal-100 text-teal-900";
    case "cancelado":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export async function listarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos_insumos")
    .select(CAMPOS)
    .order("competencia", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pedido[];
}

export async function criarPedido(p: {
  organizacao_id: string;
  prefeitura_id: string;
  unit_id: string | null;
  competencia: string;
  fornecedor: string;
  previsao_entrega: string | null;
  observacoes: string;
}) {
  const { data, error } = await supabase
    .from("pedidos_insumos")
    .insert({
      organizacao_id: p.organizacao_id,
      prefeitura_id: p.prefeitura_id,
      unit_id: p.unit_id,
      competencia: p.competencia,
      fornecedor: p.fornecedor,
      previsao_entrega: p.previsao_entrega,
      observacoes: p.observacoes,
      status: "solicitado",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function atualizarPedido(id: string, patch: Partial<Pedido>) {
  const { error } = await supabase.from("pedidos_insumos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirPedido(id: string) {
  const { error } = await supabase.from("pedidos_insumos").delete().eq("id", id);
  if (error) throw error;
}

export async function listarItens(pedidoId: string): Promise<PedidoItem[]> {
  const { data, error } = await supabase
    .from("pedido_itens")
    .select(
      "id, pedido_id, produto, categoria, unidade, quantidade, quantidade_entregue, preco_unitario, observacoes",
    )
    .eq("pedido_id", pedidoId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as PedidoItem[];
}

export async function adicionarItem(item: {
  pedido_id: string;
  produto: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
}) {
  const { error } = await supabase.from("pedido_itens").insert(item);
  if (error) throw error;
  await recalcularTotal(item.pedido_id);
}

export async function atualizarItem(id: string, pedidoId: string, patch: Partial<PedidoItem>) {
  const { error } = await supabase.from("pedido_itens").update(patch).eq("id", id);
  if (error) throw error;
  await recalcularTotal(pedidoId);
}

export async function excluirItem(id: string, pedidoId: string) {
  const { error } = await supabase.from("pedido_itens").delete().eq("id", id);
  if (error) throw error;
  await recalcularTotal(pedidoId);
}

export async function recalcularTotal(pedidoId: string) {
  const itens = await listarItens(pedidoId);
  const total = itens.reduce((s, i) => s + Number(i.quantidade) * Number(i.preco_unitario), 0);
  await supabase
    .from("pedidos_insumos")
    .update({ valor_total: Number(total.toFixed(2)) })
    .eq("id", pedidoId);
  return total;
}

export async function marcarEntregue(id: string, recebidoPor: string) {
  await atualizarPedido(id, {
    status: "entregue",
    entregue_em: new Date().toISOString(),
    recebido_por: recebidoPor,
  });
}

// ---------------- Acessos independentes de logística ----------------

export type AcessoLogistica = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  user_id: string | null;
};

export async function listarAcessosLogistica(): Promise<AcessoLogistica[]> {
  const { data, error } = await supabase
    .from("acessos_logistica")
    .select("id, nome, email, ativo, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AcessoLogistica[];
}

export async function convidarLogistica(organizacaoId: string, nome: string, email: string) {
  const { error } = await supabase.from("acessos_logistica").insert({
    organizacao_id: organizacaoId,
    nome,
    email: email.toLowerCase(),
  });
  if (error) throw error;
}

export async function removerAcessoLogistica(id: string) {
  const { error } = await supabase.from("acessos_logistica").delete().eq("id", id);
  if (error) throw error;
}
