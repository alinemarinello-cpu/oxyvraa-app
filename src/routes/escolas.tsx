import { createFileRoute } from "@tanstack/react-router";
import { Baby, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

import { LandingSegmento } from "@/components/LandingSegmento";

export const Route = createFileRoute("/escolas")({
  head: () => ({
    meta: [
      { title: "Oxyvra para Escolas e Creches — Biossegurança" },
      {
        name: "description",
        content:
          "Rotinas de higienização, saneantes, contaminação cruzada e registros para escolas infantis, creches e berçários. Diagnóstico gratuito e visita técnica.",
      },
      { property: "og:title", content: "Oxyvra para Escolas e Creches — Biossegurança" },
      {
        property: "og:description",
        content: "Organize a biossegurança da escola e mostre às famílias o que é feito todos os dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EscolasPage,
});

function EscolasPage() {
  return (
    <LandingSegmento
      segmento="escola"
      publico="Escolas infantis, creches e berçários"
      titulo="Biossegurança da escola organizada, do berçário ao pátio"
      subtitulo="Rotinas de higienização, saneantes, brinquedos e banheiros registrados pela equipe no celular — com relatório pronto para as famílias e para a fiscalização."
      rotaDiagnostico="/diagnostico-escola"
      normas="Referências: RDC 502/2021 e RDC 222/2018, no que for aplicável."
      mensagemWhats="Olá! Quero conhecer o app de gestão para escolas e creches e agendar uma visita técnica."
      recursos={[
        {
          Icone: ClipboardCheck,
          titulo: "Checklists por ambiente",
          texto: "Salas, berçário, banheiros, refeitório e áreas comuns, cada um com sua rotina.",
        },
        {
          Icone: Baby,
          titulo: "Brinquedos e tatames",
          texto: "Controle da higienização dos objetos compartilhados e do risco de contaminação cruzada.",
        },
        {
          Icone: ShieldCheck,
          titulo: "Saneantes e diluição",
          texto: "Produto certo, diluição correta e armazenamento fora do alcance das crianças.",
        },
        {
          Icone: Users,
          titulo: "Transparência com as famílias",
          texto: "Relatório em PDF com fotos e horários para apresentar aos pais quando quiser.",
        },
      ]}
    />
  );
}
