// Worker do Copiloto de Conformidade: roda de hora em hora e grava os avisos do dia.
// Segurança: exige o cabeçalho x-scheduler-secret com um segredo só de servidor
// (SCHEDULER_SECRET), nunca exposto ao cliente. Comparação em tempo constante.
import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { montarAvisos } from "@/lib/copiloto-avisos";
import type { Agendamento, Licenca } from "@/lib/copiloto-db";

function segredoValido(recebido: string | null, esperado: string | undefined): boolean {
  if (!recebido || !esperado) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/hooks/compliance-scheduler")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const chave = request.headers.get("x-scheduler-secret");
        if (!segredoValido(chave, process.env["SCHEDULER_SECRET"])) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: orgs, error } = await supabaseAdmin.from("organizacoes").select("id");
        if (error) return Response.json({ error: error.message }, { status: 500 });

        // Aviso de conversão: dispara no 12º dia do teste grátis (2 dias antes de acabar).
        const { data: assinaturas } = await supabaseAdmin
          .from("assinaturas")
          .select("organizacao_id, status, trial_fim, aviso_conversao_em")
          .eq("status", "TRIALING");

        let gravados = 0;

        for (const a of assinaturas ?? []) {
          if (!a.trial_fim || a.aviso_conversao_em) continue;
          const faltam = Math.ceil(
            (new Date(a.trial_fim).getTime() - Date.now()) / 86_400_000,
          );
          if (faltam > 2 || faltam < 0) continue;

          const dia = new Date().toISOString().slice(0, 10);
          await supabaseAdmin.from("notification_logs").upsert(
            [
              {
                organizacao_id: a.organizacao_id,
                channel: "WHATSAPP" as const,
                severity: "ALERTA" as const,
                task_type: "CONVERSAO_TRIAL",
                title: "Seu teste grátis termina em 2 dias",
                message:
                  "Ative seu plano para manter os relatórios sem marca d'água, o selo público e os alertas automáticos.",
                action_path: "/painel/assinatura",
                dedupe_key: `CONVERSAO_TRIAL-${dia}`,
              },
            ],
            { onConflict: "organizacao_id,dedupe_key", ignoreDuplicates: true },
          );
          await supabaseAdmin
            .from("assinaturas")
            .update({ aviso_conversao_em: new Date().toISOString() })
            .eq("organizacao_id", a.organizacao_id);
          gravados += 1;
        }

        for (const org of orgs ?? []) {
          const [agenda, licencas, testes] = await Promise.all([
            supabaseAdmin.from("compliance_schedules").select("*").eq("organizacao_id", org.id),
            supabaseAdmin.from("license_expirations").select("*").eq("organizacao_id", org.id),
            supabaseAdmin
              .from("biological_tests")
              .select("test_date")
              .eq("organizacao_id", org.id)
              .order("test_date", { ascending: false })
              .limit(1),
          ]);

          if (!agenda.data?.length && !licencas.data?.length) continue;

          const ultimo = testes.data?.[0]?.test_date ?? null;
          const diasSemBiologico = ultimo
            ? Math.floor((Date.now() - new Date(`${ultimo}T12:00:00`).getTime()) / 86_400_000)
            : null;

          const avisos = montarAvisos({
            agenda: (agenda.data ?? []) as unknown as Agendamento[],
            licencas: (licencas.data ?? []) as unknown as Licenca[],
            diasSemBiologico,
          });
          if (!avisos.length) continue;

          const { error: insErro, count } = await supabaseAdmin
            .from("notification_logs")
            .upsert(
              avisos.map((a) => ({ organizacao_id: org.id, ...a })),
              { onConflict: "organizacao_id,dedupe_key", ignoreDuplicates: true, count: "exact" },
            );
          if (insErro) console.error("[compliance_scheduler]", insErro.message);
          gravados += count ?? 0;
        }

        return Response.json({ ok: true, organizacoes: orgs?.length ?? 0, avisos: gravados });
      },
    },
  },
});
