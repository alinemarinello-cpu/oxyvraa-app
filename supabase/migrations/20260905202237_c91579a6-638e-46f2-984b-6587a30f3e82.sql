-- O grant padrão PUBLIC tornava as funções executáveis por anônimos mesmo após
-- revogar do papel anon. Revogamos de PUBLIC e devolvemos só a authenticated.
DO $$
declare
  f record;
begin
  for f in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC', f.proname, f.args);
    execute format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', f.proname, f.args);
    execute format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', f.proname, f.args);
    execute format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', f.proname, f.args);
  end loop;
end $$;