import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Beaker, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  calcularDiluicao,
  excluirQuimico,
  importarModeloQuimico,
  listarQuimicos,
  salvarQuimico,
  type EntradaQuimico,
  type ProdutoQuimico,
} from "@/lib/painel-db";
import { CORES_LIMPEZA, CORES_LIMPEZA_LIST, type CorLimpeza } from "@/lib/oxyvra-store";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/estoque")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Estoque e químicos — Oxyvra" },
      {
        name: "description",
        content:
          "Catálogo de produtos químicos por marca, diluição, tempo de contato, custo e estoque.",
      },
      { property: "og:title", content: "Estoque e químicos — Oxyvra" },
      {
        property: "og:description",
        content:
          "Catálogo de produtos químicos por marca, diluição, tempo de contato, custo e estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoquePage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

const NOVO: EntradaQuimico = {
  brand: "",
  name: "",
  categoria: "",
  dilution_label: "",
  dilution_ratio: 100,
  dwell_time_seconds: 300,
  color_kit_zone: "azul",
  price_per_liter: 0,
  application_rate_l_m2: 0.05,
  package_liters: 5,
  residual_hours: 0,
  food_grade: false,
  requires_rinse: false,
  usage_notes: "",
  stock_liters: 0,
  min_stock_liters: 0,
  ativo: true,
};

function EstoquePage() {
  const { data: org } = useOrganizacao();
  const quimicos = useQuery({ queryKey: ["quimicos"], queryFn: listarQuimicos });
  const [form, setForm] = useState<EntradaQuimico | null>(null);
  const [area, setArea] = useState("50");
  const [selecionado, setSelecionado] = useState<string>("");

  const meus = useMemo(
    () => (quimicos.data ?? []).filter((p) => p.organizacao_id),
    [quimicos.data],
  );
  const modelos = useMemo(
    () => (quimicos.data ?? []).filter((p) => !p.organizacao_id),
    [quimicos.data],
  );
  const alertas = meus.filter((p) => p.stock_liters <= p.min_stock_liters);
  const produtoCalc = meus.find((p) => p.id === selecionado) ?? meus[0];
  const calculo = produtoCalc ? calcularDiluicao(produtoCalc, Number(area) || 0) : null;

  const gravar = async () => {
    if (!org || !form?.brand || !form.name) return;
    try {
      await salvarQuimico(org.id, form);
      setForm(null);
      void quimicos.refetch();
      toast.success("Produto salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar produto.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Estoque e produtos químicos</h2>
          <p className="text-sm text-muted-foreground">
            Catálogo aberto: cadastre qualquer marca com diluição, tempo de contato, cor do kit e
            custo. A calculadora do app usa exatamente esses parâmetros.
          </p>
        </div>
        <button
          onClick={() => setForm({ ...NOVO })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </header>

      {!!alertas.length && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
          <p>
            <b>{alertas.length} produto(s) no nível mínimo.</b>{" "}
            {alertas.map((p) => `${p.brand} ${p.name}`).join(", ")}
          </p>
        </div>
      )}

      {form && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-black text-foreground">
            {form.id ? "Editar produto" : "Novo produto"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={rotulo}>
              Marca
              <input
                className={campo}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Produto
              <input
                className={campo}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Categoria
              <input
                className={campo}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Diluição (rótulo)
              <input
                className={campo}
                placeholder="1:40 (Desinfecção) / 1:100 (Limpeza)"
                value={form.dilution_label}
                onChange={(e) => setForm({ ...form, dilution_label: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Diluição 1:X
              <input
                type="number"
                className={campo}
                value={form.dilution_ratio}
                onChange={(e) => setForm({ ...form, dilution_ratio: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Tempo de contato (s)
              <input
                type="number"
                className={campo}
                value={form.dwell_time_seconds}
                onChange={(e) => setForm({ ...form, dwell_time_seconds: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Cor do kit
              <select
                className={campo}
                value={form.color_kit_zone}
                onChange={(e) =>
                  setForm({ ...form, color_kit_zone: e.target.value as CorLimpeza })
                }
              >
                {CORES_LIMPEZA_LIST.map((c) => (
                  <option key={c} value={c}>
                    {CORES_LIMPEZA[c].label}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              Preço por litro (R$)
              <input
                type="number"
                className={campo}
                value={form.price_per_liter}
                onChange={(e) => setForm({ ...form, price_per_liter: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Consumo (L de solução por m²)
              <input
                type="number"
                step="0.001"
                className={campo}
                value={form.application_rate_l_m2}
                onChange={(e) =>
                  setForm({ ...form, application_rate_l_m2: Number(e.target.value) })
                }
              />
            </label>
            <label className={rotulo}>
              Embalagem (L)
              <input
                type="number"
                className={campo}
                value={form.package_liters}
                onChange={(e) => setForm({ ...form, package_liters: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Residual de proteção (h)
              <input
                type="number"
                className={campo}
                value={form.residual_hours}
                onChange={(e) => setForm({ ...form, residual_hours: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Estoque atual (L)
              <input
                type="number"
                className={campo}
                value={form.stock_liters}
                onChange={(e) => setForm({ ...form, stock_liters: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Estoque mínimo (L)
              <input
                type="number"
                className={campo}
                value={form.min_stock_liters}
                onChange={(e) => setForm({ ...form, min_stock_liters: Number(e.target.value) })}
              />
            </label>
            <label className={rotulo}>
              Modo de uso
              <input
                className={campo}
                value={form.usage_notes}
                onChange={(e) => setForm({ ...form, usage_notes: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <input
                type="checkbox"
                checked={form.food_grade}
                onChange={(e) => setForm({ ...form, food_grade: e.target.checked })}
              />
              Grau alimentício
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <input
                type="checkbox"
                checked={form.requires_rinse}
                onChange={(e) => setForm({ ...form, requires_rinse: e.target.checked })}
              />
              Exige enxágue
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={gravar}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
            >
              Salvar
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-black text-foreground">Meu catálogo</h3>
        {quimicos.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !meus.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum produto no seu catálogo. Importe um modelo abaixo ou cadastre a sua marca.
          </p>
        ) : (
          <ul className="space-y-2">
            {meus.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
              >
                <div>
                  <p className="text-sm font-black text-foreground">
                    {p.brand} · {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.categoria ? `${p.categoria} · ` : ""}
                    {p.dilution_label || `1:${p.dilution_ratio}`} · contato {Math.round(p.dwell_time_seconds / 60)} min ·{" "}
                    {CORES_LIMPEZA[p.color_kit_zone]?.label} · R$ {p.price_per_liter.toFixed(2)}/L ·
                    estoque {p.stock_liters}L (mín. {p.min_stock_liters}L)
                    {p.food_grade ? " · grau alimentício" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const { organizacao_id: _o, ...resto } = p;
                      setForm(resto);
                    }}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir ${p.name}?`)) return;
                      await excluirQuimico(p.id);
                      void quimicos.refetch();
                    }}
                    className="rounded-lg border border-destructive/40 px-2.5 py-1.5 text-xs font-bold text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-1 text-sm font-black text-foreground">Modelos prontos</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Modelos de fábrica (somente leitura). Importe para o seu catálogo e ajuste como quiser.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {modelos.map((m: ProdutoQuimico) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-bold text-foreground">
                  {m.brand} · {m.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.dilution_label || `1:${m.dilution_ratio}`} ·{" "}
                  {CORES_LIMPEZA[m.color_kit_zone]?.label}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!org) return;
                  await importarModeloQuimico(org.id, m);
                  void quimicos.refetch();
                  toast.success("Modelo importado para o seu catálogo.");
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-teal px-2.5 py-1.5 text-xs font-black text-teal-foreground"
              >
                <Download className="h-3.5 w-3.5" /> Importar
              </button>
            </li>
          ))}
          {!modelos.length && (
            <li className="text-sm text-muted-foreground">Nenhum modelo disponível.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
          <Beaker className="h-4 w-4 text-teal" /> Calculadora de diluição
        </h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className={rotulo}>
            Produto
            <select
              className={campo}
              value={produtoCalc?.id ?? ""}
              onChange={(e) => setSelecionado(e.target.value)}
            >
              {meus.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} · {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={rotulo}>
            Área a higienizar (m²)
            <input
              type="number"
              className={campo}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>
        </div>
        {calculo && produtoCalc ? (
          <p className="mt-3 text-sm text-foreground">
            Solução: <b>{calculo.litrosSolucao.toFixed(1)} L</b> · concentrado{" "}
            <b>{calculo.litrosConcentrado.toFixed(2)} L</b> · água{" "}
            <b>{calculo.litrosAgua.toFixed(1)} L</b> · custo{" "}
            <b>R$ {calculo.custo.toFixed(2)}</b> · {calculo.embalagens.toFixed(2)} embalagem(ns) de{" "}
            {produtoCalc.package_liters} L. Tempo de contato:{" "}
            {Math.round(produtoCalc.dwell_time_seconds / 60)} min.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Cadastre um produto para usar a calculadora.
          </p>
        )}
      </section>
    </div>
  );
}
