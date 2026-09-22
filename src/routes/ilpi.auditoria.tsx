import { createFileRoute } from "@tanstack/react-router";
import { CloudOff, FileCheck2, ShieldCheck } from "lucide-react";
import { BarraStatus, Cartao, NavInferior } from "@/components/ilpi/IlpiUI";
import { formatarDataHora, useConectividade, useIlpi } from "@/lib/ilpi-store";

export const Route = createFileRoute("/ilpi/auditoria")({
  head: () => ({
    meta: [
      { title: "Trilha de auditoria do turno — Oxyvra ILPI" },
      {
        name: "description",
        content:
          "Histórico local de todas as ações do turno no lar de idosos: medicações, recusas, checklists, sinais vitais e ocorrências com data, hora e profissional.",
      },
      { property: "og:title", content: "Trilha de auditoria do turno — Oxyvra ILPI" },
      {
        property: "og:description",
        content: "Registro completo do turno para inspeções, sem caderno de papel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auditoria,
});

function Auditoria() {
  const { estado } = useIlpi();
  const pendentesSync = estado?.logs.filter((l) => !l.sincronizado).length ?? 0;
  const { online } = useConectividade(pendentesSync);

  if (!estado) return <main className="min-h-screen bg-background" aria-busy="true" />;

  return (
    <main className="min-h-screen bg-background pb-24">
      <BarraStatus
        online={online}
        pendentes={pendentesSync}
        titulo="Trilha de auditoria"
        subtitulo={`${estado.logs.length} ação(ões) registradas no turno`}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <Cartao className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Cada ação do turno fica gravada com data, hora e identificação do profissional. O
            histórico organiza as evidências para inspeções da Vigilância Sanitária e do
            Ministério Público.
          </p>
        </Cartao>

        <ol className="space-y-2">
          {estado.logs.length === 0 && (
            <li className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Nenhuma ação registrada ainda neste turno.
            </li>
          )}
          {estado.logs.map((l) => (
            <li key={l.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-navy">{l.acao}</p>
                  <p className="text-sm text-muted-foreground">{l.detalhe}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {formatarDataHora(l.quando)} · {l.profissional}
                  </p>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                    l.sincronizado
                      ? "bg-teal/15 text-teal"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {l.sincronizado ? (
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <CloudOff className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {l.sincronizado ? "Enviado" : "No aparelho"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <NavInferior />
    </main>
  );
}
