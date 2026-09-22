ALTER TABLE public.biological_tests ADD COLUMN IF NOT EXISTS corrective_action_log text;

CREATE OR REPLACE FUNCTION public.validar_ciclo_autoclave()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  if coalesce(trim(new.batch_number), '') = '' then raise exception 'Nº do lote é obrigatório.'; end if;
  if coalesce(trim(new.equipment_serial), '') = '' then raise exception 'Identificação do equipamento é obrigatória.'; end if;
  if new.chemical_indicator_result not in ('APROVADO','REPROVADO') then raise exception 'Resultado do indicador químico inválido.'; end if;
  if coalesce(trim(new.packages_list), '') = '' then raise exception 'Relação de pacotes é obrigatória.'; end if;
  if coalesce(trim(new.operator_name), '') = '' then raise exception 'Operador é obrigatório.'; end if;
  if new.time_minutes is null or new.temp_celsius is null or new.pressure_bar is null then raise exception 'Parâmetros físicos incompletos.'; end if;
  if coalesce(trim(new.photo_integrator_url), '') = '' then raise exception 'Foto do integrador químico é obrigatória.'; end if;
  if new.reversal_of_id is null and coalesce(trim(new.photo_panel_url), '') = '' then raise exception 'Foto do painel da autoclave é obrigatória.'; end if;
  if new.status in ('REPROVADO','BLOQUEADO') and coalesce(trim(new.corrective_action_log), '') = '' then raise exception 'Ciclo reprovado exige registro de ação corretiva.'; end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.avisar_ciclo_reprovado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.status in ('REPROVADO','BLOQUEADO') then
    insert into public.notification_logs (organizacao_id, channel, severity, task_type, title, message, action_path, dedupe_key)
    values
      (new.organizacao_id, 'WHATSAPP', 'CRITICO', 'CICLO_REPROVADO', 'Ciclo de autoclave reprovado',
       'ATENCAO: ciclo de autoclave reprovado (lote ' || new.batch_number || '). Lote bloqueado para uso.',
       '/saude', 'ciclo-' || new.id::text || '-wpp'),
      (new.organizacao_id, 'PUSH', 'CRITICO', 'CICLO_REPROVADO', 'Ciclo de autoclave reprovado',
       'Lote ' || new.batch_number || ' bloqueado para uso. Registre a acao corretiva e reprocesse a carga.',
       '/saude', 'ciclo-' || new.id::text || '-push')
    on conflict do nothing;
  end if;
  return new;
end; $function$;

DROP TRIGGER IF EXISTS autoclave_cycles_avisar ON public.autoclave_cycles;
CREATE TRIGGER autoclave_cycles_avisar
AFTER INSERT ON public.autoclave_cycles
FOR EACH ROW EXECUTE FUNCTION public.avisar_ciclo_reprovado();

CREATE OR REPLACE FUNCTION public.validar_teste_biologico()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  if coalesce(trim(new.indicator_batch_number), '') = '' then raise exception 'Lote do indicador biológico é obrigatório.'; end if;
  if coalesce(trim(new.photo_vial_url), '') = '' then raise exception 'Foto da ampola do teste biológico é obrigatória.'; end if;
  if new.result not in ('NEGATIVO','POSITIVO') then raise exception 'Resultado do teste biológico inválido.'; end if;
  if new.result = 'POSITIVO' and coalesce(trim(new.corrective_action_log), '') = '' then raise exception 'Teste biológico positivo exige registro de ação corretiva.'; end if;
  return new;
end; $function$;

DROP TRIGGER IF EXISTS biological_tests_validar ON public.biological_tests;
CREATE TRIGGER biological_tests_validar
BEFORE INSERT ON public.biological_tests
FOR EACH ROW EXECUTE FUNCTION public.validar_teste_biologico();

CREATE OR REPLACE FUNCTION public.bloquear_lote_biologico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.result = 'POSITIVO' then
    if new.autoclave_cycle_id is not null then
      update public.autoclave_cycles
         set status = 'BLOQUEADO',
             corrective_action_log = coalesce(corrective_action_log || ' | ', '') || 'TESTE BIOLOGICO POSITIVO: ' || coalesce(new.corrective_action_log, '')
       where id = new.autoclave_cycle_id;
    end if;
    insert into public.notification_logs (organizacao_id, channel, severity, task_type, title, message, action_path, dedupe_key)
    values
      (new.organizacao_id, 'WHATSAPP', 'CRITICO', 'BIOLOGICO_POSITIVO', 'Teste biológico POSITIVO',
       'ATENCAO: teste biologico POSITIVO. Interrompa o uso da autoclave e reprocesse as cargas.',
       '/saude', 'bio-' || new.id::text || '-wpp'),
      (new.organizacao_id, 'PUSH', 'CRITICO', 'BIOLOGICO_POSITIVO', 'Teste biológico POSITIVO',
       'Autoclave deve ser interditada ate nova validacao. Registre a acao corretiva.',
       '/saude', 'bio-' || new.id::text || '-push')
    on conflict do nothing;
  end if;
  return new;
end; $function$;

DROP TRIGGER IF EXISTS biological_tests_bloquear ON public.biological_tests;
CREATE TRIGGER biological_tests_bloquear
AFTER INSERT ON public.biological_tests
FOR EACH ROW EXECUTE FUNCTION public.bloquear_lote_biologico();