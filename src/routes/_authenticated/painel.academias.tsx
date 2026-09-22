import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import {
  AirVent,
  Dumbbell,
  Droplets,
  FileDown,
  MessageCircle,
  Plus,
  Printer,
  QrCode,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  AREAS_ACADEMIA,
  FAIXA_CLORO,
  FAIXA_PH,
  TIPOS_AREA,
  TIPOS_LAUDO_AR,
  criarArea,
  desviosDaMedicao,
  linkWhatsappDesvio,
  listarAreas,
  listarHigienizacoesAcademia,
  listarLaudosAr,
  listarMedicoes,
  payloadQrArea,
  registrarHigienizacao,
  registrarMedicao,
  removerArea,
  salvarLaudoAr,
  statusLaudo,
  urlSeloPublico,
  type AreaAcademia,
  type TipoAreaAcademia,
} from "@/lib/academias-db";
import { gerarDossieAcademia } from "@/lib/dossie-academia";
import { listarUnidades } from "@/lib/compliance-db";
import { useOrganizacao } from "./painel";
import { useAssinatura } from "@/hooks/useAssinatura";

export const Route = createFileRoute("/_authenticated/painel/academias")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Academias e centros esportivos — Oxyvra" },
      {
        name: "description",
        content:
          "Áreas da academia com trava química Spartan, qualidade da água, PMOC do ar, dossiê VISA e selo público sanitizado.",
      },
      { property: "og:title", content: "Academias e centros esportivos — Oxyvra" },
      {
        property: "og:description",
        content: "Musculação, vestiários, aulas coletivas, parque aquático e climatização sob controle sanitário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelAcademias,
});

const ABAS = [
  { id: "areas", label: "Áreas e QR Codes", icon: Dumbbell },
  { id: "agua", label: "Qualidade da água", icon: Droplets },
  { id: "pmoc", label: "PMOC do ar", icon: AirVent },
  { id: "selo", label: "Dossiê e selo", icon: Sparkles },
] as const;

type Aba = (typeof ABAS)[number]["id"];

function PainelAcademias() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("areas");
  const [unitId, setUnitId] = useState("");
  const [erro, setErro] = useState("");

  const unidades = useQuery({ queryKey: ["unidades-compliance"], queryFn: listarUnidades });
  useEffect(() => {
    if (!unitId && unidades.data?.length) setUnitId(unidades.data[0].id);
  }, [unidades.data, unitId]);
  const unidade = (unidades.data ?? []).find((u) => u.id === unitId);

  const areas = useQuery({
    queryKey: ["academia-areas", unitId],
    queryFn: () => listarAreas(unitId),
    enabled: Boolean(unitId),
  });
  const medicoes = useQuery({
    queryKey: ["academia-agua", unitId],
    queryFn: () => listarMedicoes(unitId),
    enabled: Boolean(unitId),
  });
  const laudos = useQuery({
    queryKey: ["academia-laudos", unitId],
    queryFn: () => listarLaudosAr(unitId),
    enabled: Boolean(unitId),
  });
  const higienizacoes = useQuery({
    queryKey: ["academia-higienizacoes", unitId],
    queryFn: () => listarHigienizacoesAcademia(unitId),
    enabled: Boolean(unitId),
  });

  const recarregar = async () => {
    await qc.invalidateQueries({ queryKey: ["academia-areas", unitId] });
    await qc.invalidateQueries({ queryKey: ["academia-agua", unitId] });
    await qc.invalidateQueries({ queryKey: ["academia-laudos", unitId] });
    await qc.invalidateQueries({ queryKey: ["academia-higienizacoes", unitId] });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Dumbbell className="h-5 w-5 text-teal" /> Academias e centros esportivos
          </h2>
          <p className="text-xs text-muted-foreground">
            Musculação, vestiários e saunas, aulas coletivas, parque aquático e central de
            climatização — cada área com produto Spartan obrigatório e trava de tempo de contato.
          </p>
        </div>
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
      </header>

      <nav className="flex gap-2 overflow-x-auto no-print">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
              aba === a.id ? "bg-teal text-teal-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <a.icon className="h-4 w-4" /> {a.label}
          </button>
        ))}
      </nav>

      {erro && <p className="text-xs font-bold text-destructive">{erro}</p>}

      {aba === "areas" && (
        <AbaAreas
          unitId={unitId}
          orgId={org?.id ?? null}
          areas={areas.data ?? []}
          onErro={setErro}
          recarregar={recarregar}
        />
      )}

      {aba === "agua" && (
        <AbaAgua
          unitId={unitId}
          orgId={org?.id ?? null}
          unidadeNome={unidade?.nome ?? ""}
          areas={areas.data ?? []}
          medicoes={medicoes.data ?? []}
          onErro={setErro}
          recarregar={recarregar}
        />
      )}

      {aba === "pmoc" && (
        <AbaPmoc
          unitId={unitId}
          orgId={org?.id ?? null}
          laudos={laudos.data ?? []}
          onErro={setErro}
          recarregar={recarregar}
        />
      )}

      {aba === "selo" && (
        <AbaSelo
          unidadeNome={unidade?.nome ?? ""}
          areas={areas.data ?? []}
          medicoes={medicoes.data ?? []}
          laudos={laudos.data ?? []}
          higienizacoes={higienizacoes.data ?? []}
        />
      )}
    </div>
  );
}

