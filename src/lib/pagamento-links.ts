// Links de pagamento (Mercado Pago) cadastrados pela conta mestre.
// Os links ficam na tabela pagamento_links: leitura pública, escrita só do master.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CicloCobranca, PlanoId } from "@/lib/planos-oxyvra";

export type LinkPagamento = {
  id: string;
  tipo: "plano" | "addon";
  plano: string | null;
  ciclo: CicloCobranca;
  url: string;
  ativo: boolean;
};

export async function carregarLinksPagamento(): Promise<LinkPagamento[]> {
  const { data, error } = await supabase
    .from("pagamento_links")
    .select("id, tipo, plano, ciclo, url, ativo")
    .order("tipo")
    .order("plano")
    .order("ciclo");
  if (error) throw new Error(error.message);
  return (data ?? []) as LinkPagamento[];
}

export function useLinksPagamento() {
  return useQuery({
    queryKey: ["pagamento-links"],
    queryFn: carregarLinksPagamento,
    staleTime: 60_000,
  });
}

export function linkDoPlano(
  links: LinkPagamento[] | undefined,
  plano: PlanoId,
  ciclo: CicloCobranca,
): string | null {
  const l = links?.find(
    (x) => x.tipo === "plano" && x.plano === plano && x.ciclo === ciclo && x.ativo,
  );
  return l?.url?.trim() ? l.url.trim() : null;
}

export function linkDoKit(
  links: LinkPagamento[] | undefined,
  ciclo: CicloCobranca,
): string | null {
  const l = links?.find((x) => x.tipo === "addon" && x.ciclo === ciclo && x.ativo);
  return l?.url?.trim() ? l.url.trim() : null;
}

/** Identificação da conta enviada ao Mercado Pago para liberar o plano automaticamente. */
export function referenciaPagamento(
  organizacaoId: string,
  plano: PlanoId,
  ciclo: CicloCobranca,
): string {
  return `${organizacaoId}|${plano}|${ciclo}|0`;
}

/** Referência do pagamento separado do kit mensal de insumos. */
export function referenciaKit(organizacaoId: string, ciclo: CicloCobranca): string {
  return `${organizacaoId}|KIT|${ciclo}|1`;
}

/** Acrescenta a referência da conta ao link do Mercado Pago. */
export function urlComReferencia(url: string, referencia: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("external_reference", referencia);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}external_reference=${encodeURIComponent(referencia)}`;
  }
}
