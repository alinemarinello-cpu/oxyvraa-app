import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  CheckSquare,
  ChevronRight,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Home,
  ListChecks,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { carregarOrganizacao, listarAlertas } from "@/lib/compliance-db";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useAuth } from "@/lib/oxyvra-auth";

export const Route = createFileRoute("/_authenticated/painel/")({
  component: VisaoExecutiva,
});

type ItemMenu = {
  titulo: string;
  sub: string;
  to: string;
  icon: typeof CheckSquare;
  corFundo: string;
  corIcone: string;
};

/** Itens da tela inicial, no mesmo estilo do aplicativo comercial. */
const ITENS: ItemMenu[] = [
  {
    titulo: "Checklists",
    sub: "Rotinas e procedimentos",
    to: "/painel/checklists",
    icon: CheckSquare,
    corFundo: "bg-gold/15",
    corIcone: "text-gold",
  },
  {
    titulo: "Documentos",
    sub: "Arquivos e laudos",
    to: "/painel/pastas",
    icon: FileText,
    corFundo: "bg-navy/10",
    corIcone: "text-navy",
  },
  {
    titulo: "Treinamentos",
    sub: "Equipe atualizada",
    to: "/painel/treinamentos",
    icon: GraduationCap,
    corFundo: "bg-navy/10",
    corIcone: "text-navy",
  },
  {
    titulo: "Indicadores",
    sub: "Acompanhamento em tempo real",
    to: "/painel/rdc",
    icon: BarChart3,
    corFundo: "bg-gold/15",
    corIcone: "text-gold",
  },
  {
    titulo: "Plano de Ação",
    sub: "Pendências e melhorias",
    to: "/painel/rdc/plano",
    icon: Settings,
    corFundo: "bg-navy/10",
    corIcone: "text-navy",
  },
];

/** Resumo do índice de conformidade com a RDC 1.002/2025 no topo da home. */
function StatusConformidade() {
  const { data } = useQuery({
    queryKey: ["rdc-resumo-home"],
    queryFn: async () => {
      const { listarPlano, listarEvidencias, calcularScore, faixaScore } = await import(
        "@/lib/rdc-db"
      );
      const unitId = localStorage.getItem("oxyvra_rdc_unidade");
      const [itens, evidencias] = await Promise.all([
        listarPlano(unitId),
        listarEvidencias(unitId),
      ]);
      const resumo = calcularScore(itens, evidencias);
      return { resumo, faixa: faixaScore(resumo.score) };
    },
  });

  if (!data || data.resumo.avaliados === 0) return null;
  const { resumo, faixa } = data;

  return (
    <Link
      to="/painel/rdc"
      className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal/10">
        <span className="text-lg font-black text-teal">{resumo.score}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black ${faixa.classe}`}>{faixa.rotulo}</p>
        <p className="truncate text-xs text-muted-foreground">
          {resumo.pendencias} pendência(s) · {resumo.naoConformes} não conformidade(s)
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/** Alertas críticos continuam visíveis na home (gestão por exceção). */
function AlertasCriticos() {
  const { data: alertas } = useQuery({
    queryKey: ["alertas-home"],
    queryFn: () => listarAlertas(),
  });
  const pendentes = (alertas ?? []).filter((a) => !a.lido).slice(0, 4);
  if (pendentes.length === 0) return null;

  return (
    <section className="mt-4 space-y-2">
      {pendentes.map((a) => (
        <div key={a.id} className="rounded-xl bg-destructive/5 px-4 py-3">
          <p className="text-sm font-bold text-foreground">{a.titulo}</p>
          <p className="text-xs text-muted-foreground">{a.mensagem}</p>
          {(a.tipo === "lactario" || a.severidade === "critica") && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `[OXYVRA — ALERTA ${a.tipo === "lactario" ? "LACTÁRIO" : "CRÍTICO"}] ${a.titulo}. ${a.mensagem} Abrir Plano de Ação (CAPA) imediatamente.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white"
            >
              Avisar coordenação no WhatsApp
            </a>
          )}
        </div>
      ))}
    </section>
  );
}

/** Geração do relatório consolidado de auditoria (PDF) direto da home. */
function BotaoRelatorioAuditoria() {
  const [gerando, setGerando] = useState(false);
  const { marcaDagua } = useAssinatura();

  async function baixarRelatorio() {
    setGerando(true);
    try {
      const [{ gerarRelatorioAuditoria }, org] = await Promise.all([
        import("@/lib/relatorio-auditoria"),
        carregarOrganizacao(),
      ]);
      await gerarRelatorioAuditoria({
        organizacaoNome: org?.nome ?? "Oxyvra",
        dias: 90,
        marcaDagua,
      });
      toast.success("Relatório de auditoria gerado.");
    } catch {
      toast.error("Não foi possível gerar o relatório agora.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixarRelatorio}
      disabled={gerando}
      className="mt-3 flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition active:scale-[0.98] disabled:opacity-60"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15">
        {gerando ? (
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        ) : (
          <Download className="h-6 w-6 text-gold" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-foreground">Relatório de auditoria</p>
        <p className="truncate text-xs text-muted-foreground">
          PDF consolidado dos últimos 90 dias
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Atalho exclusivo da conta mestre para a visão global. */
function AtalhoComplice() {
  const { roles } = useAuth();
  if (!roles.includes("master")) return null;

  return (
    <Link
      to="/superadmin/complice"
      className="mt-3 flex w-full items-center gap-4 rounded-2xl bg-navy p-4 text-left shadow-card transition active:scale-[0.98]"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/20">
        <Globe className="h-6 w-6 text-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-gold">Visão global (Complice)</p>
        <p className="truncate text-xs text-gold/70">
          Todas as organizações, execuções e diagnósticos
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gold/70" />
    </Link>
  );
}

function VisaoExecutiva() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col pb-24">
      {/* Cabeçalho centralizado, como no aplicativo comercial */}
      <header className="flex flex-col items-center pt-2 text-center">
        <OxyvraLogo size={56} />
        <h1 className="mt-4 text-2xl font-black text-foreground">Olá, Doutor(a)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sua clínica em conformidade</p>
      </header>

      <StatusConformidade />

      <AtalhoComplice />


      {/* Menu principal em cartões grandes */}
      <nav className="mt-4 flex flex-col gap-3">
        {ITENS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition active:scale-[0.98]"
          >
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${item.corFundo}`}
            >
              <item.icon className={`h-6 w-6 ${item.corIcone}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-foreground">{item.titulo}</p>
              <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <BotaoRelatorioAuditoria />

      <AlertasCriticos />

      {/* Navegação inferior fixa, como na imagem */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {[
            { to: "/painel", label: "Início", icon: Home, exact: true },
            { to: "/painel/checklists", label: "Rotinas", icon: ListChecks, exact: false },
            { to: "/painel/pastas", label: "Documentos", icon: FileText, exact: false },
            { to: "/painel/assinatura", label: "Mais", icon: Settings, exact: false },
          ].map((n) => (
            <Link
              key={n.label}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "text-teal" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold"
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
