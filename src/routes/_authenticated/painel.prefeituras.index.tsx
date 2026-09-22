import { useMemo, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight, Landmark, Plus, Save, Trash2, X } from "lucide-react";
import { listarClientes } from "@/lib/painel-db";
import {
  excluirSecretaria,
  listarEquipamentos,
  listarSecretarias,
  salvarSecretaria,
  vincularSecretaria,
  SECRETARIA_META,
  type Secretaria,
  type SecretariaTipo,
} from "@/lib/prefeituras-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/prefeituras/")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Prefeituras e secretarias — Oxyvra" },
      {
        name: "description",
        content:
          "Hierarquia municipal Oxyvra: prefeitura, secretarias, equipamentos públicos e ambientes com normas ANVISA e FNDE.",
      },
      { property: "og:title", content: "Prefeituras e secretarias — Oxyvra" },
      {
        property: "og:description",
        content: "Gestão sanitária de escolas, creches, UBS, CAPS e centros TEA municipais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrefeiturasPage,
});

const TIPOS = Object.keys(SECRETARIA_META) as SecretariaTipo[];

type Rascunho = Partial<Secretaria> & { prefeitura_id: string; nome: string; tipo: SecretariaTipo };

function PrefeiturasPage() {
  const qc = useQueryClient();
  const { data: org } = useOrganizacao();
  const [prefeituraId, setPrefeituraId] = useState("");
  const [form, setForm] = useState<Rascunho | null>(null);

  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const secretarias = useQuery({ queryKey: ["secretarias"], queryFn: () => listarSecretarias() });
  const equipamentos = useQuery({ queryKey: ["equipamentos"], queryFn: listarEquipamentos });

  const prefAtual = useMemo(
    () => clientes.data?.find((c) => c.id === prefeituraId) ?? clientes.data?.[0] ?? null,
    [clientes.data, prefeituraId],
  );

  const minhasSecretarias = (secretarias.data ?? []).filter(
    (s) => s.prefeitura_id === prefAtual?.id,
  );
  const meusEquipamentos = (equipamentos.data ?? []).filter(
    (e) => e.prefeitura_id === prefAtual?.id,
  );

  const salvar = useMutation({
    mutationFn: (r: Rascunho) => salvarSecretaria(r, org?.id ?? null),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["secretarias"] });
      setForm(null);
    },
  });

  const remover = useMutation({
    mutationFn: excluirSecretaria,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["secretarias"] });
      void qc.invalidateQueries({ queryKey: ["equipamentos"] });
    },
  });

  const vincular = useMutation({
    mutationFn: (v: { unitId: string; secretariaId: string | null }) =>
      vincularSecretaria(v.unitId, v.secretariaId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["equipamentos"] }),
  });

  if (clientes.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  if (!clientes.data?.length)
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-black text-foreground">Nenhuma prefeitura cadastrada</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre o município em Unidades para começar a organizar secretarias e equipamentos
          públicos.
        </p>
        <Link
          to="/painel/unidades"
          className="mt-4 inline-flex rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
        >
          Cadastrar prefeitura
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-teal" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
                Gestão municipal
              </h2>
              <p className="text-xs text-muted-foreground">
                Prefeitura → secretarias → equipamentos públicos → ambientes.
              </p>
            </div>
          </div>
          <Link
            to="/painel/prefeituras/dashboard"
            className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground"
          >
            Dashboard do gestor municipal
          </Link>
        </div>

        <label className="mt-4 block text-xs font-bold text-muted-foreground">
          Prefeitura municipal
          <select
            value={prefAtual?.id ?? ""}
            onChange={(e) => setPrefeituraId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
          >
            {clientes.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.cidade}/{c.uf}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
            Secretarias ({minhasSecretarias.length})
          </h3>
          <button
            onClick={() =>
              prefAtual &&
              setForm({ prefeitura_id: prefAtual.id, nome: "", tipo: "educacao", responsavel: "" })
            }
            className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-black text-teal-foreground"
          >
            <Plus className="h-4 w-4" /> Nova secretaria
          </button>
        </div>

        {form && (
          <div className="space-y-3 rounded-2xl border border-teal/40 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase text-teal">
                {form.id ? "Editar secretaria" : "Nova secretaria"}
              </p>
              <button onClick={() => setForm(null)} aria-label="Fechar">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-muted-foreground">
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as SecretariaTipo })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {SECRETARIA_META[t].emoji} {SECRETARIA_META[t].label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block font-normal">{SECRETARIA_META[form.tipo].exemplos}</span>
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Nome da secretaria
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder={SECRETARIA_META[form.tipo].label}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Responsável / secretário(a)
                <input
                  value={form.responsavel ?? ""}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                E-mail
                <input
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-muted-foreground">
                Telefone
                <input
                  value={form.telefone ?? ""}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>
            <button
              disabled={!form.nome.trim() || salvar.isPending}
              onClick={() => salvar.mutate({ ...form, nome: form.nome.trim() })}
              className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-black text-teal-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Salvar secretaria
            </button>
          </div>
        )}

        {minhasSecretarias.length === 0 && !form && (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nenhuma secretaria cadastrada para esta prefeitura.
          </p>
        )}

        {minhasSecretarias.map((s) => {
          const vinculados = meusEquipamentos.filter((e) => e.secretaria_id === s.id);
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-foreground">
                    {SECRETARIA_META[s.tipo]?.emoji} {s.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {SECRETARIA_META[s.tipo]?.label}
                    {s.responsavel ? ` · ${s.responsavel}` : ""} · {vinculados.length} equipamentos
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...s })}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-black text-foreground"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remover.mutate(s.id)}
                    className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-black text-destructive"
                    aria-label={`Excluir ${s.nome}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {vinculados.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {vinculados.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs"
                    >
                      <Building2 className="h-3.5 w-3.5 text-teal" />
                      <span className="font-bold text-foreground">{e.nome}</span>
                      <span className="text-muted-foreground">
                        {e.bairro || "sem bairro"} · {e.locais.length || e.ambientes.length}{" "}
                        ambientes
                      </span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
          Equipamentos públicos ({meusEquipamentos.length})
        </h3>
        <p className="text-xs text-muted-foreground">
          Vincule cada escola, UBS, CAPS ou centro TEA à secretaria responsável.
        </p>
        <div className="mt-3 space-y-2">
          {meusEquipamentos.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{e.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {e.bairro || "sem bairro"} · {e.locais.length || e.ambientes.length} ambientes
                </p>
              </div>
              <select
                value={e.secretaria_id ?? ""}
                onChange={(ev) =>
                  vincular.mutate({ unitId: e.id, secretariaId: ev.target.value || null })
                }
                className="rounded-lg border border-input px-2 py-1.5 text-xs"
              >
                <option value="">Sem secretaria</option>
                {minhasSecretarias.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {meusEquipamentos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum equipamento público cadastrado nesta prefeitura.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
