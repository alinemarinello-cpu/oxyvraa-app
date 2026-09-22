import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { PassosOnboarding } from "@/components/OnboardingPassos";
import { salvarPorteClinica } from "@/lib/assinatura.functions";
import { useAssinatura } from "@/hooks/useAssinatura";
import { ADDON_INSUMOS, brl } from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/onboarding/step-2")({
  head: () => ({
    meta: [
      { title: "Porte da clínica — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Informe quantas cadeiras/equipos e autoclaves sua clínica possui para o Oxyvra calcular o kit de insumos e as rotinas de esterilização.",
      },
      { property: "og:title", content: "Porte da clínica — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Segundo passo do onboarding: cadeiras, equipos e autoclaves.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Etapa2,
});

function Contador({
  titulo,
  descricao,
  valor,
  minimo,
  onChange,
}: {
  titulo: string;
  descricao: string;
  valor: number;
  minimo: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-black text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={`Diminuir ${titulo}`}
          onClick={() => onChange(Math.max(minimo, valor - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="min-w-16 text-center text-4xl font-black text-foreground">{valor}</span>
        <button
          type="button"
          aria-label={`Aumentar ${titulo}`}
          onClick={() => onChange(Math.min(200, valor + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-teal-foreground"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function Etapa2() {
  const navigate = useNavigate();
  const { assinatura } = useAssinatura();
  const [cadeiras, setCadeiras] = useState(1);
  const [autoclaves, setAutoclaves] = useState(1);

  useEffect(() => {
    if (assinatura) setCadeiras(Math.max(1, assinatura.cadeiras ?? 1));
  }, [assinatura]);

  const salvar = useMutation({
    mutationFn: salvarPorteClinica,
    onSuccess: () => navigate({ to: "/onboarding/step-3" }),
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o porte da clínica."),
  });

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <OxyvraLogo className="h-10" />
      <PassosOnboarding atual={2} />

      <h1 className="text-2xl font-black text-foreground">Qual é o porte da sua clínica?</h1>
      <p className="text-sm text-muted-foreground">
        Usamos esses números para dimensionar o kit de insumos e as rotinas de esterilização.
      </p>

      <Contador
        titulo="Quantas cadeiras / equipos sua clínica possui?"
        descricao="Cada cadeira recebe um QR Code próprio e entra no cálculo do kit de insumos."
        valor={cadeiras}
        minimo={1}
        onChange={setCadeiras}
      />
      <Contador
        titulo="Quantas autoclaves estão em uso?"
        descricao="Cada autoclave terá o registro dos 7 campos obrigatórios e o teste biológico semanal."
        valor={autoclaves}
        minimo={0}
        onChange={setAutoclaves}
      />

      <p className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Com <strong>{cadeiras}</strong> cadeira(s), o kit mensal de insumos sai por{" "}
        <strong>{brl(ADDON_INSUMOS.precoPorCadeiraMensal * cadeiras)}/mês</strong> (opcional).
      </p>

      <button
        onClick={() => salvar.mutate({ data: { cadeiras, autoclaves } })}
        disabled={salvar.isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-60"
      >
        {salvar.isPending ? "Salvando…" : "Continuar"} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
