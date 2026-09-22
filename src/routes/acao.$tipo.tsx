import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  RotateCcw,
  Check,
  MapPin,
  Loader2,
  AlertTriangle,
  Play,
  Timer,
  AlertOctagon,
  X,
  QrCode,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { z } from "zod";
import {
  getAmbienteMeta,
  addCleaning,
  useCurrentUnit,
  useHydrated,
  getCurrentPosition,
  distanceMeters,
  getChecklist,
  getTempoMinimoSeg,
  fileToDataUrl,
  formatDuracao,
  getReprovadasPendentes,
  recomendarParaLocal,
  getVerticalDaUnidade,
  usePrefeituras,
  CORES_LIMPEZA,
  findLocalByQr,
  verificarPinColaboradora,
  getColaboradorasByUnit,
  type LocalAmbiente,
  type ChecklistItem,
  type Colaboradora,
} from "@/lib/oxyvra-store";
import { QrScanner } from "@/components/QrScanner";
import {
  TIPOS_LIMPEZA,
  TIPO_LIMPEZA_META,
  ALERGENO_META,
  checarAlergenos,
  abrirNaoConformidade,
  isLocalBloqueado,
  isPpoh,
  getVerticalType,
  type Alergeno,
  type TipoLimpeza,
} from "@/lib/oxyvra-industrial";
import {
  protocoloDoLocal,
  calcularDosagemSpartan,
  validarKitSpartan,
  areaDoLocal,
} from "@/lib/spartan-protocolos";
import { enfileirar, estaOnline } from "@/lib/oxyvra-offline";
import { applyWatermark } from "@/lib/oxyvra-watermark";


const searchSchema = z.object({ refazer: z.string().optional(), qr: z.string().optional() });

export const Route = createFileRoute("/acao/$tipo")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Oxyvra — Registrar Limpeza" },
      { name: "description", content: "Siga o checklist e registre com foto." },
      { property: "og:title", content: "Oxyvra — Registrar Limpeza" },
      { property: "og:description", content: "Siga o checklist e registre com foto." },
    ],
  }),
  component: AcaoScreen,
});

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; lat: number; lng: number; distancia: number | null; foraDaArea: boolean }
  | { status: "error"; message: string };

type Fase = "escolher-local" | "executando" | "revisar";

