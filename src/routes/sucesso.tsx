import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { Check, Home, Award } from "lucide-react";
import { getAmbienteMeta, useCurrentUnit, useUnitScore } from "@/lib/oxyvra-store";

const searchSchema = z.object({ tipo: z.string().optional() });

export const Route = createFileRoute("/sucesso")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Oxyvra — Registrado com Sucesso" },
      { name: "description", content: "Higienização registrada com o selo Oxyvra." },
      { property: "og:title", content: "Oxyvra — Registrado com Sucesso" },
      { property: "og:description", content: "Higienização registrada com o selo Oxyvra." },
    ],
  }),
  component: SucessoScreen,
});

function SucessoScreen() {
  const { tipo } = Route.useSearch();
  const unit = useCurrentUnit();
  const score = useUnitScore(unit?.id);
  const meta = tipo ? getAmbienteMeta(tipo, unit?.ambientesCustom) : null;
  const label = meta?.label ?? "Ambiente";
  const now = new Date();
  const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = now.toLocaleDateString("pt-BR");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="bg-navy text-navy-foreground px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated flex flex-col items-center">
        <OxyvraLogo size={56} />
        <p className="mt-2 text-xs text-gold font-semibold tracking-widest">OXYVRA • REGISTRO</p>
      </header>

      <section className="flex-1 px-6 py-10 flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-40 h-40 rounded-full bg-success flex items-center justify-center shadow-elevated animate-in zoom-in duration-500">
            <Check className="w-24 h-24 text-success-foreground" strokeWidth={3.5} />
          </div>
          <div className="absolute -inset-3 rounded-full border-4 border-gold/60 border-dashed animate-pulse" />
        </div>

        <h1 className="mt-8 text-3xl font-black text-navy leading-tight">
          Higienização<br />Registrada!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Muito bom trabalho 👏</p>

        <div className="mt-8 w-full bg-card rounded-3xl border-2 border-gold/50 shadow-card p-6">
          <div className="flex items-center justify-center gap-2">
            <div className="oxyvra-ring w-8 h-8 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-navy" />
            </div>
            <p className="text-sm font-black tracking-widest text-gold">SELO PADRÃO OURO</p>
          </div>
          <p className="mt-3 text-base font-bold text-navy">
            Higienização Registrada com Sucesso
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Ambiente</p>
              <p className="font-bold text-navy">{label}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Hora</p>
              <p className="font-bold text-navy">{hora}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Data</p>
              <p className="font-bold text-navy">{data}</p>
            </div>
          </div>
        </div>

        {score && (
          <div className="mt-4 w-full bg-navy text-navy-foreground rounded-2xl p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gold text-navy flex flex-col items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
              <span className="text-lg font-black leading-none">{score.score}</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black tracking-widest text-gold">ÍNDICE DA UNIDADE</p>
              <p className="text-sm font-black">
                {score.hoje} de {score.esperado} higienizações no dia
              </p>
              <p className="text-[11px] text-white/70">
                Aguardando revisão do gestor
              </p>
            </div>
          </div>
        )}

        <Link
          to="/menu"
          className="mt-auto w-full h-20 rounded-3xl bg-navy text-navy-foreground font-black text-xl shadow-elevated flex items-center justify-center gap-3 active:scale-[0.98] transition"
        >
          <Home className="w-6 h-6" />
          VOLTAR AO MENU
        </Link>
      </section>
    </main>
  );
}
