import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { enfileirar } from "@/lib/oxyvra-offline";

import {
  addIncidente,
  INCIDENTE_META,
  INCIDENTE_TIPOS,
  useCurrentUnit,
  useHydrated,
  getCurrentPosition,
  type IncidenteTipo,
} from "@/lib/oxyvra-store";

export const Route = createFileRoute("/intercorrencia")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Registrar Intercorrência" },
      { name: "description", content: "Registre surtos, faltas, doenças e outras intercorrências da unidade." },
      { property: "og:title", content: "Oxyvra — Registrar Intercorrência" },
      { property: "og:description", content: "Registre surtos, faltas, doenças e outras intercorrências da unidade." },
    ],
  }),
  component: IntercorrenciaScreen,
});

function IntercorrenciaScreen() {
  const navigate = useNavigate();
  const unit = useCurrentUnit();
  const [tipo, setTipo] = useState<IncidenteTipo>("surto");
  const [quantidade, setQuantidade] = useState(1);
  const [descricao, setDescricao] = useState("");
  const [reportadoPor, setReportadoPor] = useState("");
  const [ok, setOk] = useState(false);

  const hidratado = useHydrated();

  useEffect(() => {
    if (hidratado && !unit) navigate({ to: "/entrar" });
    else if (unit && !reportadoPor && unit.responsavel) setReportadoPor(unit.responsavel);
  }, [hidratado, unit, navigate, reportadoPor]);

  if (!unit) return null;

  const salvar = async () => {
    if (!reportadoPor.trim()) return;
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const p = await getCurrentPosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 });
      lat = p.lat;
      lng = p.lng;
    } catch {
      // Geolocalização opcional; segue sem coordenadas.
    }
    addIncidente({
      unitId: unit.id,
      tipo,
      quantidade: Math.max(1, quantidade),
      descricao: descricao.trim(),
      reportadoPor: reportadoPor.trim(),
      lat,
      lng,
    });
    void enfileirar("incidente", { unitId: unit.id, tipo, quando: Date.now() });

    setOk(true);
    setTimeout(() => navigate({ to: "/menu" }), 1200);
  };

  const meta = INCIDENTE_META[tipo];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="bg-navy text-navy-foreground px-5 pt-8 pb-6 rounded-b-[2rem] shadow-elevated">
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <OxyvraLogo size={40} />
          <div className="min-w-0">
            <p className="text-[10px] text-gold font-bold tracking-widest uppercase">Intercorrência</p>
            <p className="text-sm font-black truncate">{unit.nome}</p>
          </div>
        </div>
      </header>

      <section className="flex-1 px-5 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-black text-navy">Qual o tipo?</h2>
          <p className="text-sm text-muted-foreground mb-3">Toque em uma opção</p>
          <div className="grid grid-cols-2 gap-3">
            {INCIDENTE_TIPOS.map((t) => {
              const m = INCIDENTE_META[t];
              const active = tipo === t;
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                    active
                      ? "border-gold bg-gold/10 shadow-card"
                      : "border-border bg-card"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2"
                    style={{ backgroundColor: `${m.hex}20`, color: m.hex }}
                  >
                    <span aria-hidden>{m.emoji}</span>
                  </div>
                  <p className="font-black text-navy">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{m.descricao}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-black text-navy mb-2">Quantidade</h3>
          <div className="flex items-center gap-3 bg-card border-2 border-border rounded-2xl p-3">
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              className="w-14 h-14 rounded-xl bg-secondary text-navy flex items-center justify-center active:bg-gold/30"
              aria-label="Diminuir"
            >
              <Minus className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-4xl font-black text-navy">{quantidade}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label.toLowerCase()}{quantidade > 1 ? "(s)" : ""}
              </p>
            </div>
            <button
              onClick={() => setQuantidade((q) => q + 1)}
              className="w-14 h-14 rounded-xl bg-secondary text-navy flex items-center justify-center active:bg-gold/30"
              aria-label="Aumentar"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-black text-navy block mb-1">
            Quem está reportando?
          </label>
          <input
            value={reportadoPor}
            onChange={(e) => setReportadoPor(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-border bg-card focus:outline-none focus:border-gold"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="text-sm font-black text-navy block mb-1">
            Detalhes (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:outline-none focus:border-gold resize-none"
            placeholder="Ex: 3 crianças com sintomas de virose na sala 4"
          />
        </div>

        <button
          onClick={salvar}
          disabled={!reportadoPor.trim() || ok}
          className="w-full h-16 rounded-2xl bg-navy text-white text-lg font-black tracking-wider shadow-elevated disabled:opacity-40 active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
        >
          {ok ? (
            <>
              <Check className="w-6 h-6 text-gold" /> REGISTRADO
            </>
          ) : (
            "REGISTRAR INTERCORRÊNCIA"
          )}
        </button>
      </section>
    </main>
  );
}
