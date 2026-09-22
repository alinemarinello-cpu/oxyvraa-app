-- novo papel master
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';

CREATE TABLE public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  email_contato text,
  plano text not null default 'trial',
  status text not null default 'trial',
  trial_expira_em timestamptz not null default (now() + interval '14 days'),
  gateway text,
  gateway_customer_id text,
  gateway_subscription_id text,
  bloqueado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.organizacoes TO authenticated;
GRANT ALL ON public.organizacoes TO service_role;
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organizacao_membros (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organizacao_id, user_id)
);

GRANT SELECT ON public.organizacao_membros TO authenticated;
GRANT ALL ON public.organizacao_membros TO service_role;
ALTER TABLE public.organizacao_membros ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.minha_organizacao(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select organizacao_id from public.organizacao_membros where user_id = _user_id limit 1
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role::text = 'master')
$$;

CREATE POLICY organizacoes_select ON public.organizacoes
  FOR SELECT TO authenticated
  USING (id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE POLICY organizacoes_update ON public.organizacoes
  FOR UPDATE TO authenticated
  USING ((id = public.minha_organizacao(auth.uid()) AND has_role(auth.uid(), 'gestor'::app_role)) OR public.is_master(auth.uid()))
  WITH CHECK ((id = public.minha_organizacao(auth.uid()) AND has_role(auth.uid(), 'gestor'::app_role)) OR public.is_master(auth.uid()));

CREATE POLICY organizacoes_insert ON public.organizacoes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY membros_select ON public.organizacao_membros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TRIGGER organizacoes_updated_at BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prefeituras ADD COLUMN IF NOT EXISTS organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE SET NULL;