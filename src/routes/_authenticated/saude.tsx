import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  CloudOff,
  Loader2,
  QrCode,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import { QrScanner } from "@/components/QrScanner";
import {
  AVISO_LGPD,
  CICLO_VAZIO,
  ROTULO_FREQUENCIA,
  ZONAS,
  buscarCheckpointPorCodigo,
  codigoDoQr,
  enviarFotoCarimbada,
  listarCheckpoints,
  obterPerfil,
  pendenciasCiclo,
  posicaoAtual,
  registrarCicloAutoclave,
  type EntradaCicloAutoclave,
  type Frequency,
  type QrCheckpoint,
  type ZoneType,
} from "@/lib/saude-conformidade-db";
import {
  contarPendentesSaude,
  reenviarPendentesSaude,
  salvarChecklistComFila,
} from "@/lib/saude-conformidade-fila";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/saude")({
  validateSearch: (search: Record<string, unknown>): { c?: string } =>
    typeof search["c"] === "string" ? { c: search["c"] as string } : {},

  head: () => ({
    meta: [
      { title: "Rotina sanitária da clínica — Oxyvra" },
      {
        name: "description",
        content:
          "Leia o QR Code da estação, cumpra o checklist com foto carimbada e registre os ciclos da autoclave, mesmo sem internet.",
      },
      { property: "og:title", content: "Rotina sanitária da clínica — Oxyvra" },
      {
        property: "og:description",
        content: "Execução de campo do módulo Conformidade Saúde e Estética.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OperadorSaude,
});

const campo = "h-12 w-full rounded-xl border border-border bg-background px-3 text-base";
const rotulo = "text-xs font-bold text-muted-foreground";

function OperadorSaude() {
  const { c } = Route.useSearch();
  const { data: org } = useOrganizacao();
  const perfil = useQuery({ queryKey: ["perfil-saude"], queryFn: obterPerfil });
  const checkpoints = useQuery({ queryKey: ["checkpoints"], queryFn: () => listarCheckpoints() });

  const [aba, setAba] = useState<"estacoes" | "autoclave">("estacoes");
  const [scanner, setScanner] = useState(false);
  const [estacao, setEstacao] = useState<QrCheckpoint | null>(null);
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    setPendentes(contarPendentesSaude());
    void reenviarPendentesSaude().then(() => setPendentes(contarPendentesSaude()));
  }, []);

  useEffect(() => {
    if (!c) return;
    void buscarCheckpointPorCodigo(codigoDoQr(c)).then((cp) => {
      if (cp) setEstacao(cp);
      else toast.error("QR Code não reconhecido nesta clínica.");
    });
  }, [c]);

  const aoLerQr = (raw: string) => {
    setScanner(false);
    void buscarCheckpointPorCodigo(codigoDoQr(raw)).then((cp) => {
      if (cp) setEstacao(cp);
      else toast.error("QR Code não reconhecido nesta clínica.");
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      {scanner && <QrScanner onDetected={aoLerQr} onClose={() => setScanner(false)} />}

      <header className="bg-navy px-4 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Oxyvra Conformidade</p>
        <h1 className="text-lg font-black">{perfil.data?.clinic_name ?? "Sua clínica"}</h1>
        {pendentes > 0 && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            <CloudOff className="h-3.5 w-3.5" /> {pendentes} registro(s) guardado(s) no aparelho
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 p-3">
        {(["estacoes", "autoclave"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-2xl px-3 py-3 text-sm font-black ${
              aba === a ? "bg-teal text-teal-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {a === "estacoes" ? "Estações e checklists" : "Ciclo da autoclave"}
          </button>
        ))}
      </div>

      {aba === "estacoes" ? (
        estacao ? (
          <ChecklistEstacao
            estacao={estacao}
            organizacaoId={org?.id ?? ""}
            aoSair={() => {
              setEstacao(null);
              setPendentes(contarPendentesSaude());
            }}
          />
        ) : (
          <div className="space-y-3 px-4">
            <button
              onClick={() => setScanner(true)}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-navy px-4 py-8 text-lg font-black text-white"
            >
              <QrCode className="h-7 w-7 text-gold" /> Ler QR da estação
            </button>
            <p className={rotulo}>Ou toque na estação:</p>
            <div className="grid grid-cols-2 gap-3">
              {(checkpoints.data ?? []).map((cp) => {
                const meta = ZONAS[cp.zone_type as ZoneType];
                return (
                  <button
                    key={cp.id}
                    onClick={() => setEstacao(cp)}
                    className="rounded-3xl border border-border bg-card p-4 text-left"
                  >
                    <span className="text-3xl">{meta?.emoji}</span>
                    <p className="mt-2 text-sm font-black leading-tight text-foreground">
                      {cp.custom_name || cp.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {meta?.produto}
                    </p>
                  </button>
                );
              })}
            </div>
            {checkpoints.isFetched && !(checkpoints.data ?? []).length && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhuma estação configurada. Peça ao gestor para concluir a configuração da clínica.
              </p>
            )}
          </div>
        )
      ) : (
        <FormularioAutoclave organizacaoId={org?.id ?? ""} perfilId={perfil.data?.id ?? null} />
      )}

      <p className="px-4 pt-6 text-[11px] text-muted-foreground">{AVISO_LGPD}</p>
    </div>
  );
}

/* ------------------------------- checklist ------------------------------- */

function ChecklistEstacao({
  estacao,
  organizacaoId,
  aoSair,
}: {
  estacao: QrCheckpoint;
  organizacaoId: string;
  aoSair: () => void;
}) {
  const meta = ZONAS[estacao.zone_type as ZoneType];
  const [frequencia, setFrequencia] = useState<Frequency>(meta.frequencias[0] as Frequency);
  const itens = useMemo(() => meta.itens[frequencia] ?? [], [meta, frequencia]);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [operador, setOperador] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [restante, setRestante] = useState(meta.dwellSegundos);

  useEffect(() => {
    setMarcados({});
    setRestante(meta.dwellSegundos);
  }, [frequencia, meta.dwellSegundos]);

  useEffect(() => {
    if (restante <= 0) return;
    const t = window.setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(t);
  }, [restante]);

  const anexar = async (file: File) => {
    try {
      const pos = await posicaoAtual();
      const caminho = await enviarFotoCarimbada(file, {
        unidade: estacao.custom_name || estacao.name,
        local: meta.label,
        lat: pos.lat,
        lng: pos.lng,
      });
      setFotos((f) => [...f, caminho]);
      toast.success("Foto anexada com data, hora e GPS.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar foto.");
    }
  };

  const todosOk = itens.length > 0 && itens.every((i) => marcados[i]);
  const travado = restante > 0;

  const concluir = async () => {
    if (!organizacaoId) return;
    if (!operador.trim()) return toast.error("Informe seu nome.");
    if (!todosOk) return toast.error("Marque todos os itens do checklist.");
    if (!fotos.length) return toast.error("Anexe ao menos uma foto de evidência.");
    setEnviando(true);
    try {
      const pos = await posicaoAtual();
      const destino = await salvarChecklistComFila({
        organizacao_id: organizacaoId,
        checkpoint_id: estacao.id,
        frequency: frequencia,
        operator_name: operador.trim(),
        data_json: Object.fromEntries(itens.map((i) => [i, true])),
        photo_urls: fotos,
        lat: pos.lat,
        lng: pos.lng,
        timestamp_gps: new Date().toISOString(),
      });
      toast.success(
        destino === "nuvem" ? "Checklist registrado." : "Sem internet: guardado e enviaremos depois.",
      );
      aoSair();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar.");
    } finally {
      setEnviando(false);
    }
  };

  const mmss = `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4 px-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-3xl">{meta.emoji}</p>
        <h2 className="text-lg font-black text-foreground">{estacao.custom_name || estacao.name}</h2>
        <p className="text-sm text-muted-foreground">
          Produto obrigatório: <b>{meta.produto}</b>
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {meta.frequencias.map((f) => (
          <button
            key={f}
            onClick={() => setFrequencia(f)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
              frequencia === f ? "bg-navy text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {ROTULO_FREQUENCIA[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {itens.map((i) => (
          <button
            key={i}
            onClick={() => setMarcados((m) => ({ ...m, [i]: !m[i] }))}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-bold ${
              marcados[i] ? "border-teal bg-teal/10 text-foreground" : "border-border bg-card"
            }`}
          >
            <CheckCircle2 className={`h-6 w-6 shrink-0 ${marcados[i] ? "text-teal" : "text-muted-foreground"}`} />
            {i}
          </button>
        ))}
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-5 text-sm font-black text-foreground">
        <Camera className="h-5 w-5" /> Tirar foto de evidência ({fotos.length})
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void anexar(f);
          }}
        />
      </label>

      <label className="space-y-1 block">
        <span className={rotulo}>Seu nome</span>
        <input className={campo} value={operador} onChange={(e) => setOperador(e.target.value)} />
      </label>

      {travado && (
        <p className="rounded-2xl bg-amber-500/15 p-4 text-center text-sm font-black text-amber-700">
          Aguarde o tempo de contato do produto: {mmss}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={aoSair} className="rounded-2xl border border-border px-4 py-4 text-sm font-bold">
          Voltar
        </button>
        <button
          onClick={() => void concluir()}
          disabled={enviando || travado}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-base font-black text-teal-foreground disabled:opacity-50"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          Concluir checklist
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- autoclave ------------------------------- */

function FormularioAutoclave({
  organizacaoId,
  perfilId,
}: {
  organizacaoId: string;
  perfilId: string | null;
}) {
  const perfil = useQuery({ queryKey: ["perfil-saude"], queryFn: obterPerfil });
  const [form, setForm] = useState<EntradaCicloAutoclave>({ ...CICLO_VAZIO });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const p = perfil.data;
    if (!p) return;
    setForm((f) => ({
      ...f,
      equipment_serial: f.equipment_serial || p.autoclave_serial,
      equipment_brand_model: f.equipment_brand_model || p.autoclave_brand_model,
      cycle_date_time: f.cycle_date_time || new Date().toISOString().slice(0, 16),
    }));
  }, [perfil.data]);

  const faltas = pendenciasCiclo(form);

  const anexar = async (file: File, alvo: "integrador" | "painel") => {
    try {
      const pos = await posicaoAtual();
      const caminho = await enviarFotoCarimbada(file, {
        unidade: perfil.data?.clinic_name ?? "Clínica",
        local: alvo === "integrador" ? "Integrador químico" : "Painel da autoclave",
        lat: pos.lat,
        lng: pos.lng,
      });
      setForm((f) =>
        alvo === "integrador"
          ? { ...f, photo_integrator_url: caminho }
          : { ...f, photo_panel_url: caminho },
      );
      toast.success("Foto anexada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar foto.");
    }
  };

  const gravar = async () => {
    if (!organizacaoId) return;
    setEnviando(true);
    try {
      const status = await registrarCicloAutoclave(organizacaoId, perfilId, form);
      toast.success(
        status === "APROVADO"
          ? "Ciclo registrado e lote liberado."
          : "Ciclo reprovado registrado — lote bloqueado para uso.",
      );
      setForm({
        ...CICLO_VAZIO,
        equipment_serial: form.equipment_serial,
        equipment_brand_model: form.equipment_brand_model,
        operator_name: form.operator_name,
        cycle_date_time: new Date().toISOString().slice(0, 16),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar ciclo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3 px-4">
      <div className="rounded-2xl bg-muted p-4 text-xs text-muted-foreground">
        <b className="text-foreground">RDC 1.002/2025</b> — o registro só é salvo com os 7 campos
        obrigatórios preenchidos e a foto do integrador químico anexada.
      </div>

      <div className="grid gap-3">
        <label className="space-y-1">
          <span className={rotulo}>Data e hora do ciclo</span>
          <input
            type="datetime-local"
            className={campo}
            value={form.cycle_date_time}
            onChange={(e) => setForm({ ...form, cycle_date_time: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className={rotulo}>Número do lote</span>
          <input
            className={campo}
            value={form.batch_number}
            onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className={rotulo}>Equipamento (série)</span>
            <input
              className={campo}
              value={form.equipment_serial}
              onChange={(e) => setForm({ ...form, equipment_serial: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Marca / modelo</span>
            <input
              className={campo}
              value={form.equipment_brand_model}
              onChange={(e) => setForm({ ...form, equipment_brand_model: e.target.value })}
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className={rotulo}>Tempo (min)</span>
            <input
              type="number"
              inputMode="decimal"
              className={campo}
              value={form.time_minutes ?? ""}
              onChange={(e) =>
                setForm({ ...form, time_minutes: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Temp. (°C)</span>
            <input
              type="number"
              inputMode="decimal"
              className={campo}
              value={form.temp_celsius ?? ""}
              onChange={(e) =>
                setForm({ ...form, temp_celsius: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Pressão (bar)</span>
            <input
              type="number"
              inputMode="decimal"
              className={campo}
              value={form.pressure_bar ?? ""}
              onChange={(e) =>
                setForm({ ...form, pressure_bar: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
        </div>
        <label className="space-y-1">
          <span className={rotulo}>Indicador químico (Tipo 5/6)</span>
          <select
            className={campo}
            value={form.chemical_indicator_result}
            onChange={(e) =>
              setForm({
                ...form,
                chemical_indicator_result: e.target.value as EntradaCicloAutoclave["chemical_indicator_result"],
              })
            }
          >
            <option value="">Selecione…</option>
            <option value="APROVADO">Aprovado</option>
            <option value="REPROVADO">Reprovado</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className={rotulo}>Relação de pacotes do lote</span>
          <textarea
            className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            rows={3}
            placeholder="Ex.: 3 caixas de exame clínico, 2 kits de periodontia, 1 kit cirúrgico"
            value={form.packages_list}
            onChange={(e) => setForm({ ...form, packages_list: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className={rotulo}>Operador responsável</span>
          <input
            className={campo}
            value={form.operator_name}
            onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border p-4 text-center text-xs font-black">
            <Camera className="h-5 w-5" />
            {form.photo_integrator_url ? "Integrador anexado ✓" : "Foto do integrador (obrigatória)"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void anexar(f, "integrador");
              }}
            />
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border p-4 text-center text-xs font-black">
            <Thermometer className="h-5 w-5" />
            {form.photo_panel_url ? "Painel anexado ✓" : "Foto do painel (obrigatória)"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void anexar(f, "painel");
              }}
            />
          </label>
        </div>

        {form.chemical_indicator_result === "REPROVADO" && (
          <label className="space-y-1">
            <span className={rotulo}>Ação corretiva (obrigatória — lote bloqueado)</span>
            <textarea
              className="w-full rounded-xl border border-destructive/40 bg-background p-3 text-sm"
              rows={3}
              value={form.corrective_action_log}
              onChange={(e) => setForm({ ...form, corrective_action_log: e.target.value })}
            />
          </label>
        )}
      </div>

      {faltas.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs font-bold text-amber-700">
          <p className="mb-1 flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" /> Faltam para salvar:
          </p>
          <ul className="list-disc pl-5">
            {faltas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => void gravar()}
        disabled={faltas.length > 0 || enviando}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-base font-black text-teal-foreground disabled:opacity-50"
      >
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        Salvar ciclo
      </button>
    </div>
  );
}
