// Aviso de pagamento do Mercado Pago: confirma o pagamento e libera a conta.
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { liberarEvento, registrarEvento } from "@/lib/webhook-idempotencia.server";

type Referencia = {
  organizacaoId: string;
  plano: "CONSULTORIO" | "CLINICA" | "KIT";
  ciclo: "MONTHLY" | "ANNUAL";
  kit: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lerReferencia(valor: string | null | undefined): Referencia | null {
  if (!valor) return null;
  const [organizacaoId, plano, ciclo, kit] = valor.split("|");
  if (!organizacaoId || !UUID.test(organizacaoId)) return null;
  if (plano !== "CONSULTORIO" && plano !== "CLINICA" && plano !== "KIT") return null;
  if (ciclo !== "MONTHLY" && ciclo !== "ANNUAL") return null;
  return { organizacaoId, plano, ciclo, kit: kit === "1" };
}

/** Assinatura x-signature do Mercado Pago (manifest id:...;request-id:...;ts:...;). */
function assinaturaValida(request: Request, dataId: string): boolean {
  const segredo = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  if (!segredo) return false;
  const header = request.headers.get("x-signature");
  if (!header) return false;

  let ts = "";
  let v1 = "";
  for (const parte of header.split(",")) {
    const [chave, valor] = parte.split("=", 2);
    if (chave?.trim() === "ts") ts = valor?.trim() ?? "";
    if (chave?.trim() === "v1") v1 = valor?.trim() ?? "";
  }
  if (!ts || !v1) return false;

  const requestId = request.headers.get("x-request-id") ?? "";
  const manifest = `id:${dataId.toLowerCase()};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
  const esperado = createHmac("sha256", segredo).update(manifest).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function buscarPagamento(id: string) {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Mercado Pago respondeu ${resp.status}`);
  return (await resp.json()) as {
    id: number;
    status: string;
    external_reference?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let corpo: { type?: string; action?: string; data?: { id?: string | number } };
        try {
          corpo = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const tipo = corpo.type ?? corpo.action ?? "";
        const dataId = String(corpo.data?.id ?? "");
        if (!dataId) return new Response("missing id", { status: 400 });
        if (!tipo.includes("payment")) return new Response("ignored", { status: 202 });

        if (!assinaturaValida(request, dataId)) {
          return new Response("Invalid signature", { status: 401 });
        }

        if (!(await registrarEvento("mercadopago", dataId, tipo))) {
          return new Response("duplicado", { status: 202 });
        }

        try {
          const pagamento = await buscarPagamento(dataId);
          if (pagamento.status !== "approved") {
            return new Response("aguardando aprovação", { status: 202 });
          }

          const ref = lerReferencia(pagamento.external_reference);
          if (!ref) return new Response("sem referência da conta", { status: 202 });

          const agora = new Date();
          const fim = new Date(agora);
          if (ref.ciclo === "ANNUAL") fim.setFullYear(fim.getFullYear() + 1);
          else fim.setMonth(fim.getMonth() + 1);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Pagamento só do kit de insumos: ativa apenas o kit, sem mexer no plano.
          if (ref.plano === "KIT") {
            const { error: erroKit } = await supabaseAdmin
              .from("assinaturas")
              .update({
                kit_insumos: true,
                pagamento_provedor: "mercadopago",
                pagamento_referencia: String(pagamento.id),
              } as never)
              .eq("organizacao_id", ref.organizacaoId);
            if (erroKit) throw new Error(erroKit.message);
            return new Response("ok");
          }

          const unidades = ref.plano === "CLINICA" ? 4 : 1;

          const { error: erroAssinatura } = await supabaseAdmin
            .from("assinaturas")
            .update({
              status: "ACTIVE",
              plano: ref.plano,
              ciclo: ref.ciclo,
              unidades_permitidas: unidades,
              periodo_fim: fim.toISOString(),
              pagamento_provedor: "mercadopago",
              pagamento_referencia: String(pagamento.id),
            } as never)
            .eq("organizacao_id", ref.organizacaoId);
          if (erroAssinatura) throw new Error(erroAssinatura.message);

          await supabaseAdmin
            .from("organizacoes")
            .update({
              status: "ativo",
              plano: ref.plano,
              updated_at: agora.toISOString(),
            } as never)
            .eq("id", ref.organizacaoId);

          return new Response("ok");
        } catch (e) {
          await liberarEvento("mercadopago", dataId);
          return new Response((e as Error).message, { status: 500 });
        }
      },
    },
  },
});
