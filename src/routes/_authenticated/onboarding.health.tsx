import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { ArrowLeft, ArrowRight, Check, Lock, PlayCircle, Printer, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import {
  AVISO_LEGAL,
  AVISO_LGPD,
  ZONAS,
  gerarCheckpointsPadrao,
  listarChecklists,
  listarCiclosAutoclave,
  obterPerfil,
  salvarPerfil,
  urlDaEstacao,
  type ComplianceProfile,
  type EntradaPerfil,
  type QrCheckpoint,
  type ZoneType,
} from "@/lib/saude-conformidade-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/onboarding/health")({
  head: () => ({
    meta: [
      { title: "Configurar clínica — Oxyvra Conformidade Saúde" },
      {
        name: "description",
        content:
          "Configure em 4 passos a conformidade sanitária da sua clínica: dados, responsável técnico, autoclave e folha A4 com os 9 QR Codes das estações.",
      },
      { property: "og:title", content: "Configurar clínica — Oxyvra Conformidade Saúde" },
      {
        property: "og:description",
        content: "Onboarding guiado para consultórios odontológicos e clínicas de estética.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingSaude,
});

const campo = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

const VAZIO: EntradaPerfil = {
  clinic_name: "",
  cnpj: "",
  address: "",
  city: "",
  uf: "",
  whatsapp: "",
  rt_name: "",
  rt_council: "CRO",
  rt_number: "",
  cro: "",
  autoclave_serial: "",
  autoclave_brand_model: "",
};

const PASSOS = [
  "Dados da clínica",
  "Responsável técnico",
  "Autoclave",
  "Folha de QR Codes",
  "Ativação guiada",
];

const ROTEIRO = [
  "Cole cada QR Code na estação correspondente (recepção, equipo, expurgo, autoclave, área limpa, DML, PGRSS, raio-X e sala de estar).",
  "Abra o app no celular da equipe e leia o QR da estação para iniciar a checagem.",
  "Fotografe o que foi higienizado — a foto sai carimbada com data, hora e GPS.",
  "No fim de cada ciclo da autoclave, registre os 7 dados e a foto do integrador químico.",
  "Uma vez por semana, registre o teste biológico com a foto da ampola.",
];

function OnboardingSaude() {
  const navigate = useNavigate();
  const { data: org } = useOrganizacao();
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<EntradaPerfil>(VAZIO);
  const [perfil, setPerfil] = useState<ComplianceProfile | null>(null);
  const [checkpoints, setCheckpoints] = useState<QrCheckpoint[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const existente = useQuery({ queryKey: ["perfil-saude"], queryFn: obterPerfil });

  const primeiraTarefa = useQuery({
    queryKey: ["ativacao-saude"],
    enabled: passo === 4,
    refetchInterval: 15_000,
    queryFn: async () => {
      const [logs, ciclos] = await Promise.all([listarChecklists(7), listarCiclosAutoclave(7)]);
      return { checklists: logs.length, ciclos: ciclos.length };
    },
  });
  const ativado = (primeiraTarefa.data?.checklists ?? 0) + (primeiraTarefa.data?.ciclos ?? 0) > 0;

  useEffect(() => {
    const p = existente.data;
    if (!p || perfil) return;
    setPerfil(p);
    setForm({
      clinic_name: p.clinic_name,
      cnpj: p.cnpj ?? "",
      address: p.address,
      city: p.city,
      uf: p.uf,
      whatsapp: p.whatsapp ?? "",
      rt_name: p.rt_name,
      rt_council: p.rt_council,
      rt_number: p.rt_number,
      cro: p.cro ?? "",
      autoclave_serial: p.autoclave_serial,
      autoclave_brand_model: p.autoclave_brand_model,
    });
  }, [existente.data, perfil]);

  const concluir = async () => {
    if (!org) return;
    setSalvando(true);
    try {
      const p = await salvarPerfil(org.id, form, perfil?.id);
      setPerfil(p);
      const lista = await gerarCheckpointsPadrao(org.id, p);
      setCheckpoints(lista);
      const mapa: Record<string, string> = {};
      for (const c of lista) {
        mapa[c.id] = await QRCode.toDataURL(urlDaEstacao(c.code, window.location.origin), {
          margin: 1,
          width: 320,
        });
      }
      setQrs(mapa);
      setPasso(3);
      toast.success("Clínica configurada. Imprima a folha e cole os QR Codes nas estações.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const avancar = () => {
    if (passo === 0 && !form.clinic_name.trim()) return toast.error("Informe o nome da clínica.");
    if (passo === 1 && (!form.rt_name.trim() || !form.rt_number.trim()))
      return toast.error("Informe o responsável técnico e o número do conselho.");
    if (passo === 1 && !form.cro.trim())
      return toast.error("Informe o CRO do responsável técnico.");
    if (passo === 2) return void concluir();
    setPasso((p) => p + 1);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
      <style>{`@media print { .no-print { display: none !important } .etiqueta { break-inside: avoid } }`}</style>

      <header className="no-print mb-6 flex items-center gap-3">
        <OxyvraLogo className="h-9" />
        <div>
          <h1 className="text-lg font-black text-foreground">
            Conformidade Saúde e Estética — configuração
          </h1>
          <p className="text-sm text-muted-foreground">
            Passo {passo + 1} de {PASSOS.length} · {PASSOS[passo]}
          </p>
        </div>
      </header>

      <div className="no-print mb-6 flex gap-2">
        {PASSOS.map((p, i) => (
          <div
            key={p}
            className={`h-1.5 flex-1 rounded-full ${i <= passo ? "bg-teal" : "bg-muted"}`}
          />
        ))}
      </div>

      {passo === 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className={rotulo}>Nome da clínica / consultório</span>
              <input
                className={campo}
                value={form.clinic_name}
                onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>CNPJ (opcional)</span>
              <input
                className={campo}
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>WhatsApp para alertas</span>
              <input
                className={campo}
                placeholder="(11) 99999-0000"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className={rotulo}>Endereço</span>
              <input
                className={campo}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Cidade</span>
              <input
                className={campo}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>UF</span>
              <input
                className={campo}
                maxLength={2}
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
              />
            </label>
          </div>
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">{AVISO_LGPD}</p>
        </section>
      )}

      {passo === 1 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 sm:col-span-3">
              <span className={rotulo}>Nome do responsável técnico</span>
              <input
                className={campo}
                value={form.rt_name}
                onChange={(e) => setForm({ ...form, rt_name: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Conselho</span>
              <select
                className={campo}
                value={form.rt_council}
                onChange={(e) => setForm({ ...form, rt_council: e.target.value })}
              >
                <option value="CRO">CRO</option>
                <option value="CRM">CRM</option>
                <option value="COREN">COREN</option>
                <option value="CRBM">CRBM</option>
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className={rotulo}>Número de inscrição</span>
              <input
                className={campo}
                value={form.rt_number}
                onChange={(e) => setForm({ ...form, rt_number: e.target.value })}
              />
            </label>
            <label className="space-y-1 sm:col-span-3">
              <span className={rotulo}>
                <span className="text-destructive">*</span> CRO do responsável técnico
              </span>
              <input
                className={campo}
                placeholder="Ex.: CRO-SP 12345"
                value={form.cro}
                onChange={(e) => setForm({ ...form, cro: e.target.value })}
              />
              <span className="text-xs text-muted-foreground">
                Obrigatório para validade jurídica da Pasta da Vigilância.
              </span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            O responsável técnico aparece na capa da Pasta da Vigilância.
          </p>
        </section>
      )}

      {passo === 2 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={rotulo}>Marca e modelo da autoclave</span>
              <input
                className={campo}
                placeholder="Ex.: Cristófoli Vitale 21L"
                value={form.autoclave_brand_model}
                onChange={(e) => setForm({ ...form, autoclave_brand_model: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Número de série</span>
              <input
                className={campo}
                value={form.autoclave_serial}
                onChange={(e) => setForm({ ...form, autoclave_serial: e.target.value })}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Estes dados já vêm preenchidos em cada registro de ciclo, reduzindo digitação na
            rotina.
          </p>
        </section>
      )}

      {passo === 3 && (
        <section className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-teal" /> {checkpoints.length} estações prontas
              para impressão em folha A4.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
              >
                <Printer className="h-4 w-4" /> Imprimir folha A4
              </button>
              <button
                onClick={() => setPasso(4)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                <Check className="h-4 w-4" /> Continuar para a ativação
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {checkpoints.map((c) => {
              const meta = ZONAS[c.zone_type as ZoneType];
              return (
                <div
                  key={c.id}
                  className="etiqueta rounded-2xl border border-border bg-white p-3 text-center"
                >
                  <p className="text-2xl">{meta?.emoji}</p>
                  <p className="mt-1 text-[11px] font-black leading-tight text-navy">
                    {c.custom_name || c.name}
                  </p>
                  {qrs[c.id] && (
                    <img src={qrs[c.id]} alt={`QR Code da estação ${c.name}`} className="mx-auto mt-2 w-full" />
                  )}
                  <p className="mt-1 text-[9px] font-bold uppercase text-muted-foreground">
                    {meta?.produto} · kit {meta?.corKit}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">{AVISO_LEGAL}</p>
        </section>
      )}

      {passo === 4 && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <PlayCircle className="h-5 w-5 text-teal" /> Tutorial de 90 segundos
            </div>
            <ol className="mt-3 space-y-2">
              {ROTEIRO.map((r, i) => (
                <li key={r} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-black text-foreground">
              Para liberar o painel, conclua a primeira tarefa prática
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Registre <strong>1 checklist de abertura</strong> ou <strong>1 ciclo de autoclave</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => void navigate({ to: "/saude" })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
              >
                Abrir a tela da equipe <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => void primeiraTarefa.refetch()}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Já registrei — verificar
              </button>
            </div>
            <div className="mt-4">
              <button
                disabled={!ativado}
                onClick={() => void navigate({ to: "/painel/conformidade" })}
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-50"
              >
                {ativado ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {ativado ? "Painel liberado — entrar" : "Painel bloqueado até a 1ª tarefa"}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">{AVISO_LEGAL}</p>
        </section>
      )}

      {passo < 3 && (
        <div className="no-print mt-6 flex items-center justify-between">
          <button
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <button
            onClick={avancar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
          >
            {passo === 2 ? (salvando ? "Gerando QR Codes…" : "Gerar folha de QR Codes") : "Continuar"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
