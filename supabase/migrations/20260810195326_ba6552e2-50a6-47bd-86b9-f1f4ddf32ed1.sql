
create policy "evidencias_select" on storage.objects for select to authenticated using (bucket_id = 'evidencias');
create policy "evidencias_insert" on storage.objects for insert to authenticated with check (bucket_id = 'evidencias');
create policy "evidencias_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'evidencias' and public.has_role(auth.uid(), 'admin'));
