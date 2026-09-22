import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  QrCode,
  Timer as TimerIcon,
  Camera,
  AlertTriangle,
  Building2,
  School,
  Calculator,
  CheckCircle2,
  Lock,
  MapPin,
  FileDown,
  Sparkles,
  Factory,
  Smartphone,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Oxyvra Biossegurança — Demonstração Comercial" },
      {
        name: "description",
        content:
          "Plataforma Oxyvra: auditoria anti-fraude em 4 camadas para higienização de ambientes escolares e industriais (padrão SIF).",
      },
      { property: "og:title", content: "Oxyvra Biossegurança — Demonstração Comercial" },
      {
        property: "og:description",
        content: "Fluxo operacional + Dashboard do Gestor com calculadora Spartan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

// ============================================================
// Catálogo Spartan (demo)
// ============================================================
type ProdutoId = "peroxy4d" | "dmq" | "sparquat" | "sanit10" | "cj20";
const PRODUTOS: Record<
  ProdutoId,
  {
    nome: string;
    diluicao: string;
    ratio: number; // 1:ratio
    dwellSeg: number;
    precoConcentradoLitro: number; // R$/L
    grauAlimenticio: boolean;
    cor: string;
  }
> = {
  peroxy4d: {
    nome: "Spartan Peroxy 4D",
    diluicao: "1:100",
    ratio: 100,
    dwellSeg: 300,
    precoConcentradoLitro: 78,
    grauAlimenticio: false,
    cor: "bg-blue-500",
  },
  dmq: {
    nome: "Spartan DMQ",
    diluicao: "1:200",
    ratio: 200,
    dwellSeg: 600,
    precoConcentradoLitro: 62,
    grauAlimenticio: false,
    cor: "bg-emerald-500",
  },
  sparquat: {
    nome: "Spartan Sparquat",
    diluicao: "1:100",
    ratio: 100,
    dwellSeg: 300,
    precoConcentradoLitro: 68,
    grauAlimenticio: false,
    cor: "bg-purple-500",
  },
  sanit10: {
    nome: "Spartan Sani-T-10 (Grau Alimentício)",
    diluicao: "1:500",
    ratio: 500,
    dwellSeg: 60,
    precoConcentradoLitro: 92,
    grauAlimenticio: true,
    cor: "bg-amber-500",
  },
  cj20: {
    nome: "Spartan CJ-20",
    diluicao: "1:50",
    ratio: 50,
    dwellSeg: 180,
    precoConcentradoLitro: 54,
    grauAlimenticio: false,
    cor: "bg-red-500",
  },
};

// ============================================================
// Página principal
// ============================================================
type Perfil = "operador" | "gestor" | "publico";
type Vertical = "educacional" | "industria";

function DemoPage() {
  const [perfil, setPerfil] = useState<Perfil>("operador");
  const [vertical, setVertical] = useState<Vertical>("educacional");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0B2238] to-[#0F172A] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0B2238]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                Oxyvra Biossegurança
              </p>
              <h1 className="text-sm sm:text-base font-black truncate">
                Escolar & Corporativa · Demo
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Vertical */}
            <div className="flex rounded-full bg-white/10 p-1">
              <button
                onClick={() => setVertical("educacional")}
                className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                  vertical === "educacional"
                    ? "bg-[#D4AF37] text-[#0B2238]"
                    : "text-white/80"
                }`}
              >
                <School className="w-3.5 h-3.5" /> Escolar
              </button>
              <button
                onClick={() => setVertical("industria")}
                className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                  vertical === "industria"
                    ? "bg-[#D4AF37] text-[#0B2238]"
                    : "text-white/80"
                }`}
              >
                <Factory className="w-3.5 h-3.5" /> SIF/Frigorífico
              </button>
            </div>

            {/* Perfil */}
            <div className="flex rounded-full bg-white/10 p-1">
              <button
                onClick={() => setPerfil("operador")}
                className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                  perfil === "operador" ? "bg-white text-[#0B2238]" : "text-white/80"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Operador
              </button>
              <button
                onClick={() => setPerfil("gestor")}
                className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                  perfil === "gestor" ? "bg-white text-[#0B2238]" : "text-white/80"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Gestor
              </button>
              <button
                onClick={() => setPerfil("publico")}
                className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                  perfil === "publico" ? "bg-white text-[#0B2238]" : "text-white/80"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Selo Público
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {perfil === "operador" && <OperadorFlow vertical={vertical} />}
        {perfil === "gestor" && <GestorDashboard vertical={vertical} />}
        {perfil === "publico" && <SeloPublico vertical={vertical} />}
      </main>
    </div>
  );
}

