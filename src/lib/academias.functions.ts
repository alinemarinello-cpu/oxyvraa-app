import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Leitura pública (sem login) usada pelo Selo de Academia Sanitizada. */
export const seloPublico = createServerFn({ method: "GET" })
  .inputValidator((input: { areaId: string }) => input)
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

    const { data: area } = await supabasePublic
      .from("academia_areas")
      .select("id, unit_id, organizacao_id, nome, tipo, detalhe, ultima_higienizacao, ultimo_responsavel")
      .eq("id", data.areaId)
      .eq("ativo", true)
      .maybeSingle();
    if (!area) return null;

    // O selo público só fica no ar com assinatura paga: em teste ou inadimplente ele some.
    if (area.organizacao_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: assinatura } = await supabaseAdmin
        .from("assinaturas")
        .select("status")
        .eq("organizacao_id", area.organizacao_id)
        .maybeSingle();
      if (!assinatura || assinatura.status !== "ACTIVE") return { bloqueado: true } as const;
    }

    const { data: unidade } = await supabasePublic
      .from("units")
      .select("nome, cidade, uf")
      .eq("id", area.unit_id)
      .maybeSingle();

    return {
      nome: area.nome,
      tipo: area.tipo,
      detalhe: area.detalhe,
      ultimaHigienizacao: area.ultima_higienizacao,
      responsavel: area.ultimo_responsavel,
      unidade: unidade?.nome ?? "",
      cidade: unidade ? `${unidade.cidade}/${unidade.uf}` : "",
    };
  });
