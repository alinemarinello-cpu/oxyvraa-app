CREATE OR REPLACE FUNCTION public.unit_da_minha_org(_unit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.units u join public.prefeituras p on p.id = u.prefeitura_id
    where u.id = _unit_id
      and (p.organizacao_id is null or p.organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.unit_da_minha_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unit_da_minha_org(uuid) TO authenticated, service_role;

CREATE TABLE public.execucoes (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  checklist_id uuid not null references public.checklists(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  organizacao_id uuid references public.organizacoes(id) on delete set null,
  executado_por uuid references auth.users(id) on delete set null,
  executor_nome text not null default '',
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  lat double precision,
  lng double precision,
  dispositivo text,
  total_itens integer not null default 0,
  total_conformes integer not null default 0,
  total_nao_conformes integer not null default 0,
  assinatura text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.execucoes TO authenticated;
GRANT ALL ON public.execucoes TO service_role;
ALTER TABLE public.execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY execucoes_select ON public.execucoes FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR executado_por = auth.uid());
CREATE POLICY execucoes_insert ON public.execucoes FOR INSERT TO authenticated
  WITH CHECK (executado_por = auth.uid() AND public.unit_da_minha_org(unit_id));
CREATE POLICY execucoes_conclui ON public.execucoes FOR UPDATE TO authenticated
  USING (concluida_em IS NULL AND (executado_por = auth.uid() OR public.unit_da_minha_org(unit_id)))
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.execucao_aberta(_execucao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.execucoes e where e.id = _execucao_id and e.concluida_em is null)
$$;
REVOKE EXECUTE ON FUNCTION public.execucao_aberta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execucao_aberta(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.execucao_visivel(_execucao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.execucoes e
    where e.id = _execucao_id and (public.unit_da_minha_org(e.unit_id) or e.executado_por = auth.uid())
  )
$$;
REVOKE EXECUTE ON FUNCTION public.execucao_visivel(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execucao_visivel(uuid) TO authenticated, service_role;

CREATE TABLE public.respostas (
  id uuid primary key default gen_random_uuid(),
  execucao_id uuid not null references public.execucoes(id) on delete restrict,
  item_id uuid references public.checklist_itens(id) on delete set null,
  pergunta text not null,
  tipo text not null default 'conforme',
  critico boolean not null default false,
  valor_texto text,
  valor_numero numeric,
  conforme boolean,
  foto text,
  observacao text,
  fora_do_limite boolean not null default false,
  registrado_em timestamptz not null default now(),
  registrado_por uuid references auth.users(id) on delete set null,
  lat double precision,
  lng double precision
);
GRANT SELECT, INSERT ON public.respostas TO authenticated;
GRANT ALL ON public.respostas TO service_role;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY respostas_select ON public.respostas FOR SELECT TO authenticated
  USING (public.execucao_visivel(execucao_id));
CREATE POLICY respostas_insert ON public.respostas FOR INSERT TO authenticated
  WITH CHECK (registrado_por = auth.uid() AND public.execucao_aberta(execucao_id) AND public.execucao_visivel(execucao_id));

CREATE TABLE public.planos_acao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete set null,
  unit_id uuid not null references public.units(id) on delete restrict,
  execucao_id uuid references public.execucoes(id) on delete set null,
  resposta_id uuid references public.respostas(id) on delete set null,
  titulo text not null,
  descricao text not null default '',
  criticidade text not null default 'media',
  status text not null default 'aberta',
  responsavel text not null default '',
  prazo date,
  causa_raiz text,
  acao_corretiva text,
  foto_evidencia text,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.planos_acao TO authenticated;
GRANT ALL ON public.planos_acao TO service_role;
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY capa_select ON public.planos_acao FOR SELECT TO authenticated USING (public.unit_da_minha_org(unit_id));
CREATE POLICY capa_insert ON public.planos_acao FOR INSERT TO authenticated WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY capa_update ON public.planos_acao FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id)) WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE TRIGGER planos_acao_updated_at BEFORE UPDATE ON public.planos_acao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.alertas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  execucao_id uuid references public.execucoes(id) on delete set null,
  tipo text not null default 'nao_conformidade',
  severidade text not null default 'alta',
  titulo text not null,
  mensagem text not null default '',
  lido boolean not null default false,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.alertas TO authenticated;
GRANT ALL ON public.alertas TO service_role;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY alertas_select ON public.alertas FOR SELECT TO authenticated
  USING (unit_id IS NULL OR public.unit_da_minha_org(unit_id));
CREATE POLICY alertas_insert ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (unit_id IS NULL OR public.unit_da_minha_org(unit_id));
CREATE POLICY alertas_update ON public.alertas FOR UPDATE TO authenticated
  USING (unit_id IS NULL OR public.unit_da_minha_org(unit_id)) WITH CHECK (true);