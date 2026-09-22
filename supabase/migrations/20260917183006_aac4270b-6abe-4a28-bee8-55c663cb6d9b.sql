CREATE TABLE public.pagamento_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'plano',
  plano text,
  ciclo text NOT NULL DEFAULT 'MONTHLY',
  url text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pagamento_links_tipo_chk CHECK (tipo IN ('plano','addon')),
  CONSTRAINT pagamento_links_ciclo_chk CHECK (ciclo IN ('MONTHLY','ANNUAL')),
  CONSTRAINT pagamento_links_unico UNIQUE (tipo, plano, ciclo)
);

GRANT SELECT ON public.pagamento_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamento_links TO authenticated;
GRANT ALL ON public.pagamento_links TO service_role;

ALTER TABLE public.pagamento_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links de pagamento visíveis a todos"
ON public.pagamento_links FOR SELECT
USING (true);

CREATE POLICY "Somente a conta mestre gerencia os links"
ON public.pagamento_links FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE TRIGGER pagamento_links_updated_at
BEFORE UPDATE ON public.pagamento_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS pagamento_referencia text,
  ADD COLUMN IF NOT EXISTS pagamento_provedor text NOT NULL DEFAULT 'mercadopago';

INSERT INTO public.pagamento_links (tipo, plano, ciclo, url, ativo) VALUES
  ('plano','CONSULTORIO','MONTHLY','',false),
  ('plano','CONSULTORIO','ANNUAL','',false),
  ('plano','CLINICA','MONTHLY','',false),
  ('plano','CLINICA','ANNUAL','',false),
  ('addon',NULL,'MONTHLY','',false),
  ('addon',NULL,'ANNUAL','',false);