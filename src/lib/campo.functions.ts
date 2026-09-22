import { createServerFn } from "@tanstack/react-start";
import { resolverPin } from "@/lib/campo.server";

/** Login de campo: valida o PIN da unidade na nuvem e devolve os dados operacionais. */
export const entrarComPin = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) => {
    const pin = String(data?.pin ?? "").trim();
    if (!/^\d{4}$/.test(pin)) throw new Error("PIN inválido.");
    return { pin };
  })
  .handler(async ({ data }) => resolverPin(data.pin));
