import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIAS_DOC,
  diasAte,
  documentosEmAlerta,
  enviarArquivo,
  excluirDocumento,
  faixaAviso,
  listarDocumentos,
  salvarDocumento,
  urlAssinada,
  type Documento,
} from "@/lib/biosseguranca-db";
import { listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos SDBPF — Oxyvra" },
      {
        name: "description",
        content:
          "Repositório digital de alvarás, projeto arquitetônico, PGRSS, laudos de autoclave e certificados, com controle de validade.",
      },
      { property: "og:title", content: "Documentos SDBPF — Oxyvra" },
      {
        property: "og:description",
        content: "Central documental de boas práticas de funcionamento com alerta de vencimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentosPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

type Form = Omit<Documento, "id" | "organizacao_id"> & { id?: string };

const NOVO: Form = {
  unit_id: null,
  categoria: "alvara",
  titulo: "",
  numero: "",
  orgao_emissor: "",
  arquivo_url: null,
  arquivo_nome: null,
  emitido_em: null,
  expires_at: null,
  observacoes: "",
};

function DocumentosPage() {
  const { data: org } = useOrganizacao();
  const docs = useQuery({ queryKey: ["documentos"], queryFn: listarDocumentos });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });
  const [form, setForm] = useState<Form | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alertas = documentosEmAlerta(docs.data ?? []);

  const anexar = async (file: File) => {
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("documentos", file);
      setForm((f) => (f ? { ...f, arquivo_url: caminho, arquivo_nome: file.name } : f));
      toast.success("Arquivo anexado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar arquivo.");
    } finally {
      setEnviando(false);
    }
  };

  const gravar = async () => {
    if (!org || !form?.titulo) return;
    try {
      await salvarDocumento(org.id, form);
      setForm(null);
      void docs.refetch();
      toast.success("Documento salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const abrir = async (caminho: string) => {
    const url = await urlAssinada(caminho);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Não foi possível abrir o arquivo.");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Documentos SDBPF</h2>
          <p className="text-sm text-muted-foreground">
            Série de Documentos de Boas Práticas de Funcionamento exigida na fiscalização, com
            aviso automático 60, 30 e 15 dias antes do vencimento.
          </p>
        </div>
        <button
          onClick={() => setForm({ ...NOVO })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo documento
        </button>
      </header>

      {!!alertas.length && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {alertas.length} documento(s) vencido(s) ou a vencer
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {alertas.map(({ doc, dias }) => (
              <li key={doc.id}>
                <b>{doc.titulo}</b> —{" "}
                <span className={faixaAviso(dias ?? 0).tom}>{faixaAviso(dias ?? 0).label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {form && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={rotulo}>Categoria</span>
              <select
                className={campo}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {CATEGORIAS_DOC.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Título</span>
              <input
                className={campo}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Alvará sanitário 2026"
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Unidade (opcional)</span>
              <select
                className={campo}
                value={form.unit_id ?? ""}
                onChange={(e) => setForm({ ...form, unit_id: e.target.value || null })}
              >
                <option value="">Toda a organização</option>
                {(unidades.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Número / protocolo</span>
              <input
                className={campo}
                value={form.numero ?? ""}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Órgão emissor</span>
              <input
                className={campo}
                value={form.orgao_emissor ?? ""}
                onChange={(e) => setForm({ ...form, orgao_emissor: e.target.value })}
                placeholder="Vigilância Sanitária Municipal"
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Emitido em</span>
              <input
                type="date"
                className={campo}
                value={form.emitido_em ?? ""}
                onChange={(e) => setForm({ ...form, emitido_em: e.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Válido até</span>
              <input
                type="date"
                className={campo}
                value={form.expires_at ?? ""}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Arquivo (PDF ou imagem)</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className={campo + " py-2"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void anexar(f);
                }}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {enviando ? "Enviando arquivo…" : form.arquivo_nome ? `Anexado: ${form.arquivo_nome}` : "Nenhum arquivo anexado."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => void gravar()}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
            >
              Salvar documento
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(docs.data ?? []).map((d) => {
          const dias = diasAte(d.expires_at);
          return (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-teal">
                  {CATEGORIAS_DOC.find((c) => c.valor === d.categoria)?.label ?? d.categoria}
                </p>
                <p className="font-black text-foreground">{d.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {[d.numero, d.orgao_emissor].filter(Boolean).join(" · ") || "Sem número"}
                  {d.expires_at &&
                    ` · válido até ${new Date(`${d.expires_at}T12:00:00`).toLocaleDateString("pt-BR")}`}
                </p>
                {dias !== null && dias <= 30 && (
                  <p className={`text-xs font-bold ${faixaAviso(dias).tom}`}>
                    {faixaAviso(dias).label}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {d.arquivo_url && (
                  <button
                    onClick={() => void abrir(d.arquivo_url!)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    <FileText className="h-3.5 w-3.5" /> Abrir
                  </button>
                )}
                <button
                  onClick={() => setForm({ ...d })}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  <Upload className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={async () => {
                    await excluirDocumento(d.id);
                    void docs.refetch();
                  }}
                  className="rounded-xl border border-destructive/30 p-2 text-destructive"
                  aria-label="Excluir documento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {!docs.isLoading && !(docs.data ?? []).length && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum documento cadastrado. Comece pelo alvará sanitário e pelo PGRSS.
          </p>
        )}
      </div>
    </div>
  );
}
