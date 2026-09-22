import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { listarClientes, listarUnidades } from "@/lib/painel-db";
import {
  convidarLogistica,
  listarAcessosLogistica,
  removerAcessoLogistica,
} from "@/lib/logistica-db";
import PedidosLogistica from "@/components/logistica/PedidosLogistica";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/logistica")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Logística de insumos — Oxyvra" },
      {
        name: "description",
        content:
          "Pedido mensal de insumos por empresa cliente: compra, fornecedor, custo e confirmação de entrega.",
      },
      { property: "og:title", content: "Logística de insumos — Oxyvra" },
      {
        property: "og:description",
        content: "Controle de compra e entrega de insumos vinculado a cada empresa cliente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelLogistica,
});

function PainelLogistica() {
  const { data: org } = useOrganizacao();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["logistica-base"],
    queryFn: async () => {
      const [clientes, unidades, acessos] = await Promise.all([
        listarClientes(),
        listarUnidades(),
        listarAcessosLogistica(),
      ]);
      return { clientes, unidades, acessos };
    },
  });

  const clientes = (data?.clientes ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    lat: c.lat,
    lng: c.lng,
  }));
  const unidades = (data?.unidades ?? []).map((u) => ({
    id: u.id,
    nome: u.nome,
    prefeitura_id: u.prefeitura_id,
    lat: u.lat,
    lng: u.lng,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-foreground">Logística de insumos</h1>
        <p className="text-sm text-muted-foreground">
          Vincule o pedido mensal de insumos a cada empresa cliente, acompanhe a compra e confirme a
          entrega. O responsável pela logística acessa em <strong>/logistica</strong> com o próprio
          login.
        </p>
      </header>

      {org?.id && (
        <PedidosLogistica
          organizacaoId={org.id}
          clientes={clientes}
          unidades={unidades}
          podeExcluir
        />
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <UserPlus className="h-5 w-5 text-teal" /> Responsáveis pela logística
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Convide por e-mail. Ao criar a conta com esse mesmo e-mail, o acesso é liberado
          automaticamente — somente ao módulo de pedidos.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            className="rounded-xl border border-border bg-background p-2.5 text-foreground"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@empresa.com"
            className="rounded-xl border border-border bg-background p-2.5 text-foreground"
          />
          <button
            onClick={async () => {
              if (!org?.id) return;
              if (!email.trim()) return toast.error("Informe o e-mail.");
              try {
                await convidarLogistica(org.id, nome.trim(), email.trim());
                setNome("");
                setEmail("");
                toast.success("Convite criado.");
                qc.invalidateQueries({ queryKey: ["logistica-base"] });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground"
          >
            Convidar
          </button>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {(data?.acessos ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <strong className="text-foreground">{a.nome || a.email}</strong>{" "}
                <span className="text-muted-foreground">{a.email}</span>{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                    a.user_id ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a.user_id ? "ativo" : "aguardando cadastro"}
                </span>
              </span>
              <button
                onClick={async () => {
                  await removerAcessoLogistica(a.id);
                  qc.invalidateQueries({ queryKey: ["logistica-base"] });
                }}
                className="text-destructive"
                aria-label={`Remover ${a.email}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {(data?.acessos ?? []).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Nenhum responsável convidado.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
