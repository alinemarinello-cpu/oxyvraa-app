import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileDown, Stethoscope } from "lucide-react";

import {
  calcularScore,
  faixaScore,
  listarEvidencias,
  listarHistoricoScore,
  listarPlano,
  listarPlanoRede,
  listarRiscos,
  montarAlertas,
  registrarSnapshot,
} from "@/lib/rdc-db";
import { Barra, SeletorUnidade, useUnidades, useUnidadeRdc } from "@/components/rdc/RdcContexto";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/rdc/")({
  component: StatusClinica,
});

function CardNumero({ titulo, valor, alerta }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={`mt-1 text-2xl font-black ${alerta && valor > 0 ? "text-destructive" : "text-foreground"}`}>
        {valor}
      </p>
    </div>
  );
}

function StatusClinica() {
  const { data: org } = useOrganizacao();
  const { marcaDagua } = useAssinatura();
  const { unitId, definirUnidade } = useUnidadeRdc();
  const { data: unidades } = useUnidades();
  const [gerando, setGerando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["rdc-status", unitId],
    queryFn: async () => {
      const [itens, evidencias, riscos, historico, rede] = await Promise.all([
        listarPlano(unitId),
        listarEvidencias(unitId),
        listarRiscos(unitId),
        listarHistoricoScore(unitId),
        listarPlanoRede(),
      ]);
      return { itens, evidencias, riscos, historico, rede };
    },
  });

  const resumo = data ? calcularScore(data.itens, data.evidencias) : null;

  useEffect(() => {
    if (org && resumo && resumo.avaliados > 0) void registrarSnapshot(org.id, unitId, resumo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id, resumo?.score, unitId]);

  if (isLoading || !data || !resumo) {
    return <p className="text-sm text-muted-foreground">Carregando o status da clínica…</p>;
  }

  if (resumo.avaliados === 0) {
    return (
      <div className="rounded-2xl border border-teal/40 bg-teal/5 p-6">
        <h2 className="text-lg font-black text-foreground">Comece pelo diagnóstico</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Em poucos minutos você responde o perfil da clínica e o Oxyvra monta o seu plano de
          adequação à RDC 1.002/2025, com prazos e evidências.
        </p>
        <Link
          to="/painel/rdc/diagnostico"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
        >
          <Stethoscope className="h-4 w-4" /> Fazer diagnóstico
        </Link>
      </div>
    );
  }

  const faixa = faixaScore(resumo.score);
  const alertas = montarAlertas(resumo, data.historico);

  const porUnidade = (unidades ?? []).map((u) => ({
    nome: u.nome,
    score: calcularScore(data.rede.filter((i) => i.unit_id === u.id)).score,
    avaliados: data.rede.filter((i) => i.unit_id === u.id).length,
  }));
  const scoreRede = calcularScore(data.rede).score;

  // Dias em que a clínica se mantém em alto índice de conformidade (>= 85%).
  const manutencao = (() => {
    if (resumo.score < 85) return 0;
    const ordenado = [...data.historico].sort((a, b) => a.referencia.localeCompare(b.referencia));
    let inicio: string | null = null;
    for (let i = ordenado.length - 1; i >= 0; i -= 1) {
      const snap = ordenado[i];
      if (!snap || snap.score < 85) break;
      inicio = snap.referencia;
    }
    const desde = inicio ? new Date(inicio).getTime() : Date.now();
    return Math.max(1, Math.round((Date.now() - desde) / 86_400_000));
  })();

  const baixarRelatorio = async () => {
    setGerando(true);
    try {
      const { gerarRelatorioRdc } = await import("@/lib/rdc-relatorio");
      gerarRelatorioRdc({
        clinica: org?.nome ?? "Clínica",
        unidade: unidades?.find((u) => u.id === unitId)?.nome ?? "Clínica principal",
        responsavel: "",
        resumo,
        itens: data.itens,
        evidencias: data.evidencias,
        riscos: data.riscos,
        historico: data.historico,
        marcaDagua,
      });
      toast.success("Relatório de conformidade gerado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorUnidade unitId={unitId} onChange={definirUnidade} />
        <button
          onClick={() => void baixarRelatorio()}
          disabled={gerando}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-black text-gold disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" />
          {gerando ? "Gerando…" : "Gerar relatório de conformidade"}
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          RDC 1.002/2025 — Status da clínica
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <p className="text-5xl font-black text-foreground">{resumo.score}%</p>
          <div>
            <p className={`text-sm font-black ${faixa.classe}`}>{faixa.rotulo}</p>
            <p className="text-xs text-muted-foreground">
              Índice de conformidade sobre {resumo.avaliados} requisitos aplicáveis.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Barra valor={resumo.score} />
        </div>
      </section>

      {manutencao > 0 && (
        <section className="rounded-2xl border-2 border-teal bg-teal/5 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-teal">
            Manutenção da conformidade
          </p>
          <p className="mt-1 text-lg font-black text-foreground">
            Conformidade mantida há {manutencao} dias
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            A adequação não termina aqui: seguimos monitorando documentos, treinamentos, riscos,
            ações corretivas, evidências, checklists e prazos.
          </p>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CardNumero titulo="Pendências" valor={resumo.pendencias} alerta />
        <CardNumero titulo="Não conformidades" valor={resumo.naoConformes} alerta />
        <CardNumero titulo="Ações atrasadas" valor={resumo.atrasadas} alerta />
        <CardNumero titulo="Em adequação" valor={resumo.emAdequacao} />
        <CardNumero titulo="Sem evidência" valor={resumo.semEvidencia} alerta />
        <CardNumero titulo="Riscos abertos" valor={data.riscos.filter((r) => r.status === "ABERTO").length} />
      </div>

      {alertas.length > 0 && (
        <section className="rounded-2xl border border-destructive/30 bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-destructive">
            <AlertTriangle className="h-4 w-4" /> Central de avisos
          </h2>
          <ul className="mt-3 space-y-2">
            {alertas.map((a) => (
              <li key={a} className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-foreground">
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Conformidade por categoria
        </h2>
        <ul className="mt-3 space-y-3">
          {resumo.categorias.map((c) => (
            <li key={c.categoria}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">{c.categoria}</span>
                <span className="font-black text-muted-foreground">
                  {c.conformes}/{c.total} · {c.score}%
                </span>
              </div>
              <div className="mt-1">
                <Barra valor={c.score} />
              </div>
            </li>
          ))}
        </ul>
        <Link to="/painel/rdc/plano" className="mt-4 inline-flex text-xs font-black text-teal underline">
          Abrir plano de adequação
        </Link>
      </section>

      {data.historico.length > 1 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Evolução da conformidade
          </h2>
          <div className="mt-4 flex items-end gap-3 overflow-x-auto">
            {data.historico.map((s) => (
              <div key={s.id} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <span className="text-[11px] font-black text-foreground">{s.score}%</span>
                <div className="flex h-24 w-8 items-end rounded-lg bg-border">
                  <div className="w-8 rounded-lg bg-teal" style={{ height: `${Math.max(4, s.score)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(`${s.referencia}T12:00:00`).toLocaleDateString("pt-BR", {
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {porUnidade.some((u) => u.avaliados > 0) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
              Score por unidade
            </h2>
            <span className="rounded-full bg-navy px-3 py-1.5 text-xs font-black text-gold">
              Score geral da rede: {scoreRede}%
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {porUnidade
              .filter((u) => u.avaliados > 0)
              .sort((a, b) => b.score - a.score)
              .map((u) => (
                <li key={u.nome} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                  <span className="flex-1 text-sm font-bold text-foreground">{u.nome}</span>
                  <div className="w-32">
                    <Barra valor={u.score} />
                  </div>
                  <span className="w-12 text-right text-sm font-black text-foreground">{u.score}%</span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
