import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { BotaoPagamento } from "@/components/BotaoPagamento";
import { useAssinatura } from "@/hooks/useAssinatura";
import {
  ADDON_INSUMOS,
  PLANOS,
  brl,
  valorAddonAnualTotal,
  valorAddonInsumos,
  type CicloCobranca,
  type PlanoId,
} from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Planos e pagamento — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Assine o Oxyvra Conformidade: planos Consultório e Clínica, mensal ou anual, com kit mensal de insumos hospitalares por cadeira.",
      },
      { property: "og:title", content: "Planos e pagamento — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Escolha o plano, o ciclo e o kit de insumos calculado pelas suas cadeiras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { assinatura } = useAssinatura();
  const [ciclo, setCiclo] = useState<CicloCobranca>("ANNUAL");
  const [addon, setAddon] = useState(true);
  const [cadeiras, setCadeiras] = useState(1);
  const organizacaoId = (assinatura as { organizacao_id?: string } | null)?.organizacao_id ?? null;

  useEffect(() => {
    if (assinatura) setCadeiras(Math.max(1, assinatura.cadeiras ?? 1));
  }, [assinatura]);

  const totalAddon = valorAddonInsumos(ciclo, cadeiras);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <OxyvraLogo size={90} />

      <h1 className="text-2xl font-black text-foreground">Escolha seu plano</h1>
      <p className="text-sm text-muted-foreground">
        Software de conformidade RDC 1.002/2025 mais, se quiser, o kit mensal de insumos entregue
        na clínica.
      </p>

      <div className="inline-flex rounded-xl bg-secondary p-1">
        {(["MONTHLY", "ANNUAL"] as CicloCobranca[]).map((c) => (
          <button
            key={c}
            onClick={() => setCiclo(c)}
            className={`rounded-lg px-4 py-2 text-sm font-black ${
              ciclo === c ? "bg-teal text-teal-foreground" : "text-muted-foreground"
            }`}
          >
            {c === "MONTHLY" ? "Mensal" : "Anual (economize)"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {PLANOS.map((p) => {
          const valorPlano = ciclo === "ANNUAL" ? p.precoAnualTotal : p.precoMensal;
          return (
            <article
              key={p.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-black text-foreground">{p.nome}</h2>
              <p className="text-xs font-bold uppercase text-muted-foreground">{p.resumo}</p>
              <p className="mt-3 text-3xl font-black text-foreground">
                 {brl(valorPlano)}
                 <span className="text-sm font-bold text-muted-foreground">{ciclo === "ANNUAL" ? "/ano" : "/mês"}</span>
              </p>
              {ciclo === "ANNUAL" && (
                <p className="text-xs text-muted-foreground">
                  À vista por PIX, boleto ou cartão — pague 10 meses e use 12
                </p>
              )}
              {addon && (
                <p className="mt-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                  + kit de insumos para {cadeiras} cadeira(s): <strong>{brl(totalAddon)}/mês</strong>
                  <br />
                   {ciclo === "MONTHLY" && <>Total mensal: <strong className="text-foreground">{brl(valorPlano + totalAddon)}/mês</strong></>}
                </p>
              )}
              <ul className="mt-4 space-y-1.5">
                {p.destaques.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {d}
                  </li>
                ))}
              </ul>
              <BotaoPagamento
                plano={p.id}
                ciclo={ciclo}
                kit={addon}
                organizacaoId={organizacaoId}
                rotulo={
                  p.id === "CONSULTORIO" ? "Assinar Conformidade Agora" : "Assinar Clínica Agora"
                }
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground"
              />
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-black text-foreground">{ADDON_INSUMOS.nome}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Calculado para as suas <strong>{cadeiras}</strong> cadeira(s)/equipo(s), entregue todo mês
          na clínica.
        </p>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {ADDON_INSUMOS.itens.map((i) => (
            <li key={i.nome} className="text-sm text-foreground">
              • <strong>{i.nome}</strong> — {i.detalhe}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-2xl font-black text-foreground">
          {brl(totalAddon)}
          <span className="text-sm font-bold text-muted-foreground">/mês</span>
        </p>
        {ciclo === "ANNUAL" && (
          <p className="text-xs text-muted-foreground">
            {brl(valorAddonAnualTotal(cadeiras))} por ano
          </p>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <input
            type="checkbox"
            checked={addon}
            onChange={(e) => setAddon(e.target.checked)}
            className="h-4 w-4"
          />
          Quero receber o kit mensal de insumos (Full Care)
        </label>
      </section>

      <p className="text-xs text-muted-foreground">
        O pagamento é feito na página segura do Mercado Pago. Assim que for confirmado, sua conta é
        liberada automaticamente.
      </p>
    </div>
  );
}
