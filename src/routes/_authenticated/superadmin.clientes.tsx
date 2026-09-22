import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Mail, Search, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { estenderTrialFn, listarClientesSaasFn } from "@/lib/superadmin.functions";
import { useAuth } from "@/lib/oxyvra-auth";

export const Route = createFileRoute("/_authenticated/superadmin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes do SaaS — Oxyvra Superadmin" },
      {
        name: "description",
        content:
          "Área reservada do proprietário Oxyvra: todos os clientes, porte da clínica, contato direto por WhatsApp, status do plano e endereço de entrega do kit.",
      },
      { property: "og:title", content: "Clientes do SaaS — Oxyvra Superadmin" },
      {
        property: "og:description",
        content: "Gestão de leads e clientes Oxyvra com contato em um clique.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuperadminClientes,
});

const ROTULO_SEGMENTO: Record<string, string> = {
  odonto: "Odontologia",
  escola: "Escola/Creche",
  ilpi: "ILPI / Lar de Idosos",
};

const CORES_STATUS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  TRIALING: "bg-gold/25 text-navy",
  PAST_DUE: "bg-amber-100 text-amber-900",
  CANCELED: "bg-destructive/10 text-destructive",
  SEM_ASSINATURA: "bg-secondary text-muted-foreground",
};

function somenteDigitos(v: string | null): string {
  return (v ?? "").replace(/\D/g, "");
}

function linkWhatsapp(telefone: string | null, nome: string | null, clinica: string) {
  const d = somenteDigitos(telefone);
  if (d.length < 10) return null;
  const numero = d.startsWith("55") ? d : `55${d}`;
  const texto = `Olá ${nome ?? ""}! Aqui é da Oxyvra Biossegurança. Estou acompanhando a conta da ${clinica} na plataforma de conformidade RDC 1.002/2025. Posso ajudar com a configuração ou com o Kit de Insumos?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function SuperadminClientes() {
  const { roles, loading } = useAuth();
  const ehMaster = roles.includes("master");
  const listar = useServerFn(listarClientesSaasFn);
  const estender = useServerFn(estenderTrialFn);
  const qc = useQueryClient();
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
    queryKey: ["superadmin-clientes", termo, pagina],
    queryFn: () => listar({ data: { busca: termo, pagina, porPagina } }),
    enabled: ehMaster,
    placeholderData: (anterior) => anterior,
  });

  const prorrogar = useMutation({
    mutationFn: (organizacaoId: string) => estender({ data: { organizacaoId, dias: 7 } }),
    onSuccess: () => {
      toast.success("Teste grátis estendido por mais 7 dias.");
      void qc.invalidateQueries({ queryKey: ["superadmin-clientes"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível estender."),
  });

  const filtrados = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  if (loading) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;

  if (!ehMaster) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 text-xl font-black text-foreground">Área restrita</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta página é exclusiva da conta administradora geral do Oxyvra.
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
              Oxyvra Superadmin
            </p>
            <h1 className="text-xl font-black">Clientes e leads da plataforma</h1>
          </div>
          <Link to="/painel" className="flex items-center gap-1 text-xs font-bold opacity-80">
            <ArrowLeft className="h-3.5 w-3.5" /> Painel
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por clínica, responsável, e-mail, CNPJ ou status"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm font-bold text-destructive">
            {error instanceof Error ? error.message : "Falha ao carregar."}
          </p>
        )}
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando clientes…</p>}

        {!isLoading && filtrados.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        )}

        {total > 0 && (
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {total} cliente(s) · página {pagina} de {totalPaginas}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {filtrados.map((c) => {
            const wa = linkWhatsapp(c.responsavel_telefone, c.responsavel_nome, c.clinica);
            return (
              <article
                key={c.organizacao_id}
                className="grid gap-4 rounded-2xl border border-border bg-card p-4 lg:grid-cols-5"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Cliente</p>
                  <p className="text-sm font-black text-foreground">
                    {c.responsavel_nome ?? "Responsável não informado"}
                  </p>
                  <p className="text-sm text-foreground">{c.clinica}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.cnpj ?? c.responsavel_cpf ?? "CNPJ/CPF não informado"}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                    {ROTULO_SEGMENTO[c.segmento] ?? "Odontologia"}
                  </span>
                  {c.responsavel_cargo && (
                    <p className="text-xs text-muted-foreground">{c.responsavel_cargo}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Porte</p>
                  <p className="text-sm font-bold text-foreground">
                    {c.cadeiras} cadeira(s)/equipo(s)
                  </p>
                  <p className="text-sm text-foreground">{c.autoclaves} autoclave(s)</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Contato</p>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Chamar no WhatsApp
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">WhatsApp não informado</p>
                  )}
                  {c.responsavel_email ? (
                    <a
                      href={`mailto:${c.responsavel_email}`}
                      className="flex items-center gap-1.5 text-xs font-bold text-foreground underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {c.responsavel_email}
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">E-mail não informado</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Plano</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                      CORES_STATUS[c.status] ?? "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.plano ?? "—"} · {c.ciclo === "ANNUAL" ? "anual" : "mensal"}
                    {c.kit_insumos ? " · Kit Full Care" : ""}
                  </p>
                  {c.trial_fim && (
                    <p className="text-xs text-muted-foreground">
                      Teste até {new Date(c.trial_fim).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  <button
                    onClick={() => prorrogar.mutate(c.organizacao_id)}
                    disabled={prorrogar.isPending}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-border px-2.5 py-1.5 text-xs font-black text-foreground disabled:opacity-60"
                  >
                    <Clock className="h-3.5 w-3.5" /> +7 dias de teste
                  </button>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Entrega do kit
                  </p>
                  <p className="text-xs text-foreground">
                    {c.entrega ?? "Endereço ainda não capturado no checkout."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {totalPaginas > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
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
    </main>
  );
}
