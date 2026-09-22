-- Colaboradoras: dados pessoais só para admin/gestor
DROP POLICY IF EXISTS colaboradoras_select ON public.colaboradoras;
CREATE POLICY colaboradoras_select ON public.colaboradoras
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Units: PIN de acesso só para admin/gestor
DROP POLICY IF EXISTS units_select ON public.units;
CREATE POLICY units_select ON public.units
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Presenças: alteração restrita a admin/gestor
DROP POLICY IF EXISTS presencas_update ON public.presencas;
CREATE POLICY presencas_update ON public.presencas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));