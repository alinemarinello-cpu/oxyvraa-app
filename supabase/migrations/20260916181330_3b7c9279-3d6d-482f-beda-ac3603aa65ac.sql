-- 1) Assinaturas: impedir que o próprio usuário conceda acesso pago
create or replace function public.proteger_cobranca_assinatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user in ('service_role','postgres','supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'TRIALING';
    new.stripe_subscription_id := null;
    return new;
  end if;

  new.status := old.status;
  new.plano := old.plano;
  new.ciclo := old.ciclo;
  new.unidades_permitidas := old.unidades_permitidas;
  new.kit_insumos := old.kit_insumos;
  new.trial_inicio := old.trial_inicio;
  new.trial_fim := old.trial_fim;
  new.stripe_subscription_id := old.stripe_subscription_id;
  return new;
end;
$$;

drop trigger if exists assinaturas_proteger_cobranca on public.assinaturas;
create trigger assinaturas_proteger_cobranca
before insert or update on public.assinaturas
for each row execute function public.proteger_cobranca_assinatura();

-- 2) organizacoes: só quem ainda não tem organização pode criar
drop policy if exists organizacoes_insert on public.organizacoes;
create policy organizacoes_insert on public.organizacoes
for insert to authenticated
with check (public.minha_organizacao(auth.uid()) is null or public.is_master(auth.uid()));

-- 3) execucoes: validar a linha gravada na conclusão
drop policy if exists execucoes_conclui on public.execucoes;
create policy execucoes_conclui on public.execucoes
for update to authenticated
using ((concluida_em is null) and ((executado_por = auth.uid()) or public.unit_da_minha_org(unit_id)))
with check ((executado_por = auth.uid()) or public.unit_da_minha_org(unit_id));

-- 4) alertas: validar a linha gravada na edição
drop policy if exists alertas_update on public.alertas;
create policy alertas_update on public.alertas
for update to authenticated
using ((unit_id is null) or public.unit_da_minha_org(unit_id))
with check ((unit_id is null) or public.unit_da_minha_org(unit_id));

-- 5) histórico de requisitos: restringir à organização do requisito
drop policy if exists "historico requisitos leitura" on public.rdc_requisitos_historico;
create policy "historico requisitos leitura" on public.rdc_requisitos_historico
for select to authenticated
using (
  public.is_master(auth.uid())
  or exists (
    select 1 from public.rdc_requisitos r
    where r.id = rdc_requisitos_historico.requisito_id
      and (r.organizacao_id is null or r.organizacao_id = public.minha_organizacao(auth.uid()))
  )
);