// ================= Áreas =================

function AbaAreas({
  unitId,
  orgId,
  areas,
  onErro,
  recarregar,
}: {
  unitId: string;
  orgId: string | null;
  areas: AreaAcademia[];
  onErro: (v: string) => void;
  recarregar: () => Promise<void>;
}) {
  const [form, setForm] = useState({ nome: "", tipo: "musculacao" as TipoAreaAcademia, detalhe: "" });
  const [responsavel, setResponsavel] = useState("");
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const gerar = async () => {
      const mapa: Record<string, string> = {};
      for (const a of areas) {
        mapa[a.id] = await QRCode.toDataURL(payloadQrArea(a), { margin: 1, width: 240 });
      }
      setQrs(mapa);
    };
    void gerar();
  }, [areas]);

  async function adicionar() {
    onErro("");
    try {
      await criarArea({ organizacao_id: orgId, unit_id: unitId, ...form });
      setForm({ nome: "", tipo: form.tipo, detalhe: "" });
      await recarregar();
    } catch (e) {
      onErro((e as Error).message);
    }
  }

  async function higienizar(a: AreaAcademia) {
    onErro("");
    try {
      await registrarHigienizacao(a, responsavel);
      await recarregar();
    } catch (e) {
      onErro((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 no-print">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
          Cadastrar área da academia
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex.: Sala de Bike 1"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoAreaAcademia })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            {TIPOS_AREA.map((t) => (
              <option key={t} value={t}>
                {AREAS_ACADEMIA[t].emoji} {AREAS_ACADEMIA[t].label}
              </option>
            ))}
          </select>
          <input
            value={form.detalhe}
            onChange={(e) => setForm({ ...form, detalhe: e.target.value })}
            placeholder="Detalhe (piso, bloco, turno)"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Trava química desta divisão: <strong>{AREAS_ACADEMIA[form.tipo].produto}</strong> — Kit{" "}
          {AREAS_ACADEMIA[form.tipo].corKit} · {AREAS_ACADEMIA[form.tipo].dwellSegundos / 60} min de
          tempo de contato.
        </p>
        <button
          onClick={() => void adicionar()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-black text-teal-foreground"
        >
          <Plus className="h-4 w-4" /> Adicionar área
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 no-print">
        <input
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          placeholder="Responsável pela higienização"
          className="rounded-lg border border-input px-3 py-2 text-sm"
        />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-black text-foreground"
        >
          <Printer className="h-4 w-4" /> Imprimir QR das áreas
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => {
          const meta = AREAS_ACADEMIA[a.tipo as TipoAreaAcademia];
          return (
            <article key={a.id} className="etiqueta rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-foreground">
                    {meta?.emoji} {a.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meta?.label ?? a.tipo}
                    {a.detalhe ? ` · ${a.detalhe}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => void removerArea(a.id).then(recarregar)}
                  className="no-print text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${a.nome}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 rounded-lg bg-secondary px-2 py-1 text-[11px] font-bold text-foreground">
                {a.produto_obrigatorio} · Kit {a.cor_kit} · {Math.round(a.dwell_segundos / 60)} min de
                contato
              </p>

              {qrs[a.id] && (
                <img
                  src={qrs[a.id]}
                  alt={`QR Code operacional da área ${a.nome}`}
                  className="mx-auto mt-3 h-28 w-28"
                />
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                Última higienização:{" "}
                {a.ultima_higienizacao
                  ? `${new Date(a.ultima_higienizacao).toLocaleString("pt-BR")} — ${a.ultimo_responsavel || "—"}`
                  : "sem registro"}
              </p>

              <button
                onClick={() => void higienizar(a)}
                className="no-print mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
              >
                Registrar higienização concluída
              </button>
            </article>
          );
        })}
        {areas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma área cadastrada nesta unidade ainda.</p>
        )}
      </div>
    </div>
  );
}

// ================= Qualidade da água =================

function AbaAgua({
  unitId,
  orgId,
  unidadeNome,
  areas,
  medicoes,
  onErro,
  recarregar,
}: {
  unitId: string;
  orgId: string | null;
  unidadeNome: string;
  areas: AreaAcademia[];
  medicoes: import("@/lib/academias-db").MedicaoAgua[];
  onErro: (v: string) => void;
  recarregar: () => Promise<void>;
}) {
  const aquaticas = areas.filter((a) => a.tipo === "aquatica");
  const [form, setForm] = useState({
    areaId: "",
    corpo: "piscina",
    cloro: "",
    ph: "",
    temperatura: "",
    responsavel: "",
    telefone: "",
  });
  const [alerta, setAlerta] = useState<{ desvios: string[]; link: string } | null>(null);

  const previa = desviosDaMedicao(
    form.cloro === "" ? null : Number(form.cloro),
    form.ph === "" ? null : Number(form.ph),
  );

  async function salvar() {
    onErro("");
    setAlerta(null);
    try {
      const desvios = await registrarMedicao({
        organizacao_id: orgId,
        unit_id: unitId,
        area_id: form.areaId || null,
        corpo_dagua: form.corpo,
        cloro_mg_l: form.cloro === "" ? null : Number(form.cloro),
        ph: form.ph === "" ? null : Number(form.ph),
        temperatura: form.temperatura === "" ? null : Number(form.temperatura),
        responsavel: form.responsavel,
      });
      if (desvios.length)
        setAlerta({
          desvios,
          link: linkWhatsappDesvio(unidadeNome, form.corpo, desvios, form.telefone),
        });
      setForm({ ...form, cloro: "", ph: "", temperatura: "" });
      await recarregar();
    } catch (e) {
      onErro((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
          Medição diária da qualidade da água
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Faixas obrigatórias: cloro {FAIXA_CLORO.min}–{FAIXA_CLORO.max} mg/L · pH {FAIXA_PH.min}–
          {FAIXA_PH.max}. Fora da faixa, o sistema abre alerta e prepara o aviso no WhatsApp.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <select
            value={form.areaId}
            onChange={(e) => setForm({ ...form, areaId: e.target.value })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="">Área aquática (opcional)</option>
            {aquaticas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={form.corpo}
            onChange={(e) => setForm({ ...form, corpo: e.target.value })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="piscina">Piscina</option>
            <option value="piscina_infantil">Piscina infantil</option>
            <option value="jacuzzi">Jacuzzi / hidromassagem</option>
            <option value="raia">Raia semiolímpica</option>
          </select>
          <input
            inputMode="decimal"
            value={form.cloro}
            onChange={(e) => setForm({ ...form, cloro: e.target.value })}
            placeholder="Cloro (mg/L)"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            inputMode="decimal"
            value={form.ph}
            onChange={(e) => setForm({ ...form, ph: e.target.value })}
            placeholder="pH"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            inputMode="decimal"
            value={form.temperatura}
            onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
            placeholder="Temperatura (°C)"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            placeholder="Responsável pela medição"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="WhatsApp do gestor (DDI+DDD)"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <button
            onClick={() => void salvar()}
            className="rounded-lg bg-teal px-4 py-2 text-xs font-black text-teal-foreground"
          >
            Registrar medição
          </button>
        </div>
        {previa.length > 0 && (
          <p className="mt-2 text-xs font-bold text-destructive">
            Atenção: {previa.join(" · ")}
          </p>
        )}
        {alerta && (
          <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-xs font-black text-destructive">
              Desvio registrado: {alerta.desvios.join(" · ")}
            </p>
            <a
              href={alerta.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-2 text-xs font-black text-teal-foreground"
            >
              <MessageCircle className="h-4 w-4" /> Avisar gestor no WhatsApp
            </a>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Data</th>
              <th>Local</th>
              <th>Cloro</th>
              <th>pH</th>
              <th>Temp.</th>
              <th>Responsável</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {medicoes.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="py-2">{new Date(m.medido_em).toLocaleString("pt-BR")}</td>
                <td>{m.corpo_dagua}</td>
                <td>{m.cloro_mg_l ?? "—"}</td>
                <td>{m.ph ?? "—"}</td>
                <td>{m.temperatura ?? "—"}</td>
                <td>{m.responsavel || "—"}</td>
                <td className={m.fora_faixa ? "font-black text-destructive" : "text-teal"}>
                  {m.fora_faixa ? "Fora da faixa" : "Conforme"}
                </td>
              </tr>
            ))}
            {medicoes.length === 0 && (
              <tr>
                <td colSpan={7} className="py-3 text-muted-foreground">
                  Nenhuma medição registrada nos últimos 30 dias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= PMOC =================

function AbaPmoc({
  unitId,
  orgId,
  laudos,
  onErro,
  recarregar,
}: {
  unitId: string;
  orgId: string | null;
  laudos: import("@/lib/academias-db").LaudoAr[];
  onErro: (v: string) => void;
  recarregar: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    tipo: "microbiologico",
    responsavel: "",
    art: "",
    emitido: new Date().toISOString().slice(0, 10),
    meses: 6,
  });

  async function salvar() {
    onErro("");
    try {
      await salvarLaudoAr({
        organizacao_id: orgId,
        unit_id: unitId,
        tipo: form.tipo,
        responsavel_tecnico: form.responsavel,
        registro_art: form.art || null,
        emitido_em: form.emitido,
        validade_meses: Number(form.meses),
      });
      setForm({ ...form, responsavel: "", art: "" });
      await recarregar();
    } catch (e) {
      onErro((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
          Laudos obrigatórios do ar
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Análise microbiológica do ar a cada 6 meses e ART do responsável técnico a cada 12 meses
          (Lei 13.589/2018). O checklist mensal dos climatizadores por QR Code fica no modelo nativo
          “PMOC de academia — climatização”.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <select
            value={form.tipo}
            onChange={(e) => {
              const t = TIPOS_LAUDO_AR.find((x) => x.valor === e.target.value)!;
              setForm({ ...form, tipo: t.valor, meses: t.meses });
            }}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            {TIPOS_LAUDO_AR.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            placeholder="Responsável técnico"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            value={form.art}
            onChange={(e) => setForm({ ...form, art: e.target.value })}
            placeholder="Nº da ART / CREA"
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.emitido}
            onChange={(e) => setForm({ ...form, emitido: e.target.value })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          />
          <select
            value={form.meses}
            onChange={(e) => setForm({ ...form, meses: Number(e.target.value) })}
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value={6}>Validade de 6 meses</option>
            <option value={12}>Validade de 12 meses</option>
          </select>
        </div>
        <button
          onClick={() => void salvar()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-black text-teal-foreground"
        >
          <Plus className="h-4 w-4" /> Registrar laudo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {laudos.map((l) => {
          const st = statusLaudo(l);
          return (
            <article key={l.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-black text-foreground">
                {l.tipo === "art" ? "ART / laudo técnico" : "Análise microbiológica do ar"}
              </p>
              <p className="text-xs text-muted-foreground">
                {l.responsavel_tecnico} {l.registro_art ? `· ${l.registro_art}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Emitido em {new Date(`${l.emitido_em}T12:00:00`).toLocaleDateString("pt-BR")} ·
                validade {l.validade_meses} meses
              </p>
              <p className={`mt-1 text-xs font-black ${st.tom}`}>{st.label}</p>
            </article>
          );
        })}
        {laudos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum laudo do ar registrado nesta unidade.</p>
        )}
      </div>
    </div>
  );
}

