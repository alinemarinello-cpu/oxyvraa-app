CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL UNIQUE REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  plano text NOT NULL DEFAULT 'CONSULTORIO',
  kit_insumos boolean NOT NULL DEFAULT false,
  ciclo text NOT NULL DEFAULT 'MONTHLY',
  status text NOT NULL DEFAULT 'TRIALING',
  unidades_permitidas integer NOT NULL DEFAULT 1,
  entrega_cep text,
  entrega_rua text,
  entrega_numero text,
  entrega_complemento text,
  entrega_cidade text,
  entrega_uf text,
  entrega_destinatario text,
  entrega_documento text,
  trial_inicio timestamptz NOT NULL DEFAULT now(),
  trial_fim timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  aviso_conversao_em timestamptz,
  ambiente text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizacao ve a propria assinatura"
  ON public.assinaturas FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE POLICY "Organizacao cria a propria assinatura"
  ON public.assinaturas FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));

CREATE POLICY "Organizacao atualiza a propria assinatura"
  ON public.assinaturas FOR UPDATE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TRIGGER assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_assinaturas_org ON public.assinaturas(organizacao_id);
CREATE INDEX idx_assinaturas_stripe_sub ON public.assinaturas(stripe_subscription_id);

CREATE TABLE public.remessas_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  codigo_rastreio text,
  status text NOT NULL DEFAULT 'PREPARING',
  referencia_periodo text,
  enviado_em timestamptz,
  entregue_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.remessas_insumos TO authenticated;
GRANT ALL ON public.remessas_insumos TO service_role;
ALTER TABLE public.remessas_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizacao ve as proprias remessas"
  ON public.remessas_insumos FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE TRIGGER remessas_insumos_updated_at
  BEFORE UPDATE ON public.remessas_insumos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_remessas_assinatura ON public.remessas_insumos(assinatura_id);