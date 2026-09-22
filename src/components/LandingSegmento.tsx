import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
  SprayCan,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { OxyvraLogo } from "@/components/OxyvraLogo";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";

export type LandingSegmentoProps = {
  /** Segmento usado no cadastro (escola | ilpi). */
  segmento: "escola" | "ilpi";
  titulo: string;
  subtitulo: string;
  publico: string;
  rotaDiagnostico: "/diagnostico-escola" | "/diagnostico-ilpi";
  normas: string;
  mensagemWhats: string;
  recursos: { Icone: LucideIcon; titulo: string; texto: string }[];
};

const FLUXO = [
  { Icone: ClipboardCheck, texto: "Checklists por ambiente" },
  { Icone: SprayCan, texto: "Saneantes e diluição" },
  { Icone: Droplets, texto: "Rotinas de higienização" },
  { Icone: MapPin, texto: "Registro com foto e GPS" },
  { Icone: FileText, texto: "Relatório em PDF" },
];

export function LandingSegmento({
  segmento,
  titulo,
  subtitulo,
  publico,
  rotaDiagnostico,
  normas,
  mensagemWhats,
  recursos,
}: LandingSegmentoProps) {
  const whats = waLinkOxyvra(mensagemWhats);

  return (
    <main className="min-h-screen bg-secondary">
      <header className="bg-navy px-4 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-5 text-center">
          <div className="flex justify-center">
            <OxyvraLogo size={90} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-wide text-gold">{publico}</p>
          <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">{titulo}</h1>
          <p className="text-sm text-white/80 sm:text-base">{subtitulo}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whats}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-black text-white"
            >
              <CalendarCheck className="h-4 w-4" />
              Agendar visita técnica
            </a>
            <Link
              to={rotaDiagnostico}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gold px-5 py-3 text-sm font-black text-gold"
            >
              Diagnóstico gratuito
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-[11px] text-white/60">Sem compromisso • Resposta pelo WhatsApp da Oxyvra</p>
        </div>
      </header>

      <section className="px-4 py-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <h2 className="text-center text-xl font-black text-foreground">
            O que a equipe faz pelo app, todos os dias
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {FLUXO.map(({ Icone, texto }) => (
              <span
                key={texto}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground"
              >
                <Icone className="h-4 w-4 text-teal" />
                {texto}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {recursos.map(({ Icone, titulo: t, texto }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-4">
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
                  <Icone className="h-5 w-5 text-teal" />
                </span>
                <p className="text-sm font-black text-foreground">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-gold/60 bg-card p-4 text-center">
            <p className="text-sm font-black text-foreground">
              <ShieldCheck className="mr-1 inline h-4 w-4 text-gold" />
              Conformidade documentada e rastreável
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cada rotina fica registrada com data, responsável, foto e localização — pronta para
              apresentar a quem pedir.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-navy px-4 py-10">
        <div className="mx-auto w-full max-w-md space-y-4 text-center">
          <h2 className="text-xl font-black text-white">Quer começar agora?</h2>
          <p className="text-sm text-white/80">
            Crie sua conta e fale com a nossa equipe para configurar sua instituição.
          </p>
          <Link
            to="/auth/register"
            search={{ segmento }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-black text-navy"
          >
            <CheckCircle2 className="h-4 w-4" />
            Criar minha conta
          </Link>
          <a
            href={whats}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-5 py-3 text-sm font-black text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </a>
          <p className="pt-2 text-center text-[10px] text-white/50">
            {normas} O Oxyvra apoia a gestão da adequação sanitária e não constitui certificação,
            aprovação ou garantia de aprovação por órgãos de vigilância sanitária.
          </p>
        </div>
      </section>
    </main>
  );
}
