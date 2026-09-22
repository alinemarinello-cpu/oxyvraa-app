import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

import {
  CORES_STATUS,
  STATUS_RDC,
  atualizarItemPlano,
  criarEvidencia,
  enviarArquivoEvidencia,
  listarPlano,
  listarRequisitos,
  type ItemPlano,
  type StatusRdc,
} from "@/lib/rdc-db";
import { SeletorUnidade, useUnidadeRdc } from "@/components/rdc/RdcContexto";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/rdc/plano")({
  component: PlanoAdequacao,
});

function PlanoAdequacao() {
  const { data: org } = useOrganizacao();
  const { unitId, definirUnidade } = useUnidadeRdc();
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<string>("TODOS");
  const [aberto, setAberto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

  const { data: itens } = useQuery({
    queryKey: ["rdc-plano", unitId],
    queryFn: () => listarPlano(unitId),
  });
  const { data: requisitos } = useQuery({ queryKey: ["rdc-requisitos"], queryFn: listarRequisitos });

  const catalogo = useMemo(
    () => new Map((requisitos ?? []).map((r) => [r.codigo, r])),
    [requisitos],
  );

  const categorias = useMemo(
    () => ["TODOS", ...new Set((itens ?? []).map((i) => i.categoria))],
    [itens],
  );

  const lista = (itens ?? []).filter((i) => filtro === "TODOS" || i.categoria === filtro);
  const recarregar = () => void qc.invalidateQueries({ queryKey: ["rdc-plano", unitId] });

  const salvar = async (item: ItemPlano, campos: Parameters<typeof atualizarItemPlano>[1]) => {
    try {
      await atualizarItemPlano(item, campos, "Gestor");
      recarregar();
      void qc.invalidateQueries({ queryKey: ["rdc-status", unitId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const anexar = async (item: ItemPlano, file: File) => {
    if (!org) return;
    setEnviando(item.id);
    try {
      const caminho = await enviarArquivoEvidencia(org.id, file);
      await criarEvidencia({
        organizacao_id: org.id,
        unit_id: unitId,
        titulo: `${item.codigo} — ${file.name}`,
        descricao: item.titulo,
        arquivo_url: caminho,
        vinculo_tipo: "REQUISITO",
        requisito_codigo: item.codigo,
        artigo: item.artigo,
        responsavel: item.responsavel,
      });
      await atualizarItemPlano(item, { evidencia_url: caminho }, "Gestor");
      toast.success("Evidência anexada.");
      recarregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao anexar o arquivo.");
    } finally {
      setEnviando(null);
    }
  };

  if (!itens) return <p className="text-sm text-muted-foreground">Carregando o plano…</p>;

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-teal/40 bg-teal/5 p-6">
        <h2 className="text-lg font-black text-foreground">Nenhum plano gerado ainda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Faça o diagnóstico para o Oxyvra montar a lista de ações da sua clínica.
        </p>
        <Link
          to="/painel/rdc/diagnostico"
          className="mt-4 inline-flex rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
        >
          Fazer diagnóstico
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <SeletorUnidade unitId={unitId} onChange={definirUnidade} />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground"
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c === "TODOS" ? "Todas as categorias" : c}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-3">
        {lista.map((item) => {
          const req = catalogo.get(item.codigo);
          const expandido = aberto === item.id;
          const atrasado =
            item.status !== "CONFORME" &&
            item.prazo !== null &&
            item.prazo < new Date().toISOString().slice(0, 10);
          return (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[240px] flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    {item.codigo} · {item.categoria} · {item.artigo ?? "RDC 1.002/2025"}
                  </p>
                  <p className="text-sm font-black text-foreground">{item.titulo}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-black ${CORES_STATUS[item.status]}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => void salvar(item, { status: e.target.value as StatusRdc })}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                >
                  {STATUS_RDC.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  defaultValue={item.responsavel ?? ""}
                  placeholder="Responsável"
                  onBlur={(e) => void salvar(item, { responsavel: e.target.value })}
                  className="w-40 rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  defaultValue={item.prazo ?? ""}
                  onChange={(e) => void salvar(item, { prazo: e.target.value || null })}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    atrasado ? "border-destructive text-destructive" : "border-border"
                  }`}
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  {enviando === item.id
                    ? "Enviando…"
                    : item.evidencia_url
                      ? "Evidência anexada"
                      : "Anexar evidência"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void anexar(item, f);
                    }}
                  />
                </label>
                <button
                  onClick={() => setAberto(expandido ? null : item.id)}
                  className="text-xs font-black text-teal underline"
                >
                  {expandido ? "Fechar" : "Como fazer?"}
                </button>
              </div>

              {expandido && (
                <div className="mt-4 space-y-3 rounded-xl bg-secondary p-4 text-sm">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">O que precisa?</p>
                    <p className="text-foreground">{req?.descricao ?? item.titulo}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">Como fazer?</p>
                    <p className="text-foreground">{req?.como_fazer ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">Como comprovar?</p>
                    <p className="text-foreground">{req?.evidencia ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">Referência</p>
                    <p className="text-foreground">
                      {req?.referencia ?? "RDC Anvisa nº 1.002/2025"} — {item.artigo ?? "—"}
                    </p>
                  </div>
                  <textarea
                    defaultValue={item.observacoes ?? ""}
                    placeholder="Observações da clínica"
                    onBlur={(e) => void salvar(item, { observacoes: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    rows={2}
                  />
                  {item.historico.length > 0 && (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {item.historico.map((h) => (
                        <li key={h.em}>
                          {new Date(h.em).toLocaleString("pt-BR")} — {h.de} → {h.para} ({h.por})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
