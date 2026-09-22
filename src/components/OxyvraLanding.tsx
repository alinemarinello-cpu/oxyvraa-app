import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Fingerprint,
  FolderOpen,
  FlaskConical,
  Gauge,
  History,
  LockKeyhole,
  MapPin,
  Menu,
  Microscope,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { OxyvraLogo } from "@/components/OxyvraLogo";

const fluxo = [
  { nome: "Pasta da Vigilância", Icone: FolderOpen },
  { nome: "Autoclave", Icone: FlaskConical },
  { nome: "Testes biológicos", Icone: Microscope },
  { nome: "POPs e documentos", Icone: FileText },
  { nome: "Evidências", Icone: Camera },
  { nome: "Gerar PDF", Icone: FileCheck2 },
];

const confianca = [
  {
    titulo: "Conformidade documentada e rastreável",
    texto: "Cada rotina pode reunir data, responsável, status e evidências em um histórico consultável.",
    Icone: History,
  },
  {
    titulo: "Evidências com contexto",
    texto: "Fotos, checklists e localização ficam ligados à unidade e ao registro correspondente.",
    Icone: MapPin,
  },
  {
    titulo: "Integridade dos relatórios",
    texto: "O plano Clínica inclui assinatura digital do PDF com hash SHA-256 e verificação pública.",
    Icone: Fingerprint,
  },
  {
    titulo: "Acesso por perfil",
    texto: "Gestores, equipes e revisores acessam somente as atividades adequadas às suas funções.",
    Icone: Users,
  },
];

