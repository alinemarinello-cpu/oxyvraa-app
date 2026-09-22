import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, GraduationCap, Stethoscope } from "lucide-react";

import { OxyvraLogo } from "@/components/OxyvraLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Biossegurança e Conformidade Sanitária" },
      {
        name: "description",
        content:
          "Gestão de biossegurança e conformidade sanitária para clínicas odontológicas, escolas, creches e lares de idosos. Escolha seu segmento e comece.",
      },
      { property: "og:title", content: "Oxyvra — Biossegurança e Conformidade Sanitária" },
      {
        property: "og:description",
        content: "Escolha seu segmento e organize a conformidade sanitária da sua instituição em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const SEGMENTOS = [
  {
    valor: "odonto",
    titulo: "Odontologia",
    sub: "Clínicas e consultórios odontológicos",
    detalhe: "Gestão da RDC 1.002/2025 com teste grátis de 7 dias",
    Icone: Stethoscope,
  },
  {
    valor: "escola",
    titulo: "Escola / Creche",
    sub: "Escolas infantis, creches e berçários",
    detalhe: "Biossegurança e rotinas sanitárias para a sua instituição",
    Icone: GraduationCap,
  },
  {
    valor: "ilpi",
    titulo: "ILPI / Lar de Idosos",
    sub: "Instituições de longa permanência",
    detalhe: "Biossegurança e rotinas sanitárias para a sua casa",
    Icone: Building2,
  },
] as const;

function Inicio() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <OxyvraLogo size={110} />
          <h1 className="text-2xl font-black text-foreground">
            Biossegurança e conformidade sanitária em um só app
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha o seu segmento para continuar.
          </p>
        </div>

        <div className="space-y-3">
          {SEGMENTOS.map(({ valor, titulo, sub, detalhe, Icone }) => (
            <button
              key={valor}
              type="button"
              onClick={() =>
                navigate({
                  to:
                    valor === "odonto"
                      ? "/odontologia"
                      : valor === "escola"
                        ? "/escolas"
                        : "/lares-de-idosos",
                })
              }
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-4 text-left transition-colors hover:border-teal"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/10">
                <Icone className="h-6 w-6 text-teal" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-foreground">{titulo}</span>
                <span className="block text-xs text-muted-foreground">{sub}</span>
                <span className="mt-1 block text-[11px] font-bold text-teal">{detalhe}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="space-y-2 text-center">
          <p className="text-xs font-bold text-muted-foreground">
            <Link to="/entrar" className="text-teal underline">
              Equipe de campo — entrar com PIN
            </Link>
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/auth" search={{ next: "/dashboard" }} className="text-teal underline">
              Entrar com e-mail e senha
            </Link>
          </p>
        </div>


        <p className="text-center text-[10px] text-muted-foreground/70">
          O Oxyvra apoia a gestão da adequação sanitária e não constitui certificação, aprovação ou
          garantia de aprovação por órgãos de vigilância sanitária.
        </p>
      </div>
    </main>
  );
}
