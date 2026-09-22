import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  HeartPulse,
  MessageSquareWarning,
} from "lucide-react";
import { BarraStatus, Cartao, Contador, NavInferior } from "@/components/ilpi/IlpiUI";
import { CATEGORIAS, useConectividade, useIlpi } from "@/lib/ilpi-store";

export const Route = createFileRoute("/ilpi/")({
  head: () => ({
    meta: [
      { title: "Oxyvra ILPI — Turno de biossegurança" },
      {
        name: "description",
        content:
          "App de campo para lares de idosos: checklists de biossegurança, resíduos, saneantes e trilha de auditoria do turno.",
      },
      { property: "og:title", content: "Oxyvra ILPI — Turno de biossegurança" },
      {
        property: "og:description",
        content: "Checklists RDC 502/2021 e 222/2018 e auditoria do turno no lar de idosos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TurnoAtual,
});

function TurnoAtual() {
  const { estado } = useIlpi();
  const pendentesSync = estado?.logs.filter((l) => !l.sincronizado).length ?? 0;
  const { online } = useConectividade(pendentesSync);

  if (!estado) {
    return <main className="min-h-screen bg-background" aria-busy="true" />;
  }

  const total = estado.checklist.length;
  const feitos = estado.checklist.filter((i) => i.feito).length;
  const pendentes = total - feitos;
  const residuosPendentes = estado.checklist.filter(
    (i) => i.categoria === "residuos" && !i.feito,
  ).length;

  const modulos = [
    {
      to: "/ilpi/checklists" as const,
      titulo: "Checklists de biossegurança",
      detalhe: `${feitos} de ${total} itens concluídos`,
      Icone: ClipboardCheck,
    },
    {
      to: "/ilpi/sinais" as const,
      titulo: "Sinais vitais",
      detalhe: `${estado.sinais.length} registro(s) no turno`,
      Icone: HeartPulse,
    },
    {
      to: "/ilpi/sinais" as const,
      titulo: "Ocorrências",
      detalhe: `${estado.ocorrencias.length} anotação(ões)`,
      Icone: MessageSquareWarning,
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-24">
      <BarraStatus
        online={online}
        pendentes={pendentesSync}
        titulo={estado.profissional}
        subtitulo={estado.turno}
      />

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Contador valor={feitos} rotulo="Concluídos" tom="ok" />
          <Contador valor={pendentes} rotulo="Pendentes" tom="neutro" />
          <Contador valor={residuosPendentes} rotulo="Resíduos" tom="risco" />
        </div>

        {pendentes > 0 && (
          <Cartao className="mt-4 border-warning/40 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="font-black text-navy">Itens de biossegurança em aberto</p>
                <p className="text-sm text-muted-foreground">
                  Complete os checklists do turno para manter a casa pronta para inspeção
                  da Vigilância Sanitária.
                </p>
              </div>
            </div>
          </Cartao>
        )}

        <Cartao className="mt-4">
          <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">
            Áreas do checklist
          </p>
          <ul className="mt-3 space-y-2">
            {CATEGORIAS.map((c) => {
              const itens = estado.checklist.filter((i) => i.categoria === c.id);
              const ok = itens.filter((i) => i.feito).length;
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-navy">{c.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.descricao}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-black tabular-nums text-teal">
                    {ok}/{itens.length}
                  </span>
                </li>
              );
            })}
          </ul>
        </Cartao>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {modulos.map(({ to, titulo, detalhe, Icone }) => (
            <Link
              key={titulo}
              to={to}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/15">
                <Icone className="h-6 w-6 text-teal" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-navy">{titulo}</span>
                <span className="block text-xs text-muted-foreground">{detalhe}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </div>

      <NavInferior />
    </main>
  );
}
