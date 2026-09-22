import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { Award, Building2, TrendingUp, Camera } from "lucide-react";
import {
  UNIT_TIPO_META,
  computeUnitScore,
  getPrefeituraBySlug,
  getRanking,
  getUnits,
  useCleanings,
  usePrefeituras,
  useUnits,
} from "@/lib/oxyvra-store";

export const Route = createFileRoute("/publico/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Portal da Transparência — ${params.slug}` },
      {
        name: "description",
        content: "Selo Padrão Ouro Oxyvra: acompanhe a biossegurança das unidades atendidas.",
      },
      { property: "og:title", content: "Portal da Transparência Oxyvra" },
      {
        property: "og:description",
        content: "Selo Padrão Ouro Oxyvra: acompanhe a biossegurança das unidades atendidas.",
      },
    ],
  }),
  loader: ({ params }) => {
    const pref = getPrefeituraBySlug(params.slug);
    if (!pref) throw notFound();
    return { prefeituraId: pref.id };
  },
  component: PortalPublico,
  notFoundComponent: () => (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-black text-navy">Prefeitura não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          Verifique o link ou entre em contato com o gestor.
        </p>
      </div>
    </main>
  ),
});

function PortalPublico() {
  const { slug } = Route.useParams();
  const prefeituraId = getPrefeituraBySlug(slug)?.id ?? "";
  const prefs = usePrefeituras();
  const units = useUnits();
  const cleanings = useCleanings();
  void units;
  void cleanings;

  const pref = prefs.find((p) => p.id === prefeituraId);
  const ranking = useMemo(() => getRanking(prefeituraId), [prefeituraId, units, cleanings]); // eslint-disable-line react-hooks/exhaustive-deps
  const unidades = useMemo(
    () => getUnits().filter((u) => u.prefeituraId === prefeituraId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefeituraId, units],
  );

  const mediaScore = ranking.length
    ? Math.round(ranking.reduce((s, r) => s + r.score.score, 0) / ranking.length)
    : 0;

  const ultimasAprovadas = useMemo(() => {
    const unitIds = new Set(unidades.map((u) => u.id));
    return cleanings
      .filter((c) => unitIds.has(c.unitId) && c.status === "aprovada" && c.fotoDepois)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidades, cleanings]);

  const totalHoje = ranking.reduce((s, r) => s + r.score.hoje, 0);
  const totalEsperado = ranking.reduce((s, r) => s + r.score.esperado, 0);

  if (!pref) return null;

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <OxyvraLogo size={72} />
          <div className="min-w-0">
            <p className="text-xs font-black tracking-widest text-gold">
              PORTAL DA TRANSPARÊNCIA
            </p>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight">
              Prefeitura de {pref.nome}/{pref.uf}
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Programa Oxyvra • Biossegurança de Ambientes Coletivos
            </p>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi
            icon={<Award className="w-6 h-6" />}
            label="Índice Médio"
            value={`${mediaScore}`}
            hint={mediaScore >= 90 ? "Padrão Ouro" : mediaScore >= 70 ? "Bom" : "Em evolução"}
            gold
          />
          <Kpi
            icon={<Building2 className="w-6 h-6" />}
            label="Unidades Atendidas"
            value={String(unidades.length)}
            hint="Instituições integradas"
          />
          <Kpi
            icon={<TrendingUp className="w-6 h-6" />}
            label="Higienizações Hoje"
            value={`${totalHoje} / ${totalEsperado}`}
            hint={
              totalEsperado
                ? `${Math.round((totalHoje / Math.max(1, totalEsperado)) * 100)}% do plano`
                : "Sem plano definido"
            }
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-xl font-black text-navy mb-3">Ranking das Unidades</h2>
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          {ranking.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">
              Nenhuma unidade cadastrada para esta prefeitura ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {ranking.map((r, i) => {
                const tipoMeta = UNIT_TIPO_META[r.unit.tipo];
                const cor =
                  r.score.score >= 90 ? "#D4AF37"
                    : r.score.score >= 70 ? "#16A34A"
                      : r.score.score >= 50 ? "#EAB308"
                        : "#DC2626";
                return (
                  <li key={r.unit.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 text-center text-2xl font-black text-navy shrink-0">
                      {i + 1}º
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {tipoMeta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-navy truncate">{r.unit.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tipoMeta.label} • {r.unit.bairro}
                      </p>
                      <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${r.score.cumprimento}%`, background: cor }}
                        />
                      </div>
                    </div>
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: cor, color: "#0B2238" }}
                    >
                      <span className="text-xl font-black leading-none">{r.score.score}</span>
                      <span className="text-[9px] font-black tracking-widest">SCORE</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {ultimasAprovadas.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-xl font-black text-navy mb-3">Últimas Higienizações Aprovadas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ultimasAprovadas.map((c) => {
              const u = unidades.find((x) => x.id === c.unitId);
              return (
                <figure
                  key={c.id}
                  className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
                >
                  {c.fotoDepois ? (
                    <img src={c.fotoDepois} alt="Registro aprovado" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-secondary flex items-center justify-center text-4xl">
                      <Camera className="w-8 h-8 text-navy/40" />
                    </div>
                  )}
                  <figcaption className="p-3">
                    <p className="text-xs font-black text-navy truncate">{u?.nome ?? "Unidade"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      <footer className="bg-navy text-navy-foreground py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-white/60">
          Selo <span className="text-gold font-bold">Padrão Ouro Oxyvra</span> •
          Dados atualizados em tempo real
        </div>
      </footer>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  gold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-card border ${
        gold ? "bg-gold text-navy border-gold" : "bg-card border-border"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-black">
        {icon}
        <span className="tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {hint && <p className={`text-xs mt-1 ${gold ? "text-navy/80" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}
