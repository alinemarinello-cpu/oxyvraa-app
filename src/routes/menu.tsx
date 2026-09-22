import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { AlertOctagon, LogOut, Award, RefreshCw, Search, CheckCircle2 } from "lucide-react";
import {
  getAmbienteMeta,
  UNIT_TIPO_META,
  CORES_LIMPEZA,
  getPrefeituraById,
  setCurrentUnit,
  useCurrentUnit,
  useHydrated,
  useUnitScore,
  useCleanings,
  getCleaningsToday,
  getPinAtual,
  reviewCleaning,
  getReprovadasPendentes,
  getFrequenciaEsperada,
} from "@/lib/oxyvra-store";


export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Escolha o Ambiente" },
      { name: "description", content: "Selecione o ambiente que será higienizado agora." },
      { property: "og:title", content: "Oxyvra — Escolha o Ambiente" },
      { property: "og:description", content: "Selecione o ambiente que será higienizado agora." },
    ],
  }),
  component: MenuScreen,
});

function MenuScreen() {
  const navigate = useNavigate();
  const unit = useCurrentUnit();
  const score = useUnitScore(unit?.id);
  const cleanings = useCleanings();
  void cleanings; // força reatividade quando registros mudam

  const hidratado = useHydrated();
  const [busca, setBusca] = useState("");

  const concluidosHoje = useMemo(() => {
    if (!unit) return new Set<string>();
    return new Set(
      getCleaningsToday()
        .filter((c) => c.unitId === unit.id)
        .map((c) => c.ambiente),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, cleanings]);



  useEffect(() => {
    if (hidratado && !unit) navigate({ to: "/entrar" });
  }, [hidratado, unit, navigate]);

  const reprovadas = useMemo(
    () => (unit ? getReprovadasPendentes(unit.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, cleanings],
  );
  const reprovadasPorAmbiente = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of reprovadas) if (!m[r.ambiente]) m[r.ambiente] = r.id;
    return m;
  }, [reprovadas]);

  const pinAtual = getPinAtual();
  const ehSupervisor = pinAtual?.papel === "supervisor";
  const pendentesAprovacao = useMemo(
    () =>
      unit
        ? getCleaningsToday(unit.id)
            .filter((c) => c.status === "pendente")
            .sort((a, b) => b.timestamp - a.timestamp)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, cleanings],
  );

  const sair = () => {
    setCurrentUnit(null);
    navigate({ to: "/entrar" });
  };

  if (!unit) return null;
  const pref = getPrefeituraById(unit.prefeituraId);
  // No login por PIN, o espelho local guarda o NOME do cliente em prefeituraId
  // (não o UUID), então a consulta por ID falha — usar o próprio valor como fallback.
  const prefRotulo = pref ? `${pref.nome}/${pref.uf}` : unit.prefeituraId || "";
  const tipoMeta = UNIT_TIPO_META[unit.tipo];

  const scoreLabel =
    !score ? "—" : score.score >= 90 ? "OURO" : score.score >= 70 ? "BOM" : score.score >= 50 ? "ATENÇÃO" : "CRÍTICO";
  const scoreHex =
    !score ? "#94a3b8"
      : score.score >= 90 ? "#D4AF37"
        : score.score >= 70 ? "#16A34A"
          : score.score >= 50 ? "#EAB308"
            : "#DC2626";

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="bg-navy text-navy-foreground px-5 pt-10 pb-8 rounded-b-[2rem] shadow-elevated">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <OxyvraLogo size={44} />
            <div className="min-w-0">
              <p className="text-[10px] text-gold font-bold tracking-widest uppercase flex items-center gap-1">
                <span>{tipoMeta.emoji}</span>
                <span className="truncate">
                  {prefRotulo}
                </span>
              </p>
              <p className="text-sm text-white/80 truncate">
                Olá, {unit.responsavel}
                {pinAtual
                  ? ` · ${pinAtual.nome}${ehSupervisor ? " (supervisor)" : ""}`
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={sair}
            className="shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Cartão grande da instituição */}
        <div className="bg-white/10 border-2 border-gold/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gold text-navy flex items-center justify-center text-5xl shrink-0 shadow-lg">
            <span aria-hidden>{tipoMeta.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-black tracking-widest bg-gold text-navy px-2 py-0.5 rounded-full mb-1">
              {tipoMeta.label.toUpperCase()}
            </span>
            <p className="text-lg font-black leading-tight truncate">{unit.nome}</p>
            <p className="text-xs text-white/80 truncate">📍 {unit.bairro}</p>
          </div>
        </div>

        {/* Score do dia */}
        {score && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
              style={{ background: scoreHex, color: "#0B2238" }}
            >
              <Award className="w-4 h-4" />
              <span className="text-lg font-black leading-none">{score.score}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-widest font-black text-gold">ÍNDICE DE BIOSSEGURANÇA</p>
              <p className="text-sm font-black">Padrão: {scoreLabel}</p>
              <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${score.cumprimento}%`, background: "#D4AF37" }}
                />
              </div>
              <p className="text-[10px] text-white/70 mt-1">
                {score.hoje} de {score.esperado} higienizações hoje
                {score.reprovadas > 0 && ` • ${score.reprovadas} reprovada${score.reprovadas > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        )}
      </header>

      <section className="flex-1 px-5 py-6">
        <h1 className="text-2xl font-black text-foreground text-center">
          O que você vai higienizar agora?
        </h1>
        <p className="text-center text-muted-foreground mt-1 mb-4">Toque em um dos ambientes</p>

        {/* Progresso simples do dia */}
        <div className="mb-5 rounded-2xl bg-card border-2 border-border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
            <p className="text-sm font-black text-navy">
              {concluidosHoje.size} de {unit.ambientes.length} ambientes já feitos hoje
            </p>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{
                width: `${unit.ambientes.length ? Math.round((concluidosHoje.size / unit.ambientes.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {ehSupervisor && (
          <div className="mb-5 rounded-2xl bg-navy text-white p-4 border-2 border-gold/60">
            <p className="text-[10px] font-black tracking-widest text-gold uppercase">
              Modo supervisor — {pinAtual?.nome}
            </p>
            <p className="mt-1 text-sm font-bold">
              Turno: {concluidosHoje.size} de {unit.ambientes.length} ambientes feitos ·{" "}
              {reprovadas.length} a refazer · {pendentesAprovacao.length} aguardando sua aprovação
            </p>
            {pendentesAprovacao.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendentesAprovacao.map((c) => {
                  const meta = getAmbienteMeta(c.ambiente, unit.ambientesCustom);
                  return (
                    <div key={c.id} className="rounded-xl bg-white/10 p-3">
                      <p className="text-sm font-black">
                        {meta.emoji} {meta.titulo}
                      </p>
                      <p className="text-xs text-white/70">
                        {c.servente}
                        {c.pinNome ? ` · PIN ${c.pinNome}` : ""} ·{" "}
                        {new Date(c.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            reviewCleaning(c.id, "aprovada", undefined, pinAtual?.nome)
                          }
                          className="flex-1 min-h-[44px] rounded-xl bg-teal text-sm font-black text-teal-foreground"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() =>
                            reviewCleaning(
                              c.id,
                              "reprovada",
                              "Reprovado pelo supervisor do turno",
                              pinAtual?.nome,
                            )
                          }
                          className="flex-1 min-h-[44px] rounded-xl bg-destructive text-sm font-black text-white"
                        >
                          Reprovar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {reprovadas.length > 0 && (
          <div className="mb-4 rounded-2xl bg-destructive/10 border-2 border-destructive/40 p-3 text-destructive text-sm flex items-center gap-2">
            <RefreshCw className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-black">
                {reprovadas.length} limpeza{reprovadas.length > 1 ? "s" : ""} precisam ser refeitas
              </p>
              <p className="text-xs opacity-90">Ambientes marcados em vermelho abaixo</p>
            </div>
          </div>
        )}

        {unit.ambientes.length > 6 && (
          <div className="mb-4 relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar ambiente…"
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card text-navy font-bold focus:outline-none focus:border-gold"
            />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {unit.ambientes
            .filter((id) => {
              if (!busca.trim()) return true;
              const m = getAmbienteMeta(id, unit.ambientesCustom);
              return `${m.titulo} ${m.label}`.toLowerCase().includes(busca.trim().toLowerCase());
            })
            .map((id) => {
            const a = getAmbienteMeta(id, unit.ambientesCustom);

            const locais = (unit.locais ?? []).filter((l) => l.tipo === id);
            const cores = Array.from(
              new Set(locais.map((l) => l.cor).filter(Boolean) as string[]),
            );
            const reprovadaId = reprovadasPorAmbiente[id];
            const esperadoAmbiente =
              (locais.length
                ? locais.reduce((s, l) => s + getFrequenciaEsperada(l.tipo, l), 0)
                : getFrequenciaEsperada(id));
            return (
              <Link
                key={a.id}
                to="/acao/$tipo"
                params={{ tipo: a.id }}
                search={reprovadaId ? { refazer: reprovadaId } : {}}
                className={`group relative bg-card rounded-3xl border-2 p-5 shadow-card active:scale-[0.98] transition flex items-center gap-4 ${
                  reprovadaId
                    ? "border-destructive active:border-destructive"
                    : "border-border active:border-gold"
                }`}
              >
                {reprovadaId ? (
                  <span className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] font-black tracking-widest px-2 py-1 rounded-full shadow-md">
                    REFAZER
                  </span>
                ) : concluidosHoje.has(id) ? (
                  <span className="absolute -top-2 -right-2 bg-success text-success-foreground text-[10px] font-black tracking-widest px-2 py-1 rounded-full shadow-md">
                    FEITO HOJE
                  </span>
                ) : null}

                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-5xl border-2 border-gold/60">
                  <span aria-hidden>{a.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black text-navy tracking-wide">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.sub}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-navy bg-secondary px-2 py-0.5 rounded-full">
                      {esperadoAmbiente}x/dia
                    </span>
                    {cores.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Cor:
                        </span>
                        {cores.map((c) => {
                          const meta = CORES_LIMPEZA[c as keyof typeof CORES_LIMPEZA];
                          return (
                            <span
                              key={c}
                              title={meta.label}
                              className="w-4 h-4 rounded-full border-2 border-white shadow"
                              style={{ backgroundColor: meta.hex }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center text-2xl font-black shrink-0">
                  ›
                </div>
              </Link>
            );
          })}
        </div>

        {unit.ambientes.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
            <p className="text-4xl">🧹</p>
            <p className="font-black text-navy mt-2">Nenhum ambiente cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Peça ao gestor para cadastrar os ambientes desta unidade no painel ADM MASTER.
            </p>
          </div>
        )}

        {unit.ambientes.length > 0 &&
          busca.trim() &&
          !unit.ambientes.some((id) => {
            const m = getAmbienteMeta(id, unit.ambientesCustom);
            return `${m.titulo} ${m.label}`.toLowerCase().includes(busca.trim().toLowerCase());
          }) && (
            <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
              <p className="font-black text-navy">Nenhum ambiente encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Tente outro nome.</p>
            </div>
          )}



        {(unit.locais ?? []).length > 0 && (
          <div className="mt-6 rounded-2xl bg-card border-2 border-border p-4">
            <p className="text-[10px] font-black tracking-widest text-gold mb-2">
              HISTÓRICO POR LOCAL
            </p>
            <div className="flex flex-wrap gap-2">
              {(unit.locais ?? []).map((l) => {
                const m = getAmbienteMeta(l.tipo, unit.ambientesCustom);
                return (
                  <Link
                    key={l.id}
                    to="/historico/$localId"
                    params={{ localId: l.id }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-secondary border border-border text-sm font-bold text-navy active:bg-gold/30"
                  >
                    <span>{m.emoji}</span>
                    <span className="truncate max-w-[10rem]">{l.nome}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}


        <Link
          to="/intercorrencia"
          className="mt-6 block bg-destructive/10 border-2 border-destructive/40 rounded-2xl p-4 active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-destructive text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-destructive uppercase tracking-wide text-sm">
                Registrar Intercorrência
              </p>
              <p className="text-xs text-muted-foreground">
                Surto, faltas, doenças, acidentes
              </p>
            </div>
            <span className="text-destructive text-2xl font-black">›</span>
          </div>
        </Link>
      </section>

      <footer className="p-5 text-center text-xs text-muted-foreground">
        Selo <span className="text-gold font-bold">Padrão Ouro Oxyvra</span> • Biossegurança
      </footer>
    </main>
  );
}