// ============================================================
// VISÃO PÚBLICA — Selo Oxyvra Safe
// ============================================================
function SeloPublico({ vertical }: { vertical: Vertical }) {
  const ambiente = vertical === "educacional" ? "Sala 04 — 3º Ano B" : "Câmara Fria 02";
  const local =
    vertical === "educacional"
      ? "EMEF Prof. Antônio Silva — Valinhos/SP"
      : "Unidade Industrial — Itajaí/SC";
  const produto =
    vertical === "educacional" ? "Spartan Peroxy 4D (1:100)" : "Spartan Sani-T-10 (1:500)";
  const quando = new Date(Date.now() - 1000 * 60 * 47).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="overflow-hidden border-2 border-[#D4AF37]/40 shadow-xl">
        <div className="bg-gradient-to-br from-[#0B2238] to-[#0F172A] text-white p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-9 h-9 text-[#0B2238]" />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-black">
            Certificado Digital de Biossegurança
          </p>
          <h2 className="text-xl font-black">Oxyvra Safe</h2>
          <p className="text-xs text-white/70 mt-1">{local}</p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 p-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-black text-emerald-700 leading-tight">
              AMBIENTE SANITIZADO COM SUCESSO
            </p>
            <p className="text-xs text-emerald-700/80 mt-1">{ambiente}</p>
          </div>

          <div className="space-y-2 text-sm">
            <LinhaSelo icone={<TimerIcon className="w-4 h-4" />} label="Última higienização" valor={quando} />
            <LinhaSelo icone={<Sparkles className="w-4 h-4" />} label="Produto aplicado" valor={produto} />
            <LinhaSelo icone={<ShieldCheck className="w-4 h-4" />} label="Residual ativo" valor="Até 72 horas" />
            <LinhaSelo icone={<MapPin className="w-4 h-4" />} label="Protocolo auditado" valor="GPS + PIN do operador" />
            <LinhaSelo icone={<QrCode className="w-4 h-4" />} label="Registro" valor="#OXV-2026-04872" />
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge className="bg-[#0B2238] text-white">Auditoria anti-fraude 4 camadas</Badge>
            {vertical === "industria" && (
              <Badge className="bg-[#D4AF37] text-[#0B2238]">Padrão SIF</Badge>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Escaneie o QR Code na entrada do ambiente para consultar este selo a qualquer momento.
      </p>
    </div>
  );
}

function LinhaSelo({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground shrink-0">
        {icone} {label}
      </span>
      <span className="font-bold text-[#0B2238] text-right">{valor}</span>
    </div>
  );
}

// ============================================================
// OPERADOR — Fluxo 4 camadas
// ============================================================
type Etapa = 1 | 2 | 3 | 4 | 5;

function OperadorFlow({ vertical }: { vertical: Vertical }) {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [ambienteLido, setAmbienteLido] = useState<null | {
    nome: string;
    produto: ProdutoId;
    area: number;
  }>(null);
  const [fotoAntes, setFotoAntes] = useState<string | null>(null);
  const [fotoDepois, setFotoDepois] = useState<string | null>(null);
  const [dwellRestante, setDwellRestante] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [pin, setPin] = useState("");
  const [erroPin, setErroPin] = useState("");

  // Timer
  useEffect(() => {
    if (!timerAtivo || dwellRestante <= 0) return;
    const id = setInterval(() => setDwellRestante((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [timerAtivo, dwellRestante]);

  useEffect(() => {
    if (timerAtivo && dwellRestante === 0) setTimerAtivo(false);
  }, [timerAtivo, dwellRestante]);

  const produto = ambienteLido ? PRODUTOS[ambienteLido.produto] : null;

  function simularQR() {
    const escolar = {
      nome: "Sala de Aula 04 — Bloco B",
      produto: "peroxy4d" as ProdutoId,
      area: 48,
    };
    const industria = {
      nome: "Câmara Fria 02 — Linha de Corte",
      produto: "sanit10" as ProdutoId,
      area: 120,
    };
    setAmbienteLido(vertical === "educacional" ? escolar : industria);
    setEtapa(2);
  }

  function tirarFotoAntes() {
    // simula foto com marca d'água
    setFotoAntes(gerarFotoSimulada("ANTES", ambienteLido!.nome));
    setEtapa(3);
  }

  function iniciarTimer() {
    setDwellRestante(produto!.dwellSeg);
    setTimerAtivo(true);
  }

  function tirarFotoDepois() {
    setFotoDepois(gerarFotoSimulada("DEPOIS", ambienteLido!.nome));
  }

  function concluir() {
    if (pin !== "1234") {
      setErroPin("PIN incorreto. Use 1234 para o modo demo.");
      return;
    }
    setErroPin("");
    setEtapa(5);
  }

  function reiniciar() {
    setEtapa(1);
    setAmbienteLido(null);
    setFotoAntes(null);
    setFotoDepois(null);
    setDwellRestante(0);
    setTimerAtivo(false);
    setPin("");
    setErroPin("");
  }

  const progresso = ((Math.min(etapa, 4) - 1) / 3) * 100;

  return (
    <div className="max-w-md mx-auto">
      {/* Simulador de telefone */}
      <div className="bg-[#0B2238] rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden min-h-[640px] flex flex-col">
          {/* Status bar simulado */}
          <div className="bg-[#0B2238] text-white text-[10px] px-6 py-1.5 flex justify-between">
            <span>9:41</span>
            <span>Oxyvra Auditor</span>
            <span>100%</span>
          </div>

          {/* Header do app */}
          <div className="bg-gradient-to-b from-[#0B2238] to-[#0F172A] text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-[#D4AF37] text-[#0B2238] hover:bg-[#D4AF37]">
                Etapa {Math.min(etapa, 4)} / 4
              </Badge>
              {etapa < 5 && (
                <button
                  onClick={reiniciar}
                  className="text-[10px] uppercase tracking-widest text-white/60"
                >
                  Reiniciar
                </button>
              )}
            </div>
            <Progress value={progresso} className="h-1.5 bg-white/10" />
          </div>

          <div className="flex-1 p-5">
            {etapa === 1 && <Etapa1QR onSimular={simularQR} />}
            {etapa === 2 && ambienteLido && (
              <Etapa2Foto
                ambiente={ambienteLido}
                produto={produto!}
                onFoto={tirarFotoAntes}
              />
            )}
            {etapa === 3 && ambienteLido && (
              <Etapa3Timer
                produto={produto!}
                fotoAntes={fotoAntes!}
                dwellRestante={dwellRestante}
                totalDwell={produto!.dwellSeg}
                ativo={timerAtivo}
                onIniciar={iniciarTimer}
                onAcelerar={() => setDwellRestante(3)}
                onAvancar={() => setEtapa(4)}
              />
            )}
            {etapa === 4 && ambienteLido && (
              <Etapa4Encerramento
                ambiente={ambienteLido}
                fotoDepois={fotoDepois}
                pin={pin}
                erroPin={erroPin}
                onTirarFoto={tirarFotoDepois}
                onPin={setPin}
                onConcluir={concluir}
              />
            )}
            {etapa === 5 && ambienteLido && (
              <EtapaSucesso ambiente={ambienteLido} onNovo={reiniciar} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Etapa1QR({ onSimular }: { onSimular: () => void }) {
  return (
    <div className="text-center">
      <h2 className="text-lg font-black text-[#0B2238] mb-1">Leitura Obrigatória</h2>
      <p className="text-xs text-slate-500 mb-4">
        Aproxime a câmera do QR Code ou tag NFC do ambiente
      </p>
      <div className="relative mx-auto w-56 h-56 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-6 border-2 border-[#D4AF37] rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent animate-pulse" />
        <QrCode className="w-28 h-28 text-white/40" />
      </div>
      <Button
        onClick={onSimular}
        className="mt-6 w-full h-14 text-base font-black bg-[#D4AF37] text-[#0B2238] hover:bg-[#D4AF37]/90"
      >
        <QrCode className="w-5 h-5 mr-2" />
        Simular leitura do QR
      </Button>
      <p className="text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Seleção manual bloqueada por anti-fraude
      </p>
    </div>
  );
}

function Etapa2Foto({
  ambiente,
  produto,
  onFoto,
}: {
  ambiente: { nome: string; area: number };
  produto: (typeof PRODUTOS)[ProdutoId];
  onFoto: () => void;
}) {
  const litros = (ambiente.area * 0.05).toFixed(2);
  const concentradoMl = ((parseFloat(litros) * 1000) / produto.ratio).toFixed(0);
  return (
    <div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
          QR Validado
        </p>
        <p className="text-sm font-black text-[#0B2238]">{ambiente.nome}</p>
        <p className="text-xs text-slate-600">{ambiente.area} m² · área mapeada</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Produto recomendado
        </p>
        <p className="text-sm font-black text-[#0B2238]">{produto.nome}</p>
        <p className="text-xs text-slate-600">
          Diluição {produto.diluicao} · {litros} L de solução · {concentradoMl} mL concentrado
        </p>
        {produto.grauAlimenticio && (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] mt-1">
            Grau alimentício
          </Badge>
        )}
      </div>

      <h2 className="text-base font-black text-[#0B2238] mb-2">Foto ANTES da aplicação</h2>
      <p className="text-xs text-slate-500 mb-3">
        Marca d'água digital com GPS, hora e PIN será aplicada
      </p>

      <Button
        onClick={onFoto}
        className="w-full h-14 text-base font-black bg-[#0B2238] text-white hover:bg-[#0F172A]"
      >
        <Camera className="w-5 h-5 mr-2" />
        Tirar foto ANTES
      </Button>
    </div>
  );
}

function Etapa3Timer({
  produto,
  fotoAntes,
  dwellRestante,
  totalDwell,
  ativo,
  onIniciar,
  onAcelerar,
  onAvancar,
}: {
  produto: (typeof PRODUTOS)[ProdutoId];
  fotoAntes: string;
  dwellRestante: number;
  totalDwell: number;
  ativo: boolean;
  onIniciar: () => void;
  onAcelerar: () => void;
  onAvancar: () => void;
}) {
  const iniciou = dwellRestante > 0 || (!ativo && dwellRestante === 0 && totalDwell > 0);
  const concluido = iniciou && dwellRestante === 0 && !ativo && totalDwell > 0 && fotoAntes;
  const mm = String(Math.floor(dwellRestante / 60)).padStart(2, "0");
  const ss = String(dwellRestante % 60).padStart(2, "0");
  const pct = ((totalDwell - dwellRestante) / totalDwell) * 100;

  return (
    <div>
      <div className="rounded-xl overflow-hidden mb-3 border border-slate-200">
        <div className="relative">
          <div
            className="h-32 bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-white/70 text-xs"
            dangerouslySetInnerHTML={{ __html: fotoAntes }}
          />
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800">
          <span className="font-bold">Foto validada por IA:</span> claridade e enquadramento
          aprovados
        </p>
      </div>

      <h2 className="text-base font-black text-[#0B2238] mb-1">Tempo de contato (Dwell)</h2>
      <p className="text-xs text-slate-500 mb-4">
        {produto.nome} exige {Math.round(totalDwell / 60)} min de ação sanitária
      </p>

      <div className="text-center py-4">
        <div className="text-5xl font-black tabular-nums text-[#0B2238]">
          {mm}:{ss}
        </div>
        <Progress value={pct} className="h-2 mt-3" />
      </div>

      {!ativo && !concluido && !iniciou && (
        <Button
          onClick={onIniciar}
          className="w-full h-14 text-base font-black bg-[#0B2238] text-white hover:bg-[#0F172A]"
        >
          <TimerIcon className="w-5 h-5 mr-2" />
          Iniciar aplicação e timer
        </Button>
      )}

      {ativo && (
        <>
          <Button
            disabled
            className="w-full h-14 text-base font-black bg-slate-200 text-slate-500"
          >
            <Lock className="w-5 h-5 mr-2" />
            Aguarde a ação sanitária…
          </Button>
          <button
            onClick={onAcelerar}
            className="w-full mt-2 text-xs text-[#D4AF37] font-bold flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" /> Acelerar timer (modo teste)
          </button>
        </>
      )}

      {concluido && (
        <Button
          onClick={onAvancar}
          className="w-full h-14 text-base font-black bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Dwell concluído · avançar
        </Button>
      )}
    </div>
  );
}

function Etapa4Encerramento({
  ambiente,
  fotoDepois,
  pin,
  erroPin,
  onTirarFoto,
  onPin,
  onConcluir,
}: {
  ambiente: { nome: string };
  fotoDepois: string | null;
  pin: string;
  erroPin: string;
  onTirarFoto: () => void;
  onPin: (v: string) => void;
  onConcluir: () => void;
}) {
  return (
    <div>
      <h2 className="text-base font-black text-[#0B2238] mb-1">
        Registro final · {ambiente.nome}
      </h2>
      <p className="text-xs text-slate-500 mb-4">Foto DEPOIS + PIN do operador</p>

      {!fotoDepois ? (
        <Button
          onClick={onTirarFoto}
          className="w-full h-14 text-base font-black bg-[#0B2238] text-white hover:bg-[#0F172A]"
        >
          <Camera className="w-5 h-5 mr-2" /> Tirar foto DEPOIS
        </Button>
      ) : (
        <div
          className="h-32 rounded-xl overflow-hidden border border-slate-200 mb-4 bg-gradient-to-br from-emerald-200 to-emerald-500"
          dangerouslySetInnerHTML={{ __html: fotoDepois }}
        />
      )}

      {fotoDepois && (
        <>
          <Label className="text-xs font-bold text-[#0B2238] mb-1 block">PIN do operador</Label>
          <Input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => onPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="h-12 text-center text-xl tracking-[0.5em] font-black"
          />
          {erroPin && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {erroPin}
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">PIN de teste: 1234</p>

          <Button
            onClick={onConcluir}
            disabled={pin.length !== 4}
            className="w-full h-14 mt-4 text-base font-black bg-[#D4AF37] text-[#0B2238] hover:bg-[#D4AF37]/90 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Concluir e enviar registro
          </Button>
        </>
      )}
    </div>
  );
}

function EtapaSucesso({
  ambiente,
  onNovo,
}: {
  ambiente: { nome: string };
  onNovo: () => void;
}) {
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </div>
      <h2 className="text-xl font-black text-[#0B2238]">Registro auditado ✓</h2>
      <p className="text-sm text-slate-600 mt-1">{ambiente.nome}</p>
      <div className="bg-slate-50 rounded-xl p-3 mt-4 text-left text-xs space-y-1">
        <p>
          <span className="text-slate-500">Hash:</span>{" "}
          <span className="font-mono">0xA{Math.random().toString(16).slice(2, 10)}</span>
        </p>
        <p>
          <span className="text-slate-500">Selo:</span>{" "}
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]">
            Validado Oxyvra
          </Badge>
        </p>
      </div>
      <Button
        onClick={onNovo}
        className="w-full h-12 mt-6 font-black bg-[#0B2238] text-white hover:bg-[#0F172A]"
      >
        Novo registro
      </Button>
    </div>
  );
}

function gerarFotoSimulada(tipo: "ANTES" | "DEPOIS", local: string): string {
  const hora = new Date().toLocaleTimeString("pt-BR");
  const lat = "-23.5505";
  const lng = "-46.6333";
  return `
    <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-family:monospace;font-size:11px;background:${
      tipo === "ANTES"
        ? "linear-gradient(135deg,#475569,#1e293b)"
        : "linear-gradient(135deg,#10b981,#047857)"
    }">
      <div style="position:absolute;bottom:6px;left:6px;right:6px;background:rgba(0,0,0,.55);padding:4px 6px;border-radius:4px;text-align:left;line-height:1.35">
        <div style="color:#D4AF37;font-weight:900">OXYVRA · ${tipo}</div>
        <div>${local}</div>
        <div>${hora} · GPS ${lat},${lng}</div>
        <div>PIN 1234 · Selo criptográfico</div>
      </div>
    </div>
  `;
}

// ============================================================
// GESTOR — Dashboard
// ============================================================
function GestorDashboard({ vertical }: { vertical: Vertical }) {
  return (
    <div className="space-y-6">
      <KPICards vertical={vertical} />
      <Tabs defaultValue="ambientes" className="w-full">
        <TabsList className="bg-white border border-slate-200 h-11">
          <TabsTrigger value="ambientes" className="text-xs sm:text-sm">
            Ambientes em tempo real
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="text-xs sm:text-sm">
            Calculadora de insumos
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="text-xs sm:text-sm">
            Compliance / SIF
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ambientes" className="mt-4">
          <AmbientesGrid vertical={vertical} />
        </TabsContent>
        <TabsContent value="calculadora" className="mt-4">
          <CalculadoraInsumos />
        </TabsContent>
        <TabsContent value="relatorio" className="mt-4">
          <RelatorioCompliance vertical={vertical} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICards({ vertical }: { vertical: Vertical }) {
  const kpis = [
    {
      label: "Conformidade Sanitária",
      valor: "98,4%",
      hint: "Últimos 30 dias",
      icon: ShieldCheck,
      cor: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Ambientes auditados hoje",
      valor: vertical === "educacional" ? "24 / 25" : "42 / 44",
      hint: "1 pendente",
      icon: Building2,
      cor: "text-[#0B2238] bg-slate-100",
    },
    {
      label: "Alertas anti-fraude",
      valor: "01",
      hint: "Tentativa fora de horário",
      icon: AlertTriangle,
      cor: "text-red-600 bg-red-50",
    },
    {
      label: "Consumo do mês",
      valor: "184 L",
      hint: "R$ 12.480 estimado",
      icon: Calculator,
      cor: "text-[#D4AF37] bg-amber-50",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.cor}`}
              >
                <k.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold truncate">
                  {k.label}
                </p>
                <p className="text-xl font-black text-[#0B2238]">{k.valor}</p>
                <p className="text-[10px] text-slate-500">{k.hint}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type Status = "verde" | "amarelo" | "vermelho" | "laranja";
const STATUS_META: Record<Status, { label: string; cor: string; badge: string }> = {
  verde: {
    label: "Auditado ✓",
    cor: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  amarelo: {
    label: "Dwell ativo",
    cor: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  vermelho: {
    label: "Pendente",
    cor: "border-l-red-500",
    badge: "bg-red-100 text-red-700",
  },
  laranja: {
    label: "Alerta IA",
    cor: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
};

function AmbientesGrid({ vertical }: { vertical: Vertical }) {
  const [modal, setModal] = useState<null | { nome: string; status: Status }>(null);
  const base =
    vertical === "educacional"
      ? [
          { nome: "Sala 04 · Bloco B", status: "verde" as Status, hora: "09:12" },
          { nome: "Refeitório Central", status: "verde" as Status, hora: "09:34" },
          { nome: "Banheiro Infantil 01", status: "amarelo" as Status, hora: "—" },
          { nome: "Sala dos Professores", status: "verde" as Status, hora: "08:45" },
          { nome: "Biblioteca", status: "vermelho" as Status, hora: "Pendente" },
          { nome: "Quadra Coberta", status: "laranja" as Status, hora: "09:02" },
          { nome: "Sala 07 · Bloco A", status: "verde" as Status, hora: "10:15" },
          { nome: "Berçário 02", status: "verde" as Status, hora: "07:58" },
        ]
      : [
          { nome: "Câmara Fria 02 · Corte", status: "verde" as Status, hora: "06:12" },
          { nome: "Sala de Evisceração", status: "amarelo" as Status, hora: "—" },
          { nome: "Túnel de Congelamento", status: "verde" as Status, hora: "06:34" },
          { nome: "Expedição SIF", status: "vermelho" as Status, hora: "Pendente" },
          { nome: "Vestiário Área Suja", status: "verde" as Status, hora: "05:45" },
          { nome: "Linha de Filetagem", status: "laranja" as Status, hora: "06:02" },
          { nome: "Antecâmara Frigorífica", status: "verde" as Status, hora: "07:15" },
          { nome: "Sala de Salga", status: "verde" as Status, hora: "06:58" },
        ];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {base.map((a) => {
          const m = STATUS_META[a.status];
          return (
            <button
              key={a.nome}
              onClick={() => setModal({ nome: a.nome, status: a.status })}
              className={`text-left bg-white border border-slate-200 border-l-4 ${m.cor} rounded-xl p-4 hover:shadow-md transition`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className={`${m.badge} hover:${m.badge} text-[10px]`}>
                  {m.label}
                </Badge>
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-black text-[#0B2238]">{a.nome}</p>
              <p className="text-xs text-slate-500 mt-1">Último registro: {a.hora}</p>
            </button>
          );
        })}
      </div>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          {modal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#0B2238]">{modal.nome}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div
                  className="h-48 rounded-xl overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: gerarFotoSimulada("DEPOIS", modal.nome),
                  }}
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Info label="Operador" valor="Maria S. · PIN 1234" />
                  <Info label="Produto" valor="Peroxy 4D · 1:100" />
                  <Info label="Dwell" valor="5 min · concluído" />
                  <Info label="GPS" valor="-23.5505, -46.6333" />
                  <Info label="Validação IA" valor="Aprovada" />
                  <Info label="Hash" valor="0xA83f19cd" />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        {label}
      </p>
      <p className="text-[#0B2238] font-bold">{valor}</p>
    </div>
  );
}

function CalculadoraInsumos() {
  const [produtoId, setProdutoId] = useState<ProdutoId>("peroxy4d");
  const [area, setArea] = useState(500);
  const [freq, setFreq] = useState(2);
  const p = PRODUTOS[produtoId];

  const calc = useMemo(() => {
    const litrosPorAplicacao = area * 0.05; // 50ml/m² como base
    const litrosDia = litrosPorAplicacao * freq;
    const concentradoMlDia = (litrosDia * 1000) / p.ratio;
    const concentradoLitrosMes = (concentradoMlDia * 30) / 1000;
    const galoes5L = Math.ceil(concentradoLitrosMes / 5);
    const custoMes = concentradoLitrosMes * p.precoConcentradoLitro;
    return {
      litrosDia,
      concentradoMlDia,
      concentradoLitrosMes,
      galoes5L,
      custoMes,
    };
  }, [area, freq, p]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#0B2238] flex items-center gap-2 text-base">
            <Calculator className="w-5 h-5 text-[#D4AF37]" /> Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-[#0B2238]">Produto Spartan</Label>
            <Select value={produtoId} onValueChange={(v) => setProdutoId(v as ProdutoId)}>
              <SelectTrigger className="h-11 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRODUTOS) as ProdutoId[]).map((id) => (
                  <SelectItem key={id} value={id}>
                    {PRODUTOS[id].nome} · {PRODUTOS[id].diluicao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold text-[#0B2238]">Área total (m²)</Label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-11 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-[#0B2238]">
              Frequência diária (x/dia)
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={freq}
              onChange={(e) => setFreq(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-11 mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-gradient-to-br from-[#0B2238] to-[#0F172A] text-white">
        <CardHeader>
          <CardTitle className="text-[#D4AF37] flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5" /> Resultado automático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Resultado
            label="Solução pronta / dia"
            valor={`${calc.litrosDia.toFixed(1)} L`}
          />
          <Resultado
            label="Concentrado / dia"
            valor={`${calc.concentradoMlDia.toFixed(0)} mL`}
          />
          <Resultado
            label="Consumo mensal"
            valor={`${calc.concentradoLitrosMes.toFixed(1)} L · ${calc.galoes5L} galão(ões) 5L`}
          />
          <Resultado
            label="Custo mensal estimado"
            valor={calc.custoMes.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            destaque
          />
          {p.grauAlimenticio && (
            <Badge className="bg-amber-400 text-[#0B2238] hover:bg-amber-400">
              Grau alimentício · aprovado SIF
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Resultado({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
      <span className="text-xs uppercase tracking-widest text-white/60 font-bold">
        {label}
      </span>
      <span
        className={`font-black tabular-nums ${
          destaque ? "text-2xl text-[#D4AF37]" : "text-lg text-white"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

function RelatorioCompliance({ vertical }: { vertical: Vertical }) {
  const registros =
    vertical === "educacional"
      ? [
          ["12/07 09:12", "Sala 04·B", "Maria S.", "Peroxy 4D", "5min ✓", "Aprovado"],
          ["12/07 09:34", "Refeitório", "João P.", "DMQ", "10min ✓", "Aprovado"],
          ["12/07 09:02", "Quadra", "Ana R.", "Sparquat", "5min ✓", "Alerta IA"],
          ["12/07 08:45", "Sala Prof.", "Maria S.", "Peroxy 4D", "5min ✓", "Aprovado"],
        ]
      : [
          ["12/07 06:12", "Câmara Fria 02", "Carla M.", "Sani-T-10", "1min ✓", "Aprovado"],
          ["12/07 06:34", "Túnel Cong.", "Beto L.", "Sani-T-10", "1min ✓", "Aprovado"],
          ["12/07 06:02", "Filetagem", "Beto L.", "CJ-20", "3min ✓", "Alerta IA"],
          ["12/07 05:45", "Vestiário", "Carla M.", "DMQ", "10min ✓", "Aprovado"],
        ];
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#0B2238] text-base">
          Registros auditáveis · {vertical === "educacional" ? "Vigilância" : "SIF"}
        </CardTitle>
        <Button className="bg-[#D4AF37] text-[#0B2238] hover:bg-[#D4AF37]/90 font-black">
          <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="py-2">Data/Hora</th>
                <th>Sala</th>
                <th>Operador</th>
                <th>Produto</th>
                <th>Dwell</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 font-mono text-xs">{r[0]}</td>
                  <td className="font-bold text-[#0B2238]">{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td className="text-emerald-600 font-bold">{r[4]}</td>
                  <td>
                    <Badge
                      className={
                        r[5] === "Aprovado"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                      }
                    >
                      {r[5]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
