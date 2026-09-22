import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Building2, Mail, Phone, Search, UserRound } from "lucide-react";
import { listarAssinantesConta } from "@/lib/compliance.functions";
import { diasRestantesTrial, STATUS_ORG } from "@/lib/compliance-types";

export const Route = createFileRoute("/_authenticated/painel/assinantes")({
  head: () => ({
    meta: [
      { title: "Assinantes e responsáveis — Oxyvra" },
      {
        name: "description",
        content:
          "Cadastro das empresas assinantes do Oxyvra com o responsável pela conta: nome, cargo, e-mail, telefone e situação do plano.",
      },
      { property: "og:title", content: "Assinantes e responsáveis — Oxyvra" },
      {
        property: "og:description",
        content: "Base de contatos responsáveis por cada conta contratante do Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssinantesPage,
});

function AssinantesPage() {
  const listar = useServerFn(listarAssinantesConta);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 25;

  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assinantes", termo, pagina],
    queryFn: () => listar({ data: { busca: termo, pagina, porPagina } }),
    placeholderData: (anterior) => anterior,
  });

  const lista = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando assinantes…</p>;
  if (error)
    return (
      <p className="rounded-2xl border border-destructive/30 bg-card p-6 text-sm text-muted-foreground">
        {(error as Error).message}
      </p>
    );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
              Assinantes e responsáveis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Empresas que contrataram o Oxyvra e a pessoa responsável por cada conta.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa, responsável ou telefone"
              className="w-64 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </section>

      {total > 0 && (
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {total} assinante(s) · página {pagina} de {totalPaginas}
        </p>
      )}

      {lista.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum assinante encontrado.
        </p>
      )}

      <div className="grid gap-3">
        {lista.map((a) => (
          <article key={a.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-base font-black text-foreground">
                  <Building2 className="h-4 w-4 text-teal" />
                  {a.nome}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.cnpj ? `CNPJ ${a.cnpj} · ` : ""}
                  {a.unidades} unidade(s) · desde{" "}
                  {new Date(a.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-foreground">
                {a.status === "trial"
                  ? `Teste — ${diasRestantesTrial(a.trial_expira_em)} dia(s)`
                  : (STATUS_ORG[a.status]?.label ?? a.status)}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary p-4">
                <dt className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" /> Responsável pela conta
                </dt>
                <dd className="text-sm font-black text-foreground">
                  {a.responsavel_nome ?? a.membros[0]?.nome ?? "Não informado"}
                </dd>
                {a.responsavel_cargo && (
                  <dd className="text-xs text-muted-foreground">{a.responsavel_cargo}</dd>
                )}
                {a.responsavel_cpf && (
                  <dd className="text-xs text-muted-foreground">CPF {a.responsavel_cpf}</dd>
                )}
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-xs font-bold uppercase text-muted-foreground">Contato</dt>
                <dd className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-teal" />
                  {a.responsavel_email ?? a.email_contato ?? a.membros[0]?.email ?? "—"}
                </dd>
                <dd className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Phone className="h-3.5 w-3.5 text-teal" />
                  {a.responsavel_telefone ?? "—"}
                </dd>
              </div>
            </dl>

            {a.responsavel_observacoes && (
              <p className="mt-3 text-xs text-muted-foreground">{a.responsavel_observacoes}</p>
            )}
          </article>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1 || isLoading}
            className="rounded-lg border-2 border-border px-3 py-2 text-xs font-black disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs font-bold text-muted-foreground">
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas || isLoading}
            className="rounded-lg border-2 border-border px-3 py-2 text-xs font-black disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
