import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, CloudUpload, WifiOff } from "lucide-react";
import { listarAtribuicoes, listarChecklists, listarUnidades } from "@/lib/compliance-db";
import { contarPendentesExecucao, reenviarPendentes } from "@/lib/compliance-fila";
import { submeterExecucao } from "@/lib/compliance.functions";

export const Route = createFileRoute("/_authenticated/checklist/")({
  component: ListaChecklists,
});

function ListaChecklists() {
  const enviar = useServerFn(submeterExecucao);
  const [pend, setPend] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["checklists-campo"],
    queryFn: async () => {
      const [checklists, atribuicoes, unidades] = await Promise.all([
        listarChecklists(),
        listarAtribuicoes(),
        listarUnidades(),
      ]);
      return { checklists, atribuicoes, unidades };
    },
  });

  useEffect(() => {
    setPend(contarPendentesExecucao());
  }, []);

  async function sincronizar() {
    setEnviando(true);
    await reenviarPendentes((p) => enviar({ data: p }));
    setPend(contarPendentesExecucao());
    setEnviando(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <header>
          <h1 className="text-xl font-black text-foreground">Checklists do dia</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o checklist, responda item a item e anexe as fotos exigidas.
          </p>
        </header>

        {pend > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-teal/40 bg-teal/5 p-4">
            <WifiOff className="h-5 w-5 text-teal" />
            <p className="flex-1 text-sm font-bold text-foreground">
              {pend} checklist(s) guardado(s) no aparelho aguardando internet.
            </p>
            <button
              onClick={() => void sincronizar()}
              disabled={enviando}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-black text-teal-foreground disabled:opacity-50"
            >
              <CloudUpload className="h-3.5 w-3.5" /> Enviar
            </button>
          </div>
        )}

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data.checklists.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum checklist liberado. Peça ao gestor para importar um modelo da biblioteca.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.checklists.map((c) => {
              const vinculos = data.atribuicoes.filter((a) => a.checklist_id === c.id);
              return (
                <li key={c.id}>
                  <Link
                    to="/checklist/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"
                  >
                    <ClipboardList className="h-6 w-6 text-teal" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-foreground">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.norma || "Checklist interno"}
                        {vinculos.length > 0 && ` · ${vinculos[0].frequencia}`}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
