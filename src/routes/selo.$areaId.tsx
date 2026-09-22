import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Clock, UserCheck } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { seloPublico } from "@/lib/academias.functions";

export const Route = createFileRoute("/selo/$areaId")({
  head: () => ({
    meta: [
      { title: "Selo de Academia Sanitizada — Oxyvra" },
      {
        name: "description",
        content:
          "Consulte o horário e o responsável pela última higienização desta área da academia, com registro auditável Oxyvra.",
      },
      { property: "og:title", content: "Selo de Academia Sanitizada — Oxyvra" },
      {
        property: "og:description",
        content: "Transparência de biossegurança: última higienização, horário e responsável.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ params }) => seloPublico({ data: { areaId: params.areaId } }),
  errorComponent: () => (
    <Aviso titulo="Selo indisponível" texto="Não foi possível carregar este selo agora. Tente novamente em instantes." />
  ),
  notFoundComponent: () => (
    <Aviso titulo="Área não encontrada" texto="Confira o QR Code da recepção ou fale com a gerência." />
  ),
  component: SeloPublico,
});

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
      <div>
        <h1 className="text-2xl font-black text-foreground">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
      </div>
    </main>
  );
}

function SeloPublico() {
  const selo = Route.useLoaderData();

  if (!selo)
    return <Aviso titulo="Área não encontrada" texto="Confira o QR Code da recepção ou fale com a gerência." />;

  if ("bloqueado" in selo)
    return (
      <Aviso
        titulo="Selo ainda não ativado"
        texto="Este selo público é liberado quando a assinatura da unidade está ativa. Fale com a gerência do local."
      />
    );

  const quando = selo.ultimaHigienizacao ? new Date(selo.ultimaHigienizacao) : null;
  const horas = quando ? Math.floor((Date.now() - quando.getTime()) / 3_600_000) : null;
  const recente = horas !== null && horas <= 24;

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-8">
          <OxyvraLogo size={56} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-soft">
              Selo de Academia Sanitizada
            </p>
            <h1 className="text-xl font-black">{selo.nome}</h1>
            <p className="text-xs text-primary-foreground/70">
              {[selo.unidade, selo.cidade].filter(Boolean).join(" · ") || "Higienização auditada"}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-8">
        <div
          className={`rounded-3xl border p-6 text-center ${
            recente ? "border-teal/40 bg-teal/10" : "border-border bg-card"
          }`}
        >
          <ShieldCheck className={`mx-auto h-12 w-12 ${recente ? "text-teal" : "text-muted-foreground"}`} />
          <p className="mt-3 text-lg font-black text-foreground">
            {quando ? (recente ? "Higienizado nas últimas 24 horas" : "Higienização registrada") : "Sem registro ainda"}
          </p>
          {selo.detalhe && <p className="mt-1 text-sm text-muted-foreground">{selo.detalhe}</p>}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
              <Clock className="h-4 w-4 text-teal" /> Última higienização
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {quando ? quando.toLocaleString("pt-BR") : "—"}
            </p>
            {horas !== null && (
              <p className="text-xs text-muted-foreground">há {horas} hora(s)</p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
              <UserCheck className="h-4 w-4 text-teal" /> Responsável
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{selo.responsavel || "—"}</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Registro auditável Oxyvra Biossegurança — data, hora e responsável de cada higienização.
        </p>
      </section>
    </main>
  );
}
