ALTER TABLE public.dossier_documents
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'DOSSIE',
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'OUTROS',
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dossier_documents TO authenticated;

DROP POLICY IF EXISTS "consulta publica de autenticidade" ON public.dossier_documents;
CREATE POLICY "consulta publica de autenticidade" ON public.dossier_documents
  FOR SELECT TO anon USING (kind = 'DOSSIE');

DROP POLICY IF EXISTS "ler documentos da minha org" ON public.dossier_documents;
CREATE POLICY "ler documentos da minha org" ON public.dossier_documents
  FOR SELECT TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE POLICY "atualizar documentos da minha org" ON public.dossier_documents
  FOR UPDATE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

CREATE POLICY "apagar anexos da minha org" ON public.dossier_documents
  FOR DELETE TO authenticated
  USING (kind = 'ANEXO' AND (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_dossier_documents_org_kind ON public.dossier_documents(organizacao_id, kind, generated_at DESC);