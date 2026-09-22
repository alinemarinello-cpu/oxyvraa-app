-- 1) Funções SECURITY DEFINER não devem ser executáveis por anônimos
REVOKE EXECUTE ON FUNCTION public.avisar_ciclo_reprovado() FROM anon;
REVOKE EXECUTE ON FUNCTION public.bloquear_lote_biologico() FROM anon;
REVOKE EXECUTE ON FUNCTION public.checklist_da_minha_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.execucao_aberta(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.execucao_visivel(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gestor_acesso_execucao(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gestor_acesso_prefeitura(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gestor_acesso_unit(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_logistica(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.minha_organizacao(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pedido_visivel(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pref_da_minha_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unit_da_minha_org(uuid) FROM anon;

-- 2) academia_areas: público só enxerga as colunas do selo (sem qr_token/observacoes)
REVOKE SELECT ON public.academia_areas FROM anon;
GRANT SELECT (id, organizacao_id, unit_id, nome, tipo, detalhe, ultima_higienizacao, ultimo_responsavel, ativo) ON public.academia_areas TO anon;

-- 3) dossier_documents: consulta pública de autenticidade só expõe o essencial
REVOKE SELECT ON public.dossier_documents FROM anon;
GRANT SELECT (sha256, clinic_name, period_start, period_end, plan, generated_at, kind) ON public.dossier_documents TO anon;

-- 4) Vincula automaticamente o criador como membro da organização
CREATE OR REPLACE FUNCTION public.vincular_criador_organizacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null then
    insert into public.organizacao_membros (organizacao_id, user_id)
    values (new.id, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end;
$function$;
REVOKE EXECUTE ON FUNCTION public.vincular_criador_organizacao() FROM anon;

DROP TRIGGER IF EXISTS organizacoes_vincular_criador ON public.organizacoes;
CREATE TRIGGER organizacoes_vincular_criador
  AFTER INSERT ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.vincular_criador_organizacao();

-- 5) Evidências: regra explícita de atualização, só o dono do arquivo
DROP POLICY IF EXISTS evidencias_update ON storage.objects;
CREATE POLICY evidencias_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'evidencias' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'evidencias' AND owner = auth.uid());