import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { History, Plus, Save, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS_RDC } from "@/lib/rdc-db";

export const Route = createFileRoute("/_authenticated/superadmin/regulatorio")({
  head: () => ({
    meta: [
      { title: "Banco regulatório — Oxyvra" },
      {
        name: "description",
        content: "Cadastro e atualização dos requisitos da RDC Anvisa nº 1.002/2025 sem alterar código.",
      },
      { property: "og:title", content: "Banco regulatório — Oxyvra" },
      { property: "og:description", content: "Gestão dos requisitos regulatórios da plataforma." },
    ],
  }),
  component: Regulatorio,
});

type Requisito = {
  id: string;
  codigo: string;
  categoria: string;
  titulo: string;
  descricao: string;
  texto_simplificado: string;
  como_fazer: string;
  evidencia: string;
  aplicabilidade: string;
  referencia: string;
  artigo: string | null;
  condicao: string;
  prazo_dias: number;
  ordem: number;
  versao: string;
  fonte: string;
  revisado_em: string;
  situacao: string;
  ativo: boolean;
};

const SITUACOES = ["VIGENTE", "EM REVISÃO", "REVOGADO"];
const VAZIO: Partial<Requisito> = {
  codigo: "",
  categoria: CATEGORIAS_RDC[0],
  titulo: "",
  descricao: "",
  texto_simplificado: "",
  como_fazer: "",
  evidencia: "",
  aplicabilidade: "Todos os serviços odontológicos",
  referencia: "RDC Anvisa nº 1.002/2025",
  artigo: "",
  condicao: "sempre",
  prazo_dias: 30,
  ordem: 999,
  versao: "1.0",
  fonte: "Anvisa",
  situacao: "VIGENTE",
  ativo: true,
};

function Campo({
  rotulo,
  valor,
  onChange,
  area,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
      {area ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-sm"
        />
      ) : (
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm"
        />
      )}
    </label>
  );
}

