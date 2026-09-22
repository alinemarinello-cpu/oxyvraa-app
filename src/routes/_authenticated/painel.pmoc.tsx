import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AirVent, AlertTriangle, Plus, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  SERVICOS_PMOC,
  TIPOS_CLIMA,
  abrirTarefaPmoc,
  listarEquipamentos,
  listarManutencoes,
  proximaLimpeza,
  registrarManutencao,
  salvarEquipamento,
  statusEquipamento,
  type EquipamentoClima,
  type ManutencaoClima,
} from "@/lib/pmoc-db";
import { diasAte, enviarArquivo, urlAssinada } from "@/lib/biosseguranca-db";
import { listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/pmoc")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "PMOC — Ar-condicionado e climatização | Oxyvra" },
      {
        name: "description",
        content:
          "Plano de Manutenção, Operação e Controle: equipamentos por quarto, limpeza de filtros e laudo técnico assinado.",
      },
      { property: "og:title", content: "PMOC — Ar-condicionado e climatização | Oxyvra" },
      {
        property: "og:description",
        content: "Gestão de splits e centrais com histórico de manutenção e laudo do responsável técnico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PmocPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

type FormEquip = Omit<EquipamentoClima, "id" | "organizacao_id"> & { id?: string };
type FormManut = Omit<ManutencaoClima, "id" | "organizacao_id">;

const NOVO_EQUIP: FormEquip = {
  unit_id: "",
  identificacao: "",
  ambiente: "",
  tipo: "split",
  marca: "",
  modelo: "",
  numero_serie: "",
  capacidade_btus: null,
  instalado_em: null,
  frequencia_limpeza_dias: 90,
  ultima_limpeza: null,
  responsavel_tecnico: "",
  registro_crea: "",
  laudo_url: null,
  laudo_nome: null,
  laudo_emitido_em: null,
  laudo_expira_em: null,
  ativo: true,
  observacoes: "",
};

const novaManutencao = (equipamentoId: string): FormManut => ({
  equipamento_id: equipamentoId,
  tipo_servico: "limpeza_filtro",
  executado_em: new Date().toISOString().slice(0, 10),
  proxima_em: null,
  executante: "",
  registro_executante: "",
  foto: null,
  laudo_url: null,
  observacoes: "",
});

function PmocPage() {
  const { data: org } = useOrganizacao();
  const equipamentos = useQuery({ queryKey: ["pmoc-equipamentos"], queryFn: listarEquipamentos });
  const manutencoes = useQuery({ queryKey: ["pmoc-manutencoes"], queryFn: () => listarManutencoes() });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });

  const [form, setForm] = useState<FormEquip | null>(null);
  const [manut, setManut] = useState<FormManut | null>(null);
  const [enviando, setEnviando] = useState(false);

  const lista = equipamentos.data ?? [];
  const atrasados = useMemo(() => lista.filter((e) => e.ativo && statusEquipamento(e).atrasado), [lista]);
  const laudosVencendo = useMemo(
    () =>
      lista
        .map((e) => ({ e, dias: diasAte(e.laudo_expira_em) }))
        .filter((x) => x.dias !== null && x.dias <= 60),
    [lista],
  );

  const anexarLaudo = async (file: File) => {
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("documentos", file);
      setForm((f) => (f ? { ...f, laudo_url: caminho, laudo_nome: file.name } : f));
      toast.success("Laudo anexado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar o laudo.");
    } finally {
      setEnviando(false);
    }
  };

  const gravarEquipamento = async () => {
    if (!org || !form) return;
    try {
      await salvarEquipamento(org.id, form);
      setForm(null);
      void equipamentos.refetch();
      toast.success("Equipamento salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const gravarManutencao = async () => {
    if (!org || !manut) return;
    try {
      await registrarManutencao(org.id, manut);
      setManut(null);
      void manutencoes.refetch();
      void equipamentos.refetch();
      toast.success("Manutenção registrada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar.");
    }
  };

  const abrirArquivo = async (caminho: string) => {
    const url = await urlAssinada(caminho);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Não foi possível abrir o arquivo.");
  };

  const abrirCapa = async (e: EquipamentoClima) => {
    if (!org) return;
    try {
      await abrirTarefaPmoc(org.id, e, statusEquipamento(e).label);
      toast.success("Plano de ação aberto para a manutenção.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir plano de ação.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">
            <AirVent className="mr-1 inline h-5 w-5 text-teal" /> PMOC — Ar climatizado
          </h2>
          <p className="text-sm text-muted-foreground">
            Plano de Manutenção, Operação e Controle (Lei 13.589/2018): equipamentos por
            ambiente/quarto, frequência de limpeza de filtros e laudo do responsável técnico.
          </p>
        </div>
        <button
          onClick={() => setForm({ ...NOVO_EQUIP, unit_id: unidades.data?.[0]?.id ?? "" })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo equipamento
        </button>
      </header>

      {(!!atrasados.length || !!laudosVencendo.length) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {atrasados.length} aparelho(s) com limpeza pendente · {laudosVencendo.length} laudo(s) a
            vencer
          </p>
        </div>
      )}

      {form && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1">
              <span className={rotulo}>Unidade</span>
              <select
                className={campo}
                value={form.unit_id}
                onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
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
              <span className={rotulo}>Identificação (tag)</span>
              <input
                className={campo}
                placeholder="Ex.: AC-204"
                value={form.identificacao}
                onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Ambiente / quarto</span>
              <input
                className={campo}
                placeholder="Ex.: Quarto 204 / Restaurante"
                value={form.ambiente}
                onChange={(e) => setForm({ ...form, ambiente: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Tipo</span>
              <select
                className={campo}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS_CLIMA.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Marca</span>
              <input
                className={campo}
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Modelo</span>
              <input
                className={campo}
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Nº de série</span>
              <input
                className={campo}
                value={form.numero_serie ?? ""}
                onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Capacidade (BTUs)</span>
              <input
                type="number"
                className={campo}
                value={form.capacidade_btus ?? ""}
                onChange={(e) =>
                  setForm({ ...form, capacidade_btus: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Frequência de limpeza (dias)</span>
              <input
                type="number"
                className={campo}
                value={form.frequencia_limpeza_dias}
                onChange={(e) =>
                  setForm({ ...form, frequencia_limpeza_dias: Number(e.target.value) || 90 })
                }
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Última limpeza</span>
              <input
                type="date"
                className={campo}
                value={form.ultima_limpeza ?? ""}
                onChange={(e) => setForm({ ...form, ultima_limpeza: e.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Responsável técnico</span>
              <input
                className={campo}
                placeholder="Engenheiro mecânico ou técnico"
                value={form.responsavel_tecnico}
                onChange={(e) => setForm({ ...form, responsavel_tecnico: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Registro CREA/CFT</span>
              <input
                className={campo}
                value={form.registro_crea ?? ""}
                onChange={(e) => setForm({ ...form, registro_crea: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Laudo emitido em</span>
              <input
                type="date"
                className={campo}
                value={form.laudo_emitido_em ?? ""}
                onChange={(e) => setForm({ ...form, laudo_emitido_em: e.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Laudo válido até</span>
              <input
                type="date"
                className={campo}
                value={form.laudo_expira_em ?? ""}
                onChange={(e) => setForm({ ...form, laudo_expira_em: e.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className={rotulo}>Laudo técnico assinado</span>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-muted-foreground">
                <Upload className="h-4 w-4" />
                {enviando ? "Enviando…" : (form.laudo_nome ?? "Anexar PDF do laudo")}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && void anexarLaudo(e.target.files[0])}
                />
              </label>
            </label>
          </div>
          <label className="space-y-1 block">
            <span className={rotulo}>Observações</span>
            <textarea
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              rows={2}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => void gravarEquipamento()}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
            >
              Salvar equipamento
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

      <section className="space-y-3">
        {lista.map((e) => {
          const st = statusEquipamento(e);
          const unidade = (unidades.data ?? []).find((u) => u.id === e.unit_id);
          const hist = (manutencoes.data ?? []).filter((m) => m.equipamento_id === e.id).slice(0, 3);
          return (
            <article key={e.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {e.identificacao} · {e.ambiente || "sem ambiente"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {unidade?.nome ?? "—"} · {TIPOS_CLIMA.find((t) => t.valor === e.tipo)?.label} ·{" "}
                    {e.marca} {e.modelo} {e.capacidade_btus ? `· ${e.capacidade_btus} BTUs` : ""}
                  </p>
                  <p className={`text-xs font-bold ${st.tom}`}>
                    {st.label}
                    {proximaLimpeza(e) ? ` · próxima em ${proximaLimpeza(e)}` : ""}
                  </p>
                  {e.responsavel_tecnico && (
                    <p className="text-xs text-muted-foreground">
                      RT: {e.responsavel_tecnico} {e.registro_crea ? `· ${e.registro_crea}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.laudo_url && (
                    <button
                      onClick={() => void abrirArquivo(e.laudo_url!)}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                    >
                      Ver laudo
                    </button>
                  )}
                  <button
                    onClick={() => setManut(novaManutencao(e.id))}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
                  >
                    <Wrench className="h-3.5 w-3.5" /> Registrar manutenção
                  </button>
                  <button
                    onClick={() => setForm({ ...e })}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                  >
                    Editar
                  </button>
                  {st.atrasado && (
                    <button
                      onClick={() => void abrirCapa(e)}
                      className="rounded-xl border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
                    >
                      Abrir plano de ação
                    </button>
                  )}
                </div>
              </div>

              {manut?.equipamento_id === e.id && (
                <div className="mt-3 grid gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="space-y-1">
                    <span className={rotulo}>Serviço</span>
                    <select
                      className={campo}
                      value={manut.tipo_servico}
                      onChange={(ev) => setManut({ ...manut, tipo_servico: ev.target.value })}
                    >
                      {SERVICOS_PMOC.map((s) => (
                        <option key={s.valor} value={s.valor}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className={rotulo}>Executado em</span>
                    <input
                      type="date"
                      className={campo}
                      value={manut.executado_em}
                      onChange={(ev) => setManut({ ...manut, executado_em: ev.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className={rotulo}>Próxima prevista</span>
                    <input
                      type="date"
                      className={campo}
                      value={manut.proxima_em ?? ""}
                      onChange={(ev) => setManut({ ...manut, proxima_em: ev.target.value || null })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className={rotulo}>Executante</span>
                    <input
                      className={campo}
                      value={manut.executante}
                      onChange={(ev) => setManut({ ...manut, executante: ev.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className={rotulo}>Registro (CREA/CFT)</span>
                    <input
                      className={campo}
                      value={manut.registro_executante ?? ""}
                      onChange={(ev) => setManut({ ...manut, registro_executante: ev.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className={rotulo}>Observações</span>
                    <input
                      className={campo}
                      value={manut.observacoes}
                      onChange={(ev) => setManut({ ...manut, observacoes: ev.target.value })}
                    />
                  </label>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <button
                      onClick={() => void gravarManutencao()}
                      className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
                    >
                      Salvar manutenção
                    </button>
                    <button
                      onClick={() => setManut(null)}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {!!hist.length && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {hist.map((m) => (
                    <li key={m.id}>
                      {new Date(`${m.executado_em}T12:00:00`).toLocaleDateString("pt-BR")} —{" "}
                      {SERVICOS_PMOC.find((s) => s.valor === m.tipo_servico)?.label} ·{" "}
                      {m.executante}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
        {!lista.length && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum aparelho cadastrado. Cadastre os splits e centrais por quarto/ambiente para
            montar o PMOC da hospedagem.
          </p>
        )}
      </section>
    </div>
  );
}
