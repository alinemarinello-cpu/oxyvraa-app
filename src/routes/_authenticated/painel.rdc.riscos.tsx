import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { listarRiscos, nivelCriticidade, salvarRisco } from "@/lib/rdc-db";
import { SeletorUnidade, useUnidadeRdc } from "@/components/rdc/RdcContexto";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/rdc/riscos")({
  component: MatrizRiscos,
});

const VAZIO = {
  risco: "",
  setor: "",
  probabilidade: 3,
  impacto: 3,
  responsavel: "",
  acao_preventiva: "",
  acao_corretiva: "",
  prazo: "",
  status: "ABERTO",
};

function MatrizRiscos() {
  const { data: org } = useOrganizacao();
  const { unitId, definirUnidade } = useUnidadeRdc();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...VAZIO });
  const [salvando, setSalvando] = useState(false);

  const { data: riscos } = useQuery({
    queryKey: ["rdc-riscos", unitId],
    queryFn: () => listarRiscos(unitId),
  });

  const adicionar = async () => {
    if (!org || !form.risco.trim()) {
      toast.error("Descreva o risco.");
      return;
    }
    setSalvando(true);
    try {
      await salvarRisco({
        organizacao_id: org.id,
        unit_id: unitId,
        risco: form.risco.trim(),
        setor: form.setor || null,
        probabilidade: form.probabilidade,
        impacto: form.impacto,
        responsavel: form.responsavel || null,
        acao_preventiva: form.acao_preventiva || null,
        acao_corretiva: form.acao_corretiva || null,
        prazo: form.prazo || null,
        status: form.status,
      });
      setForm({ ...VAZIO });
      void qc.invalidateQueries({ queryKey: ["rdc-riscos", unitId] });
      void qc.invalidateQueries({ queryKey: ["rdc-status", unitId] });
      toast.success("Risco registrado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o risco.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-lg font-black text-foreground">Gerenciamento de riscos</h2>
          <p className="text-sm text-muted-foreground">
            Probabilidade × impacto (1 a 5) define a criticidade e alimenta o painel.
          </p>
        </div>
        <SeletorUnidade unitId={unitId} onChange={definirUnidade} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <input
          value={form.risco}
          onChange={(e) => setForm({ ...form, risco: e.target.value })}
          placeholder="Risco identificado"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={form.setor}
          onChange={(e) => setForm({ ...form, setor: e.target.value })}
          placeholder="Setor (ex.: expurgo, recepção)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.responsavel}
          onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
          placeholder="Responsável"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="text-xs font-bold text-muted-foreground">
          Probabilidade: {form.probabilidade}
          <input
            type="range"
            min={1}
            max={5}
            value={form.probabilidade}
            onChange={(e) => setForm({ ...form, probabilidade: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Impacto: {form.impacto}
          <input
            type="range"
            min={1}
            max={5}
            value={form.impacto}
            onChange={(e) => setForm({ ...form, impacto: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <textarea
          value={form.acao_preventiva}
          onChange={(e) => setForm({ ...form, acao_preventiva: e.target.value })}
          placeholder="Ação preventiva"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          rows={2}
        />
        <textarea
          value={form.acao_corretiva}
          onChange={(e) => setForm({ ...form, acao_corretiva: e.target.value })}
          placeholder="Ação corretiva"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          rows={2}
        />
        <input
          type="date"
          value={form.prazo}
          onChange={(e) => setForm({ ...form, prazo: e.target.value })}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={() => void adicionar()}
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {salvando ? "Salvando…" : "Adicionar risco"}
        </button>
      </div>

      <ul className="space-y-2">
        {(riscos ?? []).map((r) => {
          const nivel = nivelCriticidade(r.criticidade);
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-foreground">{r.risco}</p>
                <span className={`rounded-full px-3 py-1.5 text-xs font-black ${nivel.classe}`}>
                  {nivel.rotulo} · {r.criticidade}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.setor ?? "Sem setor"} · Responsável: {r.responsavel ?? "—"} · Prazo:{" "}
                {r.prazo ? new Date(`${r.prazo}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
              </p>
              {r.acao_preventiva && (
                <p className="mt-2 text-xs text-foreground">Preventiva: {r.acao_preventiva}</p>
              )}
              {r.acao_corretiva && (
                <p className="text-xs text-foreground">Corretiva: {r.acao_corretiva}</p>
              )}
              <select
                value={r.status}
                onChange={async (e) => {
                  await salvarRisco({
                    id: r.id,
                    organizacao_id: org?.id ?? "",
                    unit_id: r.unit_id,
                    risco: r.risco,
                    setor: r.setor,
                    probabilidade: r.probabilidade,
                    impacto: r.impacto,
                    responsavel: r.responsavel,
                    acao_preventiva: r.acao_preventiva,
                    acao_corretiva: r.acao_corretiva,
                    prazo: r.prazo,
                    status: e.target.value,
                  });
                  void qc.invalidateQueries({ queryKey: ["rdc-riscos", unitId] });
                }}
                className="mt-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold"
              >
                {["ABERTO", "EM TRATATIVA", "CONTROLADO", "ENCERRADO"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
