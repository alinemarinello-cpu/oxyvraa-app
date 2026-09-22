import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";

import { OxyvraLogo } from "@/components/OxyvraLogo";
import { evento } from "@/lib/analytics";
import { lerLeadLocal, marcarEtapaLead } from "@/lib/funil-rdc";
import {
  ADDON_INSUMOS,
  PLANOS,
  brl,
  valorAddonInsumos,
  valorAddonAnualTotal,
  type CicloCobranca,
} from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos do Oxyvra Conformidade — RDC 1.002/2025" },
      {
        name: "description",
        content:
          "Oxyvra Conformidade por R$ 134/mês ou R$ 1.340/ano. Gestão da adequação à RDC Anvisa nº 1.002/2025 para clínicas odontológicas.",
      },
      { property: "og:title", content: "Planos do Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Escolha Oxyvra Conformidade ou Oxyvra Clínica, com cobrança mensal ou anual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanosPublicos,
});

function PlanosPublicos() {
  const [ciclo, setCiclo] = useState<CicloCobranca>("ANNUAL");
  const [cadeiras, setCadeiras] = useState(1);
  useEffect(() => {
    evento("page_view", { pagina: "planos" });
    evento("pricing_viewed", {});
    const lead = lerLeadLocal();
    if (lead) void marcarEtapaLead(lead.id, "PLANOS_VISTOS");
  }, []);

  const kit = valorAddonInsumos(ciclo, cadeiras);

  const iniciarCadastro = () => {
    const lead = lerLeadLocal();
    void marcarEtapaLead(lead?.id ?? null, "CHECKOUT_INICIADO", ciclo);
    evento("checkout_started", { ciclo });
  };

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <OxyvraLogo size={40} />
            <span className="text-sm font-black uppercase tracking-[0.15em] text-navy">Oxyvra</span>
          </Link>
          <Link
            to="/diagnostico"
            className="text-xs font-black text-navy/70 underline underline-offset-4"
          >
            Fazer diagnóstico
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-black text-navy sm:text-3xl">
            Gestão da adequação à RDC 1.002/2025
          </h1>
          <p className="mt-2 text-sm text-navy/70">
            Um só lugar para saber o que fazer, como comprovar, qual o prazo e como manter a
            conformidade da clínica.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
          {(["ANNUAL", "MONTHLY"] as CicloCobranca[]).map((c) => (
            <button
              key={c}
              onClick={() => setCiclo(c)}
              className={`rounded-lg px-4 py-2 text-sm font-black ${
                ciclo === c ? "bg-teal text-teal-foreground" : "text-navy/60"
              }`}
            >
              {c === "ANNUAL" ? "Anual (economize)" : "Mensal"}
            </button>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {PLANOS.map((plano) => (
            <article key={plano.id} className="rounded-3xl border-2 border-teal bg-white p-6">
              <p className="text-xs font-black uppercase tracking-wide text-teal">
                {ciclo === "ANNUAL" ? "Plano anual" : "Plano mensal"}
              </p>
              <h2 className="mt-2 text-lg font-black text-navy">{plano.nome}</h2>
              <p className="text-xs font-bold uppercase text-navy/50">{plano.resumo}</p>
              <p className="mt-3 text-4xl font-black text-navy">
                {brl(ciclo === "ANNUAL" ? plano.precoAnualTotal : plano.precoMensal)}
                <span className="text-base font-bold text-navy/50">
                  {ciclo === "ANNUAL" ? "/ano" : "/mês"}
                </span>
              </p>
              <p className="mt-1 text-xs text-navy/60">
                {ciclo === "ANNUAL"
                  ? "Pagamento à vista por PIX, boleto ou cartão — pague 10 meses e use 12"
                  : "Crédito mensal recorrente, sem comprometer o limite total do cartão"}
              </p>
              <ul className="mt-5 space-y-2">
                {plano.destaques.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-navy">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {d}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/register"
                onClick={iniciarCadastro}
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-sm font-black uppercase text-gold"
              >
                {plano.id === "CONSULTORIO" ? "Assinar Conformidade Agora" : "Assinar Clínica Agora"}
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[11px] text-navy/50">
                7 dias de teste antes da cobrança
              </p>
            </article>
          ))}

          <article className="rounded-3xl border border-navy/10 bg-white p-6">
            <h2 className="text-sm font-black text-navy">{ADDON_INSUMOS.nome}</h2>
            <p className="mt-1 text-xs text-navy/60">
              Opcional. Calculado pela quantidade de cadeiras/equipos da clínica.
            </p>
            <label className="mt-4 block text-xs font-black uppercase tracking-wide text-navy/60">
              Cadeiras / equipos
              <input
                type="number"
                min={1}
                max={50}
                value={cadeiras}
                onChange={(e) => setCadeiras(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 h-12 w-full rounded-xl border-2 border-navy/15 px-3 text-base font-black text-navy outline-none focus:border-teal"
              />
            </label>
            <p className="mt-4 text-3xl font-black text-navy">
              {brl(kit)}
              <span className="text-sm font-bold text-navy/50">/mês</span>
            </p>
            <p className="mt-1 text-xs text-navy/60">
              {ciclo === "ANNUAL"
                ? `Entrega mensal do kit. No plano anual, cobrado junto uma vez por ano: ${brl(valorAddonAnualTotal(cadeiras))}.`
                : "Entrega mensal do kit, cobrado todo mês junto com o plano."}
            </p>
            <ul className="mt-4 space-y-1">
              {ADDON_INSUMOS.itens.map((i) => (
                <li key={i.nome} className="text-sm text-navy">
                  • <strong>{i.nome}</strong> — {i.detalhe}
                </li>
              ))}
            </ul>
          </article>
        </section>


        <p className="text-[11px] leading-relaxed text-navy/50">
          Serviço de gestão da adequação, monitoramento da conformidade e gestão de evidências
          referentes à RDC Anvisa nº 1.002/2025. Não constitui certificação, aprovação ou garantia
          de aprovação por órgão de vigilância sanitária.
        </p>
      </div>
    </main>
  );
}
