alter table public.prefeituras add column cro text not null default '';
comment on column public.prefeituras.cro is 'Registro profissional CRO do responsável técnico';