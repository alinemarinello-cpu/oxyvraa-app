import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listarClientes, listarUnidades } from "@/lib/painel-db";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos de gestores — Oxyvra" },
      {
        name: "description",
        content:
          "Convide gestores das empresas clientes para acompanhar, em modo leitura, a operação das suas unidades.",
      },
      { property: "og:title", content: "Acessos de gestores — Oxyvra" },
      {
        property: "og:description",
        content: "Gestão de convites e permissões de leitura por cliente ou unidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcessosGestores,
});

type Acesso = {
  id: string;
  nome: string;
  email: string;
  escopo: string;
  prefeitura_id: string | null;
  unit_id: string | null;
  ativo: boolean;
  user_id: string | null;
};

function AcessosGestores() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [escopo, setEscopo] = useState<"cliente" | "unidade">("cliente");
  const [prefeituraId, setPrefeituraId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data } = useQuery({
    queryKey: ["acessos-gestores"],
    queryFn: async () => {
      const [clientes, unidades, acessos] = await Promise.all([
        listarClientes(),
        listarUnidades(),
        supabase
          .from("acessos_gestor")
          .select("id, nome, email, escopo, prefeitura_id, unit_id, ativo, user_id")
          .order("created_at", { ascending: false })
          .then((r) => (r.data ?? []) as Acesso[]),
      ]);
      return { clientes, unidades, acessos };
    },
  });

  const convidar = async () => {
    if (!org?.id) return;
    if (!email.trim()) return toast.error("Informe o e-mail do gestor.");
    if (escopo === "cliente" && !prefeituraId) return toast.error("Escolha o cliente.");
    if (escopo === "unidade" && !unitId) return toast.error("Escolha a unidade.");
    setSalvando(true);
    try {
      const { error } = await supabase.from("acessos_gestor").insert({
        organizacao_id: org.id,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        escopo,
        prefeitura_id: escopo === "cliente" ? prefeituraId : null,
        unit_id: escopo === "unidade" ? unitId : null,
      });
      if (error) throw error;
      toast.success("Acesso liberado. Peça ao gestor para criar a conta com este e-mail.");
      setNome("");
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["acessos-gestores"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao liberar o acesso.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("acessos_gestor").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["acessos-gestores"] });
  };

  const unidadesFiltradas = data?.unidades ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
          <UserPlus className="h-4 w-4 text-teal" /> Convidar gestor do cliente
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          O gestor acessa o painel em <strong>/gestor</strong> com e-mail e senha e enxerga apenas
          os dados do escopo escolhido, em modo somente leitura.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-muted-foreground">
            Nome do gestor
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              placeholder="Maria Souza"
            />
          </label>
          <label className="text-xs font-bold text-muted-foreground">
            E-mail de acesso
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              placeholder="gestor@empresa.com.br"
            />
          </label>
          <label className="text-xs font-bold text-muted-foreground">
            Escopo
            <select
              value={escopo}
              onChange={(e) => setEscopo(e.target.value as "cliente" | "unidade")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="cliente">Cliente inteiro (todas as unidades)</option>
              <option value="unidade">Somente uma unidade</option>
            </select>
          </label>
          {escopo === "cliente" ? (
            <label className="text-xs font-bold text-muted-foreground">
              Cliente
              <select
                value={prefeituraId}
                onChange={(e) => setPrefeituraId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Selecione…</option>
                {(data?.clientes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-xs font-bold text-muted-foreground">
              Unidade
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Selecione…</option>
                {unidadesFiltradas.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} — {u.cidade}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button
          onClick={() => void convidar()}
          disabled={salvando}
          className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
        >
          {salvando ? "Liberando…" : "Liberar acesso"}
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Gestores com acesso
        </h2>
        {(data?.acessos ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum gestor convidado ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(data?.acessos ?? []).map((a) => {
              const alvo =
                a.escopo === "unidade"
                  ? (data?.unidades.find((u) => u.id === a.unit_id)?.nome ?? "Unidade")
                  : (data?.clientes.find((c) => c.id === a.prefeitura_id)?.nome ?? "Cliente");
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{a.nome || a.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.email} · {alvo} ·{" "}
                      {a.user_id ? "conta vinculada" : "aguardando criação da conta"}
                    </p>
                  </div>
                  <button
                    onClick={() => void remover(a.id)}
                    aria-label="Remover acesso"
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
