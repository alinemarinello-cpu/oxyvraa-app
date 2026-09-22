import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { BedDouble, Droplets, Plus, Printer, ShieldAlert } from "lucide-react";
import {
  atualizarSuite,
  criarSuite,
  horasDesdeHigienizacao,
  listarHigienizacoes,
  listarSuites,
  payloadQrSuite,
  STATUS_SUITE,
  type StatusSuite,
  type Suite,
} from "@/lib/suites-db";
import { listarUnidades } from "@/lib/compliance-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/suites")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Suítes e hidromassagens — Oxyvra" },
      {
        name: "description",
        content:
          "Fluxo de giro de suítes com QR Code, status em tempo real e histórico de sanitização de hidromassagens.",
      },
      { property: "og:title", content: "Suítes e hidromassagens — Oxyvra" },
      {
        property: "og:description",
        content: "Status das suítes, trava sanitária da hidro e histórico de higienizações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelSuites,
});

const VAZIA = {
  identificacao: "",
  bloco: "",
  categoria: "standard",
  tem_hidro: false,
  tem_sauna: false,
};

function PainelSuites() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [form, setForm] = useState(VAZIA);
  const [erro, setErro] = useState("");
  const [qrs, setQrs] = useState<Record<string, string>>({});

  const unidades = useQuery({ queryKey: ["unidades-compliance"], queryFn: listarUnidades });
  useEffect(() => {
    if (!unitId && unidades.data?.length) setUnitId(unidades.data[0].id);
  }, [unidades.data, unitId]);

  const suites = useQuery({
    queryKey: ["suites", unitId],
    queryFn: () => listarSuites(unitId),
    enabled: Boolean(unitId),
  });
  const historico = useQuery({
    queryKey: ["suite-higienizacoes", unitId],
    queryFn: () => listarHigienizacoes(30, unitId),
    enabled: Boolean(unitId),
  });

  useEffect(() => {
    const gerar = async () => {
      const mapa: Record<string, string> = {};
      for (const s of suites.data ?? []) {
        mapa[s.id] = await QRCode.toDataURL(payloadQrSuite(s), { margin: 1, width: 240 });
      }
      setQrs(mapa);
    };
    void gerar();
  }, [suites.data]);

  const resumo = useMemo(() => {
    const lista = suites.data ?? [];
    return {
      total: lista.length,
      disponiveis: lista.filter((s) => s.status === "disponivel").length,
      higienizando: lista.filter((s) => s.status === "em_higienizacao").length,
      bloqueadas: lista.filter((s) => s.status === "bloqueada").length,
    };
  }, [suites.data]);

  async function adicionar() {
    setErro("");
    if (!unitId) return setErro("Selecione a unidade.");
    if (!form.identificacao.trim()) return setErro("Informe o número/nome da suíte.");
    try {
      await criarSuite({
        organizacao_id: org?.id ?? null,
        unit_id: unitId,
        identificacao: form.identificacao.trim(),
        bloco: form.bloco.trim(),
        categoria: form.categoria,
        tem_hidro: form.tem_hidro,
        tem_sauna: form.tem_sauna,
      });
      setForm(VAZIA);
      await qc.invalidateQueries({ queryKey: ["suites", unitId] });
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function mudarStatus(s: Suite, status: StatusSuite) {
    await atualizarSuite(s.id, { status, status_atualizado_em: new Date().toISOString() });
    await qc.invalidateQueries({ queryKey: ["suites", unitId] });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <BedDouble className="h-5 w-5 text-teal" /> Suítes e hidromassagens
          </h2>
          <p className="text-xs text-muted-foreground">
            Giro por QR Code, trava sanitária de hidro e status em tempo real. Registramos apenas
            metadados operacionais — nenhum dado do hóspede.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            {(unidades.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-black text-foreground"
          >
            <Printer className="h-4 w-4" /> Imprimir QR
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Suítes", valor: resumo.total },
          { label: "Disponíveis", valor: resumo.disponiveis },
          { label: "Em higienização", valor: resumo.higienizando },
          { label: "Bloqueadas", valor: resumo.bloqueadas },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-black text-foreground">{k.valor}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 no-print">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
          Cadastrar suíte
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            value={form.identificacao}
            onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
            placeholder="Suíte 101"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            value={form.bloco}
            onChange={(e) => setForm({ ...form, bloco: e.target.value })}
            placeholder="Bloco / ala"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="luxo">Luxo</option>
            <option value="hidro">Hidro</option>
            <option value="sauna">Sauna</option>
            <option value="presidencial">Presidencial</option>
          </select>
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.tem_hidro}
                onChange={(e) => setForm({ ...form, tem_hidro: e.target.checked })}
              />
              Hidro
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.tem_sauna}
                onChange={(e) => setForm({ ...form, tem_sauna: e.target.checked })}
              />
              Sauna
            </label>
          </div>
        </div>
        {erro && <p className="mt-2 text-xs font-bold text-destructive">{erro}</p>}
        <button
          onClick={() => void adicionar()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-black text-teal-foreground"
        >
          <Plus className="h-4 w-4" /> Adicionar suíte
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(suites.data ?? []).map((s) => {
          const st = STATUS_SUITE[(s.status as StatusSuite) ?? "disponivel"] ?? STATUS_SUITE.disponivel;
          const horas = horasDesdeHigienizacao(s);
          return (
            <article key={s.id} className="etiqueta rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-foreground">{s.identificacao}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.bloco || "—"} · {s.categoria}
                    {s.tem_hidro ? " · hidro" : ""}
                    {s.tem_sauna ? " · sauna" : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${st.cor}`}>
                  {st.label}
                </span>
              </div>

              {qrs[s.id] && (
                <img
                  src={qrs[s.id]}
                  alt={`QR Code de serviço da ${s.identificacao}`}
                  className="mx-auto mt-3 h-28 w-28"
                />
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                Última higienização:{" "}
                {s.ultima_higienizacao
                  ? `${new Date(s.ultima_higienizacao).toLocaleString("pt-BR")} (${horas} h)`
                  : "sem registro"}
              </p>
              {s.tem_hidro && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5 text-teal" /> Hidro sanitizada:{" "}
                  {s.ultima_sanitizacao_hidro
                    ? new Date(s.ultima_sanitizacao_hidro).toLocaleString("pt-BR")
                    : "sem registro"}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 no-print">
                {(Object.keys(STATUS_SUITE) as StatusSuite[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => void mudarStatus(s, k)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                      s.status === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {STATUS_SUITE[k].label}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
        {suites.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma suíte cadastrada nesta unidade ainda.
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 no-print">
        <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
          <ShieldAlert className="h-4 w-4 text-teal" /> Histórico de giros (30 dias)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Início</th>
                <th>Suíte</th>
                <th>Camareira</th>
                <th>QR</th>
                <th>Hidro</th>
                <th>Cloro</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(historico.data ?? []).map((h) => {
                const suite = (suites.data ?? []).find((s) => s.id === h.suite_id);
                return (
                  <tr key={h.id} className="border-t border-border">
                    <td className="py-2">{new Date(h.iniciada_em).toLocaleString("pt-BR")}</td>
                    <td>{suite?.identificacao ?? "—"}</td>
                    <td>{h.colaboradora_nome || "—"}</td>
                    <td>{h.qr_validado ? "validado" : "manual"}</td>
                    <td>{h.hidro_sanitizada ? "sanitizada" : "—"}</td>
                    <td>{h.cloro_residual ?? "—"}</td>
                    <td>{STATUS_SUITE[(h.status_final as StatusSuite) ?? "disponivel"]?.label}</td>
                  </tr>
                );
              })}
              {historico.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-3 text-muted-foreground">
                    Nenhum giro registrado no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
