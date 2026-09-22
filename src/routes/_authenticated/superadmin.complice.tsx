import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  Search,
  ShieldAlert,
  Users,
  CheckCircle2,
} from "lucide-react";
import {
  listarExecucoesCompliceFn,
  listarLeadsCompliceFn,
  listarOrganizacoesCompliceFn,
  resumoCompliceFn,
} from "@/lib/complice.functions";
import { useAuth } from "@/lib/oxyvra-auth";

export const Route = createFileRoute("/_authenticated/superadmin/complice")({
  head: () => ({
    meta: [
      { title: "Complice — Visão global Oxyvra" },
      {
        name: "description",
        content:
          "Painel global do proprietário Oxyvra: organizações, execuções de checklist, diagnósticos e leads de todas as contas.",
      },
      { property: "og:title", content: "Complice — Visão global Oxyvra" },
      {
        property: "og:description",
        content: "Todas as organizações, execuções, diagnósticos e leads em uma só tela.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Complice,
});

const ROTULO_SEGMENTO: Record<string, string> = {
  odonto: "Odontologia",
  escola: "Escola/Creche",
  ilpi: "ILPI / Lar de Idosos",
};

type Aba = "organizacoes" | "execucoes" | "leads";

function dataBr(v: string | null | undefined) {
  return v ? new Date(v).toLocaleDateString("pt-BR") : "—";
}

function Cartao({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{valor}</p>
    </div>
  );
}

function Complice() {
  const { roles, loading } = useAuth();
  const ehMaster = roles.includes("master");
  const [aba, setAba] = useState<Aba>("organizacoes");
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 25;

  const resumoFn = useServerFn(resumoCompliceFn);
  const orgsFn = useServerFn(listarOrganizacoesCompliceFn);
  const execFn = useServerFn(listarExecucoesCompliceFn);
  const leadsFn = useServerFn(listarLeadsCompliceFn);

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => setPagina(1), [aba]);

  const resumo = useQuery({
    queryKey: ["complice-resumo"],
    queryFn: () => resumoFn({ data: undefined }),
    enabled: ehMaster,
  });

  const orgs = useQuery({
    queryKey: ["complice-orgs", termo, pagina],
    queryFn: () => orgsFn({ data: { busca: termo, pagina, porPagina } }),
    enabled: ehMaster && aba === "organizacoes",
    placeholderData: (a) => a,
  });

  const execucoes = useQuery({
    queryKey: ["complice-execucoes", pagina],
    queryFn: () => execFn({ data: { pagina, porPagina } }),
    enabled: ehMaster && aba === "execucoes",
    placeholderData: (a) => a,
  });

  const leads = useQuery({
    queryKey: ["complice-leads", termo, pagina],
    queryFn: () => leadsFn({ data: { busca: termo, pagina, porPagina } }),
    enabled: ehMaster && aba === "leads",
    placeholderData: (a) => a,
  });

  const atual = aba === "organizacoes" ? orgs : aba === "execucoes" ? execucoes : leads;
  const total = atual.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  if (loading) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;

  if (!ehMaster) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 text-xl font-black text-foreground">Área restrita</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta tela é exclusiva da conta administradora geral do Oxyvra.
        </p>
        <Link to="/painel" className="mt-4 inline-flex text-sm font-bold underline">
          Voltar ao painel
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-soft">
              Acesso Complice
            </p>
            <h1 className="text-xl font-black">Visão global da plataforma</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link to="/superadmin/clientes" className="underline opacity-90">
              Clientes
            </Link>
            <Link to="/superadmin/metricas" className="underline opacity-90">
              Indicadores
            </Link>
            <Link to="/painel" className="flex items-center gap-1 opacity-80">
              <ArrowLeft className="h-3.5 w-3.5" /> Painel
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Cartao rotulo="Organizações" valor={resumo.data?.organizacoes ?? "—"} />
          <Cartao rotulo="Unidades" valor={resumo.data?.unidades ?? "—"} />
          <Cartao rotulo="Execuções" valor={resumo.data?.execucoes ?? "—"} />
          <Cartao rotulo="Diagnósticos" valor={resumo.data?.leads ?? "—"} />
          <Cartao rotulo="Convertidos" valor={resumo.data?.leadsConvertidos ?? "—"} />
          <Cartao rotulo="Planos ativos" valor={resumo.data?.assinaturasAtivas ?? "—"} />
        </section>

        <nav className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["organizacoes", "Organizações", Building2],
              ["execucoes", "Execuções", ClipboardCheck],
              ["leads", "Diagnósticos e leads", Users],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              onClick={() => setAba(valor)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-black ${
                aba === valor
                  ? "border-teal bg-teal/10 text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Icone className="h-4 w-4" /> {rotulo}
            </button>
          ))}
        </nav>

        {aba !== "execucoes" && (
          <label className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={
                aba === "organizacoes"
                  ? "Buscar organização, CNPJ, responsável ou e-mail"
                  : "Buscar lead por nome, instituição, e-mail ou cidade"
              }
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        )}

        {atual.error && (
          <p className="mt-4 text-sm font-bold text-destructive">
            {atual.error instanceof Error ? atual.error.message : "Falha ao carregar."}
          </p>
        )}
        {atual.isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>}
        {!atual.isLoading && total === 0 && !atual.error && (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum registro encontrado.</p>
        )}
        {total > 0 && (
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {total} registro(s) · página {pagina} de {totalPaginas}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {aba === "organizacoes" &&
            (orgs.data?.itens ?? []).map((o) => (
              <article
                key={o.id}
                className="grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-4"
              >
                <div>
                  <p className="text-sm font-black text-foreground">{o.nome}</p>
                  <p className="text-xs text-muted-foreground">{o.cnpj ?? "CNPJ não informado"}</p>
                  <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                    {ROTULO_SEGMENTO[o.segmento] ?? o.segmento}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Responsável</p>
                  <p className="text-sm text-foreground">{o.responsavel_nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{o.responsavel_email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{o.responsavel_telefone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Estrutura</p>
                  <p className="text-sm text-foreground">{o.unidades} unidade(s)</p>
                  <p className="text-sm text-foreground">{o.membros} acesso(s)</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Cadastro</p>
                  <p className="text-sm text-foreground">{dataBr(o.created_at)}</p>
                  <p className="text-xs text-muted-foreground">{o.status ?? "—"}</p>
                </div>
              </article>
            ))}

          {aba === "execucoes" &&
            (execucoes.data?.itens ?? []).map((e) => (
              <article
                key={e.id}
                className="grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-4"
              >
                <div>
                  <p className="text-sm font-black text-foreground">{e.unidade}</p>
                  <p className="text-xs text-muted-foreground">{e.organizacao}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Responsável</p>
                  <p className="text-sm text-foreground">{e.executor ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Quando</p>
                  <p className="text-sm text-foreground">{dataBr(e.iniciada_em)}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.concluida_em ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> concluída
                      </span>
                    ) : (
                      "em andamento"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Resultado</p>
                  <p className="text-sm text-foreground">
                    {e.total_conformes}/{e.total_itens} conformes
                  </p>
                  {e.total_nao_conformes > 0 && (
                    <p className="text-xs font-bold text-destructive">
                      {e.total_nao_conformes} não conforme(s)
                    </p>
                  )}
                </div>
              </article>
            ))}

          {aba === "leads" &&
            (leads.data?.itens ?? []).map((l) => (
              <article
                key={l.id}
                className="grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-4"
              >
                <div>
                  <p className="text-sm font-black text-foreground">{l.nome ?? "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{l.clinica ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[l.cidade, l.uf].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Contato</p>
                  <p className="text-xs text-foreground">{l.email ?? "—"}</p>
                  <p className="text-xs text-foreground">{l.whatsapp ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Diagnóstico</p>
                  <p className="text-sm text-foreground">{l.score ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">
                    {l.pendencias ?? 0} pendência(s) · {l.origem ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Situação</p>
                  <p className="text-sm text-foreground">{l.etapa ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.convertido_em ? `Cliente em ${dataBr(l.convertido_em)}` : dataBr(l.created_at)}
                  </p>
                </div>
              </article>
            ))}
        </div>

        {totalPaginas > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded-lg border-2 border-border px-3 py-2 text-xs font-black disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs font-bold text-muted-foreground">
              {pagina} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="rounded-lg border-2 border-border px-3 py-2 text-xs font-black disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
