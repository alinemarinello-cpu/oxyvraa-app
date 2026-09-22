import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota canônica do painel odontológico: entrega o Dashboard Odonto. */
export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  component: () => null,
});
