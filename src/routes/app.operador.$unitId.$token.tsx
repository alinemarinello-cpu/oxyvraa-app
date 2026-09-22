import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Delete,
  Loader2,
  Lock,
  Mic,
  Square,
  Timer,
  Volume2,
} from "lucide-react";
import {
  CORES_LIMPEZA,
  addCleaning,
  distanceMeters,
  fileToDataUrl,
  formatDuracao,
  getAmbienteMeta,
  getChecklist,
  getColaboradorasByUnit,
  getCurrentPosition,
  getTempoMinimoSeg,
  getUnitById,
  setCurrentUnit,
  useHydrated,
  verificarPinColaboradora,
  type Colaboradora,
  type LocalAmbiente,
  type Unit,
} from "@/lib/oxyvra-store";
import {
  areaDoLocal,
  calcularDosagemSpartan,
  protocoloDoLocal,
  type ProtocoloSpartan,
} from "@/lib/spartan-protocolos";
import { abrirNaoConformidade } from "@/lib/oxyvra-industrial";
import { enfileirar } from "@/lib/oxyvra-offline";
import { applyWatermark } from "@/lib/oxyvra-watermark";
import { falar, iniciarDitado, pararFala, suporteDitado, type Ditado } from "@/lib/operador-voz";

export const Route = createFileRoute("/app/operador/$unitId/$token")({
  head: () => ({
    meta: [
      { title: "Oxyvra Campo — Tarefas da área" },
      {
        name: "description",
        content:
          "Execução guiada da higienização: kit por cor, dosagem, cronômetro sanitário travado, foto e relato de problemas por voz.",
      },
      { property: "og:title", content: "Oxyvra Campo — Tarefas da área" },
      {
        property: "og:description",
        content: "Higienização guiada com kit por cor, tempo de contato travado e foto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OperadorTarefas,
});

type Fase = "pin-entrada" | "tarefas" | "pin-saida";

/** Frase simples de dosagem: tampas de 30 ml e baldes de 5 L. */
function dosagemVisual(protocolo: ProtocoloSpartan, local: LocalAmbiente | null): string {
  const d = calcularDosagemSpartan(protocolo.produto, areaDoLocal(local));
  if (d.prontoUso) return "Usar puro, direto do frasco — não misturar com água";
  const tampas = Math.max(1, Math.round(d.mlConcentrado / 30));
  const baldes = Math.max(1, Math.round(d.litrosSolucao / 5));
  return `${tampas} tampa${tampas > 1 ? "s" : ""} cheia${tampas > 1 ? "s" : ""} do produto (30 ml cada) em ${baldes} balde${baldes > 1 ? "s" : ""} de 5 litros de água`;
}

const TERMOS_SANITIZACAO = ["desinfe", "sanitiz", "aplic", "borrif", "pulveriz", "hipoclorito"];

function Teclado({
  titulo,
  subtitulo,
  valor,
  onMudar,
  onConfirmar,
  erro,
  carregando,
}: {
  titulo: string;
  subtitulo: string;
  valor: string;
  onMudar: (v: string) => void;
  onConfirmar: () => void;
  erro: string | null;
  carregando?: boolean;
}) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "limpar", "0", "apagar"];
  return (
    <section className="mx-auto w-full max-w-sm px-5 py-8">
      <h1 className="text-2xl font-black text-navy text-center">{titulo}</h1>
      <p className="mt-1 text-center text-base text-muted-foreground">{subtitulo}</p>
      <div className="mt-6 flex justify-center gap-3" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-12 w-10 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${
              valor.length > i ? "border-navy bg-navy text-primary-foreground" : "border-border"
            }`}
          >
            {valor[i] ? "•" : ""}
          </span>
        ))}
      </div>
      {erro && <p className="mt-4 text-center text-sm font-bold text-destructive">{erro}</p>}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {teclas.map((t) => (
          <button
            key={t}
            onClick={() => {
              if (t === "limpar") onMudar("");
              else if (t === "apagar") onMudar(valor.slice(0, -1));
              else if (valor.length < 4) onMudar(valor + t);
            }}
            className="h-11 min-h-[44px] rounded-2xl bg-secondary text-xl font-black text-navy active:bg-muted flex items-center justify-center"
            aria-label={t === "apagar" ? "Apagar" : t === "limpar" ? "Limpar" : t}
          >
            {t === "apagar" ? <Delete className="w-5 h-5" /> : t === "limpar" ? "C" : t}
          </button>
        ))}
      </div>
      <button
        onClick={onConfirmar}
        disabled={valor.length !== 4 || carregando}
        className="mt-5 h-11 min-h-[44px] w-full rounded-2xl bg-teal text-base font-black text-teal-foreground disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Confirmar
      </button>
    </section>
  );
}

function OperadorTarefas() {
  const { unitId, token } = Route.useParams();
  const navigate = useNavigate();
  const hidratado = useHydrated();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [local, setLocal] = useState<LocalAmbiente | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    if (!hidratado) return;
    const u = getUnitById(unitId);
    const l = (u?.locais ?? []).find((x) => x.qrToken === token) ?? null;
    if (!u || !l) {
      setNaoEncontrado(true);
      return;
    }
    setCurrentUnit(u.id);
    setUnit(u);
    setLocal(l);
  }, [hidratado, unitId, token]);

  const [fase, setFase] = useState<Fase>("pin-entrada");
  const [pin, setPin] = useState("");
  const [pinErro, setPinErro] = useState<string | null>(null);
  const [operadora, setOperadora] = useState<Colaboradora | null>(null);
  const [inicio, setInicio] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const checklist = useMemo(() => getChecklist(local?.tipo ?? ""), [local]);
  const meta = getAmbienteMeta(local?.tipo ?? "", unit?.ambientesCustom);
  const protocolo = useMemo(() => protocoloDoLocal(local), [local]);
  const cor = local?.cor ?? protocolo?.corKitExigida;

  const dwellTotal = Math.max(
    protocolo?.dwellSegundos ?? 0,
    getTempoMinimoSeg(local?.tipo ?? "", local),
  );

  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [dwellInicio, setDwellInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [foto, setFoto] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number; distancia: number | null } | null>(
    null,
  );

  useEffect(() => {
    if (dwellInicio == null) return;
    const t = window.setInterval(() => setAgora(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [dwellInicio]);

  const restante = dwellInicio
    ? Math.max(0, dwellTotal - Math.floor((agora - dwellInicio) / 1000))
    : dwellTotal;
  const dwellIniciado = dwellInicio !== null;
  const dwellOk = dwellIniciado && restante === 0;

  // ---- Relato de problema por voz ----
  const [relato, setRelato] = useState("");
  const [ouvindo, setOuvindo] = useState(false);
  const [relatoFoto, setRelatoFoto] = useState<string | null>(null);
  const [relatoErro, setRelatoErro] = useState<string | null>(null);
  const [relatoEnviado, setRelatoEnviado] = useState(false);
  const ditadoRef = useRef<Ditado | null>(null);

  useEffect(() => () => ditadoRef.current?.parar(), []);

  function alternarDitado() {
    if (ouvindo) {
      ditadoRef.current?.parar();
      ditadoRef.current = null;
      setOuvindo(false);
      return;
    }
    setRelatoErro(null);
    const d = iniciarDitado({
      onTexto: setRelato,
      onErro: (m) => {
        setRelatoErro(m);
        setOuvindo(false);
      },
      onFim: () => setOuvindo(false),
    });
    if (!d) {
      setRelatoErro("Este aparelho não escuta por voz. Escreva o problema no campo abaixo.");
      return;
    }
    ditadoRef.current = d;
    setOuvindo(true);
  }

  async function enviarRelato() {
    if (!unit || !local || !relato.trim()) return;
    abrirNaoConformidade({
      unitId: unit.id,
      prefeituraId: unit.prefeituraId,
      localId: local.id,
      localNome: local.nome,
      origem: "manual",
      descricao: relato.trim(),
    });
    await enfileirar("nc", {
      unitId: unit.id,
      localId: local.id,
      descricao: relato.trim(),
      foto: relatoFoto,
      operadora: operadora?.nome,
      quando: Date.now(),
    });
    setRelatoEnviado(true);
    setRelato("");
    setRelatoFoto(null);
    falar("Problema enviado para a gerência.");
  }

  // ---- PIN ----
  function validarPin(): Colaboradora | null | false {
    if (!unit) return false;
    const comPin = getColaboradorasByUnit(unit.id).filter((c) => c.ativo && !!c.pin);
    if (comPin.length === 0) {
      // Unidade ainda sem PIN pessoal: aceita o PIN da unidade.
      if (unit.pin && pin !== unit.pin) return false;
      return null;
    }
    const c = verificarPinColaboradora(unit.id, pin);
    return c ?? false;
  }

  function confirmarEntrada() {
    const r = validarPin();
    if (r === false) {
      setPinErro("PIN não encontrado. Confirme com a supervisora.");
      return;
    }
    setOperadora(r);
    setPin("");
    setPinErro(null);
    setInicio(Date.now());
    setFase("tarefas");
    void getCurrentPosition()
      .then((p) => {
        const d =
          unit?.lat != null && unit?.lng != null
            ? distanceMeters({ lat: p.lat, lng: p.lng }, { lat: unit.lat, lng: unit.lng })
            : null;
        setGeo({ lat: p.lat, lng: p.lng, distancia: d });
      })
      .catch(() => setGeo(null));
    falar(`Área ${local?.nome ?? ""}. ${checklist.length} tarefas para fazer.`);
  }

  async function concluir() {
    if (!unit || !local) return;
    const r = validarPin();
    if (r === false) {
      setPinErro("PIN não encontrado. Confirme com a supervisora.");
      return;
    }
    const colab = r ?? operadora;
    setSalvando(true);
    const duracao = inicio ? Math.floor((Date.now() - inicio) / 1000) : dwellTotal;
    const fotoWm = foto
      ? await applyWatermark(foto, {
          unidade: unit.nome,
          local: local.nome,
          lat: geo?.lat,
          lng: geo?.lng,
          pin: colab?.pin ?? undefined,
          quando: Date.now(),
        })
      : undefined;
    addCleaning({
      unitId: unit.id,
      ambiente: local.tipo,
      localId: local.id,
      servente: colab?.nome ?? unit.responsavel,
      colaboradoraId: colab?.id,
      colaboradoraNome: colab?.nome,
      pinOperadora: colab?.pin,
      qrValidado: true,
      lat: geo?.lat,
      lng: geo?.lng,
      distanciaMetros: geo?.distancia ?? undefined,
      fotoDepois: fotoWm,
      duracaoSeg: duracao,
      itensFeitos: Array.from(feitos),
      status: "pendente",
      corKit: local.cor,
    });
    await enfileirar("cleaning", {
      unitId: unit.id,
      localId: local.id,
      duracaoSeg: duracao,
      pin: colab?.pin,
      quando: Date.now(),
      origem: "app-operador",
    });
    setSalvando(false);
    pararFala();
    void navigate({ to: "/sucesso", search: { tipo: local.tipo } });
  }

  if (naoEncontrado) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <div>
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" aria-hidden />
          <h1 className="mt-3 text-xl font-black text-navy">Área não reconhecida</h1>
          <p className="mt-2 text-muted-foreground">
            Este QR não está liberado neste aparelho. Entre com o PIN da unidade.
          </p>
          <Link
            to="/entrar"
            className="mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-navy px-5 font-black text-primary-foreground"
          >
            Entrar com PIN
          </Link>
        </div>
      </main>
    );
  }

  if (!unit || !local) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" aria-hidden />
      </main>
    );
  }

  const cabecalho = (
    <header className="bg-navy px-5 py-4 text-primary-foreground">
      <p className="text-xs font-bold uppercase tracking-wide text-gold">{unit.nome}</p>
      <h1 className="text-2xl font-black leading-tight">
        <span aria-hidden>{meta.emoji} </span>
        {local.nome}
      </h1>
    </header>
  );

  if (fase === "pin-entrada" || fase === "pin-saida") {
    const saida = fase === "pin-saida";
    return (
      <main className="min-h-screen bg-background">
        {cabecalho}
        <Teclado
          titulo={saida ? "Encerrar tarefa" : "Digite seu PIN"}
          subtitulo={
            saida
              ? "Confirme seu PIN de 4 dígitos para assinar a higienização."
              : "4 dígitos para começar a higienização desta área."
          }
          valor={pin}
          onMudar={(v) => {
            setPin(v);
            setPinErro(null);
          }}
          onConfirmar={() => (saida ? void concluir() : confirmarEntrada())}
          erro={pinErro}
          carregando={salvando}
        />
        {saida && (
          <button
            onClick={() => {
              setPin("");
              setPinErro(null);
              setFase("tarefas");
            }}
            className="mx-auto mb-8 block min-h-[48px] px-6 font-black text-muted-foreground"
          >
            Voltar às tarefas
          </button>
        )}
      </main>
    );
  }

  const tudoFeito = feitos.size === checklist.length;
  const podeFotografar = !dwellIniciado || dwellOk;
  const podeConcluir = tudoFeito && dwellOk && !!foto;

  return (
    <main className="min-h-screen bg-background pb-40">
      {cabecalho}

      {/* Kit e dosagem */}
      {(cor || protocolo) && (
        <section className="mx-5 mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span
              className="h-14 w-14 shrink-0 rounded-2xl border-4 border-white shadow"
              style={{ backgroundColor: cor ? CORES_LIMPEZA[cor].hex : "#94A3B8" }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-lg font-black text-navy">
                Kit {cor ? CORES_LIMPEZA[cor].label.toUpperCase() : "PADRÃO"}
              </p>
              <p className="text-sm font-bold text-muted-foreground">
                {protocolo?.produto.nome ?? "Produto padrão da unidade"}
              </p>
            </div>
            <button
              onClick={() =>
                falar(
                  `Use o kit ${cor ? CORES_LIMPEZA[cor].label : "padrão"} com ${protocolo?.produto.nome ?? "o produto da unidade"}. ${protocolo ? dosagemVisual(protocolo, local) : ""}`,
                )
              }
              className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary"
              aria-label="Ouvir instrução do kit"
            >
              <Volume2 className="w-6 h-6 text-navy" />
            </button>
          </div>
          {protocolo && (
            <p className="mt-3 rounded-xl bg-secondary px-3 py-3 text-base font-black text-navy">
              💧 {dosagemVisual(protocolo, local)}
            </p>
          )}
        </section>
      )}

      {/* Cronômetro sanitário */}
      <section className="mx-5 mt-4 rounded-2xl border-2 border-gold bg-card p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-navy">
          <Timer className="w-6 h-6" aria-hidden />
          <p className="font-black uppercase tracking-wide">Tempo de contato</p>
        </div>
        <p
          className={`mt-1 text-5xl font-black tabular-nums ${dwellOk ? "text-teal" : "text-navy"}`}
          aria-live="polite"
        >
          {formatDuracao(restante)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {!dwellIniciado
            ? "Começa sozinho quando você marcar a aplicação do desinfetante."
            : dwellOk
              ? "Liberado! Pode enxaguar, fotografar e concluir."
              : "Aguarde o produto agir. Não enxágue antes do zero."}
        </p>
      </section>

      {/* Tarefas */}
      <ol className="mx-5 mt-4 space-y-3">
        {checklist.map((item, i) => {
          const marcado = feitos.has(item.id);
          const sanitiza = TERMOS_SANITIZACAO.some((t) => item.texto.toLowerCase().includes(t));
          return (
            <li key={item.id} className="flex items-stretch gap-2">
              <button
                onClick={() => {
                  setFeitos((p) => {
                    const n = new Set(p);
                    if (n.has(item.id)) n.delete(item.id);
                    else n.add(item.id);
                    return n;
                  });
                  if (!marcado && sanitiza && dwellInicio === null && dwellTotal > 0) {
                    setDwellInicio(Date.now());
                    setAgora(Date.now());
                    falar(
                      `Cronômetro iniciado. Aguarde ${Math.round(dwellTotal / 60)} minutos antes de enxaguar.`,
                    );
                  }
                }}
                className={`flex min-h-[72px] flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
                  marcado
                    ? "border-teal bg-teal text-teal-foreground"
                    : "border-border bg-card text-navy"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${marcado ? "bg-white/20" : "bg-secondary"}`}
                  aria-hidden
                >
                  {marcado ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black">{i + 1}</span>}
                </span>
                <span className="text-base font-black leading-snug">{item.texto}</span>
              </button>
              <button
                onClick={() => falar(item.texto)}
                className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary"
                aria-label={`Ouvir tarefa ${i + 1}`}
              >
                <Volume2 className="w-6 h-6 text-navy" />
              </button>
            </li>
          );
        })}
      </ol>

      {/* Relatar problema por voz */}
      <section className="mx-5 mt-6 rounded-2xl border border-border bg-card p-4">
        <p className="text-lg font-black text-navy">Achou um problema?</p>
        <p className="text-sm text-muted-foreground">
          Segure o microfone e fale. Ex.: “vazamento no vaso”, “ar-condicionado pingando”.
        </p>
        <button
          onClick={alternarDitado}
          className={`mt-3 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl text-lg font-black ${
            ouvindo ? "bg-destructive text-destructive-foreground" : "bg-secondary text-navy"
          }`}
        >
          {ouvindo ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {ouvindo ? "Gravando… tocar para parar" : "Relatar problema por voz"}
        </button>
        <textarea
          value={relato}
          onChange={(e) => setRelato(e.target.value)}
          placeholder="O que você viu?"
          className="mt-3 w-full rounded-xl border border-input px-3 py-3 text-base"
          rows={2}
        />
        <label className="mt-2 flex min-h-[56px] cursor-pointer items-center gap-2 rounded-xl bg-secondary px-4 text-base font-black text-navy">
          <Camera className="w-6 h-6 text-teal" />
          {relatoFoto ? "Foto do problema anexada — trocar" : "Tirar foto do problema"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setRelatoFoto(await fileToDataUrl(f));
              e.target.value = "";
            }}
          />
        </label>
        {relatoErro && <p className="mt-2 text-sm font-bold text-destructive">{relatoErro}</p>}
        {relatoEnviado && (
          <p className="mt-2 text-sm font-bold text-teal">
            Chamado aberto para a gerência. Obrigado!
          </p>
        )}
        <button
          onClick={() => void enviarRelato()}
          disabled={!relato.trim()}
          className="mt-3 min-h-[56px] w-full rounded-2xl bg-navy text-base font-black text-primary-foreground disabled:opacity-40"
        >
          Enviar para a gerência
        </button>
      </section>

      {/* Foto final + concluir */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card px-5 py-3 shadow-2xl">
        <label
          className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl text-base font-black ${
            podeFotografar
              ? "cursor-pointer bg-secondary text-navy"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {podeFotografar ? <Camera className="w-6 h-6 text-teal" /> : <Lock className="w-6 h-6" />}
          {!podeFotografar
            ? `Liberado em ${formatDuracao(restante)}`
            : foto
              ? "Foto final anexada — trocar"
              : "Tirar foto final"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={!podeFotografar}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setFoto(await fileToDataUrl(f));
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={() => {
            setPin("");
            setPinErro(null);
            setFase("pin-saida");
          }}
          disabled={!podeConcluir}
          className="mt-2 flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-teal text-lg font-black text-teal-foreground disabled:opacity-40"
        >
          {podeConcluir ? <Check className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          {!tudoFeito
            ? `Faltam ${checklist.length - feitos.size} tarefa(s)`
            : !dwellOk
              ? "Aguarde o cronômetro"
              : !foto
                ? "Tire a foto final"
                : "Concluir e assinar com PIN"}
        </button>
      </div>
    </main>
  );
}
