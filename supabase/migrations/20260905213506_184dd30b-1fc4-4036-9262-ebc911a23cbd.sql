ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS cadeiras integer NOT NULL DEFAULT 1;
ALTER TABLE public.remessas_insumos ADD COLUMN IF NOT EXISTS quantidade_kits integer NOT NULL DEFAULT 1;