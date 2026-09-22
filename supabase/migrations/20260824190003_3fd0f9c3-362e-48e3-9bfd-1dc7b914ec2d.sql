CREATE TABLE public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  norma text not null,
  titulo text not null,
  descricao text not null default '',
  categoria text not null default 'geral',
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.checklist_templates TO authenticated;
GRANT ALL ON public.checklist_templates TO service_role;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY templates_select ON public.checklist_templates FOR SELECT TO authenticated USING (true);

CREATE TABLE public.checklist_template_itens (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  ordem integer not null default 0,
  pergunta text not null,
  tipo text not null default 'conforme',
  critico boolean not null default false,
  foto_obrigatoria boolean not null default false,
  valor_min numeric,
  valor_max numeric,
  unidade_medida text,
  opcoes jsonb not null default '[]'::jsonb,
  ajuda text
);
GRANT SELECT ON public.checklist_template_itens TO authenticated;
GRANT ALL ON public.checklist_template_itens TO service_role;
ALTER TABLE public.checklist_template_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY template_itens_select ON public.checklist_template_itens FOR SELECT TO authenticated USING (true);

CREATE TABLE public.checklists (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  origem_template_id uuid references public.checklist_templates(id) on delete set null,
  titulo text not null,
  norma text not null default '',
  descricao text not null default '',
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklists_select ON public.checklists FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY checklists_write ON public.checklists FOR ALL TO authenticated
  USING ((organizacao_id = public.minha_organizacao(auth.uid()) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role))) OR public.is_master(auth.uid()))
  WITH CHECK ((organizacao_id = public.minha_organizacao(auth.uid()) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role))) OR public.is_master(auth.uid()));
CREATE TRIGGER checklists_updated_at BEFORE UPDATE ON public.checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.checklist_da_minha_org(_checklist_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.checklists c
    where c.id = _checklist_id
      and (c.organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.checklist_da_minha_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checklist_da_minha_org(uuid) TO authenticated, service_role;

CREATE TABLE public.checklist_itens (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  ordem integer not null default 0,
  pergunta text not null,
  tipo text not null default 'conforme',
  critico boolean not null default false,
  foto_obrigatoria boolean not null default false,
  valor_min numeric,
  valor_max numeric,
  unidade_medida text,
  opcoes jsonb not null default '[]'::jsonb,
  ajuda text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_itens TO authenticated;
GRANT ALL ON public.checklist_itens TO service_role;
ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklist_itens_select ON public.checklist_itens FOR SELECT TO authenticated
  USING (public.checklist_da_minha_org(checklist_id));
CREATE POLICY checklist_itens_write ON public.checklist_itens FOR ALL TO authenticated
  USING (public.checklist_da_minha_org(checklist_id) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role) OR public.is_master(auth.uid())))
  WITH CHECK (public.checklist_da_minha_org(checklist_id) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role) OR public.is_master(auth.uid())));

CREATE TABLE public.checklist_atribuicoes (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  frequencia text not null default 'diaria',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (checklist_id, unit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_atribuicoes TO authenticated;
GRANT ALL ON public.checklist_atribuicoes TO service_role;
ALTER TABLE public.checklist_atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY atribuicoes_select ON public.checklist_atribuicoes FOR SELECT TO authenticated
  USING (public.checklist_da_minha_org(checklist_id));
CREATE POLICY atribuicoes_write ON public.checklist_atribuicoes FOR ALL TO authenticated
  USING (public.checklist_da_minha_org(checklist_id) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role) OR public.is_master(auth.uid())))
  WITH CHECK (public.checklist_da_minha_org(checklist_id) AND (has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'admin'::app_role) OR public.is_master(auth.uid())));