function AcaoScreen() {
  const { tipo } = useParams({ from: "/acao/$tipo" });
  const { refazer, qr } = Route.useSearch();
  const navigate = useNavigate();
  const unit = useCurrentUnit();
  const meta = getAmbienteMeta(tipo, unit?.ambientesCustom);
  const checklist: ChecklistItem[] = useMemo(() => getChecklist(tipo), [tipo]);

  const locaisDoTipo: LocalAmbiente[] = useMemo(
    () => (unit?.locais ?? []).filter((l) => l.tipo === tipo),
    [unit, tipo],
  );
  const [localId, setLocalId] = useState<string | null>(null);
  const localSelecionado = useMemo(
    () => locaisDoTipo.find((l) => l.id === localId) ?? null,
    [locaisDoTipo, localId],
  );

  const [fase, setFase] = useState<Fase>(
    locaisDoTipo.length > 1 ? "escolher-local" : "executando",
  );
  // QR lido pela câmera do celular: abre direto o ambiente já validado
  useEffect(() => {
    if (!qr) return;
    const found = locaisDoTipo.find((l) => l.qrToken === qr);
    if (!found) return;
    setLocalId(found.id);
    setQrValidado(true);
    setFase("executando");
  }, [qr, locaisDoTipo]);

  useEffect(() => {
    if (qr) return;
    if (locaisDoTipo.length <= 1) {
      setLocalId(locaisDoTipo[0]?.id ?? null);
      setFase("executando");
    }
  }, [locaisDoTipo]);

  const prefeiturasAll = usePrefeituras();
  const prefeituraDaUnidade = prefeiturasAll.find((p) => p.id === unit?.prefeituraId) ?? null;
  const verticalType = getVerticalType(unit ?? undefined, prefeituraDaUnidade);
  const ppoh = isPpoh(verticalType);
  const [tipoLimpeza, setTipoLimpeza] = useState<TipoLimpeza>("pre_operacional");

  const protocolo = useMemo(() => protocoloDoLocal(localSelecionado), [localSelecionado]);
  const checagemKit = useMemo(
    () => validarKitSpartan(protocolo, localSelecionado?.cor, (c) => CORES_LIMPEZA[c].label),
    [protocolo, localSelecionado],
  );
  const dosagem = useMemo(
    () =>
      protocolo
        ? calcularDosagemSpartan(protocolo.produto, areaDoLocal(localSelecionado))
        : null,
    [protocolo, localSelecionado],
  );

  const tempoMinimo = Math.max(
    ppoh ? TIPO_LIMPEZA_META[tipoLimpeza].dwellSeg : getTempoMinimoSeg(tipo, localSelecionado),
    protocolo?.dwellSegundos ?? 0,
  );

  const alergenosZona = ((localSelecionado?.alergenos ?? []) as Alergeno[]);
  const checagemAlergeno = ppoh
    ? checarAlergenos(localSelecionado?.cor, alergenosZona)
    : { bloqueado: false, faltantes: [], mensagem: "" };
  const bloqueioLinha = ppoh ? isLocalBloqueado(localSelecionado?.id) : null;
  const linhaBloqueada = !!bloqueioLinha && !refazer;

  const [fotoAntes, setFotoAntes] = useState<string | null>(null);
  const [fotoDepois, setFotoDepois] = useState<string | null>(null);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [inicio, setInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState<number>(Date.now());
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [confirmandoFora, setConfirmandoFora] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [qrValidado, setQrValidado] = useState(false);
  const [nfcValidado, setNfcValidado] = useState(false);
  const [scanErro, setScanErro] = useState<string | null>(null);
  const [pinDialog, setPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErro, setPinErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);


  const timerRef = useRef<number | null>(null);

  const reprovadaOrigem = useMemo(() => {
    if (!refazer || !unit) return null;
    return getReprovadasPendentes(unit.id).find((c) => c.id === refazer) ?? null;
  }, [refazer, unit]);

  const hidratado = useHydrated();

  useEffect(() => {
    if (hidratado && !unit) navigate({ to: "/entrar" });
  }, [hidratado, unit, navigate]);

  useEffect(() => {
    if (inicio == null) return;
    timerRef.current = window.setInterval(() => setAgora(Date.now()), 500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [inicio]);

  const iniciar = () => {
    setInicio(Date.now());
    setAgora(Date.now());
    if (geo.status === "idle") capturarLocalizacao();
  };

  const decorridoSeg = inicio ? Math.floor((agora - inicio) / 1000) : 0;
  const restanteSeg = Math.max(0, tempoMinimo - decorridoSeg);
  const tempoOk = decorridoSeg >= tempoMinimo;

  const capturarLocalizacao = async () => {
    setGeo({ status: "loading" });
    try {
      const p = await getCurrentPosition();
      const raio = unit?.raioMetros ?? 150;
      let distancia: number | null = null;
      let fora = false;
      if (unit?.lat != null && unit?.lng != null) {
        distancia = distanceMeters({ lat: p.lat, lng: p.lng }, { lat: unit.lat, lng: unit.lng });
        fora = distancia > raio;
      }
      setGeo({ status: "ok", lat: p.lat, lng: p.lng, distancia, foraDaArea: fora });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível obter a localização.";
      setGeo({ status: "error", message: msg });
    }
  };

  const onFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "antes" | "depois",
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await fileToDataUrl(f);
      if (tipo === "antes") setFotoAntes(url);
      else setFotoDepois(url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar imagem.");
    } finally {
      e.target.value = "";
    }
  };

  const toggleItem = (id: string) => {
    setFeitos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const podeConfirmar =
    !!fotoDepois &&
    feitos.size === checklist.length &&
    tempoOk &&
    geo.status !== "loading" &&
    !checagemAlergeno.bloqueado &&
    !checagemKit.bloqueado &&
    !linhaBloqueada;

  const abrirPin = () => {
    if (!podeConfirmar) return;
    if (geo.status === "ok" && geo.foraDaArea && !confirmandoFora) {
      setConfirmandoFora(true);
      return;
    }
    setPinErro(null);
    setPinInput("");
    setPinDialog(true);
  };

  const confirmarComPin = async () => {
    if (!unit) return;
    const temColaboradoras = getColaboradorasByUnit(unit.id).some(
      (c) => c.ativo && !!c.pin,
    );
    let colab: Colaboradora | null = null;
    if (temColaboradoras) {
      colab = verificarPinColaboradora(unit.id, pinInput);
      if (!colab) {
        setPinErro("PIN inválido. Confirme com a supervisora ou no painel ADM.");
        return;
      }
    }
    setSalvando(true);
    const g = geo.status === "ok" ? geo : null;
    const wm = {
      unidade: unit.nome,
      local: localSelecionado?.nome,
      lat: g?.lat,
      lng: g?.lng,
      pin: colab?.pin ?? undefined,
      quando: Date.now(),
    };
    const fotoAntesWM = fotoAntes ? await applyWatermark(fotoAntes, wm) : undefined;
    const fotoDepoisWM = fotoDepois ? await applyWatermark(fotoDepois, wm) : undefined;
    addCleaning({
      unitId: unit.id,
      ambiente: tipo,
      localId: localId ?? undefined,
      servente: colab?.nome ?? unit.responsavel,
      colaboradoraId: colab?.id,
      colaboradoraNome: colab?.nome,
      pinOperadora: colab?.pin,
      qrValidado,
      lat: g?.lat,
      lng: g?.lng,
      distanciaMetros: g?.distancia ?? undefined,
      foraDaArea: g?.foraDaArea,
      fotoAntes: fotoAntesWM,
      fotoDepois: fotoDepoisWM,
      duracaoSeg: decorridoSeg,
      itensFeitos: Array.from(feitos),
      status: "pendente",
      refazDe: reprovadaOrigem?.id,
      nfcValidado,
      tipoLimpeza: ppoh ? tipoLimpeza : undefined,
      corKit: localSelecionado?.cor,
      alergenosZona: ppoh ? alergenosZona : undefined,
    });
    // Todo registro entra na fila: se houver internet ele sobe na hora,
    // senão fica no aparelho e sincroniza sozinho depois.
    void enfileirar("cleaning", {
      unitId: unit.id,
      localId,
      tipoLimpeza: ppoh ? tipoLimpeza : undefined,
      duracaoSeg: decorridoSeg,
      pin: colab?.pin,
      quando: Date.now(),
    });

    setPinDialog(false);
    setSalvando(false);
    navigate({ to: "/sucesso", search: { tipo } });
  };

  const lerNfc = async () => {
    setScanErro(null);
    const NDEF = (window as unknown as { NDEFReader?: new () => {
      scan: () => Promise<void>;
      onreading: ((e: { serialNumber?: string; message?: { records: { data?: DataView }[] } }) => void) | null;
    } }).NDEFReader;
    if (!NDEF) {
      setScanErro("NFC não disponível neste dispositivo. Use o QR Code.");
      return;
    }
    try {
      const reader = new NDEF();
      await reader.scan();
      reader.onreading = (e) => {
        const rec = e.message?.records?.[0]?.data;
        const raw = rec ? new TextDecoder().decode(rec) : "";
        if (raw) {
          setNfcValidado(true);
          handleQrDetected(raw);
        } else {
          setScanErro("Tag NFC sem payload Oxyvra. Use o QR Code.");
        }
      };
    } catch (err) {
      setScanErro(err instanceof Error ? err.message : "Falha ao ler NFC.");
    }
  };

  const cancelarDwell = () => {
    if (!unit || !localSelecionado) return;
    abrirNaoConformidade({
      unitId: unit.id,
      prefeituraId: unit.prefeituraId,
      localId: localSelecionado.id,
      localNome: localSelecionado.nome,
      origem: "dwell_cancelado",
      descricao: `Tempo de contato interrompido em ${formatDuracao(decorridoSeg)} de ${formatDuracao(tempoMinimo)} exigidos (${TIPO_LIMPEZA_META[tipoLimpeza].label}).`,
      responsavelQa: (prefeituraDaUnidade as { responsavelQa?: string } | null)?.responsavelQa,
    });
    navigate({ to: "/menu" });
  };

  const handleQrDetected = (raw: string) => {
    if (!unit) return;
    const found = findLocalByQr(unit.id, raw);
    if (!found) {
      setScanErro("QR não corresponde a nenhum local desta unidade.");
      setScanning(false);
      return;
    }
    if (found.tipo !== tipo) {
      setScanErro(`Este QR é do ambiente "${found.tipo}", não corresponde ao que você iniciou.`);
      setScanning(false);
      return;
    }
    setScanErro(null);
    setLocalId(found.id);
    setQrValidado(true);
    setScanning(false);
    setFase("executando");
  };


  const unitTemGeo = unit?.lat != null && unit?.lng != null;

  // -------- Escolher local --------
  if (fase === "escolher-local") {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header meta={meta} refazer={!!reprovadaOrigem} />
        <section className="flex-1 px-5 py-6">
          <h1 className="text-2xl font-black text-navy text-center">Qual local?</h1>
          <p className="text-center text-muted-foreground mt-1 mb-4">
            Escaneie o QR do local ou escolha manualmente
          </p>
          <button
            onClick={() => {
              setScanErro(null);
              setScanning(true);
            }}
            className="w-full mb-4 h-16 rounded-2xl bg-navy text-navy-foreground font-black flex items-center justify-center gap-3 shadow-elevated active:scale-[0.98]"
          >
            <QrCode className="w-6 h-6 text-gold" />
            LER QR CODE DO LOCAL
          </button>
          {ppoh && (
            <button
              onClick={lerNfc}
              className="w-full mb-4 h-14 rounded-2xl border-2 border-navy text-navy font-black flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <ShieldCheck className="w-6 h-6 text-gold" />
              APROXIMAR TAG NFC
            </button>
          )}
          {scanErro && (
            <p className="mb-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold p-3">
              {scanErro}
            </p>
          )}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-black tracking-widest text-muted-foreground">OU MANUAL</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-col gap-3">
            {locaisDoTipo.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLocalId(l.id);
                  setQrValidado(false);
                  setFase("executando");
                }}
                className="bg-card rounded-2xl border-2 border-border p-4 text-left active:border-gold active:scale-[0.98] transition flex items-center gap-3"
              >
                <div className="text-3xl">{meta.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-navy">{l.nome}</p>
                  {l.areaM2 != null && (
                    <p className="text-xs text-muted-foreground">{l.areaM2} m²</p>
                  )}
                </div>
                <div className="text-navy text-2xl font-black">›</div>
              </button>
            ))}
          </div>
        </section>
        {scanning && (
          <QrScanner
            onDetected={handleQrDetected}
            onClose={() => setScanning(false)}
          />
        )}
      </main>
    );
  }


  // -------- Execução --------
  return (
    <main className="min-h-screen bg-background flex flex-col pb-8">
      <Header meta={meta} refazer={!!reprovadaOrigem} />

      {reprovadaOrigem && (
        <div className="mx-5 mt-4 rounded-2xl bg-destructive/10 border-2 border-destructive/40 p-3 text-destructive text-sm flex items-start gap-2">
          <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-black">Refazendo limpeza reprovada</p>
            <p className="text-xs opacity-90">
              Motivo: {reprovadaOrigem.motivoReprovacao || "não informado"}
            </p>
          </div>
        </div>
      )}

      <section className="flex-1 px-5 py-6 flex flex-col gap-5">
        {localSelecionado && (
          <div className="rounded-2xl bg-secondary p-3 text-navy text-sm font-bold flex items-center gap-2">
            <span className="text-lg">📍</span>
            <span className="truncate">{localSelecionado.nome}</span>
            {localSelecionado.areaM2 != null && (
              <span className="ml-auto text-xs text-muted-foreground font-semibold">
                {localSelecionado.areaM2} m²
              </span>
            )}
          </div>
        )}

        {linhaBloqueada && bloqueioLinha && (
          <div className="rounded-2xl bg-destructive text-white p-4">
            <p className="font-black flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> LINHA BLOQUEADA
            </p>
            <p className="text-sm opacity-90 mt-1">{bloqueioLinha.descricao}</p>
            <p className="text-xs opacity-80 mt-2">
              Aguarde a ação corretiva e liberação pelo QA antes de higienizar.
            </p>
          </div>
        )}

        {ppoh && (
          <div className="rounded-2xl bg-card border-2 border-border p-4">
            <p className="text-[10px] font-black tracking-widest text-gold mb-2">
              TIPO DE HIGIENIZAÇÃO (PPOH)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {TIPOS_LIMPEZA.map((t) => {
                const m = TIPO_LIMPEZA_META[t];
                const on = tipoLimpeza === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={inicio != null}
                    onClick={() => setTipoLimpeza(t)}
                    className={`px-3 py-2 rounded-xl border-2 text-left transition disabled:opacity-50 ${
                      on ? "border-gold bg-gold/10 text-navy" : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm font-black">
                      {m.emoji} {m.label}
                    </p>
                    <p className="text-[11px] opacity-80">
                      Tempo de contato: {formatDuracao(m.dwellSeg)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {ppoh && alergenosZona.length > 0 && (
          <div
            className={`rounded-2xl p-4 border-2 ${
              checagemAlergeno.bloqueado
                ? "bg-destructive/10 border-destructive text-destructive"
                : "bg-success/10 border-success/40 text-navy"
            }`}
          >
            <p className="font-black flex items-center gap-2">
              {checagemAlergeno.bloqueado ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              CONTROLE DE ALÉRGENOS
            </p>
            <p className="text-sm mt-1">{checagemAlergeno.mensagem}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {alergenosZona.map((a) => (
                <span
                  key={a}
                  className="px-2 py-1 rounded-lg bg-background text-xs font-bold text-navy border border-border"
                >
                  {ALERGENO_META[a]?.emoji} {ALERGENO_META[a]?.label ?? a}
                </span>
              ))}
            </div>
            {checagemAlergeno.bloqueado && (
              <p className="text-xs font-bold mt-2">
                Troque para o kit correto antes de continuar — registro bloqueado.
              </p>
            )}
          </div>
        )}

        {protocolo && (
          <div
            className={`rounded-2xl border-2 p-4 ${
              checagemKit.bloqueado
                ? "border-destructive bg-destructive/10"
                : "border-gold/60 bg-card shadow-card"
            }`}
          >
            <p className="text-[10px] font-black tracking-widest text-gold mb-2">
              PROTOCOLO SPARTAN OBRIGATÓRIO
            </p>
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-border"
                style={{ backgroundColor: CORES_LIMPEZA[protocolo.corKitExigida].hex }}
              >
                <span className="text-xl">🧴</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-navy">{protocolo.produto.nome}</p>
                <p className="text-xs text-muted-foreground">{protocolo.produto.categoria}</p>
                <p className="text-xs text-muted-foreground mt-1">{protocolo.instrucao}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-lg bg-navy text-navy-foreground text-xs font-black">
                    Balde/Pano {CORES_LIMPEZA[protocolo.corKitExigida].label}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-muted text-xs font-bold text-navy">
                    {protocolo.produto.diluicaoLabel}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-muted text-xs font-bold text-navy">
                    Contato {formatDuracao(protocolo.dwellSegundos)}
                  </span>
                </div>
                {dosagem && (
                  <p className="mt-2 text-xs font-bold text-navy">
                    {areaDoLocal(localSelecionado)} m² ·{" "}
                    {dosagem.prontoUso ? (
                      <>Pronto uso — {dosagem.litrosSolucao.toFixed(2)} L</>
                    ) : (
                      <>
                        {dosagem.litrosSolucao.toFixed(2)} L de solução ={" "}
                        {dosagem.mlConcentrado.toFixed(0)} ml de {protocolo.produto.nome} +{" "}
                        {dosagem.litrosAgua.toFixed(2)} L de água
                      </>
                    )}
                  </p>
                )}
                {checagemKit.bloqueado && (
                  <p className="mt-2 text-xs font-black text-destructive flex items-start gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {checagemKit.mensagem}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {localSelecionado && (
          <LocalRecomendacao local={localSelecionado} unitId={unit?.id} />
        )}

        {/* CRONÔMETRO */}
        <div className="rounded-3xl border-4 border-gold/60 bg-card p-4 flex items-center gap-4 shadow-card">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white ${
              tempoOk ? "bg-success" : inicio ? "bg-navy" : "bg-muted-foreground/40"
            }`}
          >
            <Timer className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-widest text-gold">CRONÔMETRO</p>
            {inicio == null ? (
              <p className="text-xl font-black text-navy">
                Toque em iniciar para começar
              </p>
            ) : (
              <p className="text-3xl font-black text-navy tabular-nums">
                {formatDuracao(decorridoSeg)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Mantenha o produto agindo por {formatDuracao(tempoMinimo)}
              {inicio != null && !tempoOk && (
                <span className="ml-2 font-bold text-destructive">
                  faltam {formatDuracao(restanteSeg)}
                </span>
              )}
              {tempoOk && (
                <span className="ml-2 font-bold text-success" style={{ color: "#166534" }}>
                  ✓ tempo cumprido
                </span>
              )}
            </p>

          </div>
          {inicio == null && (
            <button
              onClick={iniciar}
              className="shrink-0 h-14 px-5 rounded-2xl bg-gold text-navy font-black flex items-center gap-2 shadow-elevated active:scale-95 transition"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              INICIAR
            </button>
          )}
        </div>

        {ppoh && inicio != null && !tempoOk && (
          <button
            onClick={cancelarDwell}
            className="w-full h-12 rounded-2xl border-2 border-destructive text-destructive font-black flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
            INTERROMPER — ABRIR NÃO CONFORMIDADE
          </button>
        )}

        {/* FOTO ANTES */}
        <FotoBloco
          label="FOTO ANTES (opcional)"
          descricao="Para comparar depois"
          foto={fotoAntes}
          disabled={inicio == null}
          onFile={(e) => onFile(e, "antes")}
          onRemove={() => setFotoAntes(null)}
          emoji={meta.emoji}
          cor="secondary"
        />

        {/* CHECKLIST */}
        <div className="rounded-3xl border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black tracking-widest text-gold">
              CHECKLIST DE HIGIENIZAÇÃO
            </p>
            <span className="text-xs font-black text-navy">
              {feitos.size}/{checklist.length}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {checklist.map((item) => {
              const marcado = feitos.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    disabled={inicio == null}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition disabled:opacity-40 ${
                      marcado
                        ? "border-success bg-success/10"
                        : "border-border bg-secondary active:border-gold"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        marcado ? "bg-success text-white" : "bg-white border-2 border-navy/20"
                      }`}
                    >
                      {marcado && <Check className="w-5 h-5" strokeWidth={3} />}
                    </div>
                    <span
                      className={`font-bold text-navy ${
                        marcado ? "line-through opacity-60" : ""
                      }`}
                    >
                      {item.texto}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* FOTO DEPOIS */}
        <FotoBloco
          label="FOTO DEPOIS (obrigatória)"
          descricao="Registro do ambiente higienizado"
          foto={fotoDepois}
          disabled={inicio == null}
          onFile={(e) => onFile(e, "depois")}
          onRemove={() => setFotoDepois(null)}
          emoji={meta.emoji}
          cor="gold"
        />

        {/* GEO */}
        {inicio != null && (
          <div>
            {geo.status === "loading" && (
              <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-navy font-bold text-sm">
                <Loader2 className="w-5 h-5 animate-spin" /> Verificando sua localização…
              </div>
            )}
            {geo.status === "error" && (
              <div className="rounded-2xl bg-destructive/10 border-2 border-destructive/30 p-3 text-destructive text-sm font-bold">
                ⚠️ {geo.message}
                <button onClick={capturarLocalizacao} className="ml-2 underline">
                  Tentar de novo
                </button>
              </div>
            )}
            {geo.status === "ok" && !unitTemGeo && (
              <div className="rounded-2xl bg-secondary border-2 border-border p-3 text-navy text-sm font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" /> Localização capturada
              </div>
            )}
            {geo.status === "ok" && unitTemGeo && !geo.foraDaArea && (
              <div
                className="rounded-2xl bg-success/15 border-2 border-success/40 p-3 text-sm font-bold flex items-center gap-2"
                style={{ color: "#166534" }}
              >
                <Check className="w-5 h-5" /> Dentro da unidade
                {geo.distancia != null && ` (${Math.round(geo.distancia)}m)`}
              </div>
            )}
            {geo.status === "ok" && geo.foraDaArea && (
              <div className="rounded-2xl bg-destructive/10 border-2 border-destructive/40 p-3 text-destructive text-sm font-bold flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  Você está a <b>{Math.round(geo.distancia!)}m</b> da unidade. Se já estiver no
                  local, aproxime-se e tente de novo — senão o registro será enviado marcado como{" "}
                  <b>fora da área</b> para o gestor conferir.
                </div>
              </div>
            )}

          </div>
        )}

        {erro && (
          <p className="rounded-2xl bg-destructive/10 text-destructive text-sm font-bold p-3">
            {erro}
          </p>
        )}

        {/* CONFIRMAR */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={abrirPin}
            disabled={!podeConfirmar}
            className={`h-24 rounded-3xl font-black text-2xl shadow-elevated flex items-center justify-center gap-3 active:scale-[0.98] transition disabled:opacity-40 ${
              confirmandoFora
                ? "bg-destructive text-destructive-foreground"
                : "bg-success text-success-foreground"
            }`}
          >
            <Check className="w-8 h-8" strokeWidth={3} />
            {confirmandoFora ? "CONFIRMAR MESMO ASSIM" : "CONFIRMAR LIMPEZA"}
          </button>
          {!podeConfirmar && (
            <p className="text-center text-xs text-muted-foreground -mt-1">
              {inicio == null && "Toque em INICIAR para começar"}
              {inicio != null && feitos.size < checklist.length && "Marque todos os itens do checklist"}
              {inicio != null && feitos.size === checklist.length && !fotoDepois && "Falta a foto DEPOIS"}
              {inicio != null && feitos.size === checklist.length && fotoDepois && !tempoOk && "Aguarde o tempo mínimo"}
            </p>
          )}
        </div>
      </section>
      {pinDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-elevated">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-navy text-gold flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-gold">ETAPA FINAL</p>
                <h2 className="text-lg font-black text-navy">Assinar com PIN</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Digite seu PIN pessoal de 4 dígitos para encerrar e assinar a limpeza.
            </p>
            <input
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                setPinErro(null);
              }}
              inputMode="numeric"
              maxLength={4}
              autoFocus
              placeholder="----"
              className="w-full h-12 rounded-2xl border-2 border-border text-center font-mono tracking-[0.6em] text-2xl font-black text-navy"
            />
            {pinErro && (
              <p className="mt-2 text-sm font-bold text-destructive">{pinErro}</p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPinDialog(false)}
                className="flex-1 h-12 rounded-2xl border-2 border-border font-black text-navy"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarComPin}
                disabled={salvando || pinInput.length !== 4}
                className="flex-1 h-12 rounded-2xl bg-success text-success-foreground font-black flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Assinar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


function Header({
  meta,
  refazer,
}: {
  meta: { emoji: string; titulo: string };
  refazer: boolean;
}) {
  return (
    <header className="bg-navy text-navy-foreground px-5 pt-10 pb-6 rounded-b-[2rem] shadow-elevated">
      <div className="flex items-center gap-3">
        <Link
          to="/menu"
          className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-gold font-semibold tracking-widest">
            {refazer ? "REFAZENDO" : "HIGIENIZANDO"}
          </p>
          <p className="text-lg font-black truncate">
            <span className="mr-2">{meta.emoji}</span>
            {meta.titulo}
          </p>
        </div>
      </div>
    </header>
  );
}

function LocalRecomendacao({ local, unitId }: { local: LocalAmbiente; unitId?: string }) {
  const unit = useCurrentUnit();
  const prefeituras = usePrefeituras();
  const vertical = useMemo(() => {
    const u = unit && (!unitId || unit.id === unitId) ? unit : undefined;
    const pref = u ? prefeituras.find((p) => p.id === u.prefeituraId) : undefined;
    return getVerticalDaUnidade(u, pref);
  }, [unit, unitId, prefeituras]);
  const rec = useMemo(() => recomendarParaLocal(local, vertical), [local, vertical]);
  if (!rec) {
    return (
      <div className="rounded-2xl bg-warning/10 border-2 border-warning/30 p-3 text-warning-foreground text-sm font-bold flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p>Sem recomendação automática</p>
          <p className="text-xs opacity-90 font-semibold">
            Informe cor de limpeza e metragem no painel ADM para calcular o produto ideal.
          </p>
        </div>
      </div>
    );
  }
  const cor = CORES_LIMPEZA[local.cor!];
  return (
    <div className="rounded-2xl border-2 border-gold/60 bg-card p-4 shadow-card">
      <p className="text-[10px] font-black tracking-widest text-gold mb-2">PRODUTO E QUANTIDADE SUGERIDOS</p>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: cor.hex }}
        >
          <span className="text-xl">🧴</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-navy truncate">{rec.produto.nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{cor.label} — {cor.uso}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-navy text-navy-foreground text-xs font-black">
              {rec.litrosSolucao.toFixed(2)} L solução
            </span>
            <span className="text-[11px] text-muted-foreground">
              (1:{rec.diluicao} · {rec.litrosProdutoConcentrado.toFixed(3)} L concentrado)
            </span>
            {rec.produto.grauAlimenticio && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-success/15 text-success text-[10px] font-black uppercase tracking-wider">
                Grau alimentício
              </span>
            )}
            {rec.produto.requerEnxague && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-warning/15 text-warning text-[10px] font-black uppercase tracking-wider">
                Requer enxágue
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FotoBloco({
  label,
  descricao,
  foto,
  disabled,
  onFile,
  onRemove,
  emoji,
  cor,
}: {
  label: string;
  descricao: string;
  foto: string | null;
  disabled: boolean;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  emoji: string;
  cor: "gold" | "secondary";
}) {
  const borda = cor === "gold" ? "border-gold/60" : "border-border";
  return (
    <div className={`rounded-3xl border-2 ${borda} bg-card overflow-hidden`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-widest text-gold">{label}</p>
          <p className="text-xs text-muted-foreground">{descricao}</p>
        </div>
        {foto && (
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-navy active:bg-destructive active:text-white"
            aria-label="Remover foto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {foto ? (
        <img src={foto} alt={label} className="w-full aspect-square object-cover" />
      ) : (
        <label
          className={`block relative aspect-square flex items-center justify-center border-t-2 border-dashed ${
            disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:bg-secondary"
          } ${borda}`}
        >
          <div className="text-center px-4">
            <div className="text-6xl mb-2">{emoji}</div>
            <div className="inline-flex items-center gap-2 text-navy font-black">
              <Camera className="w-5 h-5" />
              {disabled ? "Inicie o cronômetro" : "Tirar foto"}
            </div>
          </div>
          {!disabled && (
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          )}
        </label>
      )}
      {foto && (
        <label className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-navy border-t border-border active:bg-secondary cursor-pointer">
          <RotateCcw className="w-4 h-4" />
          Trocar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
