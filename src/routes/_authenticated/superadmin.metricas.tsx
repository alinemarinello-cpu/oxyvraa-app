import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { metricasSaasFn } from "@/lib/metricas.functions";
import { brl } from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/superadmin/metricas")({
  head: () => ({
    meta: [
      { title: "Indicadores do SaaS — Oxyvra" },
      { name: "description", content: "Clientes, assinaturas, MRR e conversões da plataforma Oxyvra." },
      { property: "og:title", content: "Indicadores do SaaS — Oxyvra" },
      { property: "og:description", content: "Painel administrativo interno da Oxyvra." },
    ],
  }),
  component: Metricas,
});

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
  { dias: 365, rotulo: "12 meses" },
];

function Card({
  titulo,
  valor,
  detalhe,
  destaque,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${destaque ? "border-teal bg-teal/5" : "border-border bg-card"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

function Metricas() {
  const [dias, setDias] = useState(30);
  const buscar = useServerFn(metricasSaasFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["metricas-saas", dias],
    queryFn: () => buscar({ data: { periodoDias: dias } }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Indicadores do SaaS</h1>
        <p className="text-sm text-muted-foreground">
          Visão administrativa interna da Oxyvra: base de clientes, receita recorrente e funil.
        </p>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            onClick={() => setDias(p.dias)}
            className={`rounded-lg px-3 py-2 text-xs font-black ${
              dias === p.dias ? "bg-teal text-teal-foreground" : "text-muted-foreground"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {(error as Error).message}
        </p>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Carregando indicadores…</p>}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card titulo="MRR" valor={brl(data.mrr)} detalhe="Receita recorrente mensal" destaque />
            <Card titulo="Ticket médio" valor={brl(data.ticketMedio)} />
            <Card titulo="Clientes ativos" valor={String(data.clientesAtivos)} />
            <Card
              titulo="Novos clientes"
              valor={String(data.clientesNovos)}
              detalhe={`Últimos ${data.periodoDias} dias`}
            />
            <Card titulo="Em teste" valor={String(data.clientesTrial)} />
            <Card titulo="Pagamento em atraso" valor={String(data.atrasados)} />
            <Card
              titulo="Cancelamentos"
              valor={String(data.cancelamentos)}
              detalhe={`Últimos ${data.periodoDias} dias`}
            />
            <Card titulo="Clientes inativos" valor={String(data.clientesInativos)} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card titulo="Diagnósticos realizados" valor={String(data.diagnosticos)} />
            <Card titulo="Diagnóstico → assinatura" valor={`${data.taxaConversao}%`} destaque />
            <Card titulo="Score médio no diagnóstico" valor={`${data.scoreMedioDiagnostico}%`} />
            <Card
              titulo="Uso do sistema"
              valor={String(data.usoRegistros)}
              detalhe={`Registros nos últimos ${data.periodoDias} dias`}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-black text-foreground">Receita por plano</h2>
            <div className="mt-3 space-y-2">
              {data.porPlano.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma assinatura paga registrada até o momento.
                </p>
              )}
              {data.porPlano.map((p) => (
                <div
                  key={`${p.plano}-${p.ciclo}`}
                  className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2"
                >
                  <span className="text-sm font-bold text-foreground">
                    {p.plano} · {p.ciclo === "ANNUAL" ? "Anual" : "Mensal"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.assinaturas} assinatura(s) — <strong>{brl(p.mrr)}</strong>/mês
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
