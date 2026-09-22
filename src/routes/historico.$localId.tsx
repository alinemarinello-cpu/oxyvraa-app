import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Check, X, Clock, Camera, MapPin } from "lucide-react";
import {
  getAmbienteMeta,
  getCleaningsByLocal,
  getUnits,
  useCleanings,
  formatDuracao,
} from "@/lib/oxyvra-store";

export const Route = createFileRoute("/historico/$localId")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Histórico do Local" },
      { name: "description", content: "Linha do tempo de todas as higienizações do local." },
      { property: "og:title", content: "Oxyvra — Histórico do Local" },
      { property: "og:description", content: "Linha do tempo de todas as higienizações do local." },
    ],
  }),
  loader: ({ params }) => {
    for (const u of getUnits()) {
      const l = (u.locais ?? []).find((x) => x.id === params.localId);
      if (l) return { unitId: u.id, localId: l.id, tipo: l.tipo, nome: l.nome };
    }
    throw notFound();
  },
  notFoundComponent: () => (
    <main className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-black text-navy">Local não encontrado</h1>
        <Link to="/menu" className="underline text-navy/70 mt-4 inline-block">Voltar ao menu</Link>
      </div>
    </main>
  ),
  component: HistoricoLocal,
});

function HistoricoLocal() {
  const { unitId, localId, tipo, nome } = Route.useLoaderData();
  const cleanings = useCleanings();
  void cleanings;
  const registros = useMemo(
    () => getCleaningsByLocal(localId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localId, cleanings],
  );
  const unit = getUnits().find((u) => u.id === unitId);
  const meta = getAmbienteMeta(tipo, unit?.ambientesCustom);

  return (
    <main className="min-h-screen bg-background flex flex-col">
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
            <p className="text-xs text-gold font-semibold tracking-widest">HISTÓRICO</p>
            <p className="text-lg font-black truncate">
              <span className="mr-2">{meta.emoji}</span>
              {nome}
            </p>
            {unit && <p className="text-xs text-white/70 truncate">{unit.nome}</p>}
          </div>
        </div>
      </header>

      <section className="flex-1 px-5 py-6">
        {registros.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
            Nenhuma higienização registrada para este local ainda.
          </div>
        ) : (
          <ol className="relative border-l-2 border-gold/40 pl-5 space-y-4">
            {registros.map((r) => {
              const cor =
                r.status === "aprovada" ? "bg-success" :
                  r.status === "reprovada" ? "bg-destructive" : "bg-gold";
              const label =
                r.status === "aprovada" ? "APROVADA" :
                  r.status === "reprovada" ? "REPROVADA" : "PENDENTE";
              return (
                <li key={r.id} className="relative">
                  <span className={`absolute -left-[26px] top-2 w-4 h-4 rounded-full ${cor} ring-4 ring-background`} />
                  <div className="bg-card rounded-2xl border border-border p-3 shadow-card">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-navy">
                        {new Date(r.timestamp).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full ${cor} text-white`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Por {r.servente}</p>

                    {(r.fotoAntes || r.fotoDepois) && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {r.fotoAntes && (
                          <figure className="rounded-xl overflow-hidden border border-border">
                            <img src={r.fotoAntes} alt="Antes" className="w-full aspect-square object-cover" />
                            <figcaption className="text-[10px] text-center font-black text-muted-foreground py-1">ANTES</figcaption>
                          </figure>
                        )}
                        {r.fotoDepois && (
                          <figure className="rounded-xl overflow-hidden border border-gold/50">
                            <img src={r.fotoDepois} alt="Depois" className="w-full aspect-square object-cover" />
                            <figcaption className="text-[10px] text-center font-black text-gold py-1">DEPOIS</figcaption>
                          </figure>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                      {r.duracaoSeg != null && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuracao(r.duracaoSeg)}</span>
                      )}
                      {r.itensFeitos && (
                        <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" />{r.itensFeitos.length} itens</span>
                      )}
                      {r.foraDaArea && (
                        <span className="inline-flex items-center gap-1 text-destructive font-bold"><MapPin className="w-3 h-3" />fora da área</span>
                      )}
                      {!r.fotoDepois && (
                        <span className="inline-flex items-center gap-1"><Camera className="w-3 h-3" />sem foto</span>
                      )}
                    </div>

                    {r.status === "reprovada" && r.motivoReprovacao && (
                      <div className="mt-2 rounded-lg bg-destructive/10 text-destructive text-xs p-2 flex items-start gap-2">
                        <X className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><b>Motivo:</b> {r.motivoReprovacao}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
