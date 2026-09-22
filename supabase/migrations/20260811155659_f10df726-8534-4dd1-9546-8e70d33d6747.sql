-- cleanings: restrict broad select
DROP POLICY IF EXISTS cleanings_select ON public.cleanings;
CREATE POLICY cleanings_select ON public.cleanings FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR registrado_por = auth.uid()
);

-- prefeituras: restrict contract/financial data
DROP POLICY IF EXISTS prefeituras_select ON public.prefeituras;
CREATE POLICY prefeituras_select ON public.prefeituras FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
);

-- nao_conformidades: restrict updates
DROP POLICY IF EXISTS nc_update ON public.nao_conformidades;
CREATE POLICY nc_update ON public.nao_conformidades FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
);

-- storage: ownership checks on evidencias bucket
DROP POLICY IF EXISTS evidencias_select ON storage.objects;
CREATE POLICY evidencias_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'evidencias'
  AND (
    owner = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
  )
);

DROP POLICY IF EXISTS evidencias_insert ON storage.objects;
CREATE POLICY evidencias_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'evidencias'
  AND owner = auth.uid()
);