import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/oxyvra-auth";
import { useLinksPagamento, type LinkPagamento } from "@/lib/pagamento-links";

export const Route = createFileRoute("/_authenticated/superadmin/pagamentos")({
  head: () => ({
    meta: [
      { title: "Links de pagamento — Oxyvra" },
      {
        name: "description",
        content:
          "Cadastre os links de pagamento do Mercado Pago usados nos planos Consultório e Clínica e no kit de insumos da Oxyvra.",
      },
      { property: "og:title", content: "Links de pagamento — Oxyvra" },
      {
        property: "og:description",
        content: "Área da conta mestre para configurar os links de cobrança dos planos Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PagamentosMaster,
});

const ROTULO: Record<string, string> = {
  "plano|CONSULTORIO|MONTHLY": "Plano Conformidade — mensal",
  "plano|CONSULTORIO|ANNUAL": "Plano Conformidade — anual",
  "plano|CLINICA|MONTHLY": "Plano Clínica — mensal",
  "plano|CLINICA|ANNUAL": "Plano Clínica — anual",
  "addon||MONTHLY": "Kit de insumos — mensal",
  "addon||ANNUAL": "Kit de insumos — anual",
};

function PagamentosMaster() {
  const { roles } = useAuth();
  const ehMaster = roles.includes("master");
  const qc = useQueryClient();
  const { data, isLoading } = useLinksPagamento();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const inicial: Record<string, string> = {};
    for (const l of data as LinkPagamento[]) inicial[l.id] = l.url ?? "";
    setUrls(inicial);
  }, [data]);

  if (!ehMaster) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Esta área é exclusiva da conta mestre.
      </p>
    );
  }

  const salvar = async (link: LinkPagamento) => {
    setSalvando(link.id);
    const url = (urls[link.id] ?? "").trim();
    const { error } = await supabase
      .from("pagamento_links")
      .update({ url, ativo: url.length > 0 })
      .eq("id", link.id);
    setSalvando(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link salvo.");
    await qc.invalidateQueries({ queryKey: ["pagamento-links"] });
  };

  const enderecoAviso =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/webhooks/mercadopago`
      : "";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Links de pagamento (Mercado Pago)
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Cole aqui o link de pagamento de cada plano. Enquanto um campo estiver vazio, o botão do
          cliente abre o WhatsApp do comercial em vez do pagamento.
        </p>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="mt-4 space-y-3">
            {((data ?? []) as LinkPagamento[]).map((l) => {
              const chave = `${l.tipo}|${l.plano ?? ""}|${l.ciclo}`;
              return (
                <div key={l.id} className="rounded-xl border border-border p-4">
                  <p className="text-xs font-black uppercase text-muted-foreground">
                    {ROTULO[chave] ?? chave}
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={urls[l.id] ?? ""}
                      onChange={(e) => setUrls((u) => ({ ...u, [l.id]: e.target.value }))}
                      placeholder="https://mpago.la/..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm normal-case text-foreground"
                    />
                    <button
                      onClick={() => void salvar(l)}
                      disabled={salvando === l.id}
                      className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground disabled:opacity-60"
                    >
                      {salvando === l.id ? "Salvando…" : "Salvar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gold" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Aviso de pagamento (liberação automática)
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No Mercado Pago, em Notificações / Webhooks, cole o endereço abaixo e escolha o evento de
          pagamentos. Assim que um pagamento é aprovado, a conta do cliente é liberada sozinha.
        </p>
        <code className="mt-3 block break-all rounded-xl bg-secondary p-3 text-xs text-foreground">
          {enderecoAviso}
        </code>
      </section>
    </div>
  );
}
