-- =============================================================
-- 1. Helpers de tenant
-- =============================================================
CREATE OR REPLACE FUNCTION public.pref_da_minha_org(_prefeitura_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.prefeituras p
    where p.id = _prefeitura_id
      and (p.organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()))
  )
$$;
GRANT EXECUTE ON FUNCTION public.pref_da_minha_org(uuid) TO authenticated, service_role;

-- Backfill: vincula cadastros órfãos à única organização existente (se houver só uma)
DO $$
DECLARE _org uuid;
BEGIN
  IF (SELECT count(*) FROM public.organizacoes) = 1 THEN
    SELECT id INTO _org FROM public.organizacoes LIMIT 1;
    UPDATE public.prefeituras SET organizacao_id = _org WHERE organizacao_id IS NULL;
  END IF;
END $$;

-- Fecha a brecha: organizacao_id nulo deixa de liberar acesso
CREATE OR REPLACE FUNCTION public.unit_da_minha_org(_unit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.units u join public.prefeituras p on p.id = u.prefeitura_id
    where u.id = _unit_id
      and (p.organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()))
  )
$$;

-- =============================================================
-- 2. Políticas org-scoped nas tabelas de cadastro/operação
-- =============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('prefeituras','units','colaboradoras','presencas','cleanings',
                        'incidentes','nao_conformidades','pagamentos','despesas')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- prefeituras
CREATE POLICY prefeituras_select ON public.prefeituras FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY prefeituras_insert ON public.prefeituras FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));
CREATE POLICY prefeituras_update ON public.prefeituras FOR UPDATE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));
CREATE POLICY prefeituras_delete ON public.prefeituras FOR DELETE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()));

-- units
CREATE POLICY units_select ON public.units FOR SELECT TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id));
CREATE POLICY units_write ON public.units FOR ALL TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id))
  WITH CHECK (public.pref_da_minha_org(prefeitura_id));

-- colaboradoras
CREATE POLICY colaboradoras_select ON public.colaboradoras FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id));
CREATE POLICY colaboradoras_write ON public.colaboradoras FOR ALL TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

-- presencas
CREATE POLICY presencas_select ON public.presencas FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id));
CREATE POLICY presencas_write ON public.presencas FOR ALL TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

-- cleanings (append-only: sem delete)
CREATE POLICY cleanings_select ON public.cleanings FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR registrado_por = auth.uid());
CREATE POLICY cleanings_insert ON public.cleanings FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id) AND registrado_por = auth.uid());
CREATE POLICY cleanings_update ON public.cleanings FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

-- incidentes (append-only)
CREATE POLICY incidentes_select ON public.incidentes FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id));
CREATE POLICY incidentes_insert ON public.incidentes FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));

-- nao_conformidades
CREATE POLICY nc_select ON public.nao_conformidades FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id));
CREATE POLICY nc_insert ON public.nao_conformidades FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY nc_update ON public.nao_conformidades FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

-- financeiro
CREATE POLICY pagamentos_all ON public.pagamentos FOR ALL TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id))
  WITH CHECK (public.pref_da_minha_org(prefeitura_id));
CREATE POLICY despesas_all ON public.despesas FOR ALL TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id))
  WITH CHECK (public.pref_da_minha_org(prefeitura_id));

-- =============================================================
-- 3. Catálogo genérico de produtos químicos
-- =============================================================
CREATE TABLE public.chemical_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  brand text NOT NULL DEFAULT '',
  name text NOT NULL,
  dilution_ratio numeric NOT NULL DEFAULT 100,
  dwell_time_seconds integer NOT NULL DEFAULT 60,
  color_kit_zone text NOT NULL DEFAULT 'azul',
  price_per_liter numeric NOT NULL DEFAULT 0,
  application_rate_l_m2 numeric NOT NULL DEFAULT 0.05,
  package_liters numeric NOT NULL DEFAULT 5,
  residual_hours integer NOT NULL DEFAULT 0,
  food_grade boolean NOT NULL DEFAULT false,
  requires_rinse boolean NOT NULL DEFAULT false,
  usage_notes text NOT NULL DEFAULT '',
  stock_liters numeric NOT NULL DEFAULT 0,
  min_stock_liters numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chemical_products TO authenticated;
GRANT ALL ON public.chemical_products TO service_role;

ALTER TABLE public.chemical_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY chemical_products_select ON public.chemical_products FOR SELECT TO authenticated
  USING (organizacao_id IS NULL OR organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY chemical_products_write ON public.chemical_products FOR ALL TO authenticated
  USING (organizacao_id IS NOT NULL AND organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id IS NOT NULL AND organizacao_id = public.minha_organizacao(auth.uid()));

CREATE TRIGGER chemical_products_updated_at BEFORE UPDATE ON public.chemical_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX chemical_products_org_idx ON public.chemical_products(organizacao_id);

-- Modelos globais (Spartan) — somente leitura para todas as organizações
INSERT INTO public.chemical_products
  (organizacao_id, brand, name, dilution_ratio, dwell_time_seconds, color_kit_zone, price_per_liter,
   application_rate_l_m2, package_liters, residual_hours, food_grade, requires_rinse, usage_notes)
VALUES
  (NULL,'Spartan','Peroxy 4D',100,600,'amarelo',36.00,0.05,5,72,false,true,'Áreas críticas / clínicas / enfermaria / barreira sanitária'),
  (NULL,'Spartan','DMQ',100,300,'verde',24.00,0.04,5,24,false,false,'Cozinha / refeitório / eletrônicos e informática'),
  (NULL,'Spartan','Sparquat',50,600,'vermelho',17.00,0.06,5,12,false,false,'Banheiros / sanitários / vestiários / áreas externas'),
  (NULL,'Spartan','Sani-T-10',500,60,'verde',42.00,0.03,5,8,true,false,'Sanitizante quaternário — contato direto com alimentos'),
  (NULL,'Spartan','CJ-20',50,600,'vermelho',48.00,0.08,5,6,true,true,'Detergente alcalino clorado — limpeza pesada e câmaras frias');