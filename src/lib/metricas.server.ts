// Indicadores do negócio para o painel administrativo Oxyvra (conta master).
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADDON_INSUMOS, planoPorId } from "@/lib/planos-oxyvra";

type Db = SupabaseClient<any, any, any>;

export type MetricasSaas = {
  periodoDias: number;
  clientesTotal: number;
  clientesNovos: number;
  clientesAtivos: number;
  clientesTrial: number;
  clientesInativos: number;
  cancelamentos: number;
  atrasados: number;
  mrr: number;
  ticketMedio: number;
  porPlano: { plano: string; ciclo: string; assinaturas: number; mrr: number }[];
  diagnosticos: number;
  diagnosticosConvertidos: number;
  taxaConversao: number;
  scoreMedioDiagnostico: number;
  usoRegistros: number;
  unidadesAtivas: number;
};

async function exigirMaster(userId: string, supabase: Db) {
  const { data, error } = await supabase.rpc("is_master", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Acesso restrito à conta administradora geral.");
}

/** Valor mensal recorrente de uma assinatura paga. */
function mrrDaAssinatura(a: {
  plano: string;
  ciclo: string;
  kit_insumos: boolean;
  cadeiras: number;
}): number {
  const p = planoPorId(a.plano);
  const anual = a.ciclo === "ANNUAL";
  const base = anual ? p.precoAnualMensalizado : p.precoMensal;
  const cadeiras = Math.max(1, a.cadeiras || 1);
  const kit = a.kit_insumos
    ? (anual ? ADDON_INSUMOS.precoPorCadeiraAnualMensalizado : ADDON_INSUMOS.precoPorCadeiraMensal) *
      cadeiras
    : 0;
  return base + kit;
}

export async function metricasSaas(
  userId: string,
  supabase: Db,
  periodoDias: number,
): Promise<MetricasSaas> {
  await exigirMaster(userId, supabase);

  const dias = Math.min(365, Math.max(1, Math.round(periodoDias || 30)));
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();

  // Um único resumo agregado no banco: não carrega linha a linha e não cresce
  // em tempo de resposta conforme o número de clientes aumenta.
  const { data, error } = await supabase.rpc("metricas_resumo", { _desde: desde });
  if (error) throw new Error(error.message);
  const r = (data ?? {}) as any;

  const status = (r.status ?? {}) as Record<string, number>;
  const planos = (r.planos ?? []) as {
    plano: string;
    ciclo: string;
    kit_insumos: boolean;
    assinaturas: number;
    cadeiras: number;
  }[];

  const agrupado = new Map<
    string,
    { plano: string; ciclo: string; assinaturas: number; mrr: number }
  >();
  let mrr = 0;
  for (const g of planos) {
    const valor =
      mrrDaAssinatura({
        plano: g.plano,
        ciclo: g.ciclo,
        kit_insumos: g.kit_insumos,
        cadeiras: 1,
      }) *
        g.assinaturas +
      (g.kit_insumos
        ? (g.ciclo === "ANNUAL"
            ? ADDON_INSUMOS.precoPorCadeiraAnualMensalizado
            : ADDON_INSUMOS.precoPorCadeiraMensal) *
          Math.max(0, (g.cadeiras ?? g.assinaturas) - g.assinaturas)
        : 0);
    mrr += valor;
    const chave = `${g.plano}-${g.ciclo}`;
    const atual = agrupado.get(chave) ?? {
      plano: g.plano,
      ciclo: g.ciclo,
      assinaturas: 0,
      mrr: 0,
    };
    atual.assinaturas += g.assinaturas;
    atual.mrr += valor;
    agrupado.set(chave, atual);
  }

  const leads = (r.leads ?? { total: 0, convertidos: 0, score_medio: 0 }) as {
    total: number;
    convertidos: number;
    score_medio: number;
  };

  const clientesTotal = r.clientes_total ?? 0;
  const clientesAtivos = status.ACTIVE ?? 0;
  const clientesTrial = status.TRIALING ?? 0;

  return {
    periodoDias: dias,
    clientesTotal,
    clientesNovos: r.clientes_novos ?? 0,
    clientesAtivos,
    clientesTrial,
    clientesInativos: Math.max(0, clientesTotal - clientesAtivos - clientesTrial),
    cancelamentos: r.cancelamentos ?? 0,
    atrasados: status.PAST_DUE ?? 0,
    mrr: Math.round(mrr * 100) / 100,
    ticketMedio: clientesAtivos ? Math.round((mrr / clientesAtivos) * 100) / 100 : 0,
    porPlano: [...agrupado.values()].sort((a, b) => b.mrr - a.mrr),
    diagnosticos: leads.total ?? 0,
    diagnosticosConvertidos: leads.convertidos ?? 0,
    taxaConversao: leads.total
      ? Math.round((leads.convertidos / leads.total) * 1000) / 10
      : 0,
    scoreMedioDiagnostico: leads.score_medio ?? 0,
    usoRegistros: r.uso_registros ?? 0,
    unidadesAtivas: r.unidades ?? 0,
  };
}
