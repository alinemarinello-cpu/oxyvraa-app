import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, FileWarning } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { validarDocumento } from "@/lib/saude-conformidade.functions";
import { AVISO_LEGAL } from "@/lib/saude-conformidade-db";

export const Route = createFileRoute("/validar/$hash")({
  head: () => ({
    meta: [
      { title: "Validar autenticidade do documento — Oxyvra" },
      {
        name: "description",
        content:
          "Confira se a Pasta da Vigilância apresentada foi realmente gerada pelo sistema Oxyvra, com data e período do documento.",
      },
      { property: "og:title", content: "Validar autenticidade do documento — Oxyvra" },
      {
        property: "og:description",
        content: "Conferência pública do código de autenticidade de dossiês sanitários.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ params }) => validarDocumento({ data: { hash: params.hash } }),
  errorComponent: () => (
    <Moldura
      icone={<FileWarning className="h-10 w-10 text-destructive" />}
      titulo="Código inválido"
      texto="O código informado não tem o formato esperado. Confira o QR Code impresso no documento."
    />
  ),
  notFoundComponent: () => (
    <Moldura
      icone={<FileWarning className="h-10 w-10 text-destructive" />}
      titulo="Documento não localizado"
      texto="Nenhum documento com este código foi gerado pelo sistema."
    />
  ),
  component: Validacao,
});

function Moldura({
  icone,
  titulo,
  texto,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mb-4 flex justify-center">
          <OxyvraLogo className="h-10" />
        </div>
        <div className="mb-3 flex justify-center">{icone}</div>
        <h1 className="text-xl font-black text-foreground">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
        {children}
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">{AVISO_LEGAL}</p>
      </div>
    </main>
  );
}

function Validacao() {
  const doc = Route.useLoaderData();
  const { hash } = Route.useParams();

  if (!doc)
    return (
      <Moldura
        icone={<FileWarning className="h-10 w-10 text-destructive" />}
        titulo="Documento não localizado"
        texto="Nenhum documento com este código foi gerado pelo sistema."
      />
    );

  const periodo =
    doc.inicio && doc.fim
      ? `${new Date(`${doc.inicio}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${doc.fim}T12:00:00`).toLocaleDateString("pt-BR")}`
      : "—";

  return (
    <Moldura
      icone={<ShieldCheck className="h-10 w-10 text-teal" />}
      titulo="Documento autêntico"
      texto="Este código corresponde a um documento gerado pelo sistema Oxyvra."
    >
      <dl className="mt-5 space-y-2 text-left text-sm">
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-bold text-muted-foreground">Estabelecimento</dt>
          <dd className="font-black text-foreground">{doc.clinica || "—"}</dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-bold text-muted-foreground">Período dos registros</dt>
          <dd className="font-black text-foreground">{periodo}</dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-bold text-muted-foreground">Emitido em</dt>
          <dd className="font-black text-foreground">
            {new Date(doc.geradoEm).toLocaleString("pt-BR")}
          </dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-xs font-bold text-muted-foreground">Código de autenticidade</dt>
          <dd className="break-all font-mono text-[11px] text-foreground">{hash}</dd>
        </div>
      </dl>
    </Moldura>
  );
}