function TrialSeal({ inverse = false }: { inverse?: boolean }) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-center text-[10px] font-black uppercase sm:text-xs ${
        inverse
          ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
          : "border-teal/25 bg-teal/5 text-teal"
      }`}
    >
      <BadgeCheck className="h-4 w-4 shrink-0" />
      <span>Teste grátis por 7 dias</span>
      <span aria-hidden>•</span>
      <span>Sem cartão</span>
      <span aria-hidden>•</span>
      <span>Sem visita técnica</span>
      <span aria-hidden>•</span>
      <span>Comece agora</span>
    </div>
  );
}

function ProductPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[330px]" aria-label="Prévia do aplicativo Oxyvra">
      <div className="relative rounded-[2.5rem] border-[7px] border-navy bg-card p-2 shadow-elevated">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-navy" />
        <div className="min-h-[590px] overflow-hidden rounded-[1.8rem] bg-secondary">
          <div className="bg-navy px-5 pb-5 pt-10 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <OxyvraLogo size={30} />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">Oxyvra</span>
              </div>
              <ShieldCheck className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-6 text-xs font-bold text-primary-foreground/65">Clínica Sorriso</p>
            <h2 className="mt-1 text-xl font-black">Pasta da Vigilância</h2>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/15">
              <div className="h-full w-[82%] rounded-full bg-teal-soft" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold">
              <span>Organização da pasta</span>
              <span>82%</span>
            </div>
          </div>

          <div className="space-y-2.5 p-4">
            {[
              { nome: "Autoclave", detalhe: "Ciclos e parâmetros", Icone: FlaskConical, ok: true },
              { nome: "Testes biológicos", detalhe: "Registros semanais", Icone: Microscope, ok: true },
              { nome: "POPs e documentos", detalhe: "2 revisões pendentes", Icone: FileText, ok: false },
              { nome: "Evidências", detalhe: "Fotos e checklists", Icone: Camera, ok: true },
            ].map(({ nome, detalhe, Icone, ok }) => (
              <div key={nome} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal/10 text-teal">
                  <Icone className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-foreground">{nome}</span>
                  <span className="block text-[10px] text-muted-foreground">{detalhe}</span>
                </span>
                {ok ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Clock3 className="h-5 w-5 shrink-0 text-warning" />
                )}
              </div>
            ))}
            <div className="flex h-12 items-center justify-center gap-2 rounded-md bg-teal text-xs font-black uppercase text-teal-foreground">
              <FileCheck2 className="h-4 w-4" /> Gerar pasta em PDF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OxyvraLanding() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Oxyvra — início">
            <OxyvraLogo size={38} />
            <span className="text-sm font-black uppercase tracking-[0.15em] text-navy">Oxyvra</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
            <a href="#produto" className="text-sm font-bold text-muted-foreground hover:text-foreground">Produto</a>
            <a href="#confianca" className="text-sm font-bold text-muted-foreground hover:text-foreground">Segurança</a>
            <Link to="/planos" className="text-sm font-bold text-muted-foreground hover:text-foreground">Planos</Link>
            <Link to="/entrar" className="text-sm font-bold text-muted-foreground hover:text-foreground">Acesso da equipe</Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="hidden text-[10px] font-black uppercase text-teal xl:inline">7 dias grátis • sem cartão</span>
            <Button asChild className="h-10 bg-teal text-teal-foreground hover:bg-teal/90">
              <Link to="/auth/register" search={{ segmento: "odonto" }}>Testar grátis <ArrowRight /></Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
          >
            {menuAberto ? <X /> : <Menu />}
          </Button>
        </div>

        {menuAberto && (
          <nav className="border-t border-border bg-background px-4 py-4 sm:hidden" aria-label="Navegação móvel">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              <a href="#produto" onClick={() => setMenuAberto(false)} className="py-2 text-sm font-bold">Produto</a>
              <Link to="/planos" className="py-2 text-sm font-bold">Planos</Link>
              <Link to="/entrar" className="py-2 text-sm font-bold">Acesso da equipe</Link>
              <Button asChild className="mt-2 h-11 bg-teal text-teal-foreground hover:bg-teal/90">
                <Link to="/auth/register" search={{ segmento: "odonto" }}>Testar grátis por 7 dias</Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      <section className="relative bg-navy text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-xs font-bold text-teal-soft">
              <Smartphone className="h-4 w-4" /> Software para clínicas a partir de R$ 134/mês
            </div>
            <h1 className="text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
              Sua clínica preparada para a RDC 1.002/2025. Sem papelada espalhada. Sem perder registros.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
              Organize a Pasta da Vigilância, autoclaves, testes, checklists e evidências pelo app Oxyvra.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-14 bg-teal px-6 text-sm font-black uppercase text-teal-foreground hover:bg-teal/90">
                <Link to="/auth/register" search={{ segmento: "odonto" }}>Testar grátis por 7 dias <ArrowRight /></Link>
              </Button>
              <Button asChild variant="outline" className="h-14 border-primary-foreground/25 bg-transparent px-6 font-bold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/diagnostico">Fazer diagnóstico de risco sanitário</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs font-bold text-primary-foreground/60">
              Sem cartão • Cancele quando quiser • A partir de R$ 134/mês
            </p>
          </div>
          <ProductPhone />
        </div>
      </section>

      <section id="produto" className="scroll-mt-20 border-b border-border bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-teal">Tudo conectado</p>
            <h2 className="mt-3 text-3xl font-black text-navy sm:text-4xl">
              Sua Pasta da Vigilância. Digital, organizada e pronta para apresentar.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A rotina da clínica alimenta a pasta continuamente. Você acompanha pendências e reúne os registros em PDF quando precisar.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {fluxo.map(({ nome, Icone }, index) => (
              <div key={nome} className="relative flex min-h-32 flex-col justify-between rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal/10 text-teal"><Icone className="h-5 w-5" /></span>
                  <span className="text-[10px] font-black text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-sm font-black text-navy">{nome}</h3>
                {index < fluxo.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 rounded-full bg-card text-teal lg:block" />}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5 text-center">
            <TrialSeal />
            <Button asChild className="h-12 bg-teal px-6 text-teal-foreground hover:bg-teal/90">
              <Link to="/auth/register" search={{ segmento: "odonto" }}>Começar minha pasta agora <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-teal">Clareza para agir</p>
            <h2 className="mt-3 text-3xl font-black text-navy sm:text-4xl">Do requisito à evidência, sem perder o contexto.</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Desenvolvido com base nos requisitos aplicáveis da RDC Anvisa nº 1.002/2025, o Oxyvra transforma a gestão em tarefas claras: o que fazer, como registrar, qual o prazo e o que ainda está pendente.
            </p>
            <div className="mt-7 border-l-4 border-gold pl-4">
              <p className="font-black text-navy">Dezembro de 2026 está chegando.</p>
              <p className="mt-1 text-sm text-muted-foreground">Comece a organizar sua adequação agora.</p>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {[
              { titulo: "O que preciso fazer", texto: "Plano de ação organizado por prioridade e unidade.", Icone: ClipboardCheck },
              { titulo: "Como comprovar", texto: "Fotos, documentos, checklists e responsáveis vinculados.", Icone: Camera },
              { titulo: "Qual é o prazo", texto: "Pendências e vencimentos visíveis para o gestor.", Icone: Clock3 },
              { titulo: "Qual é o status", texto: "Visão contínua do que está em dia e do que exige atenção.", Icone: Gauge },
            ].map(({ titulo, texto, Icone }) => (
              <article key={titulo} className="bg-card p-6">
                <Icone className="h-6 w-6 text-teal" />
                <h3 className="mt-4 font-black text-navy">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="confianca" className="scroll-mt-20 bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-teal">Confiança verificável</p>
            <h2 className="mt-3 text-3xl font-black text-navy sm:text-4xl">Registros que mostram como a rotina foi executada.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Menos tempo procurando informações espalhadas. Mais clareza para localizar registros por unidade, período e atividade.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {confianca.map(({ titulo, texto, Icone }) => (
              <article key={titulo} className="rounded-md border border-border bg-card p-6">
                <Icone className="h-6 w-6 text-teal" />
                <h3 className="mt-5 font-black text-navy">{titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Histórico por atividade", "Fotos e GPS", "PDF organizado", "Hash SHA-256", "QR público"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-navy">
                <Check className="h-4 w-4 text-success" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-teal">Planos transparentes</p>
              <h2 className="mt-3 text-3xl font-black text-navy sm:text-4xl">Comece pequeno. Evolua quando sua clínica precisar.</h2>
            </div>
            <TrialSeal />
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {[
              { nome: "Oxyvra Conformidade", escopo: "1 cadeira • 1 unidade", mensal: "R$ 134", anual: "R$ 1.340/ano", itens: ["Autoclaves e testes biológicos", "Checklists com foto e GPS", "Pasta da Vigilância em PDF"] },
              { nome: "Oxyvra Clínica", escopo: "Até 4 cadeiras • multi-equipe", mensal: "R$ 188", anual: "R$ 1.880/ano", itens: ["Tudo do plano Conformidade", "QR individual e modo offline", "PDF com hash SHA-256"] },
            ].map((plano) => (
              <article key={plano.nome} className="rounded-md border-2 border-teal/30 bg-background p-6 sm:p-8">
                <p className="text-xs font-black uppercase text-teal">{plano.escopo}</p>
                <h3 className="mt-2 text-xl font-black text-navy">{plano.nome}</h3>
                <p className="mt-5 text-4xl font-black text-navy">{plano.mensal}<span className="text-sm text-muted-foreground">/mês</span></p>
                <p className="mt-1 text-xs text-muted-foreground">ou {plano.anual} à vista</p>
                <ul className="mt-6 space-y-3">
                  {plano.itens.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{item}</li>)}
                </ul>
                <Button asChild className="mt-7 h-12 w-full bg-navy text-primary-foreground hover:bg-navy/90">
                  <Link to="/auth/register" search={{ segmento: "odonto" }}>Testar grátis por 7 dias <ArrowRight /></Link>
                </Button>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild variant="link" className="font-black text-teal"><Link to="/planos">Comparar planos e formas de pagamento <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      <section className="bg-teal py-16 text-teal-foreground sm:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          <LockKeyhole className="h-9 w-9" />
          <h2 className="mt-5 text-3xl font-black sm:text-4xl">Organize sua adequação com clareza desde o primeiro dia.</h2>
          <p className="mt-4 max-w-2xl text-teal-foreground/80">Crie sua conta, cadastre sua clínica e comece a reunir os registros da rotina no Oxyvra.</p>
          <div className="mt-7"><TrialSeal inverse /></div>
          <Button asChild className="mt-6 h-14 bg-navy px-7 text-sm font-black uppercase text-primary-foreground hover:bg-navy/90">
            <Link to="/auth/register" search={{ segmento: "odonto" }}>Começar teste grátis <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <footer className="bg-navy py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2.5"><OxyvraLogo size={36} /><span className="text-sm font-black uppercase tracking-[0.15em]">Oxyvra Biossegurança</span></div>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-primary-foreground/55">
              Plataforma de gestão da adequação, monitoramento da conformidade e organização de evidências. Não constitui certificação, aprovação ou garantia de aprovação por órgão de vigilância sanitária.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-primary-foreground/75">
            <Link to="/diagnostico">Diagnóstico gratuito</Link>
            <Link to="/planos">Planos</Link>
            <Link to="/entrar">Acesso da equipe</Link>
            <Link to="/auth" search={{ next: "/dashboard" }}>Entrar como gestor</Link>
            <Link to="/privacidade">Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}