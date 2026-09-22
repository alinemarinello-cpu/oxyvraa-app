REVOKE EXECUTE ON FUNCTION public.pref_da_minha_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unit_da_minha_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.minha_organizacao(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.checklist_da_minha_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.execucao_aberta(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.execucao_visivel(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.pref_da_minha_org(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unit_da_minha_org(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.minha_organizacao(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.checklist_da_minha_org(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execucao_aberta(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execucao_visivel(uuid) TO authenticated, service_role;