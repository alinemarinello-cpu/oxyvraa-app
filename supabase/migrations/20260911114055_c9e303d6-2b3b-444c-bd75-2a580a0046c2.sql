CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_org_created_at ON public.organizacoes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_nome_trgm ON public.organizacoes USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_org_cnpj_trgm ON public.organizacoes USING gin (cnpj gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_org_resp_nome_trgm ON public.organizacoes USING gin (responsavel_nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_org_resp_email_trgm ON public.organizacoes USING gin (responsavel_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_org_resp_tel_trgm ON public.organizacoes USING gin (responsavel_telefone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_assinaturas_org ON public.assinaturas (organizacao_id);
CREATE INDEX IF NOT EXISTS idx_org_membros_org ON public.organizacao_membros (organizacao_id);
CREATE INDEX IF NOT EXISTS idx_prefeituras_org ON public.prefeituras (organizacao_id);
CREATE INDEX IF NOT EXISTS idx_units_prefeitura ON public.units (prefeitura_id);