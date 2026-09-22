import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  FileText,
  Loader2,
  QrCode,
  RotateCcw,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAssinatura } from "@/hooks/useAssinatura";
import {
  AVISO_LEGAL,
  CORES_SEMAFORO,
  ROTULO_FREQUENCIA,
  TIPOS_LICENCA,
  ZONAS,
  estornarCiclo,
  listarCheckpoints,
  listarChecklists,
  listarCiclosAutoclave,
  listarDocumentosPasta,
  listarTestesBiologicos,
  loteLiberado,
  obterPerfil,
  enviarFotoCarimbada,
  posicaoAtual,
  registrarTesteBiologico,
  resumirConformidade,
  situacaoLicenca,
  type AutoclaveCycle,
  type Frequency,
  type ZoneType,
} from "@/lib/saude-conformidade-db";
import { generateVigilanciaDossierPDF } from "@/lib/dossie-vigilancia";
import { PrazosLicencas } from "@/components/saude/PrazosLicencas";
import { useOrganizacao } from "./painel";


export const Route = createFileRoute("/_authenticated/painel/conformidade")({
  head: () => ({
    meta: [
      { title: "Conformidade Saúde e Estética — Oxyvra" },
      {
        name: "description",
        content:
          "Semáforo sanitário da clínica, calendário de testes biológicos, ciclos de autoclave e geração da Pasta da Vigilância em PDF.",
      },
      { property: "og:title", content: "Conformidade Saúde e Estética — Oxyvra" },
      {
        property: "og:description",
        content: "Painel de conformidade para consultórios odontológicos e clínicas de estética.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelConformidade,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

const hojeIso = () => new Date().toISOString().slice(0, 10);
const trintaDiasAtras = () => new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

function PainelConformidade() {
  const { data: org } = useOrganizacao();
  const { marcaDagua } = useAssinatura();
  const perfil = useQuery({ queryKey: ["perfil-saude"], queryFn: obterPerfil });
  const checkpoints = useQuery({ queryKey: ["checkpoints"], queryFn: () => listarCheckpoints() });
  const logs = useQuery({ queryKey: ["checklist-logs"], queryFn: () => listarChecklists(30) });
  const ciclos = useQuery({ queryKey: ["ciclos-autoclave"], queryFn: () => listarCiclosAutoclave(90) });
  const testes = useQuery({ queryKey: ["testes-biologicos"], queryFn: () => listarTestesBiologicos(8) });
  const documentos = useQuery({ queryKey: ["documentos-pasta"], queryFn: listarDocumentosPasta });

  const [inicio, setInicio] = useState(trintaDiasAtras());
  const [fim, setFim] = useState(hojeIso());
  const [gerando, setGerando] = useState(false);
  const [teste, setTeste] = useState({
    test_date: hojeIso(),
    indicator_batch_number: "",
    result: "NEGATIVO" as "NEGATIVO" | "POSITIVO",
    operator_name: "",
    autoclave_cycle_id: "",
    photo_vial_url: null as string | null,
    corrective_action_log: "",
  });

  const anexos = (documentos.data ?? []).filter((d) => d.kind === "ANEXO");
  const resumo = resumirConformidade(logs.data ?? [], ciclos.data ?? [], testes.data ?? [], anexos);
  const plano = marcaDagua ? "TRIAL_14" : "BLINDADO";
  const estornos = (ciclos.data ?? []).filter((c) => c.reversal_of_id);

  const gerarDossie = async () => {
    if (!org) return;
    setGerando(true);
    try {
      await generateVigilanciaDossierPDF(org.id, { start: inicio, end: fim }, plano);
      toast.success("Pasta da Vigilância gerada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o documento.");
    } finally {
      setGerando(false);
    }
  };

  const anexarAmpola = async (file: File) => {
    try {
      const pos = await posicaoAtual();
      const caminho = await enviarFotoCarimbada(file, {
        unidade: perfil.data?.clinic_name ?? "Clínica",
        local: "Ampola do teste biológico",
        lat: pos.lat,
        lng: pos.lng,
      });
      setTeste((t) => ({ ...t, photo_vial_url: caminho }));
      toast.success("Foto da ampola anexada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    }
  };

  const salvarTeste = async () => {
    if (!org) return;
    try {
      await registrarTesteBiologico(org.id, {
        autoclave_cycle_id: teste.autoclave_cycle_id || null,
        test_date: teste.test_date,
        indicator_batch_number: teste.indicator_batch_number,
        result: teste.result,
        photo_vial_url: teste.photo_vial_url,
        operator_name: teste.operator_name,
        corrective_action_log: teste.corrective_action_log,
      });
      setTeste({
        ...teste,
        indicator_batch_number: "",
        photo_vial_url: null,
        corrective_action_log: "",
        result: "NEGATIVO",
      });
      void testes.refetch();
      void ciclos.refetch();
      toast.success(
        teste.result === "POSITIVO"
          ? "Resultado positivo registrado — lote bloqueado e aviso enviado ao responsável."
          : "Teste biológico registrado.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar teste.");
    }
  };

  const estornar = async (c: AutoclaveCycle) => {
    if (!org) return;
    const motivo = window.prompt(
      "Justifique o estorno deste registro (obrigatório, mínimo 15 caracteres):",
    );
    if (!motivo) return;
    try {
      await estornarCiclo(org.id, c, motivo);
      void ciclos.refetch();
      toast.success("Estorno registrado. O lançamento original permanece no histórico.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao estornar.");
    }
  };

  const semaforo = CORES_SEMAFORO[resumo.semaforo];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Conformidade — Saúde e Estética</h2>
          <p className="text-sm text-muted-foreground">
            {perfil.data?.clinic_name ?? "Clínica não configurada"}
            {perfil.data ? ` · RT ${perfil.data.rt_name} (${perfil.data.rt_council} ${perfil.data.rt_number})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/hoje"
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
          >
            <CalendarCheck className="h-4 w-4" /> O que fazer hoje
          </Link>

          <Link
            to="/onboarding/health"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            <Settings2 className="h-4 w-4" /> Configuração e QR Codes
          </Link>
          <Link
            to="/saude"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-black text-white"
          >
            <QrCode className="h-4 w-4" /> App da equipe
          </Link>
        </div>
      </header>

      {!perfil.data && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <p className="text-sm font-bold text-amber-700">
            Configure a clínica em 4 passos para liberar checklists, autoclave e a Pasta da
            Vigilância.
          </p>
          <Link
            to="/onboarding/health"
            className="mt-3 inline-flex rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
          >
            Começar configuração
          </Link>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className={rotulo}>Situação geral</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${semaforo.classe}`}>
            {semaforo.label}
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className={rotulo}>Checklists hoje</p>
          <p className="text-2xl font-black text-foreground">{resumo.checklistsHoje}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className={rotulo}>Ciclos (90 dias)</p>
          <p className="text-2xl font-black text-foreground">{resumo.ciclosPeriodo}</p>
          <p className="text-xs text-muted-foreground">{resumo.ciclosReprovados} reprovado(s)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className={rotulo}>Último biológico</p>
          <p className="text-2xl font-black text-foreground">
            {resumo.diasSemBiologico === null ? "—" : `${resumo.diasSemBiologico} d`}
          </p>
          <p className={`text-xs font-bold ${resumo.biologicoAtrasado ? "text-destructive" : "text-muted-foreground"}`}>
            {resumo.biologicoAtrasado ? "Atrasado (semanal)" : "Dentro do prazo"}
          </p>
        </div>
      </section>

      {resumo.alertas.length > 0 && (
        <section className="rounded-2xl border border-destructive/30 bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Pendências ativas
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {resumo.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-black text-foreground">Pasta da Vigilância</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Compila POPs, checklists com fotos e GPS, ciclos de autoclave, testes biológicos e
          pendências do período escolhido.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className={rotulo}>Início</span>
            <input type="date" className={campo} value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Fim</span>
            <input type="date" className={campo} value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
          <button
            onClick={() => void gerarDossie()}
            disabled={gerando}
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Gerar Pasta da Vigilância (PDF)
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {plano === "TRIAL_14"
            ? "No período de teste o PDF sai com marca d'água “TESTE — SEM VALIDADE SANITÁRIA”."
            : "O PDF sai com QR Code de conferência pública do código de autenticidade."}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-foreground">Licenças e anexos obrigatórios</h3>
          <Link
            to="/painel/pastas"
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
          >
            Enviar documento
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {TIPOS_LICENCA.map((t) => {
            const doc = anexos
              .filter((a) => a.title.toUpperCase().includes(t.label.toUpperCase().slice(0, 8)))
              .at(0);
            const s = situacaoLicenca(doc?.valid_until ?? null);
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                <span className="font-bold text-foreground">{t.label}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    doc ? s.classe : "bg-muted text-muted-foreground"
                  }`}
                >
                  {doc ? s.label : "Não enviado"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Documentos vencidos deixam o semáforo em crítico e aparecem na Seção G da Pasta da
          Vigilância.
        </p>
      </section>



      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
          <CalendarCheck className="h-4 w-4" /> Calendário de testes biológicos (8 semanas)
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <label className="space-y-1">
            <span className={rotulo}>Data</span>
            <input
              type="date"
              className={campo}
              value={teste.test_date}
              onChange={(e) => setTeste({ ...teste, test_date: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Lote do indicador</span>
            <input
              className={campo}
              value={teste.indicator_batch_number}
              onChange={(e) => setTeste({ ...teste, indicator_batch_number: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Resultado</span>
            <select
              className={campo}
              value={teste.result}
              onChange={(e) => setTeste({ ...teste, result: e.target.value as "NEGATIVO" | "POSITIVO" })}
            >
              <option value="NEGATIVO">Negativo (esterilização eficaz)</option>
              <option value="POSITIVO">Positivo (interditar equipamento)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Ciclo vinculado</span>
            <select
              className={campo}
              value={teste.autoclave_cycle_id}
              onChange={(e) => setTeste({ ...teste, autoclave_cycle_id: e.target.value })}
            >
              <option value="">Sem vínculo</option>
              {(ciclos.data ?? []).slice(0, 30).map((c) => (
                <option key={c.id} value={c.id}>
                  Lote {c.batch_number} — {new Date(c.cycle_date_time).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={rotulo}>Operador</span>
            <input
              className={campo}
              value={teste.operator_name}
              onChange={(e) => setTeste({ ...teste, operator_name: e.target.value })}
            />
          </label>
        </div>

        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-bold text-foreground">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void anexarAmpola(f);
            }}
          />
          {teste.photo_vial_url
            ? "Foto da ampola anexada ✓"
            : "Foto da ampola com o resultado (obrigatória)"}
        </label>

        {teste.result === "POSITIVO" && (
          <label className="mt-3 block space-y-1">
            <span className={rotulo}>Ação corretiva (obrigatória)</span>
            <textarea
              rows={3}
              className={campo}
              placeholder="Ex.: autoclave retirada de uso, chamado de manutenção aberto, cargas reprocessadas na autoclave 02."
              value={teste.corrective_action_log}
              onChange={(e) => setTeste({ ...teste, corrective_action_log: e.target.value })}
            />
          </label>
        )}

        <button
          onClick={() => void salvarTeste()}
          className="mt-3 rounded-xl bg-navy px-4 py-2 text-sm font-black text-white"
        >
          Registrar teste biológico
        </button>

        <div className="mt-4 space-y-2">
          {(testes.data ?? []).map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
            >
              <span className="font-bold text-foreground">
                {new Date(`${t.test_date}T12:00:00`).toLocaleDateString("pt-BR")} · lote{" "}
                {t.indicator_batch_number}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  t.result === "NEGATIVO"
                    ? "bg-teal text-teal-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {t.result}
              </span>
            </div>
          ))}
          {!(testes.data ?? []).length && (
            <p className="text-sm text-muted-foreground">Nenhum teste biológico registrado ainda.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-foreground">Ciclos de autoclave (90 dias)</h3>
        {(ciclos.data ?? [])
          .filter((c) => !c.reversal_of_id)
          .map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-black text-foreground">
                  Lote {c.batch_number} · {new Date(c.cycle_date_time).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.equipment_brand_model} ({c.equipment_serial}) · {c.time_minutes} min /{" "}
                  {c.temp_celsius} °C / {c.pressure_bar} bar · {c.operator_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    loteLiberado(c, estornos)
                      ? "bg-teal text-teal-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {loteLiberado(c, estornos) ? "Lote liberado" : "Lote bloqueado"}
                </span>
                <button
                  onClick={() => void estornar(c)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Estornar
                </button>
              </div>
            </div>
          ))}
        {!(ciclos.data ?? []).length && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum ciclo registrado no período.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black text-foreground">Checklists dos últimos 30 dias</h3>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Data/hora</th>
                <th className="p-3">Estação</th>
                <th className="p-3">Frequência</th>
                <th className="p-3">Fotos</th>
                <th className="p-3">Operador</th>
              </tr>
            </thead>
            <tbody>
              {(logs.data ?? []).slice(0, 50).map((l) => {
                const cp = (checkpoints.data ?? []).find((x) => x.id === l.checkpoint_id);
                const meta = cp ? ZONAS[cp.zone_type as ZoneType] : undefined;
                return (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3">{new Date(l.timestamp_gps).toLocaleString("pt-BR")}</td>
                    <td className="p-3">
                      {meta?.emoji} {cp ? cp.custom_name || cp.name : "—"}
                      {l.reversal_of_id && (
                        <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          ESTORNO
                        </span>
                      )}
                    </td>
                    <td className="p-3">{ROTULO_FREQUENCIA[l.frequency as Frequency] ?? l.frequency}</td>
                    <td className="p-3">{(l.photo_urls ?? []).length}</td>
                    <td className="p-3">{l.operator_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!(logs.data ?? []).length && (
          <p className="text-sm text-muted-foreground">Nenhum checklist registrado nos últimos 30 dias.</p>
        )}
      </section>

      <PrazosLicencas organizacaoId={org?.id} />

      <p className="text-[11px] leading-relaxed text-muted-foreground">{AVISO_LEGAL}</p>

    </div>
  );
}