function Regulatorio() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [edicao, setEdicao] = useState<Partial<Requisito> | null>(null);
  const [historicoDe, setHistoricoDe] = useState<string | null>(null);

  const { data: requisitos } = useQuery({
    queryKey: ["regulatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rdc_requisitos")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Requisito[];
    },
  });

  const { data: historico } = useQuery({
    queryKey: ["regulatorio-historico", historicoDe],
    enabled: Boolean(historicoDe),
    queryFn: async () => {
      const { data } = await supabase
        .from("rdc_requisitos_historico")
        .select("id, versao, situacao, created_at, snapshot")
        .eq("requisito_id", historicoDe!)
        .order("created_at", { ascending: false });
      return (data ?? []) as { id: string; versao: string; situacao: string; created_at: string }[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (r: Partial<Requisito>) => {
      const payload = {
        ...r,
        prazo_dias: Number(r.prazo_dias) || 30,
        ordem: Number(r.ordem) || 999,
        revisado_em: new Date().toISOString().slice(0, 10),
      };
      if (r.id) {
        const { error } = await supabase
          .from("rdc_requisitos")
          .update(payload as never)
          .eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rdc_requisitos").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Requisito salvo. A versão anterior foi preservada no histórico.");
      setEdicao(null);
      void qc.invalidateQueries({ queryKey: ["regulatorio"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtrados = (requisitos ?? []).filter((r) =>
    [r.codigo, r.titulo, r.categoria, r.artigo ?? ""].join(" ").toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Banco regulatório</h1>
          <p className="text-sm text-muted-foreground">
            Requisitos da RDC 1.002/2025 administráveis: nada fica fixo no código e nenhuma versão
            anterior é apagada.
          </p>
        </div>
        <button
          onClick={() => setEdicao({ ...VAZIO })}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-black text-teal-foreground"
        >
          <Plus className="h-4 w-4" /> Novo requisito
        </button>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por código, título, categoria ou artigo"
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
      />

      {edicao && (
        <section className="rounded-2xl border-2 border-teal bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-foreground">
              {edicao.id ? `Editando ${edicao.codigo}` : "Novo requisito"}
            </h2>
            <button onClick={() => setEdicao(null)} aria-label="Fechar">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Código" valor={edicao.codigo ?? ""} onChange={(v) => setEdicao({ ...edicao, codigo: v })} />
            <label className="block">
              <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                Categoria
              </span>
              <select
                value={edicao.categoria}
                onChange={(e) => setEdicao({ ...edicao, categoria: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm"
              >
                {CATEGORIAS_RDC.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Campo rotulo="Título" valor={edicao.titulo ?? ""} onChange={(v) => setEdicao({ ...edicao, titulo: v })} />
            </div>
            <div className="sm:col-span-2">
              <Campo area rotulo="Descrição" valor={edicao.descricao ?? ""} onChange={(v) => setEdicao({ ...edicao, descricao: v })} />
            </div>
            <div className="sm:col-span-2">
              <Campo area rotulo="Texto simplificado (o que precisa fazer)" valor={edicao.texto_simplificado ?? ""} onChange={(v) => setEdicao({ ...edicao, texto_simplificado: v })} />
            </div>
            <div className="sm:col-span-2">
              <Campo area rotulo="Como fazer" valor={edicao.como_fazer ?? ""} onChange={(v) => setEdicao({ ...edicao, como_fazer: v })} />
            </div>
            <Campo rotulo="Evidência necessária" valor={edicao.evidencia ?? ""} onChange={(v) => setEdicao({ ...edicao, evidencia: v })} />
            <Campo rotulo="Aplicabilidade" valor={edicao.aplicabilidade ?? ""} onChange={(v) => setEdicao({ ...edicao, aplicabilidade: v })} />
            <Campo rotulo="Referência normativa" valor={edicao.referencia ?? ""} onChange={(v) => setEdicao({ ...edicao, referencia: v })} />
            <Campo rotulo="Artigo" valor={edicao.artigo ?? ""} onChange={(v) => setEdicao({ ...edicao, artigo: v })} />
            <Campo rotulo="Fonte" valor={edicao.fonte ?? ""} onChange={(v) => setEdicao({ ...edicao, fonte: v })} />
            <Campo rotulo="Versão" valor={edicao.versao ?? ""} onChange={(v) => setEdicao({ ...edicao, versao: v })} />
            <Campo rotulo="Condição de aplicabilidade (chave)" valor={edicao.condicao ?? ""} onChange={(v) => setEdicao({ ...edicao, condicao: v })} />
            <Campo rotulo="Prazo (dias)" valor={String(edicao.prazo_dias ?? 30)} onChange={(v) => setEdicao({ ...edicao, prazo_dias: Number(v) })} />
            <Campo rotulo="Ordem" valor={String(edicao.ordem ?? 999)} onChange={(v) => setEdicao({ ...edicao, ordem: Number(v) })} />
            <label className="block">
              <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                Situação
              </span>
              <select
                value={edicao.situacao}
                onChange={(e) => setEdicao({ ...edicao, situacao: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm"
              >
                {SITUACOES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <input
                type="checkbox"
                checked={edicao.ativo ?? true}
                onChange={(e) => setEdicao({ ...edicao, ativo: e.target.checked })}
                className="h-4 w-4"
              />
              Ativo no diagnóstico
            </label>
          </div>
          <button
            onClick={() => salvar.mutate(edicao)}
            disabled={salvar.isPending}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-black text-gold disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Salvar requisito
          </button>
        </section>
      )}

      <section className="space-y-2">
        {filtrados.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-teal">
                  {r.codigo} · {r.categoria}
                </p>
                <h3 className="text-sm font-black text-foreground">{r.titulo}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.referencia}
                  {r.artigo ? ` · ${r.artigo}` : ""} · versão {r.versao} · revisado em{" "}
                  {new Date(r.revisado_em).toLocaleDateString("pt-BR")} · {r.situacao}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoricoDe(historicoDe === r.id ? null : r.id)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black text-foreground"
                >
                  <History className="h-3.5 w-3.5" /> Histórico
                </button>
                <button
                  onClick={() => setEdicao(r)}
                  className="h-9 rounded-xl bg-secondary px-3 text-xs font-black text-foreground"
                >
                  Editar
                </button>
              </div>
            </div>
            {historicoDe === r.id && (
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {(historico ?? []).length === 0 && (
                  <li className="text-xs text-muted-foreground">Sem alterações registradas.</li>
                )}
                {(historico ?? []).map((h) => (
                  <li key={h.id} className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("pt-BR")} — versão {h.versao} ({h.situacao})
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
