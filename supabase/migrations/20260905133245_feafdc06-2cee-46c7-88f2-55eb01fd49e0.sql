alter table public.compliance_profiles add column cro text not null default '';
comment on column public.compliance_profiles.cro is 'Registro profissional CRO do responsável técnico';