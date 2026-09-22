CREATE TABLE public.compliance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  title text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'DAILY' CHECK (frequency IN ('DAILY','WEEKLY','MONTHLY','YEARLY')),
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  weekday smallint,
  hora time DEFAULT '07:30',
  assigned_role text NOT NULL DEFAULT 'operador',
  is_completed boolean NOT NULL DEFAULT false,
  last_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_schedules TO authenticated;
GRANT ALL ON public.compliance_schedules TO service_role;
ALTER TABLE public.compliance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules da minha org" ON public.compliance_schedules FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TABLE public.license_expirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  expiration_date date NOT NULL,
  alert_lead_days integer[] NOT NULL DEFAULT ARRAY[30,15,7,1],
  status text NOT NULL DEFAULT 'EM_DIA' CHECK (status IN ('EM_DIA','PROXIMO_VENCIMENTO','VENCIDO')),
  document_id uuid REFERENCES public.dossier_documents(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_expirations TO authenticated;
GRANT ALL ON public.license_expirations TO service_role;
ALTER TABLE public.license_expirations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "licencas da minha org" ON public.license_expirations FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'PUSH' CHECK (channel IN ('PUSH','WHATSAPP','EMAIL')),
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','ALERTA','CRITICO')),
  task_type text,
  title text NOT NULL,
  message text NOT NULL,
  action_path text,
  dedupe_key text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notification_logs_dedupe ON public.notification_logs (organizacao_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notificacoes da minha org" ON public.notification_logs FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "marcar notificacao lida" ON public.notification_logs FOR UPDATE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "criar notificacao na minha org" ON public.notification_logs FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON public.compliance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_licencas_updated BEFORE UPDATE ON public.license_expirations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();