import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Wrench } from "lucide-react";
import { atualizarPlanoAcao, listarPlanosAcao } from "@/lib/compliance-db";

export const Route = createFileRoute("/_authenticated/painel/capa")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  component: CapaPage,
});

const STATUS: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

function CapaPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<"abertas" | "todas">("abertas");
  const { data, isLoading } = useQuery({ queryKey: ["capa"], queryFn: listarPlanosAcao });

  const atualizar = useMutation({
    mutationFn: (v: { id: string; campos: Parameters<typeof atualizarPlanoAcao>[1] }) =>
      atualizarPlanoAcao(v.id, v.campos),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["capa"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const lista = (data ?? []).filter((p) => filtro === "todas" || p.status !== "concluida");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-teal" />
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Planos de ação (CAPA)
        </h2>
        <div className="ml-auto flex gap-1 rounded-lg bg-secondary p-1">
          {(["abertas", "todas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-black ${
                filtro === f ? "bg-teal text-teal-foreground" : "text-muted-foreground"
              }`}
            >
              {f === "abertas" ? "Abertas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum plano de ação pendente. Não conformidades críticas abrem tarefas aqui
          automaticamente.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-black text-foreground">{p.titulo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.descricao}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Prazo: {p.prazo ? new Date(p.prazo).toLocaleDateString("pt-BR") : "sem prazo"}
                  </p>
                </div>
                <select
                  value={p.status}
                  onChange={(e) =>
                    atualizar.mutate({
                      id: p.id,
                      campos: {
                        status: e.target.value,
                        concluida_em:
                          e.target.value === "concluida" ? new Date().toISOString() : null,
                      },
                    })
                  }
                  className="rounded-lg border border-input px-2 py-2 text-xs font-bold"
                >
                  {Object.entries(STATUS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  defaultValue={p.responsavel ?? ""}
                  onBlur={(e) =>
                    atualizar.mutate({ id: p.id, campos: { responsavel: e.target.value } })
                  }
                  placeholder="Responsável pela correção"
                  className="rounded-lg border border-input px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  defaultValue={p.prazo?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    atualizar.mutate({ id: p.id, campos: { prazo: e.target.value || null } })
                  }
                  className="rounded-lg border border-input px-3 py-2 text-sm"
                />
                <textarea
                  defaultValue={p.causa_raiz ?? ""}
                  onBlur={(e) =>
                    atualizar.mutate({ id: p.id, campos: { causa_raiz: e.target.value } })
                  }
                  placeholder="Causa raiz"
                  className="rounded-lg border border-input px-3 py-2 text-sm"
                />
                <textarea
                  defaultValue={p.acao_corretiva ?? ""}
                  onBlur={(e) =>
                    atualizar.mutate({ id: p.id, campos: { acao_corretiva: e.target.value } })
                  }
                  placeholder="Ação corretiva aplicada"
                  className="rounded-lg border border-input px-3 py-2 text-sm"
                />
              </div>

              {p.status === "concluida" && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal">
                  <CheckCircle2 className="h-4 w-4" /> Concluída
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
