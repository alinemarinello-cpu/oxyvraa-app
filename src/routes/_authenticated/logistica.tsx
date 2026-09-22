import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meuAcessoLogistica } from "@/lib/logistica.functions";
import PedidosLogistica from "@/components/logistica/PedidosLogistica";

export const Route = createFileRoute("/_authenticated/logistica")({
  head: () => ({
    meta: [
      { title: "Central de Logística — Oxyvra" },
      {
        name: "description",
        content:
          "Acesso do responsável pela logística: pedidos mensais de insumos, compras e entregas por empresa cliente.",
      },
      { property: "og:title", content: "Central de Logística — Oxyvra" },
      {
        property: "og:description",
        content: "Pedidos, compras e entregas de insumos das operações Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CentralLogistica,
});

function CentralLogistica() {
  const carregar = useServerFn(meuAcessoLogistica);
  const { data: acesso, isLoading } = useQuery({
    queryKey: ["meu-acesso-logistica"],
    queryFn: () => carregar(),
  });

  const { data: base } = useQuery({
    enabled: !!acesso,
    queryKey: ["logistica-escopo"],
    queryFn: async () => {
      const [c, u] = await Promise.all([
        supabase.from("prefeituras").select("id, nome, lat, lng").order("nome"),
        supabase.from("units").select("id, nome, prefeitura_id, lat, lng").order("nome"),
      ]);
      return { clientes: c.data ?? [], unidades: u.data ?? [] };
    },
  });

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!acesso) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-black text-foreground">Acesso de logística não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Peça ao administrador para convidar o seu e-mail em Painel → Logística de insumos.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-teal">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <Truck className="h-6 w-6 text-teal" /> Central de Logística
        </h1>
        <p className="text-sm text-muted-foreground">
          {acesso.nome || acesso.email}
          {acesso.organizacao_nome ? ` · ${acesso.organizacao_nome}` : ""}
        </p>
      </header>
      <PedidosLogistica
        organizacaoId={acesso.organizacao_id}
        clientes={base?.clientes ?? []}
        unidades={base?.unidades ?? []}
      />
    </div>
  );
}
