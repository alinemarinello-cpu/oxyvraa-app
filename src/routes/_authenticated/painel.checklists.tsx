import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, Plus, Save, Trash2, Building2 } from "lucide-react";
import {
  atribuir,
  atualizarChecklist,
  criarChecklistVazio,
  duplicarTemplate,
  excluirChecklist,
  listarAtribuicoes,
  listarChecklists,
  listarItens,
  listarTemplates,
  listarUnidades,
  removerAtribuicao,
  salvarItens,
} from "@/lib/compliance-db";
import { TIPOS_RESPOSTA, type ItemChecklist, type TipoResposta } from "@/lib/compliance-types";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/checklists")({
  component: ChecklistsPage,
});

const FREQUENCIAS = ["diaria", "semanal", "quinzenal", "mensal"];

// Agrupa os modelos da biblioteca por tipo de negócio/empresa.
const VERTICAIS: { chave: string; label: string; categorias: string[] }[] = [
  {
    chave: "saude",
    label: "Saúde e clínicas",
    categorias: ["esterilizacao", "estrutura", "residuos"],
  },
  { chave: "odontologia", label: "Odontologia", categorias: ["odontologia"] },
  { chave: "estetica", label: "Estética e beleza", categorias: ["estetica"] },
  { chave: "alimentos", label: "Alimentos e cozinhas", categorias: ["alimentos", "temperatura"] },
  { chave: "hotelaria", label: "Hotelaria e pousadas", categorias: ["hotelaria"] },
  { chave: "motel", label: "Motéis e alta rotatividade", categorias: ["motel"] },
  {
    chave: "infantil",
    label: "Berçários, creches e educação infantil",
    categorias: ["infantil"],
  },
  {
    chave: "publico",
    label: "Setor público municipal (prefeituras)",
    categorias: [
      "publico_merenda",
      "publico_educacao",
      "publico_odonto",
      "publico_caps",
      "publico_tea",
    ],
  },
  { chave: "geral", label: "Higiene geral e indústria", categorias: ["higiene"] },
];

function rotuloVertical(categoria: string): string {
  for (const v of VERTICAIS) if (v.categorias.includes(categoria)) return v.label;
  return "Outros";
}

function agruparPorVertical<T extends { categoria: string }>(templates: T[]) {
  const ordem = [...VERTICAIS.map((v) => v.label), "Outros"];
  const grupos = new Map<string, T[]>();
  for (const t of templates) {
    const rotulo = rotuloVertical(t.categoria);
    grupos.set(rotulo, [...(grupos.get(rotulo) ?? []), t]);
  }
  return ordem.filter((r) => grupos.has(r)).map((r) => ({ rotulo: r, itens: grupos.get(r)! }));
}

function itemVazio(ordem: number): ItemChecklist {
  return {
    ordem,
    pergunta: "",
    tipo: "conforme",
    critico: false,
    foto_obrigatoria: false,
    valor_min: null,
    valor_max: null,
    unidade_medida: null,
    opcoes: [],
    ajuda: null,
  };
}

