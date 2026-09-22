ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS porte_dados jsonb NOT NULL DEFAULT '{}'::jsonb;