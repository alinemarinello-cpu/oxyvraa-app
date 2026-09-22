import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  ArrowLeft,
  Building2,
  FolderOpen,
  ShieldCheck,
  Stethoscope,
  Barcode,
  Users,
  UserRound,
  BookOpen,
} from "lucide-react";

import { bootstrapOrganizacao } from "@/lib/compliance.functions";
import { diasRestantesTrial, organizacaoLiberada, STATUS_ORG } from "@/lib/compliance-types";
import { useAuth } from "@/lib/oxyvra-auth";
import { useAssinatura } from "@/hooks/useAssinatura";
import { diasRestantes, trialAtivo } from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Compliance — Oxyvra" },
      {
        name: "description",
        content:
          "Painel do gestor Oxyvra: conformidade por unidade, checklists sanitários, planos de ação e assinatura.",
      },
      { property: "og:title", content: "Painel de Compliance — Oxyvra" },
      {
        property: "og:description",
        content: "Gestão de compliance sanitário multiunidade com auditoria e planos de ação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelLayout,
});

/** Operacional: visível para toda a equipe (inclusive ASB/TSB). */
const NAV = [
  { to: "/painel", label: "Dashboard Odonto", icon: LayoutDashboard, exact: true },
  { to: "/painel/rdc", label: "RDC 1.002/2025", icon: Stethoscope, exact: false },
  { to: "/painel/esterilizacao", label: "Autoclaves e testes", icon: ShieldCheck, exact: false },
  {
    to: "/painel/checklists",
    label: "Checklists de biossegurança",
    icon: ClipboardList,
    exact: false,
  },
  { to: "/ajuda", label: "Ajuda / Manual", icon: BookOpen, exact: false },
] as const;

/** Gestão: apenas o dentista/dono da clínica (plano, dossiê, equipe e dados da clínica). */
const NAV_GESTOR = [
  { to: "/painel/conformidade", label: "Dossiê e selo digital", icon: Stethoscope, exact: false },
  { to: "/painel/pastas", label: "Pasta da Vigilância", icon: FolderOpen, exact: false },
  { to: "/painel/insumos", label: "Kit Full Care", icon: Barcode, exact: false },
  { to: "/painel/unidades", label: "Consultórios", icon: Building2, exact: false },
  { to: "/painel/acessos", label: "Acessos de gestores", icon: Users, exact: false },
  { to: "/painel/assinatura", label: "Assinatura", icon: CreditCard, exact: false },
] as const;

const NAV_MASTER = [
  { to: "/superadmin/complice", label: "Visão global (Complice)", icon: LayoutDashboard, exact: false },
  { to: "/painel/assinantes", label: "Assinantes", icon: UserRound, exact: false },
  { to: "/superadmin/clientes", label: "Clientes do SaaS", icon: UserRound, exact: false },
  { to: "/superadmin/metricas", label: "Indicadores do SaaS", icon: LayoutDashboard, exact: false },
  { to: "/superadmin/regulatorio", label: "Banco regulatório", icon: Stethoscope, exact: false },
  { to: "/superadmin/pagamentos", label: "Links de pagamento", icon: CreditCard, exact: false },
] as const;




export function useOrganizacao() {
  const bootstrap = useServerFn(bootstrapOrganizacao);
  return useQuery({
    queryKey: ["organizacao"],
    queryFn: () => bootstrap({ data: {} }),
    staleTime: 60_000,
  });
}

/** Faixa fixa de conversão exibida durante o período de teste. */
function BannerTeste() {
  const { assinatura } = useAssinatura();
  if (!assinatura || !trialAtivo(assinatura)) return null;
  return (
    <div className="sticky top-0 z-30 bg-gold px-4 py-2.5 text-navy">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold">
          Você está no Período de Teste Grátis (RDC 1.002/2025) —{" "}
          {diasRestantes(assinatura.trial_fim)} dias restantes.
        </p>
        <Link
          to="/checkout"
          className="rounded-xl bg-navy px-3 py-2 text-xs font-black text-gold"
        >
          Assinar plano com Kit de Insumos
        </Link>
      </div>
    </div>
  );
}

function PainelLayout() {
  const { data: org, isLoading } = useOrganizacao();
  const { roles } = useAuth();
  const isMaster = roles.includes("master");
  // Equipe (ASB/TSB) entra pelo PIN e só vê o operacional; gestor vê tudo.
  const somenteOperador =
    roles.includes("operador") &&
    !roles.includes("gestor") &&
    !roles.includes("admin") &&
    !isMaster;


  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-soft">
                Oxyvra Compliance
              </p>
              <h1 className="text-xl font-black">
                {isMaster ? "Visão geral — todas as organizações" : "Painel do gestor"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {org && !isMaster && (
                <span className="rounded-full bg-teal px-3 py-1.5 text-xs font-bold text-teal-foreground">
                  {org.status === "trial"
                    ? `Teste — ${diasRestantesTrial(org.trial_expira_em)} dias restantes`
                    : (STATUS_ORG[org.status]?.label ?? org.status)}
                </span>
              )}
              <Link
                to="/menu"
                className="flex items-center gap-1 text-xs font-bold text-primary-foreground/70 hover:text-primary-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> App de campo
              </Link>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              ...NAV,
              ...(somenteOperador ? [] : NAV_GESTOR),
              ...(isMaster ? NAV_MASTER : []),
            ].map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                activeProps={{ className: "bg-teal text-teal-foreground" }}
                inactiveProps={{ className: "bg-white/10 text-primary-foreground/80" }}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <BannerTeste />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando sua organização…</p>
        ) : !isMaster && org && !organizacaoLiberada(org) ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-6">
            <h2 className="text-lg font-black text-foreground">Acesso suspenso</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {STATUS_ORG[org.status]?.label ?? "Assinatura inativa"}. Regularize o pagamento para
              voltar a usar o painel. Os dados continuam guardados com segurança.
            </p>
            <Link
              to="/painel/assinatura"
              className="mt-4 inline-flex rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
            >
              Ver assinatura
            </Link>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
