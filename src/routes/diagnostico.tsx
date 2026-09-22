import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { OxyvraLogo } from "@/components/OxyvraLogo";
import { capturarUtm, evento } from "@/lib/analytics";
import {
  AVISO_FUNIL,
  PERGUNTAS_FUNIL,
  calcularFunil,
  guardarLeadLocal,
  salvarDiagnosticoPublico,
  type ContatoLead,
  type RespostaFunil,
} from "@/lib/funil-rdc";
import { brl, PLANOS } from "@/lib/planos-oxyvra";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Sua clínica está preparada para a RDC 1002/2025? — Oxyvra" },
      {
        name: "description",
        content:
          "Faça o diagnóstico gratuito da RDC Anvisa nº 1.002/2025 e descubra em minutos quais pontos da sua clínica odontológica precisam de atenção.",
      },
      { property: "og:title", content: "Diagnóstico RDC 1.002/2025 — Oxyvra" },
      {
        property: "og:description",
        content:
          "Descubra quais pontos da sua clínica precisam de atenção e acompanhe sua adequação em um único lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FunilDiagnostico,
});

type Etapa = "landing" | "perguntas" | "contato" | "resultado";

const OPCOES: { valor: RespostaFunil; rotulo: string; classe: string }[] = [
  { valor: "SIM", rotulo: "Sim", classe: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { valor: "PARCIAL", rotulo: "Em parte", classe: "border-amber-500 bg-amber-50 text-amber-800" },
  { valor: "NAO", rotulo: "Não", classe: "border-destructive bg-destructive/10 text-destructive" },
];

function FunilDiagnostico() {
  const [etapa, setEtapa] = useState<Etapa>("landing");
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, RespostaFunil>>({});
  const [contato, setContato] = useState<ContatoLead>({
    nome: "",
    clinica: "",
    email: "",
    whatsapp: "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    evento("page_view", { pagina: "diagnostico_rdc" });
  }, []);

  const resultado = useMemo(() => calcularFunil(respostas), [respostas]);
  const total = PERGUNTAS_FUNIL.length;
  const progresso = Math.round((Object.keys(respostas).length / total) * 100);
  const plano = PLANOS[0]!;

  const iniciar = () => {
    evento("diagnostic_started", { total_perguntas: total });
    setEtapa("perguntas");
  };

  const responder = (chave: string, valor: RespostaFunil) => {
    setRespostas((r) => ({ ...r, [chave]: valor }));
    if (indice + 1 < total) setIndice((i) => i + 1);
    else setEtapa("contato");
  };

  const concluir = async () => {
    setSalvando(true);
    const id = await salvarDiagnosticoPublico(contato, respostas, resultado, capturarUtm());
    if (id) guardarLeadLocal(id, resultado);
    evento("diagnostic_completed", {
      score: resultado.score,
      pendencias: resultado.pendencias.length,
    });
    setSalvando(false);
    setEtapa("resultado");
  };

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <OxyvraLogo size={40} />
            <span className="text-sm font-black uppercase tracking-[0.15em] text-navy">Oxyvra</span>
          </Link>
          <Link
            to="/planos"
            className="text-xs font-black text-navy/70 underline underline-offset-4"
          >
            Ver planos
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {etapa === "landing" && (
          <section className="space-y-6">
            <div className="rounded-3xl bg-navy p-6 text-white sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">
                Diagnóstico gratuito
              </p>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">
                Sua clínica está preparada para a RDC 1002/2025?
              </h1>
              <p className="mt-3 text-sm text-white/80 sm:text-base">
                Descubra quais pontos da sua clínica precisam de atenção e acompanhe sua adequação
                em um único lugar.
              </p>
              <button
                onClick={iniciar}
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-black uppercase tracking-wide text-navy sm:w-auto"
              >
                <ClipboardCheck className="h-5 w-5" /> Fazer diagnóstico RDC
              </button>
              <p className="mt-3 text-xs text-white/60">
                12 perguntas • cerca de 3 minutos • sem cartão de crédito
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icone: Stethoscope,
                  titulo: "O que preciso fazer",
                  texto: "Requisitos traduzidos em tarefas simples, sem juridiquês.",
                },
                {
                  icone: FileCheck2,
                  titulo: "Como comprovar",
                  texto: "Cada tarefa indica a evidência esperada e o prazo.",
                },
                {
                  icone: ShieldCheck,
                  titulo: "Como manter",
                  texto: "Alertas, checklists e histórico de conformidade contínua.",
                },
              ].map((c) => (
                <article key={c.titulo} className="rounded-2xl border border-navy/10 bg-white p-4">
                  <c.icone className="h-5 w-5 text-teal" />
                  <h2 className="mt-2 text-sm font-black text-navy">{c.titulo}</h2>
                  <p className="mt-1 text-xs text-navy/70">{c.texto}</p>
                </article>
              ))}
            </div>

            <p className="text-[11px] leading-relaxed text-navy/50">{AVISO_FUNIL}</p>
          </section>
        )}

        {etapa === "perguntas" && (
          <section className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-navy/60">
                <span>
                  Pergunta {indice + 1} de {total}
                </span>
                <span>{progresso}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-teal transition-all"
                  style={{ width: `${Math.max(4, progresso)}%` }}
                />
              </div>
            </div>

            {(() => {
              const p = PERGUNTAS_FUNIL[indice]!;
              return (
                <article className="rounded-3xl border border-navy/10 bg-white p-5">
                  <p className="text-[11px] font-black uppercase tracking-wide text-teal">
                    {p.categoria}
                  </p>
                  <h2 className="mt-2 text-lg font-black leading-snug text-navy">{p.texto}</h2>
                  <p className="mt-2 text-xs text-navy/60">{p.ajuda}</p>
                  <div className="mt-5 grid gap-2">
                    {OPCOES.map((o) => (
                      <button
                        key={o.valor}
                        onClick={() => responder(p.chave, o.valor)}
                        className={`h-14 rounded-2xl border-2 text-sm font-black ${
                          respostas[p.chave] === o.valor ? o.classe : "border-navy/15 text-navy"
                        }`}
                      >
                        {o.rotulo}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-xs font-bold text-navy/60">
                    <button
                      onClick={() => setIndice((i) => Math.max(0, i - 1))}
                      disabled={indice === 0}
                      className="disabled:opacity-30"
                    >
                      Voltar
                    </button>
                    <span className="text-[11px] text-navy/40">{p.referencia}</span>
                  </div>
                </article>
              );
            })()}
          </section>
        )}

        {etapa === "contato" && (
          <section className="space-y-4 rounded-3xl border border-navy/10 bg-white p-5">
            <h2 className="text-xl font-black text-navy">Para onde enviamos o seu resultado?</h2>
            <p className="text-xs text-navy/60">
              Usamos seus dados apenas para apresentar o resultado e o plano de adequação. Não
              coletamos dados de pacientes.
            </p>
            {(
              [
                ["nome", "Seu nome", "text"],
                ["clinica", "Nome da clínica", "text"],
                ["email", "E-mail", "email"],
                ["whatsapp", "WhatsApp", "tel"],
              ] as const
            ).map(([campo, rotulo, tipo]) => (
              <label key={campo} className="block">
                <span className="text-xs font-black uppercase tracking-wide text-navy/60">
                  {rotulo}
                </span>
                <input
                  type={tipo}
                  value={contato[campo]}
                  onChange={(e) => setContato((c) => ({ ...c, [campo]: e.target.value }))}
                  className="mt-1 h-12 w-full rounded-xl border-2 border-navy/15 px-3 text-sm font-semibold text-navy outline-none focus:border-teal"
                />
              </label>
            ))}
            <button
              onClick={concluir}
              disabled={salvando || !contato.nome || !contato.email}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-40"
            >
              {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Ver meu resultado
            </button>
          </section>
        )}

        {etapa === "resultado" && (
          <section className="space-y-5">
            <article className="rounded-3xl border border-navy/10 bg-white p-6 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-navy/50">
                Índice de adequação estimado
              </p>
              <p className={`mt-2 text-6xl font-black ${resultado.faixa.classe}`}>
                {resultado.score}%
              </p>
              <p className="mt-1 text-sm font-black text-navy">{resultado.faixa.rotulo}</p>
              <p className="mt-1 text-xs text-navy/60">{resultado.faixa.descricao}</p>
            </article>

            <article className="rounded-3xl border border-navy/10 bg-white p-5">
              <h2 className="text-sm font-black uppercase tracking-wide text-navy/60">
                Por categoria
              </h2>
              <div className="mt-3 space-y-3">
                {resultado.categorias.map((c) => (
                  <div key={c.categoria}>
                    <div className="flex justify-between text-xs font-bold text-navy">
                      <span>{c.categoria}</span>
                      <span>{c.score}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy/10">
                      <div
                        className={`h-full rounded-full ${c.score >= 70 ? "bg-emerald-500" : c.score >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${Math.max(3, c.score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-navy/10 bg-white p-5">
              <h2 className="text-sm font-black uppercase tracking-wide text-navy/60">
                Pendências identificadas ({resultado.pendencias.length})
              </h2>
              {resultado.pendencias.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Nenhuma pendência apontada neste diagnóstico
                  rápido.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {resultado.pendencias.map((p) => (
                    <li
                      key={p.texto}
                      className="rounded-2xl border border-navy/10 bg-secondary/50 p-3"
                    >
                      <p className="text-[11px] font-black uppercase tracking-wide text-teal">
                        {p.categoria}
                      </p>
                      <p className="text-sm font-semibold text-navy">{p.texto}</p>
                      <p className="mt-0.5 text-[11px] text-navy/50">{p.referencia}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-3xl bg-navy p-6 text-white">
              <h2 className="text-xl font-black">O Oxyvra resolve cada pendência dessa lista</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-white/85">
                <li>• Plano de adequação gerado automaticamente com prazo e responsável</li>
                <li>• Central de evidências com fotos, laudos e documentos</li>
                <li>• Autoclaves, testes biológicos e checklists com comprovação</li>
                <li>• Relatório de gestão da adequação em PDF para a fiscalização</li>
                <li>• Monitoramento contínuo depois que a clínica se adequa</li>
              </ul>
              <p className="mt-5 text-sm text-white/70">
                <strong className="text-gold">{brl(plano.precoMensal)}/mês</strong> ou{" "}
                <strong className="text-gold">{brl(plano.precoAnualTotal)}/ano</strong> — pague 10
                meses e use 12.
              </p>
              <Link
                to="/planos"
                onClick={() => evento("pricing_viewed", { origem: "resultado_diagnostico" })}
                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold text-sm font-black uppercase text-navy sm:w-auto sm:px-8"
              >
                Ver planos <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLinkOxyvra(
                  `Olá! Fiz o diagnóstico gratuito de adequação à RDC Anvisa 1002/2025.\n\n` +
                    `Nome: ${contato.nome || "-"}\n` +
                    `Clínica: ${contato.clinica || "-"}\n` +
                    `E-mail: ${contato.email || "-"}\n` +
                    `WhatsApp: ${contato.whatsapp || "-"}\n` +
                    `Resultado: ${resultado.faixa.rotulo} (${resultado.score}%)\n\n` +
                    `Quero falar com um especialista da Oxyvra.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/30 text-sm font-black uppercase text-white transition hover:bg-white/10 sm:w-auto sm:px-8"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </article>

            <p className="text-[11px] leading-relaxed text-navy/50">{AVISO_FUNIL}</p>
          </section>
        )}
      </div>
    </main>
  );
}
