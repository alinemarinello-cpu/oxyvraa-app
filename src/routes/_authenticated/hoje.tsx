import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  concluirTarefa,
  criarAgendaPadrao,
  guiaDe,
  listarAgenda,
  listarLicencas,
  listarNotificacoes,
  marcarNotificacaoLida,
  tarefasDeHoje,
  type Tarefa,
} from "@/lib/copiloto-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({
    meta: [
      { title: "O que fazer hoje — Oxyvra Copiloto" },
      {
        name: "description",
        content:
          "Feed diário do copiloto de conformidade: tarefas do dia, teste biológico e avisos de vencimento de licenças e laudos.",
      },
      { property: "og:title", content: "O que fazer hoje — Oxyvra Copiloto" },
      {
        property: "og:description",
        content: "Tarefas do dia, teste biológico e prazos de licenças em um único feed guiado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CentralDeTarefas,
});

const CORES = {
  CRITICO: "border-destructive/40 bg-destructive/5",
  ALERTA: "border-amber-500/40 bg-amber-500/5",
  INFO: "border-border bg-card",
} as const;

const ETIQUETA = {
  CRITICO: "bg-destructive text-destructive-foreground",
  ALERTA: "bg-amber-500 text-white",
  INFO: "bg-muted text-muted-foreground",
} as const;

function CentralDeTarefas() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [guiada, setGuiada] = useState<Tarefa | null>(null);
  const [salvando, setSalvando] = useState(false);

  const agenda = useQuery({ queryKey: ["copiloto-agenda"], queryFn: listarAgenda });
  const licencas = useQuery({ queryKey: ["copiloto-licencas"], queryFn: listarLicencas });
  const avisos = useQuery({ queryKey: ["copiloto-avisos"], queryFn: () => listarNotificacoes(15) });

  // Primeira visita: cria a rotina mínima da clínica.
  useEffect(() => {
    if (!org?.id || agenda.isLoading || (agenda.data?.length ?? 0) > 0) return;
    criarAgendaPadrao(org.id)
      .then(() => qc.invalidateQueries({ queryKey: ["copiloto-agenda"] }))
      .catch(() => undefined);
  }, [org?.id, agenda.isLoading, agenda.data, qc]);

  const tarefas = useMemo(
    () => tarefasDeHoje(agenda.data ?? [], licencas.data ?? []),
    [agenda.data, licencas.data],
  );
  const pendentes = tarefas.filter((t) => !t.feita);
  const naoLidos = (avisos.data ?? []).filter((n) => !n.read_at);

  async function ativarAvisos() {
    if (typeof Notification === "undefined") {
      toast.error("Este aparelho não permite avisos na tela.");
      return;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      new Notification("Oxyvra Copiloto", {
        body: "Pronto! Você será avisado das tarefas e dos prazos.",
      });
      toast.success("Avisos ativados neste aparelho.");
    } else toast.error("Avisos bloqueados nas configurações do aparelho.");
  }

  async function concluir(t: Tarefa) {
    if (!t.agendamentoId) return;
    setSalvando(true);
    try {
      await concluirTarefa(t.agendamentoId);
      await qc.invalidateQueries({ queryKey: ["copiloto-agenda"] });
      toast.success("Tarefa registrada.");
      setGuiada(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="bg-primary px-4 py-6 text-primary-foreground">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-soft">
          Copiloto de conformidade
        </p>
        <h1 className="mt-1 text-2xl font-black">O que fazer hoje</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">
          {pendentes.length
            ? `${pendentes.length} tarefa(s) aguardando registro.`
            : "Tudo registrado por aqui. Bom trabalho!"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={ativarAvisos}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold"
          >
            <Bell className="h-4 w-4" /> Ativar avisos no celular
          </button>
          <Link
            to="/painel/conformidade"
            className="flex items-center gap-2 rounded-xl bg-teal px-3 py-2 text-sm font-bold text-teal-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Painel do gestor
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {agenda.isLoading || licencas.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando suas tarefas…</p>
        ) : (
          <ul className="space-y-3">
            {tarefas.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setGuiada(t)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${CORES[t.severidade]}`}
                >
                  <span className="mt-0.5">
                    {t.feita ? (
                      <CheckCircle2 className="h-5 w-5 text-teal" />
                    ) : t.severidade === "CRITICO" ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : (
                      <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-black ${ETIQUETA[t.severidade]}`}
                    >
                      {t.feita ? "Concluída hoje" : t.etiqueta}
                    </span>
                    <span className="mt-1 block text-base font-black text-foreground">
                      {t.titulo}
                    </span>
                    {t.descricao && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {t.descricao}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" />
                </button>
              </li>
            ))}
            {!tarefas.length && (
              <li className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Nenhuma tarefa programada para hoje.
              </li>
            )}
          </ul>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">
            Avisos recebidos {naoLidos.length ? `(${naoLidos.length} novos)` : ""}
          </h2>
          <ul className="mt-3 space-y-2">
            {(avisos.data ?? []).map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border p-3 text-sm ${n.read_at ? "border-border bg-card" : "border-teal/40 bg-teal/5"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-foreground">{n.title}</strong>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">
                    {n.channel === "WHATSAPP" ? "WhatsApp" : n.channel === "EMAIL" ? "E-mail" : "Celular"}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{n.message}</p>
                {!n.read_at && (
                  <button
                    onClick={async () => {
                      await marcarNotificacaoLida(n.id);
                      qc.invalidateQueries({ queryKey: ["copiloto-avisos"] });
                    }}
                    className="mt-2 text-xs font-bold text-teal"
                  >
                    Marcar como lido
                  </button>
                )}
              </li>
            ))}
            {!(avisos.data ?? []).length && (
              <li className="text-sm text-muted-foreground">Nenhum aviso por enquanto.</li>
            )}
          </ul>
        </section>
      </main>

      {guiada && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 sm:mx-auto sm:max-w-md sm:rounded-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-teal">Modo guiado</p>
            <h3 className="mt-1 text-xl font-black text-foreground">{guiada.titulo}</h3>
            <ol className="mt-4 space-y-3">
              {guiaDe(guiada.taskType).passos.map((p, i) => (
                <li key={p} className="flex gap-3 text-sm text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  const destino = guiaDe(guiada.taskType).destino;
                  setGuiada(null);
                  navigate({ to: destino });
                }}
                className="w-full rounded-xl bg-teal px-4 py-3 text-sm font-black text-teal-foreground"
              >
                {guiaDe(guiada.taskType).rotuloBotao}
              </button>
              {guiada.agendamentoId && !guiada.feita && (
                <button
                  disabled={salvando}
                  onClick={() => concluir(guiada)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground"
                >
                  {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Já fiz esta tarefa
                </button>
              )}
              <button
                onClick={() => setGuiada(null)}
                className="w-full py-2 text-sm font-bold text-muted-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