function ChecklistsPage() {
  const qc = useQueryClient();
  const { data: org } = useOrganizacao();
  const [editando, setEditando] = useState<string | null>(null);

  const templates = useQuery({ queryKey: ["templates"], queryFn: listarTemplates });
  const checklists = useQuery({ queryKey: ["checklists"], queryFn: listarChecklists });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });
  const atribuicoes = useQuery({ queryKey: ["atribuicoes"], queryFn: listarAtribuicoes });

  const importar = useMutation({
    mutationFn: (templateId: string) => duplicarTemplate(templateId, org!.id),
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["checklists"] });
      setEditando(id);
    },
  });

  const criar = useMutation({
    mutationFn: () => criarChecklistVazio(org!.id, "Novo checklist"),
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["checklists"] });
      setEditando(id);
    },
  });

  const remover = useMutation({
    mutationFn: excluirChecklist,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-teal" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
              Biblioteca de normas
            </h2>
            <p className="text-xs text-muted-foreground">
              Modelos nativos prontos para uso — importe e ajuste ao seu processo.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-5">
          {agruparPorVertical(templates.data ?? []).map((grupo) => (
            <div key={grupo.rotulo}>
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-foreground">
                <Building2 className="h-3.5 w-3.5 text-teal" /> {grupo.rotulo}
                <span className="font-normal text-muted-foreground">
                  ({grupo.itens.length} modelo{grupo.itens.length === 1 ? "" : "s"})
                </span>
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {grupo.itens.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-teal">{t.norma}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{t.titulo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.descricao}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t.itens.length} perguntas</p>
                    <button
                      onClick={() => importar.mutate(t.id)}
                      disabled={!org || importar.isPending}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-2 text-xs font-black text-teal-foreground disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" /> Importar e editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Meus checklists
          </h2>
          <button
            onClick={() => criar.mutate()}
            disabled={!org}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Criar do zero
          </button>
        </div>

        {(checklists.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum checklist ainda. Importe um modelo da biblioteca acima.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(checklists.data ?? []).map((c) => (
              <li key={c.id} className="rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">{c.norma || "Sem norma"}</p>
                  </div>
                  <button
                    onClick={() => setEditando(editando === c.id ? null : c.id)}
                    className="rounded-lg bg-secondary px-3 py-2 text-xs font-black text-foreground"
                  >
                    {editando === c.id ? "Fechar" : "Editar perguntas"}
                  </button>
                  <button
                    onClick={() => remover.mutate(c.id)}
                    className="rounded-lg p-2 text-destructive"
                    aria-label="Excluir checklist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {editando === c.id && (
                  <Editor
                    checklistId={c.id}
                    titulo={c.titulo}
                    norma={c.norma}
                    unidades={unidades.data ?? []}
                    atribuicoes={(atribuicoes.data ?? []).filter((a) => a.checklist_id === c.id)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Editor({
  checklistId,
  titulo,
  norma,
  unidades,
  atribuicoes,
}: {
  checklistId: string;
  titulo: string;
  norma: string;
  unidades: { id: string; nome: string }[];
  atribuicoes: { id: string; unit_id: string; frequencia: string }[];
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(titulo);
  const [normaTxt, setNormaTxt] = useState(norma);
  const [itens, setItens] = useState<ItemChecklist[] | null>(null);
  const [unidadeSel, setUnidadeSel] = useState(unidades[0]?.id ?? "");
  const [frequencia, setFrequencia] = useState("diaria");

  useQuery({
    queryKey: ["itens", checklistId],
    queryFn: async () => {
      const r = await listarItens(checklistId);
      setItens(r);
      return r;
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      await atualizarChecklist(checklistId, { titulo: nome, norma: normaTxt });
      await salvarItens(checklistId, itens ?? []);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["checklists"] });
      void qc.invalidateQueries({ queryKey: ["itens", checklistId] });
    },
  });

  const vincular = useMutation({
    mutationFn: () => atribuir(checklistId, unidadeSel, frequencia),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["atribuicoes"] }),
  });

  const desvincular = useMutation({
    mutationFn: removerAtribuicao,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["atribuicoes"] }),
  });

  function set(idx: number, campos: Partial<ItemChecklist>) {
    setItens((prev) => prev?.map((i, k) => (k === idx ? { ...i, ...campos } : i)) ?? null);
  }

  if (!itens) return <p className="px-4 pb-4 text-xs text-muted-foreground">Carregando itens…</p>;

  return (
    <div className="space-y-4 border-t border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-muted-foreground">
          Título
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal text-foreground"
          />
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Norma de referência
          <input
            value={normaTxt}
            onChange={(e) => setNormaTxt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal text-foreground"
          />
        </label>
      </div>

      <ol className="space-y-3">
        {itens.map((item, idx) => (
          <li key={idx} className="rounded-xl bg-secondary p-3">
            <div className="flex gap-2">
              <span className="pt-2 text-xs font-black text-muted-foreground">{idx + 1}</span>
              <input
                value={item.pergunta}
                onChange={(e) => set(idx, { pergunta: e.target.value })}
                placeholder="Pergunta do checklist"
                className="flex-1 rounded-lg border border-input px-3 py-2 text-sm"
              />
              <button
                onClick={() => setItens(itens.filter((_, k) => k !== idx))}
                className="rounded-lg p-2 text-destructive"
                aria-label="Remover pergunta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <select
                value={item.tipo}
                onChange={(e) => set(idx, { tipo: e.target.value as TipoResposta })}
                className="rounded-lg border border-input px-2 py-2 text-xs"
              >
                {TIPOS_RESPOSTA.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
              {(item.tipo === "temperatura" || item.tipo === "numero") && (
                <>
                  <input
                    type="number"
                    value={item.valor_min ?? ""}
                    onChange={(e) =>
                      set(idx, { valor_min: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    placeholder="mín."
                    className="rounded-lg border border-input px-2 py-2 text-xs"
                  />
                  <input
                    type="number"
                    value={item.valor_max ?? ""}
                    onChange={(e) =>
                      set(idx, { valor_max: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    placeholder="máx."
                    className="rounded-lg border border-input px-2 py-2 text-xs"
                  />
                  <input
                    value={item.unidade_medida ?? ""}
                    onChange={(e) => set(idx, { unidade_medida: e.target.value || null })}
                    placeholder="unidade (°C, ppm)"
                    className="rounded-lg border border-input px-2 py-2 text-xs"
                  />
                </>
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs font-bold text-muted-foreground">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={item.critico}
                  onChange={(e) => set(idx, { critico: e.target.checked })}
                />
                Item crítico
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={item.foto_obrigatoria}
                  onChange={(e) => set(idx, { foto_obrigatoria: e.target.checked })}
                />
                Foto obrigatória
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setItens([...itens, itemVazio(itens.length)])}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-black text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar pergunta
        </button>
        <button
          onClick={() => salvar.mutate()}
          disabled={salvar.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-2 text-xs font-black text-teal-foreground disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> {salvar.isPending ? "Salvando…" : "Salvar checklist"}
        </button>
      </div>

      <div className="rounded-xl border border-border p-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-foreground">
          <Building2 className="h-4 w-4 text-teal" /> Unidades e frequência
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={unidadeSel}
            onChange={(e) => setUnidadeSel(e.target.value)}
            className="rounded-lg border border-input px-2 py-2 text-xs"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <select
            value={frequencia}
            onChange={(e) => setFrequencia(e.target.value)}
            className="rounded-lg border border-input px-2 py-2 text-xs"
          >
            {FREQUENCIAS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={() => vincular.mutate()}
            disabled={!unidadeSel}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-50"
          >
            Vincular
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {atribuicoes.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                {unidades.find((u) => u.id === a.unit_id)?.nome ?? "Unidade"}
              </span>
              · {a.frequencia}
              <button onClick={() => desvincular.mutate(a.id)} className="text-destructive">
                remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
