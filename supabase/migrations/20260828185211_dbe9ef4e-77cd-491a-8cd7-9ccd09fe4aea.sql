CREATE TABLE public.acessos_gestor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text NOT NULL DEFAULT '',
  escopo text NOT NULL CHECK (escopo IN ('cliente','unidade')),
  prefeitura_id uuid REFERENCES public.prefeituras(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX acessos_gestor_email_idx ON public.acessos_gestor (lower(email));
CREATE INDEX acessos_gestor_user_idx ON public.acessos_gestor (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acessos_gestor TO authenticated;
GRANT ALL ON public.acessos_gestor TO service_role;

ALTER TABLE public.acessos_gestor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org gerencia acessos" ON public.acessos_gestor
  FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE POLICY "gestor ve seu acesso" ON public.acessos_gestor
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER acessos_gestor_updated_at
  BEFORE UPDATE ON public.acessos_gestor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.gestor_acesso_unit(_unit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acessos_gestor a
    LEFT JOIN public.units u ON u.id = _unit_id
    WHERE a.user_id = auth.uid()
      AND a.ativo
      AND (a.unit_id = _unit_id OR (a.prefeitura_id IS NOT NULL AND a.prefeitura_id = u.prefeitura_id))
  )
$$;

CREATE OR REPLACE FUNCTION public.gestor_acesso_prefeitura(_prefeitura_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acessos_gestor a
    WHERE a.user_id = auth.uid()
      AND a.ativo
      AND (
        a.prefeitura_id = _prefeitura_id
        OR a.unit_id IN (SELECT id FROM public.units WHERE prefeitura_id = _prefeitura_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.gestor_acesso_execucao(_execucao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.execucoes e
    WHERE e.id = _execucao_id AND public.gestor_acesso_unit(e.unit_id)
  )
$$;

CREATE POLICY "gestor cliente le prefeitura" ON public.prefeituras
  FOR SELECT TO authenticated USING (public.gestor_acesso_prefeitura(id));

CREATE POLICY "gestor cliente le units" ON public.units
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(id));

CREATE POLICY "gestor cliente le execucoes" ON public.execucoes
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le respostas" ON public.respostas
  FOR SELECT TO authenticated USING (public.gestor_acesso_execucao(execucao_id));

CREATE POLICY "gestor cliente le cleanings" ON public.cleanings
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le planos" ON public.planos_acao
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le alertas" ON public.alertas
  FOR SELECT TO authenticated USING (unit_id IS NOT NULL AND public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le colaboradoras" ON public.colaboradoras
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le incidentes" ON public.incidentes
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));

CREATE POLICY "gestor cliente le nao conformidades" ON public.nao_conformidades
  FOR SELECT TO authenticated USING (public.gestor_acesso_unit(unit_id));