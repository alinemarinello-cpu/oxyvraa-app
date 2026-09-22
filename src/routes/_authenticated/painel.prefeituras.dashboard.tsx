import { useMemo, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, FileDown, MapPin, ShieldCheck } from "lucide-react";
import { listarClientes } from "@/lib/painel-db";
import {
  agrupar,
  conformidade,
  listarAlertasMunicipais,
  listarEquipamentos,
  listarExecucoesMunicipais,
  listarSecretarias,
} from "@/lib/prefeituras-db";
import { gerarDossieMunicipal } from "@/lib/dossie-municipal";
import { useAssinatura } from "@/hooks/useAssinatura";

export const Route = createFileRoute("/_authenticated/painel/prefeituras/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Dashboard do gestor municipal — Oxyvra" },
      {
        name: "description",
        content:
          "Mapa de conformidade sanitária por bairro e secretaria, alertas de risco e dossiê para TCE, MP e Vigilância Sanitária.",
      },
      { property: "og:title", content: "Dashboard do gestor municipal — Oxyvra" },
      {
        property: "og:description",
        content: "Conformidade sanitária municipal em tempo real com relatório de auditoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardMunicipal,
});

const PERIODO = 30;

function corPct(v: number | null) {
  if (v === null) return "bg-secondary text-muted-foreground";
  if (v >= 90) return "bg-teal text-teal-foreground";
  if (v >= 70) return "bg-gold/20 text-foreground";
  return "bg-destructive text-destructive-foreground";
}

function DashboardMunicipal() {
  const { marcaDagua } = useAssinatura();
  const [prefeituraId, setPrefeituraId] = useState("");

  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const secretarias = useQuery({ queryKey: ["secretarias"], queryFn: () => listarSecretarias() });
  const equipamentos = useQuery({ queryKey: ["equipamentos"], queryFn: listarEquipamentos });
  const execucoes = useQuery({
    queryKey: ["execucoes-municipais", PERIODO],
    queryFn: () => listarExecucoesMunicipais(PERIODO),
  });
  const alertas = useQuery({ queryKey: ["alertas-municipais"], queryFn: listarAlertasMunicipais });

  const pref = useMemo(
    () => clientes.data?.find((c) => c.id === prefeituraId) ?? clientes.data?.[0] ?? null,
    [clientes.data, prefeituraId],
  );

  const dados = useMemo(() => {
    const eqs = (equipamentos.data ?? []).filter((e) => e.prefeitura_id === pref?.id);
    const ids = new Set(eqs.map((e) => e.id));
    const execs = (execucoes.data ?? []).filter((e) => ids.has(e.unit_id));
    const secs = secretarias.data ?? [];
    const nomeSec = (id: string | null) =>
      secs.find((s) => s.id === id)?.nome ?? "Sem secretaria vinculada";
    const porSecretaria = agrupar(eqs, execs, (e) => ({
      chave: e.secretaria_id ?? "sem",
      rotulo: nomeSec(e.secretaria_id),
    }));
    const porBairro = agrupar(eqs, execs, (e) => ({
      chave: e.bairro || "sem",
      rotulo: e.bairro || "Bairro não informado",
    }));
    const equipamentosDetalhe = eqs.map((e) => ({
      ...e,
      secretaria: nomeSec(e.secretaria_id),
      conformidade: conformidade(execs.filter((x) => x.unit_id === e.id)),
    }));
    const alertasRisco = (alertas.data ?? []).filter((a) => !a.unit_id || ids.has(a.unit_id));
    return {
      eqs,
      execs,
      porSecretaria,
      porBairro,
      equipamentosDetalhe,
      alertasRisco,
      geral: conformidade(execs),
      naoConformes: execs.reduce((s, e) => s + (e.total_nao_conformes ?? 0), 0),
    };
  }, [equipamentos.data, execucoes.data, secretarias.data, alertas.data, pref]);

  const criticos = dados.alertasRisco.filter(
    (a) => a.severidade === "critico" || a.severidade === "alto",
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <Link
          to="/painel/prefeituras"
          className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Secretarias e equipamentos
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-56 flex-1 text-xs font-bold text-muted-foreground">
            Prefeitura municipal
            <select
              value={pref?.id ?? ""}
              onChange={(e) => setPrefeituraId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
            >
              {(clientes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.cidade}/{c.uf}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!pref}
            onClick={() =>
              pref &&
              gerarDossieMunicipal({
                municipio: pref.nome,
                periodoDias: PERIODO,
                conformidadeGeral: dados.geral,
                totalExecucoes: dados.execs.length,
                totalNaoConformes: dados.naoConformes,
                porSecretaria: dados.porSecretaria,
                porBairro: dados.porBairro,
                equipamentos: dados.equipamentosDetalhe,
                alertas: dados.alertasRisco,
                responsavel: pref.responsavel_tecnico ?? undefined,
                marcaDagua,
              })
            }
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" /> Dossiê TCE / MP / VISA (1 clique)
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Conformidade sanitária", valor: dados.geral === null ? "—" : `${dados.geral}%` },
          { label: "Equipamentos públicos", valor: String(dados.eqs.length) },
          { label: `Checklists (${PERIODO} dias)`, valor: String(dados.execs.length) },
          { label: "Itens não conformes", valor: String(dados.naoConformes) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-black text-foreground">{k.valor}</p>
          </div>
        ))}
      </section>

      {criticos.length > 0 && (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-sm font-black uppercase tracking-wide text-destructive">
              Alertas de risco sanitário — ação imediata
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {criticos.slice(0, 10).map((a) => (
              <li key={a.id} className="rounded-xl bg-card p-3">
                <p className="text-sm font-black text-foreground">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.mensagem}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("pt-BR")} ·{" "}
                  {dados.equipamentosDetalhe.find((e) => e.id === a.unit_id)?.nome ?? "Município"} ·{" "}
                  {dados.equipamentosDetalhe.find((e) => e.id === a.unit_id)?.secretaria ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Conformidade por secretaria
          </h2>
        </div>
        <div className="mt-3 space-y-2">
          {dados.porSecretaria.map((s) => (
            <div key={s.chave} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                {s.rotulo}
              </span>
              <span className="text-xs text-muted-foreground">
                {s.unidades} eq. · {s.execucoes} checklists · {s.naoConformes} NC
              </span>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-black ${corPct(s.conformidade)}`}
              >
                {s.conformidade === null ? "—" : `${s.conformidade}%`}
              </span>
            </div>
          ))}
          {dados.porSecretaria.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Cadastre secretarias e vincule os equipamentos públicos para ver este mapa.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-teal" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Mapa de conformidade da cidade — por bairro
          </h2>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {dados.porBairro.map((b) => (
            <div key={b.chave} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-foreground">{b.rotulo}</p>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-black ${corPct(b.conformidade)}`}
                >
                  {b.conformidade === null ? "—" : `${b.conformidade}%`}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${b.conformidade ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.unidades} equipamentos · {b.naoConformes} não conformidades
              </p>
            </div>
          ))}
          {dados.porBairro.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum equipamento público cadastrado.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Equipamentos públicos monitorados
        </h2>
        <div className="mt-3 space-y-2">
          {dados.equipamentosDetalhe.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{e.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {e.secretaria} · {e.bairro || "sem bairro"}
                </p>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${corPct(e.conformidade)}`}>
                {e.conformidade === null ? "sem execuções" : `${e.conformidade}%`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
