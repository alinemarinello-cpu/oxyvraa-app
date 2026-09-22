CREATE TABLE public.unit_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pin TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'operador' CHECK (papel IN ('operador','supervisor')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (unit_id, pin)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_pins TO authenticated;
GRANT ALL ON public.unit_pins TO service_role;

ALTER TABLE public.unit_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores gerenciam PINs das suas unidades" ON public.unit_pins
  FOR ALL TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE TRIGGER unit_pins_updated_at BEFORE UPDATE ON public.unit_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cleanings ADD COLUMN pin_nome TEXT;
ALTER TABLE public.execucoes ADD COLUMN pin_nome TEXT;