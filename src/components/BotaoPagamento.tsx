import { ExternalLink, MessageCircle } from "lucide-react";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";
import {
  linkDoKit,
  linkDoPlano,
  referenciaKit,
  referenciaPagamento,
  urlComReferencia,
  useLinksPagamento,
  type LinkPagamento,
} from "@/lib/pagamento-links";
import type { CicloCobranca, PlanoId } from "@/lib/planos-oxyvra";

type Props = {
  plano: PlanoId;
  ciclo: CicloCobranca;
  kit: boolean;
  organizacaoId?: string | null;
  rotulo: string;
  className?: string;
};

/** Botão de pagamento: abre o link do Mercado Pago cadastrado ou, se ainda não houver, o WhatsApp. */
export function BotaoPagamento({
  plano,
  ciclo,
  kit,
  organizacaoId,
  rotulo,
  className,
}: Props) {
  const { data } = useLinksPagamento();
  const links = data as LinkPagamento[] | undefined;
  const url = linkDoPlano(links, plano, ciclo);
  const urlKit = kit ? linkDoKit(links, ciclo) : null;

  const base =
    className ??
    "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground";

  const mensagemWhats = waLinkOxyvra(
    `Olá! Quero assinar o plano ${plano === "CONSULTORIO" ? "Conformidade" : "Clínica"} (${ciclo === "ANNUAL" ? "anual" : "mensal"})${kit ? " com o kit de insumos" : ""}.`,
  );

  if (!url) {
    return (
      <a href={mensagemWhats} target="_blank" rel="noreferrer" className={base}>
        <MessageCircle className="h-4 w-4" /> Falar com o comercial
      </a>
    );
  }

  // O plano e o kit são cobranças separadas no Mercado Pago: o plano nunca
  // ativa o kit sozinho.
  const destino = organizacaoId
    ? urlComReferencia(url, referenciaPagamento(organizacaoId, plano, ciclo))
    : url;

  const destinoKit =
    urlKit && organizacaoId
      ? urlComReferencia(urlKit, referenciaKit(organizacaoId, ciclo))
      : urlKit;

  return (
    <>
      <a href={destino} target="_blank" rel="noreferrer" className={base}>
        {rotulo} <ExternalLink className="h-4 w-4" />
      </a>
      {kit &&
        (destinoKit ? (
          <a
            href={destinoKit}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal text-sm font-black text-teal"
          >
            Pagar o kit de insumos (à parte) <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <a
            href={mensagemWhats}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal text-sm font-black text-teal"
          >
            <MessageCircle className="h-4 w-4" /> Contratar o kit com o comercial
          </a>
        ))}
      {kit && (
        <p className="mt-2 text-xs text-muted-foreground">
          O kit mensal de insumos é cobrado em um pagamento separado do plano.
        </p>
      )}
    </>
  );
}
