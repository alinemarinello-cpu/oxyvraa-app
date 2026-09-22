-- 1. PERFIS DE CONFORMIDADE
CREATE TABLE public.compliance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'DENTISTA_INDIVIDUAL',
  status text NOT NULL DEFAULT 'ATIVO',
  clinic_name text NOT NULL DEFAULT '',
  cnpj text,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  uf text NOT NULL DEFAULT '',
  whatsapp text,
  rt_name text NOT NULL DEFAULT '',
  rt_council text NOT NULL DEFAULT 'CRO',
  rt_number text NOT NULL DEFAULT '',
  autoclave_serial text NOT NULL DEFAULT '',
  autoclave_brand_model text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_profiles TO authenticated;
GRANT ALL ON public.compliance_profiles TO service_role;
ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil conformidade da minha org" ON public.compliance_profiles FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE TRIGGER compliance_profiles_updated_at BEFORE UPDATE ON public.compliance_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PONTOS DE QR CODE
CREATE TABLE public.qr_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  compliance_profile_id uuid NOT NULL REFERENCES public.compliance_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  custom_name text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  zone_type text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_checkpoints TO authenticated;
GRANT ALL ON public.qr_checkpoints TO service_role;
ALTER TABLE public.qr_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkpoints da minha org" ON public.qr_checkpoints FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE TRIGGER qr_checkpoints_updated_at BEFORE UPDATE ON public.qr_checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. REGISTROS DE CHECKLIST (imutáveis)
CREATE TABLE public.checklist_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  checkpoint_id uuid REFERENCES public.qr_checkpoints(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  operator_name text NOT NULL DEFAULT '',
  frequency text NOT NULL,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  lat double precision,
  lng double precision,
  timestamp_gps timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now(),
  reversal_of_id uuid REFERENCES public.checklist_logs(id) ON DELETE SET NULL,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.checklist_logs TO authenticated;
GRANT ALL ON public.checklist_logs TO service_role;
ALTER TABLE public.checklist_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ler checklists da minha org" ON public.checklist_logs FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "registrar checklists da minha org" ON public.checklist_logs FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

-- 4. CICLOS DE AUTOCLAVE (imutáveis, RDC 1.002/2025)
CREATE TABLE public.autoclave_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  compliance_profile_id uuid REFERENCES public.compliance_profiles(id) ON DELETE SET NULL,
  equipment_serial text NOT NULL,
  equipment_brand_model text NOT NULL,
  cycle_date_time timestamptz NOT NULL,
  batch_number text NOT NULL,
  time_minutes numeric NOT NULL,
  temp_celsius numeric NOT NULL,
  pressure_bar numeric NOT NULL,
  chemical_indicator_result text NOT NULL,
  packages_list text NOT NULL,
  operator_user_id uuid REFERENCES auth.users(id),
  operator_name text NOT NULL,
  photo_integrator_url text NOT NULL,
  photo_panel_url text,
  status text NOT NULL,
  corrective_action_log text,
  is_immutable boolean NOT NULL DEFAULT true,
  reversal_of_id uuid REFERENCES public.autoclave_cycles(id) ON DELETE SET NULL,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.autoclave_cycles TO authenticated;
GRANT ALL ON public.autoclave_cycles TO service_role;
ALTER TABLE public.autoclave_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ler ciclos da minha org" ON public.autoclave_cycles FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "registrar ciclos da minha org" ON public.autoclave_cycles FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE OR REPLACE FUNCTION public.validar_ciclo_autoclave()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  if coalesce(trim(new.batch_number), '') = '' then raise exception 'Nº do lote é obrigatório.'; end if;
  if coalesce(trim(new.equipment_serial), '') = '' then raise exception 'Identificação do equipamento é obrigatória.'; end if;
  if new.chemical_indicator_result not in ('APROVADO','REPROVADO') then raise exception 'Resultado do indicador químico inválido.'; end if;
  if coalesce(trim(new.packages_list), '') = '' then raise exception 'Relação de pacotes é obrigatória.'; end if;
  if coalesce(trim(new.operator_name), '') = '' then raise exception 'Operador é obrigatório.'; end if;
  if new.time_minutes is null or new.temp_celsius is null or new.pressure_bar is null then raise exception 'Parâmetros físicos incompletos.'; end if;
  if coalesce(trim(new.photo_integrator_url), '') = '' then raise exception 'Foto do integrador químico é obrigatória.'; end if;
  if new.status = 'REPROVADO' and coalesce(trim(new.corrective_action_log), '') = '' then raise exception 'Ciclo reprovado exige registro de ação corretiva.'; end if;
  return new;
end; $$;
CREATE TRIGGER autoclave_cycles_validar BEFORE INSERT ON public.autoclave_cycles
  FOR EACH ROW EXECUTE FUNCTION public.validar_ciclo_autoclave();

-- 5. TESTES BIOLÓGICOS
CREATE TABLE public.biological_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  autoclave_cycle_id uuid REFERENCES public.autoclave_cycles(id) ON DELETE SET NULL,
  test_date date NOT NULL,
  indicator_batch_number text NOT NULL,
  result text NOT NULL,
  photo_vial_url text,
  operator_user_id uuid REFERENCES auth.users(id),
  operator_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.biological_tests TO authenticated;
GRANT ALL ON public.biological_tests TO service_role;
ALTER TABLE public.biological_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ler biologicos da minha org" ON public.biological_tests FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "registrar biologicos da minha org" ON public.biological_tests FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

-- 6. DOCUMENTOS GERADOS (validação pública de autenticidade por hash)
CREATE TABLE public.dossier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  sha256 text NOT NULL UNIQUE,
  clinic_name text NOT NULL DEFAULT '',
  period_start date,
  period_end date,
  plan text NOT NULL DEFAULT 'TRIAL_14',
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.dossier_documents TO authenticated;
GRANT SELECT ON public.dossier_documents TO anon;
GRANT ALL ON public.dossier_documents TO service_role;
ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consulta publica de autenticidade" ON public.dossier_documents FOR SELECT TO anon USING (true);
CREATE POLICY "ler documentos da minha org" ON public.dossier_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "registrar documentos da minha org" ON public.dossier_documents FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE INDEX idx_checklist_logs_org_data ON public.checklist_logs(organizacao_id, timestamp_gps DESC);
CREATE INDEX idx_autoclave_org_data ON public.autoclave_cycles(organizacao_id, cycle_date_time DESC);
CREATE INDEX idx_biological_org_data ON public.biological_tests(organizacao_id, test_date DESC);