import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Consulta pública de autenticidade do dossiê (sem login e sem dados internos). */
export const validarDocumento = createServerFn({ method: "GET" })
  .inputValidator((input: { hash: string }) => {
    const hash = String(input?.hash ?? "").trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Código de autenticidade inválido.");
    return { hash };
  })
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: doc } = await supabasePublic
      .from("dossier_documents")
      .select("sha256, clinic_name, period_start, period_end, plan, generated_at")
      .eq("sha256", data.hash)
      .maybeSingle();

    if (!doc) return null;
    return {
      hash: doc.sha256,
      clinica: doc.clinic_name,
      inicio: doc.period_start,
      fim: doc.period_end,
      plano: doc.plan,
      geradoEm: doc.generated_at,
    };
  });
