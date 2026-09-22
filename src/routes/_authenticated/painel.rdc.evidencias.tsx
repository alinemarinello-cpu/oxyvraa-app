import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import {
  criarEvidencia,
  enviarArquivoEvidencia,
  listarEvidencias,
  listarPlano,
  urlEvidencia,
} from "@/lib/rdc-db";
import { SeletorUnidade, useUnidadeRdc } from "@/components/rdc/RdcContexto";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/rdc/evidencias")({
  component: CentralEvidencias,
});

const VINCULOS = ["REQUISITO", "DOCUMENTO", "CHECKLIST", "RISCO", "NÃO CONFORMIDADE", "TREINAMENTO"];

function CentralEvidencias() {
  const { data: org } = useOrganizacao();
  const { unitId, definirUnidade } = useUnidadeRdc();
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vinculo, setVinculo] = useState("REQUISITO");
  const [codigo, setCodigo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: evidencias } = useQuery({
    queryKey: ["rdc-evidencias", unitId],
    queryFn: () => listarEvidencias(unitId),
  });
  const { data: itens } = useQuery({
    queryKey: ["rdc-plano", unitId],
    queryFn: () => listarPlano(unitId),
  });

  const enviar = async () => {
    if (!org || !titulo.trim()) {
      toast.error("Informe o título da evidência.");
      return;
    }
    setSalvando(true);
    try {
      const caminho = arquivo ? await enviarArquivoEvidencia(org.id, arquivo) : null;
      await criarEvidencia({
        organizacao_id: org.id,
        unit_id: unitId,
        titulo: titulo.trim(),
        descricao: descricao || null,
        arquivo_url: caminho,
        vinculo_tipo: vinculo,
        requisito_codigo: codigo || null,
        artigo: itens?.find((i) => i.codigo === codigo)?.artigo ?? null,
        responsavel: responsavel || null,
      });
      setTitulo("");
      setDescricao("");
      setCodigo("");
      setArquivo(null);
      void qc.invalidateQueries({ queryKey: ["rdc-evidencias", unitId] });
      void qc.invalidateQueries({ queryKey: ["rdc-status", unitId] });
      toast.success("Evidência registrada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar a evidência.");
    } finally {
      setSalvando(false);
    }
  };

  const abrir = async (caminho: string) => {
    const url = await urlEvidencia(caminho);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Arquivo indisponível.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-lg font-black text-foreground">Central de evidências</h2>
          <p className="text-sm text-muted-foreground">
            Fotos, PDFs, certificados e comprovantes vinculados a cada exigência.
          </p>
        </div>
        <SeletorUnidade unitId={unitId} onChange={definirUnidade} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da evidência"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <select
          value={vinculo}
          onChange={(e) => setVinculo(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold"
        >
          {VINCULOS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Requisito (opcional)</option>
          {(itens ?? []).map((i) => (
            <option key={i.id} value={i.codigo}>
              {i.codigo} — {i.titulo}
            </option>
          ))}
        </select>
        <input
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          placeholder="Responsável"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="file"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição"
          rows={2}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          onClick={() => void enviar()}
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60 sm:col-span-2"
        >
          <Upload className="h-4 w-4" /> {salvando ? "Enviando…" : "Registrar evidência"}
        </button>
      </div>

      <ul className="space-y-2">
        {(evidencias ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-black text-foreground">{e.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {e.vinculo_tipo}
                {e.requisito_codigo ? ` · ${e.requisito_codigo}` : ""} · {e.responsavel ?? "—"} ·{" "}
                {new Date(e.created_at).toLocaleDateString("pt-BR")}
              </p>
              {e.descricao && <p className="text-xs text-foreground">{e.descricao}</p>}
            </div>
            {e.arquivo_url && (
              <button
                onClick={() => void abrir(e.arquivo_url!)}
                className="rounded-xl bg-secondary px-3 py-2 text-xs font-black text-foreground"
              >
                Abrir arquivo
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
