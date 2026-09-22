import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Barcode, Camera, Plus, Syringe, Trash2, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIAS_INSUMO,
  abrirTarefaTroca,
  diasAte,
  enviarArquivo,
  excluirCaixa,
  excluirInsumo,
  faixaAviso,
  listarAplicacoes,
  listarCaixas,
  listarInsumos,
  registrarAplicacao,
  registrarTrocaCaixa,
  salvarCaixa,
  salvarInsumo,
  urlAssinada,
  validadeEfetiva,
  type AplicacaoInsumo,
  type CaixaPerfuro,
  type InsumoLote,
} from "@/lib/biosseguranca-db";
import { listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/insumos")({
  head: () => ({
    meta: [
      { title: "Insumos, lotes e perfurocortantes — Oxyvra" },
      {
        name: "description",
        content:
          "Controle de lote e validade de anestésicos, resinas e medicamentos, e troca de caixas de perfurocortantes com foto obrigatória.",
      },
      { property: "og:title", content: "Insumos, lotes e perfurocortantes — Oxyvra" },
      {
        property: "og:description",
        content: "Rastreabilidade de insumos e travas operacionais do PGRSS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsumosPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

type FormInsumo = Omit<InsumoLote, "id" | "organizacao_id"> & { id?: string };
type FormCaixa = Omit<CaixaPerfuro, "id" | "trocada_em" | "foto_troca" | "status"> & {
  id?: string;
};

const NOVO_INSUMO: FormInsumo = {
  unit_id: null,
  nome: "",
  categoria: "injetável",
  marca: "",
  aberto_em: null,
  validade_apos_aberto_dias: null,
  foto_frasco: null,
  fabricante: "",
  codigo_barras: "",
  lote: "",
  validade: new Date().toISOString().slice(0, 10),
  quantidade: 1,
  unidade: "un",
  registro_anvisa: "",
  observacoes: "",
};

type FormAplicacao = Omit<AplicacaoInsumo, "id" | "organizacao_id"> & { id?: string };

const NOVA_APLICACAO: FormAplicacao = {
  unit_id: "",
  insumo_id: null,
  execucao_id: null,
  procedimento: "Harmonização facial",
  cliente_iniciais: "",
  produto: "",
  marca: "",
  lote: "",
  validade: null,
  registro_anvisa: "",
  quantidade_utilizada: null,
  unidade_medida: "UI",
  foto_frasco: null,
  profissional_nome: "",
  profissional_registro: "",
  aplicado_em: new Date().toISOString(),
  lat: null,
  lng: null,
  observacoes: "",
};

const PROCEDIMENTOS = [
  "Harmonização facial",
  "Toxina botulínica",
  "Preenchimento",
  "Bioestimulador de colágeno",
  "Micropigmentação",
  "Limpeza de pele / peeling",
  "Podologia",
  "Outro procedimento invasivo",
];

const NOVA_CAIXA: FormCaixa = {
  unit_id: "",
  local: "",
  capacidade_litros: 13,
  montada_em: new Date().toISOString().slice(0, 10),
  nivel_percentual: 0,
  responsavel: "",
};

function InsumosPage() {
  const { data: org } = useOrganizacao();
  const insumos = useQuery({ queryKey: ["insumos"], queryFn: listarInsumos });
  const caixas = useQuery({ queryKey: ["caixas"], queryFn: listarCaixas });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });
  const [formInsumo, setFormInsumo] = useState<FormInsumo | null>(null);
  const [formCaixa, setFormCaixa] = useState<FormCaixa | null>(null);
  const [formAplic, setFormAplic] = useState<FormAplicacao | null>(null);
  const aplicacoes = useQuery({ queryKey: ["aplicacoes"], queryFn: () => listarAplicacoes(180) });

  const vencendo = (insumos.data ?? []).filter(
    (i) => (diasAte(validadeEfetiva(i).data) ?? 99) <= 30,
  );

  const gravarInsumo = async () => {
    if (!org || !formInsumo?.nome || !formInsumo.lote) return;
    try {
      await salvarInsumo(org.id, formInsumo);
      setFormInsumo(null);
      void insumos.refetch();
      toast.success("Insumo registrado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar insumo.");
    }
  };

  const anexarFrasco = async (file: File, alvo: "insumo" | "aplicacao") => {
    try {
      const caminho = await enviarArquivo("frascos", file);
      if (alvo === "insumo" && formInsumo) setFormInsumo({ ...formInsumo, foto_frasco: caminho });
      if (alvo === "aplicacao" && formAplic) setFormAplic({ ...formAplic, foto_frasco: caminho });
      toast.success("Foto anexada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    }
  };

  const gravarAplicacao = async () => {
    if (!org || !formAplic) return;
    try {
      await registrarAplicacao(org.id, formAplic);
      setFormAplic(null);
      void aplicacoes.refetch();
      toast.success("Aplicação registrada com rastreabilidade de lote.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar a aplicação.");
    }
  };

  const gravarCaixa = async () => {
    if (!org || !formCaixa?.unit_id) return toast.error("Escolha a unidade da caixa.");
    try {
      const status = await salvarCaixa(org.id, formCaixa);
      if (status === "troca_pendente") {
        await abrirTarefaTroca(org.id, formCaixa);
        toast.warning("Caixa acima de 2/3: tarefa de troca imediata criada em Planos de ação.");
      } else {
        toast.success("Caixa registrada.");
      }
      setFormCaixa(null);
      void caixas.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar caixa.");
    }
  };

  const trocar = async (caixa: CaixaPerfuro, file: File) => {
    try {
      const caminho = await enviarArquivo("perfurocortantes", file);
      await registrarTrocaCaixa(caixa.id, caminho, caixa.responsavel);
      void caixas.refetch();
      toast.success("Troca registrada com evidência fotográfica.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar troca.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">
              <Trash className="mr-1 inline h-4 w-4 text-teal" /> Caixas de perfurocortantes
            </h2>
            <p className="text-sm text-muted-foreground">
              Ao marcar 2/3 (66%) ou mais, o sistema abre automaticamente uma tarefa de troca
              imediata e só aceita a baixa com foto da substituição.
            </p>
          </div>
          <button
            onClick={() => setFormCaixa({ ...NOVA_CAIXA })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Nova caixa
          </button>
        </header>

        {formCaixa && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className={rotulo}>Unidade</span>
                <select
                  className={campo}
                  value={formCaixa.unit_id}
                  onChange={(e) => setFormCaixa({ ...formCaixa, unit_id: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {(unidades.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Local / sala</span>
                <input
                  className={campo}
                  value={formCaixa.local}
                  onChange={(e) => setFormCaixa({ ...formCaixa, local: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Capacidade (L)</span>
                <input
                  type="number"
                  className={campo}
                  value={formCaixa.capacidade_litros}
                  onChange={(e) =>
                    setFormCaixa({ ...formCaixa, capacidade_litros: Number(e.target.value) })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Montada em</span>
                <input
                  type="date"
                  className={campo}
                  value={formCaixa.montada_em}
                  onChange={(e) => setFormCaixa({ ...formCaixa, montada_em: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Preenchimento (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={campo}
                  value={formCaixa.nivel_percentual}
                  onChange={(e) =>
                    setFormCaixa({ ...formCaixa, nivel_percentual: Number(e.target.value) })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Responsável</span>
                <input
                  className={campo}
                  value={formCaixa.responsavel}
                  onChange={(e) => setFormCaixa({ ...formCaixa, responsavel: e.target.value })}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void gravarCaixa()}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                Salvar caixa
              </button>
              <button
                onClick={() => setFormCaixa(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(caixas.data ?? []).map((c) => {
            const unidade = (unidades.data ?? []).find((u) => u.id === c.unit_id);
            const critico = c.nivel_percentual >= 66;
            return (
              <div
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                  critico ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
                }`}
              >
                <div>
                  <p className="font-black text-foreground">
                    {unidade?.nome ?? "Unidade"} · {c.local || "sala clínica"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.capacidade_litros} L · montada em{" "}
                    {new Date(`${c.montada_em}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                    {c.nivel_percentual}% preenchida
                  </p>
                  {critico && (
                    <p className="text-xs font-bold text-destructive">
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                      Troca imediata obrigatória (limite de 2/3)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.foto_troca && (
                    <button
                      onClick={async () => {
                        const url = await urlAssinada(c.foto_troca!);
                        if (url) window.open(url, "_blank", "noopener");
                      }}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                    >
                      Foto da troca
                    </button>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-teal px-3 py-2 text-xs font-black text-teal-foreground">
                    Registrar troca com foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void trocar(c, f);
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      await excluirCaixa(c.id);
                      void caixas.refetch();
                    }}
                    className="rounded-xl border border-destructive/30 p-2 text-destructive"
                    aria-label="Excluir caixa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!caixas.isLoading && !(caixas.data ?? []).length && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma caixa cadastrada.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">
              <Barcode className="mr-1 inline h-4 w-4 text-teal" /> Insumos, lotes e validade
            </h2>
            <p className="text-sm text-muted-foreground">
              Anestésicos, resinas e medicamentos com código de barras, lote e validade — alerta
              automático 30 dias antes do vencimento.
            </p>
          </div>
          <button
            onClick={() => setFormInsumo({ ...NOVO_INSUMO })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Novo lote
          </button>
        </header>

        {!!vencendo.length && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <b>{vencendo.length} lote(s) vencido(s) ou a vencer em 30 dias.</b>{" "}
            {vencendo.map((i) => `${i.nome} (lote ${i.lote})`).join(", ")}
          </div>
        )}

        {formInsumo && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 sm:col-span-2">
                <span className={rotulo}>Produto</span>
                <input
                  className={campo}
                  value={formInsumo.nome}
                  onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })}
                  placeholder="Lidocaína 2% com epinefrina"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Categoria</span>
                <select
                  className={campo}
                  value={formInsumo.categoria}
                  onChange={(e) => setFormInsumo({ ...formInsumo, categoria: e.target.value })}
                >
                  {CATEGORIAS_INSUMO.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Fabricante</span>
                <input
                  className={campo}
                  value={formInsumo.fabricante}
                  onChange={(e) => setFormInsumo({ ...formInsumo, fabricante: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Código de barras</span>
                <input
                  className={campo}
                  inputMode="numeric"
                  value={formInsumo.codigo_barras ?? ""}
                  onChange={(e) => setFormInsumo({ ...formInsumo, codigo_barras: e.target.value })}
                  placeholder="Leitor ou digitação"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Lote</span>
                <input
                  className={campo}
                  value={formInsumo.lote}
                  onChange={(e) => setFormInsumo({ ...formInsumo, lote: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Validade</span>
                <input
                  type="date"
                  className={campo}
                  value={formInsumo.validade}
                  onChange={(e) => setFormInsumo({ ...formInsumo, validade: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Quantidade</span>
                <input
                  type="number"
                  className={campo}
                  value={formInsumo.quantidade}
                  onChange={(e) =>
                    setFormInsumo({ ...formInsumo, quantidade: Number(e.target.value) })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Unidade</span>
                <input
                  className={campo}
                  value={formInsumo.unidade}
                  onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Registro ANVISA</span>
                <input
                  className={campo}
                  value={formInsumo.registro_anvisa ?? ""}
                  onChange={(e) =>
                    setFormInsumo({ ...formInsumo, registro_anvisa: e.target.value })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Marca</span>
                <input
                  className={campo}
                  value={formInsumo.marca}
                  onChange={(e) => setFormInsumo({ ...formInsumo, marca: e.target.value })}
                  placeholder="Ex.: Botox / Juvederm / Sculptra"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Aberto em (uso fracionado)</span>
                <input
                  type="date"
                  className={campo}
                  value={formInsumo.aberto_em ?? ""}
                  onChange={(e) =>
                    setFormInsumo({ ...formInsumo, aberto_em: e.target.value || null })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Validade após aberto (dias)</span>
                <input
                  type="number"
                  className={campo}
                  value={formInsumo.validade_apos_aberto_dias ?? ""}
                  onChange={(e) =>
                    setFormInsumo({
                      ...formInsumo,
                      validade_apos_aberto_dias: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Ex.: 30 dias para séruns e ácidos"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Unidade de atendimento</span>
                <select
                  className={campo}
                  value={formInsumo.unit_id ?? ""}
                  onChange={(e) => setFormInsumo({ ...formInsumo, unit_id: e.target.value || null })}
                >
                  <option value="">Toda a organização</option>
                  {(unidades.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm font-bold">
                <Camera className="h-4 w-4" />
                {formInsumo.foto_frasco ? "Foto anexada" : "Foto do frasco"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void anexarFrasco(f, "insumo");
                  }}
                />
              </label>
              <button
                onClick={() => void gravarInsumo()}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                Salvar lote
              </button>
              <button
                onClick={() => setFormInsumo(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(insumos.data ?? []).map((i) => {
            const efetiva = validadeEfetiva(i);
            const dias = diasAte(efetiva.data) ?? 0;
            return (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-black text-foreground">
                    {i.nome}
                    {i.marca ? ` · ${i.marca}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.categoria} · lote {i.lote} · {i.quantidade} {i.unidade}
                    {i.codigo_barras ? ` · ${i.codigo_barras}` : ""}
                    {i.registro_anvisa ? ` · ANVISA ${i.registro_anvisa}` : ""}
                  </p>
                  <p className={`text-xs font-bold ${dias <= 30 ? faixaAviso(dias).tom : "text-muted-foreground"}`}>
                    {efetiva.porAbertura ? "Validade após aberto" : "Validade"}{" "}
                    {new Date(`${efetiva.data}T12:00:00`).toLocaleDateString("pt-BR")}
                    {dias <= 30 ? ` — ${faixaAviso(dias).label.toLowerCase()}` : ""}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFormInsumo({ ...i })}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      await excluirInsumo(i.id);
                      void insumos.refetch();
                    }}
                    className="rounded-xl border border-destructive/30 p-2 text-destructive"
                    aria-label="Excluir lote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!insumos.isLoading && !(insumos.data ?? []).length && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum lote cadastrado.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">
              <Syringe className="mr-1 inline h-4 w-4 text-teal" /> Aplicações em cliente
            </h2>
            <p className="text-sm text-muted-foreground">
              Rastreabilidade exigida em injetáveis e procedimentos invasivos: marca, lote,
              validade, registro ANVISA e foto do frasco usado no atendimento.
            </p>
          </div>
          <button
            onClick={() => setFormAplic({ ...NOVA_APLICACAO, aplicado_em: new Date().toISOString() })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Registrar aplicação
          </button>
        </header>

        {formAplic && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className={rotulo}>Unidade</span>
                <select
                  className={campo}
                  value={formAplic.unit_id}
                  onChange={(e) => setFormAplic({ ...formAplic, unit_id: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {(unidades.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Procedimento</span>
                <select
                  className={campo}
                  value={formAplic.procedimento}
                  onChange={(e) => setFormAplic({ ...formAplic, procedimento: e.target.value })}
                >
                  {PROCEDIMENTOS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Iniciais do cliente</span>
                <input
                  className={campo}
                  maxLength={10}
                  value={formAplic.cliente_iniciais}
                  onChange={(e) =>
                    setFormAplic({ ...formAplic, cliente_iniciais: e.target.value.toUpperCase() })
                  }
                  placeholder="A.M.S. (LGPD)"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Lote já cadastrado</span>
                <select
                  className={campo}
                  value={formAplic.insumo_id ?? ""}
                  onChange={(e) => {
                    const insumo = (insumos.data ?? []).find((i) => i.id === e.target.value);
                    setFormAplic({
                      ...formAplic,
                      insumo_id: e.target.value || null,
                      produto: insumo?.nome ?? formAplic.produto,
                      marca: insumo?.marca ?? formAplic.marca,
                      lote: insumo?.lote ?? formAplic.lote,
                      validade: insumo?.validade ?? formAplic.validade,
                      registro_anvisa: insumo?.registro_anvisa ?? formAplic.registro_anvisa,
                    });
                  }}
                >
                  <option value="">Digitar manualmente</option>
                  {(insumos.data ?? []).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} — lote {i.lote}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Produto</span>
                <input
                  className={campo}
                  value={formAplic.produto}
                  onChange={(e) => setFormAplic({ ...formAplic, produto: e.target.value })}
                  placeholder="Toxina botulínica 100U"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Marca</span>
                <input
                  className={campo}
                  value={formAplic.marca}
                  onChange={(e) => setFormAplic({ ...formAplic, marca: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Lote</span>
                <input
                  className={campo}
                  value={formAplic.lote}
                  onChange={(e) => setFormAplic({ ...formAplic, lote: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Validade</span>
                <input
                  type="date"
                  className={campo}
                  value={formAplic.validade ?? ""}
                  onChange={(e) =>
                    setFormAplic({ ...formAplic, validade: e.target.value || null })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Registro ANVISA</span>
                <input
                  className={campo}
                  value={formAplic.registro_anvisa ?? ""}
                  onChange={(e) => setFormAplic({ ...formAplic, registro_anvisa: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Quantidade utilizada</span>
                <input
                  type="number"
                  className={campo}
                  value={formAplic.quantidade_utilizada ?? ""}
                  onChange={(e) =>
                    setFormAplic({
                      ...formAplic,
                      quantidade_utilizada: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Unidade (UI, ml, seringa)</span>
                <input
                  className={campo}
                  value={formAplic.unidade_medida}
                  onChange={(e) => setFormAplic({ ...formAplic, unidade_medida: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Profissional responsável</span>
                <input
                  className={campo}
                  value={formAplic.profissional_nome}
                  onChange={(e) =>
                    setFormAplic({ ...formAplic, profissional_nome: e.target.value })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Registro do conselho</span>
                <input
                  className={campo}
                  value={formAplic.profissional_registro ?? ""}
                  onChange={(e) =>
                    setFormAplic({ ...formAplic, profissional_registro: e.target.value })
                  }
                  placeholder="CRBM / CRO / COREN"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm font-bold">
                <Camera className="h-4 w-4" />
                {formAplic.foto_frasco ? "Foto anexada" : "Foto do frasco/ampola *"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void anexarFrasco(f, "aplicacao");
                  }}
                />
              </label>
              <button
                onClick={() => void gravarAplicacao()}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                Salvar aplicação
              </button>
              <button
                onClick={() => setFormAplic(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(aplicacoes.data ?? []).map((a) => {
            const unidade = (unidades.data ?? []).find((u) => u.id === a.unit_id);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-black text-foreground">
                    {a.procedimento} · {a.produto || "produto"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.marca ? `${a.marca} · ` : ""}lote {a.lote}
                    {a.validade
                      ? ` · val. ${new Date(`${a.validade}T12:00:00`).toLocaleDateString("pt-BR")}`
                      : ""}
                    {a.quantidade_utilizada
                      ? ` · ${a.quantidade_utilizada} ${a.unidade_medida}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {unidade?.nome ?? "Unidade"} · cliente {a.cliente_iniciais || "—"} ·{" "}
                    {a.profissional_nome || "profissional"} ·{" "}
                    {new Date(a.aplicado_em).toLocaleString("pt-BR")}
                  </p>
                </div>
                {a.foto_frasco && (
                  <button
                    onClick={async () => {
                      const url = await urlAssinada(a.foto_frasco!);
                      if (url) window.open(url, "_blank", "noopener");
                    }}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    Ver frasco
                  </button>
                )}
              </div>
            );
          })}
          {!aplicacoes.isLoading && !(aplicacoes.data ?? []).length && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma aplicação registrada.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

