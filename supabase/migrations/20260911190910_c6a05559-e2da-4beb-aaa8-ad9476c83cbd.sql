-- 1) Banco regulatório administrável -------------------------------------
ALTER TABLE public.rdc_requisitos
  ADD COLUMN IF NOT EXISTS texto_simplificado text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS aplicabilidade text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS versao text NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS fonte text NOT NULL DEFAULT 'Anvisa',
  ADD COLUMN IF NOT EXISTS revisado_em date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'VIGENTE';

CREATE TABLE IF NOT EXISTS public.rdc_requisitos_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisito_id uuid NOT NULL REFERENCES public.rdc_requisitos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  versao text NOT NULL,
  situacao text NOT NULL,
  snapshot jsonb NOT NULL,
  alterado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rdc_requisitos_historico TO authenticated;
GRANT ALL ON public.rdc_requisitos_historico TO service_role;
ALTER TABLE public.rdc_requisitos_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico requisitos leitura" ON public.rdc_requisitos_historico;
CREATE POLICY "historico requisitos leitura" ON public.rdc_requisitos_historico
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_historico_requisito()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.rdc_requisitos_historico (requisito_id, codigo, versao, situacao, snapshot, alterado_por)
  values (old.id, old.codigo, old.versao, old.situacao, to_jsonb(old), auth.uid());
  return new;
end; $$;

DROP TRIGGER IF EXISTS rdc_requisitos_historico_trg ON public.rdc_requisitos;
CREATE TRIGGER rdc_requisitos_historico_trg
  BEFORE UPDATE ON public.rdc_requisitos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_requisito();

CREATE INDEX IF NOT EXISTS idx_rdc_hist_requisito ON public.rdc_requisitos_historico(requisito_id, created_at DESC);

-- 2) Funil de aquisição: diagnóstico público ------------------------------
CREATE TABLE IF NOT EXISTS public.rdc_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  clinica text,
  email text,
  whatsapp text,
  cidade text,
  uf text,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  aplicaveis integer NOT NULL DEFAULT 0,
  pendencias integer NOT NULL DEFAULT 0,
  categorias jsonb NOT NULL DEFAULT '[]'::jsonb,
  origem text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  etapa text NOT NULL DEFAULT 'INICIADO',
  plano_escolhido text,
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  convertido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rdc_leads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.rdc_leads TO authenticated;
GRANT ALL ON public.rdc_leads TO service_role;
ALTER TABLE public.rdc_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead pode criar diagnostico" ON public.rdc_leads;
CREATE POLICY "lead pode criar diagnostico" ON public.rdc_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lead pode atualizar o proprio diagnostico" ON public.rdc_leads;
CREATE POLICY "lead pode atualizar o proprio diagnostico" ON public.rdc_leads
  FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '2 days')
  WITH CHECK (created_at > now() - interval '2 days');

DROP POLICY IF EXISTS "master ve todos os diagnosticos" ON public.rdc_leads;
CREATE POLICY "master ve todos os diagnosticos" ON public.rdc_leads
  FOR SELECT TO authenticated USING (public.is_master(auth.uid()));

CREATE TRIGGER rdc_leads_updated_at BEFORE UPDATE ON public.rdc_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rdc_leads_created ON public.rdc_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rdc_leads_etapa ON public.rdc_leads(etapa);

-- 3) Catálogo de serviços futuros -----------------------------------------
CREATE TABLE IF NOT EXISTS public.servicos_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'SERVICO',
  preco numeric(12,2),
  unidade_cobranca text NOT NULL DEFAULT 'PROJETO',
  price_id text,
  ativo boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.servicos_catalogo TO anon;
GRANT SELECT ON public.servicos_catalogo TO authenticated;
GRANT ALL ON public.servicos_catalogo TO service_role;
ALTER TABLE public.servicos_catalogo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicos ativos sao publicos" ON public.servicos_catalogo;
CREATE POLICY "servicos ativos sao publicos" ON public.servicos_catalogo
  FOR SELECT TO anon, authenticated USING (ativo OR public.is_master(auth.uid()));

CREATE TRIGGER servicos_catalogo_updated_at BEFORE UPDATE ON public.servicos_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.servicos_catalogo (codigo, nome, descricao, tipo, unidade_cobranca, ordem, ativo) VALUES
  ('consultoria', 'Consultoria em Conformidade', 'Acompanhamento técnico para adequação à RDC 1.002/2025.', 'SERVICO', 'HORA', 1, false),
  ('auditoria', 'Auditoria Interna', 'Auditoria presencial ou remota com relatório de evidências.', 'SERVICO', 'PROJETO', 2, false),
  ('implantacao', 'Implantação Assistida', 'Configuração completa da clínica na plataforma.', 'SERVICO', 'PROJETO', 3, false),
  ('treinamentos_premium', 'Treinamentos Premium', 'Capacitação da equipe com certificados e registro de presença.', 'SERVICO', 'TURMA', 4, false),
  ('documentacao', 'Documentação Personalizada', 'POPs, manuais e formulários redigidos para a sua realidade.', 'SERVICO', 'PROJETO', 5, false),
  ('pgrss', 'PGRSS', 'Elaboração e acompanhamento do plano de gerenciamento de resíduos.', 'SERVICO', 'PROJETO', 6, false),
  ('multiunidades', 'Multiunidades', 'Gestão consolidada de rede com painel comparativo por unidade.', 'ADDON', 'UNIDADE', 7, false)
ON CONFLICT (codigo) DO NOTHING;