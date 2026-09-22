import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Camera,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { meuAcessoGestor } from "@/lib/gestor.functions";
import {
  alertasDoEscopo,
  execucoesDoEscopo,
  limpezasDoEscopo,
  planosDoEscopo,
  unidadesDoEscopo,
} from "@/lib/gestor-db";

export const Route = createFileRoute("/_authenticated/gestor")({
  head: () => ({
    meta: [
      { title: "Painel do Gestor — Oxyvra" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real o que a equipe de limpeza executou na sua empresa: conformidade, fotos, alertas e planos de ação.",
      },
      { property: "og:title", content: "Painel do Gestor — Oxyvra" },
      {
        property: "og:description",
        content: "Conformidade sanitária e auditoria visual das suas unidades, em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelGestor,
});

function Kpi({
  label,
  valor,
  sufixo,
  icon: Icon,
}: {
  label: string;
  valor: string | number;
  sufixo?: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-teal" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-black text-foreground">
        {valor}
        {sufixo && <span className="text-lg text-muted-foreground">{sufixo}</span>}
      </p>
    </div>
  );
}

function PainelGestor() {
  const carregarAcesso = useServerFn(meuAcessoGestor);
  const acessoQ = useQuery({
    queryKey: ["acesso-gestor"],
    queryFn: () => carregarAcesso(),
    staleTime: 60_000,
  });
  const acesso = acessoQ.data ?? null;

  const dadosQ = useQuery({
    queryKey: ["painel-gestor", acesso?.id],
    enabled: !!acesso,
    queryFn: async () => {
      const unidades = await unidadesDoEscopo({
        prefeituraId: acesso?.prefeitura_id ?? null,
        unitId: acesso?.unit_id ?? null,
      });
      const ids = unidades.map((u) => u.id);
      const [execucoes, limpezas, planos, alertas] = await Promise.all([
        execucoesDoEscopo(ids),
        limpezasDoEscopo(ids),
        planosDoEscopo(ids),
        alertasDoEscopo(ids),
      ]);
      return { unidades, execucoes, limpezas, planos, alertas };
    },
  });

  if (acessoQ.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando seu acesso…</p>;
  }

  if (!acesso) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-teal" />
          <h1 className="mt-3 text-lg font-black text-foreground">Acesso de gestor não liberado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua conta ainda não está vinculada a nenhuma empresa. Peça à administração da Oxyvra
            para convidar este e-mail como gestor.
          </p>
          <Link
            to="/menu"
            className="mt-4 inline-flex rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
          >
            Ir para o app de campo
          </Link>
        </div>
      </div>
    );
  }

  const d = dadosQ.data;
  const itens = d?.execucoes.reduce((s, e) => s + e.total_itens, 0) ?? 0;
  const conformes = d?.execucoes.reduce((s, e) => s + e.total_conformes, 0) ?? 0;
  const conformidade = itens ? Math.round((conformes / itens) * 100) : 0;
  const capaAbertos = d?.planos.filter((p) => p.status !== "concluida") ?? [];
  const nomeUnidade = (id: string | null) =>
    d?.unidades.find((u) => u.id === id)?.nome ?? "Unidade";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-soft">
            Oxyvra — Painel do Gestor
          </p>
          <h1 className="text-xl font-black">
            {acesso.unidade_nome ?? acesso.cliente_nome ?? "Minha empresa"}
          </h1>
          <p className="mt-1 text-xs text-primary-foreground/70">
            {acesso.escopo === "unidade"
              ? "Visão da sua unidade — somente leitura"
              : "Visão de todas as unidades do contrato — somente leitura"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {dadosQ.isLoading || !d ? (
          <p className="text-sm text-muted-foreground">Carregando os dados da operação…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Conformidade (30 dias)" valor={conformidade} sufixo="%" icon={CheckCircle2} />
              <Kpi label="Checklists realizados" valor={d.execucoes.length} icon={ClipboardList} />
              <Kpi label="Pendências abertas" valor={capaAbertos.length} icon={AlertTriangle} />
              <Kpi label="Unidades" valor={d.unidades.length} icon={Building2} />
            </div>

            {d.alertas.filter((a) => !a.lido).length > 0 && (
              <section className="rounded-2xl border border-destructive/30 bg-card p-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-destructive">
                  Alertas da operação
                </h2>
                <ul className="mt-3 space-y-2">
                  {d.alertas
                    .filter((a) => !a.lido)
                    .slice(0, 6)
                    .map((a) => (
                      <li key={a.id} className="rounded-xl bg-destructive/5 px-4 py-3">
                        <p className="text-sm font-bold text-foreground">{a.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {nomeUnidade(a.unit_id)} · {a.mensagem}
                        </p>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
                <Camera className="h-4 w-4 text-teal" /> Auditoria visual — últimas execuções
              </h2>
              {d.limpezas.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ainda não há registros de campo nas suas unidades.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {d.limpezas.map((c) => (
                    <article key={c.id} className="overflow-hidden rounded-xl border border-border">
                      {c.foto_depois ? (
                        <img
                          src={c.foto_depois}
                          alt={`Foto da higienização de ${c.ambiente}`}
                          loading="lazy"
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center bg-secondary text-xs text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-bold text-foreground">{c.ambiente}</p>
                        <p className="text-xs text-muted-foreground">
                          {nomeUnidade(c.unit_id)} · {c.servente}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {new Date(c.executado_em).toLocaleString("pt-BR")}
                          {c.fora_da_area && (
                            <span className="ml-1 font-black text-destructive">fora da área</span>
                          )}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
                Checklists por unidade (30 dias)
              </h2>
              <ul className="mt-3 space-y-2">
                {d.unidades.map((u) => {
                  const ex = d.execucoes.filter((e) => e.unit_id === u.id);
                  const tot = ex.reduce((s, e) => s + e.total_itens, 0);
                  const ok = ex.reduce((s, e) => s + e.total_conformes, 0);
                  const pct = tot ? Math.round((ok / tot) * 100) : null;
                  return (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.bairro} · {ex.length} checklist(s)
                        </p>
                      </div>
                      <span className="text-sm font-black text-foreground">
                        {pct === null ? "sem dados" : `${pct}%`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {capaAbertos.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
                  Pendências em tratamento
                </h2>
                <ul className="mt-3 space-y-2">
                  {capaAbertos.map((p) => (
                    <li key={p.id} className="rounded-xl bg-secondary px-4 py-3">
                      <p className="text-sm font-bold text-foreground">{p.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {nomeUnidade(p.unit_id)} · {p.criticidade} · responsável {p.responsavel || "—"}
                        {p.prazo ? ` · prazo ${new Date(p.prazo).toLocaleDateString("pt-BR")}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
