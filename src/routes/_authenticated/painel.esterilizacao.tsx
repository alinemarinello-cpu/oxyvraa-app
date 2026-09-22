import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, CheckCircle2, ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  ROTULO_LOTE,
  atualizarCiclo,
  enviarArquivo,
  listarCiclos,
  registrarCiclo,
  situacaoLote,
  urlAssinada,
  type EntradaCiclo,
} from "@/lib/biosseguranca-db";
import { listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/esterilizacao")({
  head: () => ({
    meta: [
      { title: "Ciclos de autoclave e CME — Oxyvra" },
      {
        name: "description",
        content:
          "Registro de ciclos de autoclave com indicadores físico, químico integrador e biológico, foto da fita e liberação de lote.",
      },
      { property: "og:title", content: "Ciclos de autoclave e CME — Oxyvra" },
      {
        property: "og:description",
        content: "Rastreabilidade de esterilização conforme RDC 15/2012.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EsterilizacaoPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

const agora = () => new Date().toISOString().slice(0, 16);

const NOVO: EntradaCiclo = {
  unit_id: "",
  equipamento: "",
  lote: "",
  ciclo: "",
  iniciado_em: agora(),
  finalizado_em: null,
  temperatura: 134,
  tempo_exposicao_min: 20,
  indicador_fisico: false,
  indicador_quimico: false,
  indicador_biologico: "nao_aplicavel",
  foto_integrador: null,
  operador_nome: "",
  operador_pin: "",
  observacoes: "",
};

function Selo({ status }: { status: string }) {
  const cor =
    status === "liberado"
      ? "bg-teal text-teal-foreground"
      : status === "reprovado"
        ? "bg-destructive text-destructive-foreground"
        : "bg-amber-500 text-white";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${cor}`}>
      {status === "liberado" ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : status === "reprovado" ? (
        <ShieldAlert className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {ROTULO_LOTE[status] ?? status}
    </span>
  );
}

function EsterilizacaoPage() {
  const { data: org } = useOrganizacao();
  const ciclos = useQuery({ queryKey: ["ciclos"], queryFn: () => listarCiclos(60) });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });
  const [form, setForm] = useState<EntradaCiclo>({ ...NOVO });

  const previsao = situacaoLote(form);

  const anexar = async (file: File, cicloId?: string) => {
    try {
      const caminho = await enviarArquivo("integradores", file);
      if (cicloId) {
        await atualizarCiclo(cicloId, { foto_integrador: caminho });
        void ciclos.refetch();
      } else {
        setForm((f) => ({ ...f, foto_integrador: caminho }));
      }
      toast.success("Foto da fita integradora anexada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar foto.");
    }
  };

  const gravar = async () => {
    if (!org) return;
    if (!form.unit_id) return toast.error("Escolha a unidade.");
    if (!form.lote.trim()) return toast.error("Informe o número do lote/ciclo.");
    if (!form.operador_nome.trim() || !form.operador_pin?.trim())
      return toast.error("Informe nome e PIN do operador responsável.");
    try {
      const status = await registrarCiclo(org.id, {
        ...form,
        iniciado_em: new Date(form.iniciado_em).toISOString(),
        finalizado_em: form.finalizado_em ? new Date(form.finalizado_em).toISOString() : null,
      });
      setForm({ ...NOVO, unit_id: form.unit_id, equipamento: form.equipamento });
      void ciclos.refetch();
      toast.success(`Ciclo registrado — ${ROTULO_LOTE[status]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar ciclo.");
    }
  };

  const abrirFoto = async (caminho: string) => {
    const url = await urlAssinada(caminho);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-black text-foreground">Central de Material e Esterilização</h2>
        <p className="text-sm text-muted-foreground">
          Registro rápido de ciclos da autoclave. O lote só recebe o selo <b>Apto para uso</b> com
          a foto da fita integradora anexada e os indicadores aprovados (RDC 15/2012).
        </p>
      </header>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className={rotulo}>Unidade</span>
            <select
              className={campo}
              value={form.unit_id}
              onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
            >
              <option value="">Selecione…</option>
              {(unidades.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Autoclave / equipamento</span>
            <input
              className={campo}
              value={form.equipamento}
              onChange={(e) => setForm({ ...form, equipamento: e.target.value })}
              placeholder="Ex.: Autoclave 21L — sala 2"
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Nº do lote</span>
            <input
              className={campo}
              value={form.lote}
              onChange={(e) => setForm({ ...form, lote: e.target.value })}
              placeholder="2026-08-27-01"
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Ciclo</span>
            <input
              className={campo}
              value={form.ciclo}
              onChange={(e) => setForm({ ...form, ciclo: e.target.value })}
              placeholder="1º do dia"
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Início</span>
            <input
              type="datetime-local"
              className={campo}
              value={form.iniciado_em}
              onChange={(e) => setForm({ ...form, iniciado_em: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Término</span>
            <input
              type="datetime-local"
              className={campo}
              value={form.finalizado_em ?? ""}
              onChange={(e) => setForm({ ...form, finalizado_em: e.target.value || null })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Temperatura (°C)</span>
            <input
              type="number"
              inputMode="decimal"
              className={campo}
              value={form.temperatura ?? ""}
              onChange={(e) =>
                setForm({ ...form, temperatura: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Tempo de exposição (min)</span>
            <input
              type="number"
              inputMode="numeric"
              className={campo}
              value={form.tempo_exposicao_min ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  tempo_exposicao_min: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Teste biológico</span>
            <select
              className={campo}
              value={form.indicador_biologico}
              onChange={(e) => setForm({ ...form, indicador_biologico: e.target.value })}
            >
              <option value="nao_aplicavel">Não aplicável hoje</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Operador responsável</span>
            <input
              className={campo}
              value={form.operador_nome}
              onChange={(e) => setForm({ ...form, operador_nome: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>PIN do operador</span>
            <input
              type="password"
              inputMode="numeric"
              className={campo}
              value={form.operador_pin ?? ""}
              onChange={(e) => setForm({ ...form, operador_pin: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Foto da fita integradora</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className={campo + " py-2"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void anexar(f);
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.indicador_fisico}
              onChange={(e) => setForm({ ...form, indicador_fisico: e.target.checked })}
            />
            Indicador físico aprovado
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.indicador_quimico}
              onChange={(e) => setForm({ ...form, indicador_quimico: e.target.checked })}
            />
            Integrador químico Classe 5/6 aprovado
          </label>
          <Selo status={previsao} />
        </div>

        <textarea
          className="w-full rounded-xl border border-border bg-background p-3 text-sm"
          rows={2}
          placeholder="Observações do ciclo"
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        />

        <button
          onClick={() => void gravar()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
        >
          <CheckCircle2 className="h-4 w-4" /> Registrar ciclo
        </button>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-foreground">Últimos ciclos</h3>
        {(ciclos.data ?? []).map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div>
              <p className="font-black text-foreground">
                Lote {c.lote} {c.ciclo && `· ${c.ciclo}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.iniciado_em).toLocaleString("pt-BR")} ·{" "}
                {c.equipamento || "Autoclave"} · {c.operador_nome || "—"} ·{" "}
                {c.temperatura ?? "—"} °C / {c.tempo_exposicao_min ?? "—"} min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Selo status={c.status} />
              {c.foto_integrador ? (
                <button
                  onClick={() => void abrirFoto(c.foto_integrador!)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  <Camera className="h-3.5 w-3.5" /> Ver fita
                </button>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-amber-500/50 px-3 py-2 text-xs font-bold text-amber-600">
                  <Camera className="h-3.5 w-3.5" /> Anexar fita
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void anexar(f, c.id);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
        {!ciclos.isLoading && !(ciclos.data ?? []).length && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum ciclo registrado nos últimos 60 dias.
          </p>
        )}
      </section>
    </div>
  );
}
