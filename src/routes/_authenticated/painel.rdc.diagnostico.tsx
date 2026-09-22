import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";

import {
  aplicavel,
  listarRequisitos,
  obterDiagnostico,
  perguntasVisiveis,
  salvarDiagnosticoEGerarPlano,
  type Respostas,
} from "@/lib/rdc-db";
import { SeletorUnidade, useUnidadeRdc } from "@/components/rdc/RdcContexto";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/rdc/diagnostico")({
  component: Diagnostico,
});

function Diagnostico() {
  const { data: org } = useOrganizacao();
  const { unitId, definirUnidade } = useUnidadeRdc();
  const navigate = useNavigate();
  const [respostas, setRespostas] = useState<Respostas>({});
  const [salvando, setSalvando] = useState(false);

  const { data: requisitos } = useQuery({ queryKey: ["rdc-requisitos"], queryFn: listarRequisitos });
  const { data: diag } = useQuery({
    queryKey: ["rdc-diagnostico", unitId],
    queryFn: () => obterDiagnostico(unitId),
  });

  useEffect(() => {
    if (diag?.respostas) setRespostas(diag.respostas);
  }, [diag]);

  const visiveis = perguntasVisiveis(respostas);
  const respondidas = visiveis.filter((p) => respostas[p.chave] !== undefined).length;
  const completo = respondidas === visiveis.length;
  const aplicaveis = (requisitos ?? []).filter((r) => aplicavel(r, respostas));

  const concluir = async () => {
    if (!org) return;
    setSalvando(true);
    try {
      const r = await salvarDiagnosticoEGerarPlano(org.id, unitId, respostas);
      toast.success(`Plano gerado: ${r.aplicaveis} requisitos aplicáveis.`);
      void navigate({ to: "/painel/rdc/plano" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o diagnóstico.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-lg font-black text-foreground">Diagnóstico RDC 1.002/2025</h2>
          <p className="text-sm text-muted-foreground">
            Responda o que a sua clínica faz. Só aparecem as perguntas necessárias, e o sistema
            monta o plano de adequação sozinho.
          </p>
        </div>
        <SeletorUnidade unitId={unitId} onChange={definirUnidade} />
      </div>

      <div className="space-y-3">
        {visiveis.map((p) => (
          <div key={p.chave} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-bold text-foreground">{p.texto}</p>
            {p.ajuda && <p className="mt-1 text-xs text-muted-foreground">{p.ajuda}</p>}
            {p.tipo === "numero" ? (
              <input
                type="number"
                min={0}
                value={String(respostas[p.chave] ?? "")}
                onChange={(e) =>
                  setRespostas((r) => ({ ...r, [p.chave]: Number(e.target.value || 0) }))
                }
                className="mt-3 w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold"
              />
            ) : (
              <div className="mt-3 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setRespostas((r) => ({ ...r, [p.chave]: v }))}
                    className={`rounded-xl px-4 py-2 text-sm font-black ${
                      respostas[p.chave] === v
                        ? "bg-navy text-gold"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {v ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-teal/40 bg-teal/5 p-5">
        <p className="text-sm font-black text-foreground">
          {respondidas} de {visiveis.length} perguntas respondidas
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Com as respostas atuais, {aplicaveis.length} requisitos da RDC 1.002/2025 se aplicam à sua
          clínica. Os demais ficam registrados como “não se aplica”.
        </p>
        <button
          onClick={() => void concluir()}
          disabled={!completo || salvando || !org}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-50"
        >
          <ClipboardCheck className="h-4 w-4" />
          {salvando ? "Gerando…" : "Iniciar plano de adequação"}
        </button>
      </div>
    </div>
  );
}
