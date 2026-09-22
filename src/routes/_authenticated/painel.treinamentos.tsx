import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  diasAte,
  enviarArquivo,
  excluirPop,
  excluirTreinamento,
  faixaAviso,
  listarPops,
  listarTreinamentos,
  salvarPop,
  salvarTreinamento,
  urlAssinada,
  type Pop,
  type Treinamento,
} from "@/lib/biosseguranca-db";
import { listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/treinamentos")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "POPs e capacitação da equipe — Oxyvra" },
      {
        name: "description",
        content:
          "Matriz de treinamentos em biossegurança por colaborador e cadastro de Procedimentos Operacionais Padrão.",
      },
      { property: "og:title", content: "POPs e capacitação da equipe — Oxyvra" },
      {
        property: "og:description",
        content: "Histórico de capacitação vinculado aos POPs para comprovação em fiscalização.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TreinamentosPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

type FormPop = Omit<Pop, "id" | "organizacao_id"> & { id?: string };
type FormTre = Omit<Treinamento, "id" | "organizacao_id"> & { id?: string };

const NOVO_POP: FormPop = {
  codigo: "",
  titulo: "",
  norma: "",
  versao: "1.0",
  descricao: "",
  arquivo_url: null,
  revisado_em: null,
};

const NOVO_TRE: FormTre = {
  unit_id: null,
  participante: "",
  funcao: "ASB",
  tema: "",
  pop_id: null,
  realizado_em: new Date().toISOString().slice(0, 10),
  validade: null,
  carga_horaria: 2,
  instrutor: "",
  certificado_url: null,
};

function TreinamentosPage() {
  const { data: org } = useOrganizacao();
  const pops = useQuery({ queryKey: ["pops"], queryFn: listarPops });
  const treinos = useQuery({ queryKey: ["treinamentos"], queryFn: listarTreinamentos });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });
  const [formPop, setFormPop] = useState<FormPop | null>(null);
  const [formTre, setFormTre] = useState<FormTre | null>(null);

  const abrir = async (caminho: string) => {
    const url = await urlAssinada(caminho);
    if (url) window.open(url, "_blank", "noopener");
  };

  const gravarPop = async () => {
    if (!org || !formPop?.codigo || !formPop.titulo) return;
    try {
      await salvarPop(org.id, formPop);
      setFormPop(null);
      void pops.refetch();
      toast.success("POP salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar POP.");
    }
  };

  const gravarTre = async () => {
    if (!org || !formTre?.participante || !formTre.tema) return;
    try {
      await salvarTreinamento(org.id, formTre);
      setFormTre(null);
      void treinos.refetch();
      toast.success("Treinamento registrado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar treinamento.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">
              <BookOpen className="mr-1 inline h-4 w-4 text-teal" /> Procedimentos Operacionais
              Padrão (POPs)
            </h2>
            <p className="text-sm text-muted-foreground">
              Cadastre os POPs para vincular às execuções de checklist e comprovar a rotina na
              fiscalização (RDC 1002/2025).
            </p>
          </div>
          <button
            onClick={() => setFormPop({ ...NOVO_POP })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Novo POP
          </button>
        </header>

        {formPop && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className={rotulo}>Código</span>
                <input
                  className={campo}
                  value={formPop.codigo}
                  onChange={(e) => setFormPop({ ...formPop, codigo: e.target.value })}
                  placeholder="POP-01"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={rotulo}>Título</span>
                <input
                  className={campo}
                  value={formPop.titulo}
                  onChange={(e) => setFormPop({ ...formPop, titulo: e.target.value })}
                  placeholder="Desinfecção de superfícies entre pacientes"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Norma de referência</span>
                <input
                  className={campo}
                  value={formPop.norma}
                  onChange={(e) => setFormPop({ ...formPop, norma: e.target.value })}
                  placeholder="RDC 1002/2025"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Versão</span>
                <input
                  className={campo}
                  value={formPop.versao}
                  onChange={(e) => setFormPop({ ...formPop, versao: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Revisado em</span>
                <input
                  type="date"
                  className={campo}
                  value={formPop.revisado_em ?? ""}
                  onChange={(e) => setFormPop({ ...formPop, revisado_em: e.target.value || null })}
                />
              </label>
              <label className="space-y-1 sm:col-span-3">
                <span className={rotulo}>Arquivo do POP (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className={campo + " py-2"}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const caminho = await enviarArquivo("pops", f);
                    setFormPop((p) => (p ? { ...p, arquivo_url: caminho } : p));
                    toast.success("Arquivo anexado.");
                  }}
                />
              </label>
            </div>
            <textarea
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              rows={2}
              placeholder="Resumo do procedimento"
              value={formPop.descricao}
              onChange={(e) => setFormPop({ ...formPop, descricao: e.target.value })}
            />
            <div className="flex gap-2">
              <button
                onClick={() => void gravarPop()}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                Salvar POP
              </button>
              <button
                onClick={() => setFormPop(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(pops.data ?? []).map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-black text-foreground">
                  {p.codigo} — {p.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.norma || "Sem norma"} · versão {p.versao}
                  {p.revisado_em &&
                    ` · revisado em ${new Date(`${p.revisado_em}T12:00:00`).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <div className="flex gap-2">
                {p.arquivo_url && (
                  <button
                    onClick={() => void abrir(p.arquivo_url!)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    Abrir
                  </button>
                )}
                <button
                  onClick={() => setFormPop({ ...p })}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    await excluirPop(p.id);
                    void pops.refetch();
                  }}
                  className="rounded-xl border border-destructive/30 p-2 text-destructive"
                  aria-label="Excluir POP"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!pops.isLoading && !(pops.data ?? []).length && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum POP cadastrado ainda.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">
              <GraduationCap className="mr-1 inline h-4 w-4 text-teal" /> Matriz de treinamentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Histórico de capacitação em biossegurança por ASB, TSB e dentistas, com validade e
              certificado anexado.
            </p>
          </div>
          <button
            onClick={() => setFormTre({ ...NOVO_TRE })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Registrar treinamento
          </button>
        </header>

        {formTre && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className={rotulo}>Participante</span>
                <input
                  className={campo}
                  value={formTre.participante}
                  onChange={(e) => setFormTre({ ...formTre, participante: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Função</span>
                <select
                  className={campo}
                  value={formTre.funcao}
                  onChange={(e) => setFormTre({ ...formTre, funcao: e.target.value })}
                >
                  {["ASB", "TSB", "Dentista", "Recepção", "Limpeza", "Outro"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Unidade</span>
                <select
                  className={campo}
                  value={formTre.unit_id ?? ""}
                  onChange={(e) => setFormTre({ ...formTre, unit_id: e.target.value || null })}
                >
                  <option value="">Toda a organização</option>
                  {(unidades.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={rotulo}>Tema</span>
                <input
                  className={campo}
                  value={formTre.tema}
                  onChange={(e) => setFormTre({ ...formTre, tema: e.target.value })}
                  placeholder="Biossegurança e paramentação"
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>POP relacionado</span>
                <select
                  className={campo}
                  value={formTre.pop_id ?? ""}
                  onChange={(e) => setFormTre({ ...formTre, pop_id: e.target.value || null })}
                >
                  <option value="">Nenhum</option>
                  {(pops.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} — {p.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Realizado em</span>
                <input
                  type="date"
                  className={campo}
                  value={formTre.realizado_em}
                  onChange={(e) => setFormTre({ ...formTre, realizado_em: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Válido até</span>
                <input
                  type="date"
                  className={campo}
                  value={formTre.validade ?? ""}
                  onChange={(e) => setFormTre({ ...formTre, validade: e.target.value || null })}
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Carga horária (h)</span>
                <input
                  type="number"
                  className={campo}
                  value={formTre.carga_horaria ?? ""}
                  onChange={(e) =>
                    setFormTre({
                      ...formTre,
                      carga_horaria: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span className={rotulo}>Instrutor</span>
                <input
                  className={campo}
                  value={formTre.instrutor}
                  onChange={(e) => setFormTre({ ...formTre, instrutor: e.target.value })}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className={rotulo}>Certificado (PDF ou foto)</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className={campo + " py-2"}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const caminho = await enviarArquivo("certificados", f);
                    setFormTre((t) => (t ? { ...t, certificado_url: caminho } : t));
                    toast.success("Certificado anexado.");
                  }}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void gravarTre()}
                className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
              >
                Salvar treinamento
              </button>
              <button
                onClick={() => setFormTre(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(treinos.data ?? []).map((t) => {
            const dias = diasAte(t.validade);
            const pop = (pops.data ?? []).find((p) => p.id === t.pop_id);
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-black text-foreground">
                    {t.participante} · <span className="text-teal">{t.funcao}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.tema} · {new Date(`${t.realizado_em}T12:00:00`).toLocaleDateString("pt-BR")}
                    {t.carga_horaria ? ` · ${t.carga_horaria}h` : ""}
                    {pop ? ` · ${pop.codigo}` : ""}
                  </p>
                  {dias !== null && dias <= 30 && (
                    <p className={`text-xs font-bold ${faixaAviso(dias).tom}`}>
                      Reciclagem: {faixaAviso(dias).label.toLowerCase()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {t.certificado_url && (
                    <button
                      onClick={() => void abrir(t.certificado_url!)}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                    >
                      Certificado
                    </button>
                  )}
                  <button
                    onClick={() => setFormTre({ ...t })}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      await excluirTreinamento(t.id);
                      void treinos.refetch();
                    }}
                    className="rounded-xl border border-destructive/30 p-2 text-destructive"
                    aria-label="Excluir treinamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!treinos.isLoading && !(treinos.data ?? []).length && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum treinamento registrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