// ================= Dossiê e selo =================

function AbaSelo({
  unidadeNome,
  areas,
  medicoes,
  laudos,
  higienizacoes,
}: {
  unidadeNome: string;
  areas: AreaAcademia[];
  medicoes: import("@/lib/academias-db").MedicaoAgua[];
  laudos: import("@/lib/academias-db").LaudoAr[];
  higienizacoes: import("@/lib/academias-db").HigienizacaoAcademia[];
}) {
  const { marcaDagua } = useAssinatura();
  const [selos, setSelos] = useState<Record<string, string>>({});

  useEffect(() => {
    const gerar = async () => {
      const mapa: Record<string, string> = {};
      for (const a of areas) {
        mapa[a.id] = await QRCode.toDataURL(urlSeloPublico(a.id), { margin: 1, width: 320 });
      }
      setSelos(mapa);
    };
    void gerar();
  }, [areas]);

  const resumo = useMemo(
    () => ({
      foraFaixa: medicoes.filter((m) => m.fora_faixa).length,
      laudosCriticos: laudos.filter((l) => statusLaudo(l).critico).length,
    }),
    [medicoes, laudos],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 no-print">
        <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
          Dossiê Sanitário para a VISA
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF consolidado com áreas, higienizações, medições de água e laudos do ar dos últimos 30
          dias. {resumo.foraFaixa} medição(ões) fora da faixa · {resumo.laudosCriticos} laudo(s)
          vencido(s) ou a vencer.
        </p>
        <button
          onClick={() =>
            gerarDossieAcademia({
              unidade: unidadeNome || "Academia",
              cidade: "",
              periodoDias: 30,
              areas,
              higienizacoes,
              medicoes,
              laudos,
              marcaDagua,
            })
          }
          className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
        >
          <FileDown className="h-4 w-4" /> Gerar dossiê em PDF
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
            <QrCode className="h-4 w-4 text-teal" /> Selo de Academia Sanitizada
          </p>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-black text-foreground"
          >
            <Printer className="h-4 w-4" /> Imprimir selos
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Exponha na recepção: o aluno escaneia e vê o horário e o responsável pela última
          higienização daquela área.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <article key={a.id} className="etiqueta rounded-2xl border border-border p-4 text-center">
              <p className="text-sm font-black text-foreground">{a.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {AREAS_ACADEMIA[a.tipo as TipoAreaAcademia]?.label ?? a.tipo}
              </p>
              {selos[a.id] && (
                <img
                  src={selos[a.id]}
                  alt={`QR público do selo sanitizado da área ${a.nome}`}
                  className="mx-auto mt-2 h-32 w-32"
                />
              )}
              <p className="mt-2 break-all text-[10px] text-muted-foreground">
                {urlSeloPublico(a.id)}
              </p>
            </article>
          ))}
          {areas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Cadastre as áreas para gerar os selos públicos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
