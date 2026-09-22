CREATE OR REPLACE FUNCTION public.metricas_resumo(_desde timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  resultado jsonb;
BEGIN
  IF NOT public.is_master(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso restrito a conta administradora geral.';
  END IF;

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
  ) INTO resultado;

  RETURN resultado;
END;
$fn$;

REVOKE ALL ON FUNCTION public.metricas_resumo(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.metricas_resumo(timestamptz) TO authenticated, service_role;