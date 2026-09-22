import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { PassosOnboarding } from "@/components/OnboardingPassos";
import { ativarTrialGratis } from "@/lib/assinatura.functions";
import { useAssinatura } from "@/hooks/useAssinatura";
import { BotaoPagamento } from "@/components/BotaoPagamento";
import {
  ADDON_INSUMOS,
  PLANOS,
  brl,
  valorAddonAnualTotal,
  valorAddonInsumos,
  type CicloCobranca,
  type PlanoId,
} from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/onboarding/step-3")({
  head: () => ({
    meta: [
      { title: "Escolha seu plano — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Ative 7 dias grátis sem cartão ou assine agora os planos Consultório e Clínica, com kit mensal de insumos hospitalares por cadeira.",
      },
      { property: "og:title", content: "Escolha seu plano — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Terceiro passo do onboarding: plano, ciclo de cobrança e kit de insumos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Etapa3,
});

function Etapa3() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { assinatura } = useAssinatura();
  const [ciclo, setCiclo] = useState<CicloCobranca>("ANNUAL");
  const [addon, setAddon] = useState(false);
  const [cadeiras, setCadeiras] = useState(1);
  const organizacaoId = (assinatura as { organizacao_id?: string } | null)?.organizacao_id ?? null;

  useEffect(() => {
    if (assinatura) setCadeiras(Math.max(1, assinatura.cadeiras ?? 1));
  }, [assinatura]);

  const trial = useMutation({
    mutationFn: ativarTrialGratis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assinatura"] });
      toast.success("Teste grátis de 7 dias ativado!");
      navigate({ to: "/painel" });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível ativar o teste."),
  });

  const totalAddon = valorAddonInsumos(ciclo, cadeiras);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <OxyvraLogo className="h-10" />
      <PassosOnboarding atual={3} />

      <h1 className="text-2xl font-black text-foreground">Escolha como quer começar</h1>
      <p className="text-sm text-muted-foreground">
        Teste 7 dias sem cartão ou já assine e libere o selo público e os PDFs sem marca d’água.
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
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal text-sm font-black text-teal"
              />
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gold/50 bg-gold/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-gold" />
          <div className="flex-1">
            <h2 className="text-sm font-black text-foreground">{ADDON_INSUMOS.nome}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Calculado para as suas <strong>{cadeiras}</strong> cadeira(s)/equipo(s), entregue
              todo mês na clínica.
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
          </div>
        </div>
      </section>

      <button
        onClick={() => trial.mutate({ data: {} })}
        disabled={trial.isPending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal text-base font-black text-teal-foreground disabled:opacity-60"
      >
        <ShieldCheck className="h-5 w-5" />
        {trial.isPending ? "Ativando…" : "Ativar 7 dias grátis sem cartão"}
      </button>

      <p className="text-xs text-muted-foreground">
        O pagamento é feito na página segura do Mercado Pago. Assim que for confirmado, sua conta é
        liberada automaticamente.
      </p>
    </div>
  );
}
