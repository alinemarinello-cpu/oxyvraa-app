import { createFileRoute } from "@tanstack/react-router";
import { BedDouble, ClipboardCheck, HandHeart, ShieldCheck } from "lucide-react";

import { LandingSegmento } from "@/components/LandingSegmento";

export const Route = createFileRoute("/lares-de-idosos")({
  head: () => ({
    meta: [
      { title: "Oxyvra para ILPIs e Lares de Idosos — Biossegurança" },
      {
        name: "description",
        content:
          "Higienização de ambientes, saneantes, contaminação cruzada e registros diários para instituições de longa permanência. Diagnóstico gratuito e visita técnica.",
      },
      { property: "og:title", content: "Oxyvra para ILPIs e Lares de Idosos — Biossegurança" },
      {
        property: "og:description",
        content: "Rotinas de biossegurança registradas todos os dias, com relatório pronto para apresentar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LaresPage,
});

function LaresPage() {
  return (
    <LandingSegmento
      segmento="ilpi"
      publico="Instituições de longa permanência para idosos"
      titulo="Biossegurança da casa registrada, quarto por quarto"
      subtitulo="Higienização de ambientes, saneantes, objetos compartilhados e cuidados da equipe — tudo registrado pelo celular, com relatório pronto para famílias e fiscalização."
      rotaDiagnostico="/diagnostico-ilpi"
      normas="Referências: RDC 502/2021 e RDC 222/2018, no que for aplicável."
      mensagemWhats="Olá! Quero conhecer o app de gestão para lares de idosos (ILPIs) e agendar uma visita técnica."
      recursos={[
        {
          Icone: ClipboardCheck,
          titulo: "Checklists por ambiente",
          texto: "Quartos, banheiros, áreas de convivência e apoio, cada um com sua rotina e frequência.",
        },
        {
          Icone: BedDouble,
          titulo: "Objetos compartilhados",
          texto: "Cadeiras de banho, andadores e superfícies de toque com higienização controlada.",
        },
        {
          Icone: ShieldCheck,
          titulo: "Saneantes e diluição",
          texto: "Produto adequado, diluição correta e armazenamento seguro, com registro de uso.",
        },
        {
          Icone: HandHeart,
          titulo: "Equipe e proteção",
          texto: "Higiene das mãos e uso de proteção acompanhados no dia a dia do turno.",
        },
      ]}
    />
  );
}
