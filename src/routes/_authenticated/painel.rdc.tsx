import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AVISO_RDC } from "@/lib/rdc-db";

export const Route = createFileRoute("/_authenticated/painel/rdc")({
  head: () => ({
    meta: [
      { title: "RDC 1.002/2025 — Adequação da clínica | Oxyvra" },
      {
        name: "description",
        content:
          "Índice de conformidade, diagnóstico, plano de adequação, riscos e evidências da sua clínica odontológica frente à RDC Anvisa nº 1.002/2025.",
      },
      { property: "og:title", content: "RDC 1.002/2025 — Adequação da clínica | Oxyvra" },
      {
        property: "og:description",
        content: "Transforme a RDC 1.002/2025 em tarefas simples: o que fazer, como fazer, como comprovar e o prazo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LayoutRdc,
});

const ABAS = [
  { to: "/painel/rdc", label: "Status da clínica", exact: true },
  { to: "/painel/rdc/diagnostico", label: "Diagnóstico", exact: false },
  { to: "/painel/rdc/plano", label: "Plano de adequação", exact: false },
  { to: "/painel/rdc/riscos", label: "Riscos", exact: false },
  { to: "/painel/rdc/evidencias", label: "Evidências", exact: false },
] as const;

function LayoutRdc() {
  return (
    <div className="space-y-5">
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {ABAS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            activeOptions={{ exact: a.exact }}
            activeProps={{ className: "bg-navy text-gold" }}
            inactiveProps={{ className: "bg-secondary text-muted-foreground" }}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-bold"
          >
            {a.label}
          </Link>
        ))}
      </nav>

      <Outlet />

      <p className="rounded-2xl bg-secondary px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        {AVISO_RDC}
      </p>
    </div>
  );
}
