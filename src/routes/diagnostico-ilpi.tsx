import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Droplets,
  FileWarning,
  Hand,
  Loader2,
  Mail,
  MessageCircle,
  Recycle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SprayCan,
  User,
} from "lucide-react";

import { OxyvraLogo } from "@/components/OxyvraLogo";
import { capturarUtm, evento } from "@/lib/analytics";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostico-ilpi")({
  head: () => ({
    meta: [
      { title: "Diagnóstico gratuito de risco sanitário para ILPIs — Oxyvra" },
      {
        name: "description",
        content:
          "Responda 5 perguntas rápidas baseadas nas exigências da Vigilância Sanitária (RDC 502/2021 e RDC 222/2018) e descubra o nível de risco da sua instituição de longa permanência.",
      },
      { property: "og:title", content: "Qual o nível de risco da sua ILPI perante a Vigilância Sanitária?" },
      {
        property: "og:description",
        content:
          "Diagnóstico gratuito de biossegurança para lares de idosos: descubra onde sua instituição está exposta a multas e interdições.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizIlpi,
});

/* ------------------------------------------------------------------ */
/* Perguntas                                                           */
/* ------------------------------------------------------------------ */

type Opcao = { rotulo: string; pontos: 0 | 1 | 2 };

type Pergunta = {
  chave: string;
  icone: typeof SprayCan;
  tema: string;
  norma: string;
  texto: string;
  opcoes: Opcao[];
  vulnerabilidade: string;
};

const PERGUNTAS: Pergunta[] = [
  {
    chave: "ambientes",
    icone: SprayCan,
    tema: "Higienização de ambientes",
    norma: "RDC 502/2021",
    texto: "Como são realizadas as rotinas de higienização dos quartos, banheiros e áreas comuns?",
    opcoes: [
      { rotulo: "A limpeza é feita conforme a demanda do dia, sem rotina definida", pontos: 0 },
      { rotulo: "Há rotina definida, com registro em papel", pontos: 1 },
      { rotulo: "Há rotina definida, com registro digital por ambiente", pontos: 2 },
    ],
    vulnerabilidade: "Higienização de ambientes sem rotina definida e sem registro por ambiente.",
  },
  {
    chave: "saneantes",
    icone: Droplets,
    tema: "Produtos de limpeza (saneantes)",
    norma: "RDC 502/2021",
    texto: "Como são escolhidos e preparados os produtos de limpeza usados na instituição?",
    opcoes: [
      { rotulo: "Produtos de uso geral, com diluição feita sem medida padronizada", pontos: 0 },
      { rotulo: "Produtos regularizados, com diluição conforme o rótulo, sem registro do preparo", pontos: 1 },
      { rotulo: "Produtos regularizados, com diluição medida e preparo registrado", pontos: 2 },
    ],
    vulnerabilidade: "Uso de saneantes sem regularização confirmada, diluição padronizada ou registro do preparo.",
  },
  {
    chave: "materiais",
    icone: ClipboardCheck,
    tema: "Contaminação cruzada — materiais de limpeza",
    norma: "RDC 502/2021",
    texto: "Como os panos, baldes e acessórios de limpeza são usados entre os ambientes?",
    opcoes: [
      { rotulo: "Os mesmos materiais circulam entre todos os ambientes", pontos: 0 },
      { rotulo: "Materiais separados por área, sem controle formal", pontos: 1 },
      { rotulo: "Materiais separados por área, com identificação e controle de troca", pontos: 2 },
    ],
    vulnerabilidade: "Materiais de limpeza compartilhados entre ambientes, favorecendo a contaminação cruzada.",
  },
  {
    chave: "superficies",
    icone: DoorOpen,
    tema: "Contaminação cruzada — objetos compartilhados",
    norma: "RDC 502/2021",
    texto:
      "Como é o cuidado com objetos e superfícies compartilhados entre os residentes (corrimãos, mesas, materiais de uso comum)?",
    opcoes: [
      { rotulo: "Higienização sem frequência definida", pontos: 0 },
      { rotulo: "Higienização em frequência fixa, sem registro", pontos: 1 },
      { rotulo: "Higienização em frequência definida e registrada", pontos: 2 },
    ],
    vulnerabilidade: "Superfícies e objetos compartilhados higienizados sem frequência definida nem registro.",
  },
  {
    chave: "equipe",
    icone: Hand,
    tema: "Equipe — higiene das mãos e proteção",
    norma: "RDC 502/2021",
    texto:
      "Como é o acompanhamento da higiene das mãos e do uso de proteção (luvas, máscaras) pela equipe?",
    opcoes: [
      { rotulo: "Orientação repassada na admissão", pontos: 0 },
      { rotulo: "Orientações periódicas, sem registro formal", pontos: 1 },
      { rotulo: "Orientações com registro e supervisão de rotina", pontos: 2 },
    ],
    vulnerabilidade: "Higiene das mãos e uso de proteção pela equipe sem registro nem supervisão de rotina.",
  },
];

/* ------------------------------------------------------------------ */
/* Cálculo de risco                                                    */
/* ------------------------------------------------------------------ */

type Nivel = {
  rotulo: string;
  icone: typeof ShieldAlert;
  descricao: string;
  corTexto: string;
  corFundo: string;
  corBarra: string;
};

function nivelDeRisco(score: number): Nivel {
  if (score < 40)
    return {
      rotulo: "Risco Crítico",
      icone: ShieldAlert,
      descricao:
        "Sua ILPI está altamente exposta a autuações, multas e até interdição em uma fiscalização surpresa. Os pontos abaixo são os primeiros que a Vigilância costuma cobrar.",
      corTexto: "text-red-700",
      corFundo: "bg-red-50 border-red-200",
      corBarra: "bg-red-500",
    };
  if (score < 75)
    return {
      rotulo: "Risco Moderado",
      icone: AlertTriangle,
      descricao:
        "Há uma base de controle, mas as lacunas abaixo deixam a instituição vulnerável a notificações e exigências com prazo de cumprimento.",
      corTexto: "text-amber-700",
      corFundo: "bg-amber-50 border-amber-200",
      corBarra: "bg-amber-500",
    };
  return {
    rotulo: "Conformidade Avançada",
    icone: ShieldCheck,
    descricao:
      "Sua instituição está bem posicionada. O desafio agora é manter a comprovação contínua e eliminar o retrabalho de papel.",
    corTexto: "text-emerald-700",
    corFundo: "bg-emerald-50 border-emerald-200",
    corBarra: "bg-emerald-500",
  };
}

/* ------------------------------------------------------------------ */
/* Persistência do lead                                                */
/* ------------------------------------------------------------------ */

type Lead = { nome: string; email: string; instituicao: string; leitos: string };

async function salvarLeadIlpi(
  lead: Lead,
  respostas: Record<string, number>,
  score: number,
  vulnerabilidades: string[],
): Promise<void> {
  const { error } = await supabase.from("rdc_leads").insert({
    nome: lead.nome || null,
    clinica: lead.instituicao || null,
    email: lead.email || null,
    respostas: { ...respostas, leitos: lead.leitos, vertical: "ilpi" },
    score,
    aplicaveis: PERGUNTAS.length,
    pendencias: vulnerabilidades.length,
    categorias: PERGUNTAS.map((p) => ({
      categoria: p.tema,
      score: Math.round(((respostas[p.chave] ?? 0) / 2) * 100),
    })),
    origem: "quiz-ilpi",
    utm: capturarUtm(),
    etapa: "DIAGNOSTICO_CONCLUIDO",
  });
  if (error) {
    console.warn("Lead ILPI não pôde ser salvo:", error.message);
    toast.error(
      "Não conseguimos registrar seu contato agora. Fale com a Oxyvra pelo WhatsApp para receber o resultado.",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

type Etapa = "captura" | "perguntas" | "calculando" | "resultado";

function QuizIlpi() {
  const [etapa, setEtapa] = useState<Etapa>("captura");
  const [lead, setLead] = useState<Lead>({ nome: "", email: "", instituicao: "", leitos: "" });
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);

  const score = useMemo(() => {
    const total = PERGUNTAS.reduce((s, p) => s + (respostas[p.chave] ?? 0), 0);
    return Math.round((total / (PERGUNTAS.length * 2)) * 100);
  }, [respostas]);

  const vulnerabilidades = useMemo(
    () =>
      PERGUNTAS.filter((p) => (respostas[p.chave] ?? 0) < 2).map((p) => ({
        tema: p.tema,
        norma: p.norma,
        texto: p.vulnerabilidade,
        grave: (respostas[p.chave] ?? 0) === 0,
      })),
    [respostas],
  );

  const nivel = nivelDeRisco(score);
  const perguntaAtual = PERGUNTAS[indice]!;
  const progresso = Math.round((Object.keys(respostas).length / PERGUNTAS.length) * 100);

  const capturaValida =
    lead.nome.trim().length >= 2 &&
    /.+@.+\..+/.test(lead.email.trim()) &&
    lead.instituicao.trim().length >= 2 &&
    Number(lead.leitos) > 0;

  const iniciar = () => {
    if (!capturaValida) return;
    evento("diagnostic_started", { funil: "ilpi" });
    setEtapa("perguntas");
  };

  const responder = (pontos: number) => {
    const novas = { ...respostas, [perguntaAtual.chave]: pontos };
    setRespostas(novas);
    if (indice < PERGUNTAS.length - 1) {
      setIndice(indice + 1);
    } else {
      setEtapa("calculando");
      setSalvando(true);
      const novoScore = Math.round(
        (PERGUNTAS.reduce((s, p) => s + (novas[p.chave] ?? 0), 0) / (PERGUNTAS.length * 2)) * 100,
      );
      const novasVuln = PERGUNTAS.filter((p) => (novas[p.chave] ?? 0) < 2).map((p) => p.vulnerabilidade);
      void salvarLeadIlpi(lead, novas, novoScore, novasVuln).finally(() => setSalvando(false));
      evento("diagnostic_completed", { funil: "ilpi", score: novoScore });
      window.setTimeout(() => setEtapa("resultado"), 2200);
    }
  };

  const msgWhatsApp =
    `Olá! Fiz o diagnóstico gratuito de risco sanitário da minha ILPI.\n\n` +
    `Nome: ${lead.nome || "-"}\n` +
    `Instituição: ${lead.instituicao || "-"}\n` +
    `E-mail: ${lead.email || "-"}\n` +
    `Resultado: ${nivel.rotulo} (${score}%)\n\n` +
    `Quero falar com um especialista da Oxyvra.`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B2238]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <OxyvraLogo />
          <span className="rounded-full bg-[#0B2238]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0B2238]/70">
            Lares de Idosos · ILPI
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        {/* ---------------- CAPTURA ---------------- */}
        {etapa === "captura" && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Diagnóstico gratuito · 2 minutos
              </span>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                Qual o nível de risco da sua ILPI perante a Vigilância Sanitária?
              </h1>
              <p className="text-sm text-slate-600 sm:text-base">
                Responda a 5 perguntas rápidas baseadas nas exigências legais federais e descubra se
                sua instituição está blindada contra multas e interdições.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Campo icone={User} rotulo="Nome do gestor">
                <input
                  value={lead.nome}
                  onChange={(e) => setLead({ ...lead, nome: e.target.value })}
                  placeholder="Ex.: Maria Fernandes"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B2238]"
                />
              </Campo>
              <Campo icone={Mail} rotulo="E-mail profissional">
                <input
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="voce@instituicao.org"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B2238]"
                />
              </Campo>
              <Campo icone={Building2} rotulo="Nome da instituição">
                <input
                  value={lead.instituicao}
                  onChange={(e) => setLead({ ...lead, instituicao: e.target.value })}
                  placeholder="Ex.: Lar São Vicente"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B2238]"
                />
              </Campo>
              <Campo icone={BedDouble} rotulo="Número de leitos">
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={lead.leitos}
                  onChange={(e) => setLead({ ...lead, leitos: e.target.value })}
                  placeholder="Ex.: 40"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B2238]"
                />
              </Campo>

              <button
                onClick={iniciar}
                disabled={!capturaValida}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2238] py-3 text-sm font-bold text-white transition enabled:hover:bg-[#12355a] disabled:opacity-40"
              >
                Iniciar diagnóstico gratuito <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                Seus dados são usados apenas para entregar o resultado e o contato de um especialista.
                Ferramenta de apoio à gestão — não representa aprovação ou certificação perante a
                Anvisa ou a vigilância sanitária local.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- PERGUNTAS ---------------- */}
        {etapa === "perguntas" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  Pergunta {indice + 1} de {PERGUNTAS.length}
                </span>
                <span>{progresso}% concluído</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#0B2238]/5 p-2.5">
                  <perguntaAtual.icone className="h-5 w-5 text-[#0B2238]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
                    {perguntaAtual.tema} · {perguntaAtual.norma}
                  </p>
                  <h2 className="mt-1 text-base font-bold leading-snug sm:text-lg">
                    {perguntaAtual.texto}
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {perguntaAtual.opcoes.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => responder(op.pontos)}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm transition hover:border-[#0B2238] hover:bg-[#0B2238]/5"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500">
                      {String.fromCharCode(97 + i)}
                    </span>
                    {op.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {indice > 0 && (
              <button
                onClick={() => setIndice(indice - 1)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0B2238]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar à pergunta anterior
              </button>
            )}
          </div>
        )}

        {/* ---------------- CALCULANDO ---------------- */}
        {etapa === "calculando" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
            <p className="text-sm font-semibold">Calculando nível de conformidade regulatória...</p>
            <p className="text-xs text-slate-500">
              Cruzando suas respostas com os pontos críticos das RDC 502/2021 e RDC 222/2018.
            </p>
          </div>
        )}

        {/* ---------------- RESULTADO ---------------- */}
        {etapa === "resultado" && (
          <div className="space-y-6">
            <div className={`space-y-3 rounded-2xl border p-6 text-center shadow-sm ${nivel.corFundo}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Resultado do diagnóstico · {lead.instituicao}
              </p>
              <nivel.icone className={`mx-auto h-12 w-12 ${nivel.corTexto}`} />
              <h2 className={`text-2xl font-extrabold ${nivel.corTexto}`}>{nivel.rotulo}</h2>
              <div className="mx-auto max-w-xs">
                <div className="h-3 overflow-hidden rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full ${nivel.corBarra} transition-all duration-1000`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Índice de conformidade: {score}%
                </p>
              </div>
              <p className="mx-auto max-w-md text-sm text-slate-700">{nivel.descricao}</p>
            </div>

            {vulnerabilidades.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Onde sua ILPI está exposta a multas e autuações
                </h3>
                <div className="space-y-2">
                  {vulnerabilidades.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${v.grave ? "text-red-500" : "text-amber-500"}`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          {v.tema} · {v.norma}
                        </p>
                        <p className="text-sm">{v.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-2xl bg-[#0B2238] p-6 text-white shadow-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                <p className="text-sm leading-relaxed">
                  A Oxyvra elimina 100% desses riscos substituindo o papel por uma solução completa
                  que une <strong>visita técnica presencial</strong>,{" "}
                  <strong>Pasta da Vigilância automatizada</strong> e{" "}
                  <strong>aplicativo de campo</strong> para sua equipe.
                </p>
              </div>
              <div className="space-y-2.5">
                <a
                  href={waLinkOxyvra(
                    `Olá! Quero solicitar uma visita técnica da Oxyvra com mapeamento in loco.\n\n` +
                      `Nome: ${lead.nome || "-"}\n` +
                      `Instituição: ${lead.instituicao || "-"}\n` +
                      `E-mail: ${lead.email || "-"}\n` +
                      `Resultado do diagnóstico: ${nivel.rotulo} (${score}%)`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#0B2238] transition hover:brightness-110"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Solicitar visita técnica e mapeamento in loco
                </a>
                <a
                  href={waLinkOxyvra(msgWhatsApp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com um especialista da Oxyvra via WhatsApp
                </a>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/60">
                <CheckCircle2 className="h-3 w-3" />
                {salvando ? "Salvando seu resultado..." : "Resultado registrado — um especialista pode retomar com você."}
              </p>
            </div>

            <p className="text-center text-[11px] leading-relaxed text-slate-500">
              Ferramenta de apoio à gestão da adequação, baseada nas RDC 502/2021 e 222/2018. Não
              representa aprovação, certificação ou garantia perante a Anvisa ou a vigilância
              sanitária local.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Campo({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: typeof User;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <Icone className="h-3.5 w-3.5 text-[#D4AF37]" /> {rotulo}
      </span>
      {children}
    </label>
  );
}
