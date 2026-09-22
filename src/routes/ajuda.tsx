import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";
import odonto from "@/content/manuais/odonto.json";
import escola from "@/content/manuais/escola.json";
import ilpi from "@/content/manuais/ilpi.json";

type Item = { nome: string; texto: string };
type Secao = { titulo: string; intro?: string; passos?: string[]; itens?: Item[] };
type Manual = {
  id: string;
  rotulo: string;
  titulo: string;
  subtitulo: string;
  intro: string;
  secoes: Secao[];
};

const MANUAIS = [odonto, escola, ilpi] as unknown as Manual[];

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Manual do usuário — Oxyvra Biossegurança" },
      {
        name: "description",
        content:
          "Passo a passo simples do aplicativo Oxyvra para clínicas odontológicas, escolas e creches e lares de idosos.",
      },
      { property: "og:title", content: "Manual do usuário — Oxyvra Biossegurança" },
      {
        property: "og:description",
        content: "Como usar o Oxyvra no dia a dia: cadastro, PIN da equipe, checklists e relatórios.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaAjuda,
});

function SecaoManual({ secao, aberta, onToggle }: { secao: Secao; aberta: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-base font-black text-foreground">{secao.titulo}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition ${aberta ? "rotate-180" : ""}`}
        />
      </button>

      {aberta && (
        <div className="space-y-4 border-t border-border px-4 pb-5 pt-4">
          {secao.intro && <p className="text-sm leading-relaxed text-muted-foreground">{secao.intro}</p>}

          {secao.passos && (
            <ol className="space-y-3">
              {secao.passos.map((passo, i) => (
                <li key={passo} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-black text-navy">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{passo}</span>
                </li>
              ))}
            </ol>
          )}

          {secao.itens && (
            <ul className="space-y-3">
              {secao.itens.map((item) => (
                <li key={item.nome} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-sm font-black text-foreground">{item.nome}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PaginaAjuda() {
  const [manualId, setManualId] = useState(MANUAIS[0].id);
  const [abertas, setAbertas] = useState<string[]>([MANUAIS[0].secoes[0].titulo]);
  const manual = MANUAIS.find((m) => m.id === manualId) ?? MANUAIS[0];

  function trocarManual(id: string) {
    const novo = MANUAIS.find((m) => m.id === id) ?? MANUAIS[0];
    setManualId(id);
    setAbertas([novo.secoes[0].titulo]);
  }

  function alternar(titulo: string) {
    setAbertas((atual) =>
      atual.includes(titulo) ? atual.filter((t) => t !== titulo) : [...atual, titulo],
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy px-4 py-6 text-center">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-gold/80 hover:text-gold"
          >
            <ChevronLeft className="h-4 w-4" /> Início
          </Link>
          <div className="flex flex-col items-center">
            <OxyvraLogo size={48} />
            <h1 className="mt-3 text-2xl font-black text-gold">Manual do usuário</h1>
            <p className="mt-1 text-sm text-white/70">
              Passo a passo simples para usar o Oxyvra sozinho.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">
        <div className="flex flex-wrap gap-2">
          {MANUAIS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => trocarManual(m.id)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                m.id === manualId
                  ? "bg-navy text-gold"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {m.rotulo}
            </button>
          ))}
        </div>

        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-lg font-black text-foreground">{manual.titulo}</h2>
          <p className="mt-1 text-sm font-bold text-teal">{manual.subtitulo}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{manual.intro}</p>
        </section>

        <div className="mt-4 space-y-3">
          {manual.secoes.map((secao) => (
            <SecaoManual
              key={secao.titulo}
              secao={secao}
              aberta={abertas.includes(secao.titulo)}
              onToggle={() => alternar(secao.titulo)}
            />
          ))}
        </div>

        <a
          href={waLinkOxyvra(
            `Olá! Estou usando o manual do Oxyvra (${manual.rotulo}) e preciso de ajuda.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-teal px-4 py-3 text-sm font-black text-teal-foreground"
        >
          Falar com a Oxyvra no WhatsApp
        </a>
      </main>
    </div>
  );
}
