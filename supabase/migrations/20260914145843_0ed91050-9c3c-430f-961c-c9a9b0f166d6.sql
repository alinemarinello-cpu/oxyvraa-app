-- 1. Índices de desempenho para escala
CREATE INDEX IF NOT EXISTS idx_cleanings_created ON public.cleanings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execucoes_org_data ON public.execucoes (organizacao_id, iniciada_em DESC);
CREATE INDEX IF NOT EXISTS idx_execucoes_unit_data ON public.execucoes (unit_id, iniciada_em DESC);
CREATE INDEX IF NOT EXISTS idx_rdc_evid_org_data ON public.rdc_evidencias (organizacao_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON public.assinaturas (status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status_upd ON public.assinaturas (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rdc_leads_convertido ON public.rdc_leads (convertido_em);
CREATE INDEX IF NOT EXISTS idx_docs_org_expira ON public.documentos_sdbpf (organizacao_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created ON public.pagamentos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_org_created ON public.notification_logs (organizacao_id, created_at DESC);

-- 2. Resumo de indicadores agregado no banco (evita varrer todas as linhas na aplicação)
CREATE OR REPLACE FUNCTION public.metricas_resumo(_desde timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'clientes_total', (SELECT count(*) FROM public.organizacoes),
    'clientes_novos', (SELECT count(*) FROM public.organizacoes WHERE created_at >= _desde),
    'unidades', (SELECT count(*) FROM public.units),
    'uso_registros', (SELECT count(*) FROM public.cleanings WHERE created_at >= _desde),
    'status', (
      SELECT coalesce(jsonb_object_agg(status, qtd), '{}'::jsonb)
      FROM (SELECT status, count(*) AS qtd FROM public.assinaturas GROUP BY status) s
    ),
    'cancelamentos', (
      SELECT count(*) FROM public.assinaturas
      WHERE status = 'CANCELED' AND updated_at >= _desde
    ),
    'planos', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'plano', plano, 'ciclo', ciclo, 'kit_insumos', kit_insumos,
        'assinaturas', qtd, 'cadeiras', cadeiras
      )), '[]'::jsonb)
      FROM (
        SELECT plano, ciclo, coalesce(kit_insumos, false) AS kit_insumos,
               count(*) AS qtd, sum(greatest(coalesce(cadeiras, 1), 1)) AS cadeiras
        FROM public.assinaturas
        WHERE status = 'ACTIVE'
        GROUP BY plano, ciclo, coalesce(kit_insumos, false)
      ) p
    ),
    'leads', (
      SELECT jsonb_build_object(
        'total', count(*),
        'convertidos', count(*) FILTER (WHERE convertido_em IS NOT NULL OR etapa = 'CONVERTIDO'),
        'score_medio', coalesce(round(avg(coalesce(score, 0)))::int, 0)
      )
      FROM public.rdc_leads WHERE created_at >= _desde
    )
  )
$$;

REVOKE ALL ON FUNCTION public.metricas_resumo(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.metricas_resumo(timestamptz) TO service_role;

-- 3. Idempotência de webhooks de pagamento
CREATE TABLE IF NOT EXISTS public.eventos_webhook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL,
  evento_id text NOT NULL,
  tipo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origem, evento_id)
);

GRANT ALL ON public.eventos_webhook TO service_role;
ALTER TABLE public.eventos_webhook ENABLE ROW LEVEL SECURITY;
