ALTER TABLE public.prefeituras
  ADD COLUMN IF NOT EXISTS contrato_arquivo_url text,
  ADD COLUMN IF NOT EXISTS contrato_arquivo_nome text,
  ADD COLUMN IF NOT EXISTS contrato_assinado_em date;