import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Paperclip,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  AVISO_LEGAL,
  CATEGORIAS_PASTA,
  enviarAnexoPasta,
  excluirAnexoPasta,
  listarDocumentosPasta,
  urlAssinada,
  type CategoriaPasta,
  type DocumentoPasta,
} from "@/lib/saude-conformidade-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/pastas")({
  head: () => ({
    meta: [
      { title: "Pastas de conformidade — Oxyvra" },
      {
        name: "description",
        content:
          "Biblioteca central com dossiês gerados, alvarás, laudos, POPs, contratos e demais anexos de conformidade da sua organização.",
      },
      { property: "og:title", content: "Pastas de conformidade — Oxyvra" },
      {
        property: "og:description",
        content: "Todos os documentos sanitários do cliente em um só lugar, prontos para a fiscalização.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPastas,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

function tamanho(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function vencimento(valid: string | null) {
  if (!valid) return null;
  const dias = Math.ceil((new Date(`${valid}T12:00:00`).getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return { texto: "Vencido", critico: true };
  if (dias <= 30) return { texto: `Vence em ${dias} dia(s)`, critico: true };
  return { texto: `Válido até ${new Date(`${valid}T12:00:00`).toLocaleDateString("pt-BR")}`, critico: false };
}

function PainelPastas() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["pastas-conformidade"], queryFn: listarDocumentosPasta });

  const [aba, setAba] = useState<"TODOS" | "DOSSIE" | CategoriaPasta>("TODOS");
  const [form, setForm] = useState({
    title: "",
    category: "OUTROS" as CategoriaPasta,
    notes: "",
    valid_until: "",
  });
  const [arquivo, setArquivo] = useState<File | null>(null);

  const enviar = useMutation({
    mutationFn: async () => {
      if (!org?.id) throw new Error("Organização não identificada.");
      if (!arquivo) throw new Error("Escolha um arquivo.");
      if (!form.title.trim()) throw new Error("Dê um nome ao documento.");
      await enviarAnexoPasta({
        organizacao_id: org.id,
        clinic_name: org.nome ?? "",
        title: form.title,
        category: form.category,
        notes: form.notes,
        valid_until: form.valid_until || null,
        file: arquivo,
      });
    },
    onSuccess: () => {
      toast.success("Anexo guardado na pasta.");
      setForm({ title: "", category: "OUTROS", notes: "", valid_until: "" });
      setArquivo(null);
      qc.invalidateQueries({ queryKey: ["pastas-conformidade"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apagar = useMutation({
    mutationFn: (doc: DocumentoPasta) => excluirAnexoPasta(doc),
    onSuccess: () => {
      toast.success("Anexo removido.");
      qc.invalidateQueries({ queryKey: ["pastas-conformidade"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function abrir(doc: DocumentoPasta) {
    if (!doc.file_path) {
      toast.info("Este dossiê foi gerado antes do arquivamento automático. Gere novamente para guardar o PDF.");
      return;
    }
    const url = await urlAssinada(doc.file_path);
    if (!url) return toast.error("Não foi possível abrir o arquivo.");
    window.open(url, "_blank", "noopener");
  }

  const lista = docs.data ?? [];
  const filtrados = useMemo(() => {
    if (aba === "TODOS") return lista;
    if (aba === "DOSSIE") return lista.filter((d) => d.kind === "DOSSIE");
    return lista.filter((d) => d.kind === "ANEXO" && d.category === aba);
  }, [lista, aba]);

  const vencendo = lista.filter((d) => {
    const v = vencimento(d.valid_until);
    return v?.critico;
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-soft">
          Biblioteca de conformidade
        </p>
        <h2 className="mt-1 text-xl font-black">Pastas do cliente</h2>
        <p className="mt-1 max-w-2xl text-sm text-primary-foreground/80">
          Tudo o que a fiscalização pede em um só lugar: dossiês gerados pelo sistema e os seus
          próprios anexos (alvarás, laudos, contratos, certificados e outros arquivos).
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <Link
            to="/painel/conformidade"
            className="rounded-xl bg-teal px-3 py-2 text-teal-foreground"
          >
            Gerar Pasta da Vigilância
          </Link>
          <Link to="/painel/documentos" className="rounded-xl bg-white/10 px-3 py-2">
            Documentos SDBPF
          </Link>
        </div>
      </header>

      {vencendo.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-bold text-destructive">
              {vencendo.length} documento(s) vencido(s) ou a vencer em 30 dias
            </p>
            <p className="text-muted-foreground">{vencendo.map((d) => d.title).join(" · ")}</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Paperclip className="h-4 w-4" /> Enviar outro anexo
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Nome do documento</label>
            <input
              className={campo}
              value={form.title}
              placeholder="Ex.: Alvará sanitário 2026"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={rotulo}>Pasta</label>
            <select
              className={campo}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as CategoriaPasta })}
            >
              {CATEGORIAS_PASTA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Validade (opcional)</label>
            <input
              type="date"
              className={campo}
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            />
          </div>
          <div>
            <label className={rotulo}>Arquivo (PDF, imagem, planilha — até 25 MB)</label>
            <input
              type="file"
              className={`${campo} py-2`}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo}>Observações (sem dados de paciente)</label>
            <textarea
              className="min-h-[70px] w-full rounded-xl border border-border bg-background p-3 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={() => enviar.mutate()}
          disabled={enviar.isPending}
          className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Guardar na pasta
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "TODOS", label: "Todos", emoji: "📁" },
            { id: "DOSSIE", label: "Dossiês gerados", emoji: "🛡️" },
            ...CATEGORIAS_PASTA,
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setAba(c.id as typeof aba)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
                aba === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {docs.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pastas…</p>
        ) : filtrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <FolderOpen className="mx-auto mb-2 h-6 w-6" />
            Nenhum documento nesta pasta ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((d) => {
              const v = vencimento(d.valid_until);
              const cat = CATEGORIAS_PASTA.find((c) => c.id === d.category);
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      {d.kind === "DOSSIE" ? (
                        <ShieldCheck className="h-4 w-4 text-teal" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      {d.title || "Pasta da Vigilância"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.kind === "DOSSIE"
                        ? `Dossiê ${d.plan === "TRIAL_14" ? "de teste" : "blindado"} · código ${d.sha256.slice(0, 12)}…`
                        : `${cat?.emoji ?? "📎"} ${cat?.label ?? d.category} · ${tamanho(d.size_bytes)}`}
                      {" · "}
                      {new Date(d.generated_at).toLocaleDateString("pt-BR")}
                    </p>
                    {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
                    {v && (
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          v.critico ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {v.texto}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {d.kind === "DOSSIE" && (
                      <Link
                        to="/validar/$hash"
                        params={{ hash: d.sha256 }}
                        className="rounded-xl bg-muted px-3 py-2 text-xs font-bold"
                      >
                        Validar
                      </Link>
                    )}
                    <button
                      onClick={() => abrir(d)}
                      className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                    >
                      <Download className="h-3.5 w-3.5" /> Abrir
                    </button>
                    {d.kind === "ANEXO" && (
                      <button
                        onClick={() => {
                          if (confirm(`Remover "${d.title}" da pasta?`)) apagar.mutate(d);
                        }}
                        className="rounded-xl bg-destructive/10 p-2 text-destructive"
                        aria-label="Remover anexo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="rounded-2xl bg-muted p-4 text-[11px] leading-relaxed text-muted-foreground">
        {AVISO_LEGAL}
      </p>
    </div>
  );
}
