import { createFileRoute } from "@tanstack/react-router";

import { OxyvraLanding } from "@/components/OxyvraLanding";

export const Route = createFileRoute("/odontologia")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Gestão da RDC 1.002/2025" },
      {
        name: "description",
        content:
          "Organize Pasta da Vigilância, autoclaves, testes, checklists e evidências. Teste o Oxyvra grátis por 7 dias, sem cartão.",
      },
      { property: "og:title", content: "Oxyvra — Gestão da RDC 1.002/2025" },
      {
        property: "og:description",
        content: "Sua clínica preparada para a RDC 1.002/2025, com registros organizados em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OxyvraLanding,
});
