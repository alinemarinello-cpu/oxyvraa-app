CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;

  if lower(coalesce(new.email, '')) = 'comercial@oxyvra.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'master')
    on conflict do nothing;
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'operador')
    on conflict do nothing;
  end if;

  return new;
end;
$function$;