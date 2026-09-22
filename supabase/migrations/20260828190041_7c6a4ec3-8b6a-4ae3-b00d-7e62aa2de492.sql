-- 1) Acessos independentes de logística
CREATE TABLE public.acessos_logistica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX acessos_logistica_org_email_idx ON public.acessos_logistica (organizacao_id, lower(email));
CREATE INDEX acessos_logistica_user_idx ON public.acessos_logistica (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acessos_logistica TO authenticated;
GRANT ALL ON public.acessos_logistica TO service_role;
ALTER TABLE public.acessos_logistica ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_logistica(_organizacao_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acessos_logistica a
    WHERE a.user_id = auth.uid() AND a.ativo AND a.organizacao_id = _organizacao_id
  )
$$;

CREATE POLICY "logistica_acessos_select" ON public.acessos_logistica FOR SELECT TO authenticated
USING (
  organizacao_id = public.minha_organizacao(auth.uid())
  OR public.is_master(auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "logistica_acessos_insert" ON public.acessos_logistica FOR INSERT TO authenticated
WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "logistica_acessos_update" ON public.acessos_logistica FOR UPDATE TO authenticated
USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "logistica_acessos_delete" ON public.acessos_logistica FOR DELETE TO authenticated
USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TRIGGER acessos_logistica_updated_at BEFORE UPDATE ON public.acessos_logistica
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Pedidos mensais de insumos
CREATE TABLE public.pedidos_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  prefeitura_id uuid NOT NULL REFERENCES public.prefeituras(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  competencia text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  valor_total numeric NOT NULL DEFAULT 0,
  fornecedor text NOT NULL DEFAULT '',
  transportadora text NOT NULL DEFAULT '',
  nota_fiscal text,
  previsao_entrega date,
  entregue_em timestamptz,
  recebido_por text NOT NULL DEFAULT '',
  foto_entrega text,
  observacoes text NOT NULL DEFAULT '',
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pedidos_insumos_org_idx ON public.pedidos_insumos (organizacao_id, competencia);
CREATE INDEX pedidos_insumos_pref_idx ON public.pedidos_insumos (prefeitura_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_insumos TO authenticated;
GRANT ALL ON public.pedidos_insumos TO service_role;
ALTER TABLE public.pedidos_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select" ON public.pedidos_insumos FOR SELECT TO authenticated
USING (public.pref_da_minha_org(prefeitura_id) OR public.is_logistica(organizacao_id));
CREATE POLICY "pedidos_insert" ON public.pedidos_insumos FOR INSERT TO authenticated
WITH CHECK (public.pref_da_minha_org(prefeitura_id) OR public.is_logistica(organizacao_id));
CREATE POLICY "pedidos_update" ON public.pedidos_insumos FOR UPDATE TO authenticated
USING (public.pref_da_minha_org(prefeitura_id) OR public.is_logistica(organizacao_id))
WITH CHECK (public.pref_da_minha_org(prefeitura_id) OR public.is_logistica(organizacao_id));
CREATE POLICY "pedidos_delete" ON public.pedidos_insumos FOR DELETE TO authenticated
USING (public.pref_da_minha_org(prefeitura_id));

CREATE TRIGGER pedidos_insumos_updated_at BEFORE UPDATE ON public.pedidos_insumos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Itens do pedido
CREATE OR REPLACE FUNCTION public.pedido_visivel(_pedido_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pedidos_insumos p
    WHERE p.id = _pedido_id
      AND (public.pref_da_minha_org(p.prefeitura_id) OR public.is_logistica(p.organizacao_id))
  )
$$;

CREATE TABLE public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_insumos(id) ON DELETE CASCADE,
  chemical_product_id uuid REFERENCES public.chemical_products(id) ON DELETE SET NULL,
  produto text NOT NULL,
  categoria text NOT NULL DEFAULT 'quimico',
  unidade text NOT NULL DEFAULT 'un',
  quantidade numeric NOT NULL DEFAULT 1,
  quantidade_entregue numeric NOT NULL DEFAULT 0,
  preco_unitario numeric NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pedido_itens_pedido_idx ON public.pedido_itens (pedido_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedido_itens_select" ON public.pedido_itens FOR SELECT TO authenticated
USING (public.pedido_visivel(pedido_id));
CREATE POLICY "pedido_itens_insert" ON public.pedido_itens FOR INSERT TO authenticated
WITH CHECK (public.pedido_visivel(pedido_id));
CREATE POLICY "pedido_itens_update" ON public.pedido_itens FOR UPDATE TO authenticated
USING (public.pedido_visivel(pedido_id)) WITH CHECK (public.pedido_visivel(pedido_id));
CREATE POLICY "pedido_itens_delete" ON public.pedido_itens FOR DELETE TO authenticated
USING (public.pedido_visivel(pedido_id));

CREATE TRIGGER pedido_itens_updated_at BEFORE UPDATE ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();