import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { BarraStatus, Cartao, NavInferior } from "@/components/ilpi/IlpiUI";
import {
  CATEGORIAS,
  formatarHora,
  novoLog,
  useConectividade,
  useIlpi,
} from "@/lib/ilpi-store";

export const Route = createFileRoute("/ilpi/checklists")({
  head: () => ({
    meta: [
      { title: "Checklists de biossegurança — Oxyvra ILPI" },
      {
        name: "description",
        content:
          "Checklists diários do lar de idosos: cuidados assistenciais, desinfecção de ambientes, resíduos da RDC 222/2018 e controle de saneantes regularizados.",
      },
      { property: "og:title", content: "Checklists de biossegurança — Oxyvra ILPI" },
      {
        property: "og:description",
        content: "Rotina diária conforme RDC 502/2021 e RDC 222/2018, com registro por toque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checklists,
});

function Checklists() {
  const { estado, atualizar } = useIlpi();
  const pendentesSync = estado?.logs.filter((l) => !l.sincronizado).length ?? 0;
  const { online } = useConectividade(pendentesSync);

  if (!estado) return <main className="min-h-screen bg-background" aria-busy="true" />;

  const feitos = estado.checklist.filter((i) => i.feito).length;
  const total = estado.checklist.length;

  function alternar(itemId: string) {
    atualizar((e) => {
      const item = e.checklist.find((i) => i.id === itemId);
      if (!item) return e;
      const marcando = !item.feito;
      const checklist = e.checklist.map((i) =>
        i.id === itemId
          ? { ...i, feito: marcando, feitoEm: marcando ? Date.now() : undefined }
          : i,
      );
      const base = { ...e, checklist };
      return marcando
        ? novoLog(base, "Item de checklist concluído", `${item.texto}${item.norma ? ` (${item.norma})` : ""}`, online)
        : novoLog(base, "Item de checklist desmarcado", item.texto, online);
    });
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <BarraStatus
        online={online}
        pendentes={pendentesSync}
        titulo="Checklists do turno"
        subtitulo={`${feitos} de ${total} itens concluídos`}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <Cartao className="flex items-start gap-3 border-gold/40 bg-gold/5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Itens baseados na RDC 502/2021 (funcionamento de ILPI) e RDC 222/2018 (resíduos de
            serviços de saúde). O registro serve como evidência interna para inspeções; não
            substitui a avaliação da Vigilância Sanitária.
          </p>
        </Cartao>

        {CATEGORIAS.map((cat) => {
          const itens = estado.checklist.filter((i) => i.categoria === cat.id);
          const ok = itens.filter((i) => i.feito).length;
          return (
            <Cartao key={cat.id}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-black text-navy">{cat.titulo}</h2>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-black text-navy tabular-nums">
                  {ok}/{itens.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{cat.descricao}</p>
              <ul className="mt-3 space-y-2">
                {itens.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => alternar(i.id)}
                      aria-pressed={i.feito}
                      className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left ${
                        i.feito ? "border-teal bg-teal/10" : "border-border bg-card"
                      }`}
                    >
                      {i.feito ? (
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-teal" aria-hidden />
                      ) : (
                        <Circle className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-snug text-navy">
                          {i.texto}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {i.norma}
                          {i.feito && i.feitoEm ? ` · registrado às ${formatarHora(i.feitoEm)}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Cartao>
          );
        })}
      </div>

      <NavInferior />
    </main>
  );
}
