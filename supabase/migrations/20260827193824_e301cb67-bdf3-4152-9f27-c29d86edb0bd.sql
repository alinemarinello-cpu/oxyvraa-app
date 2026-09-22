ALTER TABLE public.chemical_products
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dilution_label text NOT NULL DEFAULT '';