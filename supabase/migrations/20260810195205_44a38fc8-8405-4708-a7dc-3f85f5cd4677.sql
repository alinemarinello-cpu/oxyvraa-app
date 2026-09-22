
-- ============ ROLES / PROFILES ============
create type public.app_role as enum ('admin', 'gestor', 'operador');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMP TRIGGER ============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

-- ============ PREFEITURAS / CONTRATANTES ============
create table public.prefeituras (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  nome text not null,
  uf text not null default 'SP',
  vertical text not null default 'educacional',
  vertical_type text,
  responsavel_qa text,
  responsavel_tecnico text,
  registro_rt text,
  valor_mensal numeric(12,2),
  dia_vencimento int,
  inicio_contrato date,
  fim_contrato date,
  numero_contrato text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.prefeituras to authenticated;
grant all on public.prefeituras to service_role;
alter table public.prefeituras enable row level security;
create policy "prefeituras_select" on public.prefeituras for select to authenticated using (true);
create policy "prefeituras_admin_write" on public.prefeituras for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger prefeituras_updated_at before update on public.prefeituras for each row execute function public.update_updated_at_column();

-- ============ UNIDADES ============
create table public.units (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  tipo text not null default 'escola',
  nome text not null,
  bairro text not null default '',
  pin text not null,
  responsavel text not null default '',
  nome_completo text,
  endereco text,
  foto_fachada text,
  qtd_alunos int,
  qtd_colaboradores int,
  lat double precision,
  lng double precision,
  raio_metros int not null default 150,
  ambientes jsonb not null default '[]'::jsonb,
  locais jsonb not null default '[]'::jsonb,
  ambientes_custom jsonb not null default '{}'::jsonb,
  produtos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_prefeitura_idx on public.units(prefeitura_id);
grant select, insert, update, delete on public.units to authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;
create policy "units_select" on public.units for select to authenticated using (true);
create policy "units_admin_write" on public.units for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger units_updated_at before update on public.units for each row execute function public.update_updated_at_column();

-- ============ COLABORADORAS ============
create table public.colaboradoras (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  unit_id uuid not null references public.units(id) on delete cascade,
  nome text not null,
  cpf text,
  telefone text,
  pin text,
  turnos jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index colaboradoras_unit_idx on public.colaboradoras(unit_id);
grant select, insert, update, delete on public.colaboradoras to authenticated;
grant all on public.colaboradoras to service_role;
alter table public.colaboradoras enable row level security;
create policy "colaboradoras_select" on public.colaboradoras for select to authenticated using (true);
create policy "colaboradoras_admin_write" on public.colaboradoras for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger colaboradoras_updated_at before update on public.colaboradoras for each row execute function public.update_updated_at_column();

-- ============ LIMPEZAS ============
create table public.cleanings (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  unit_id uuid not null references public.units(id) on delete cascade,
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  registrado_por uuid references auth.users(id) on delete set null,
  ambiente text not null,
  local_id text,
  servente text not null default '',
  executado_em timestamptz not null default now(),
  lat double precision,
  lng double precision,
  distancia_metros double precision,
  fora_da_area boolean not null default false,
  foto_antes text,
  foto_depois text,
  duracao_seg int,
  itens_feitos jsonb not null default '[]'::jsonb,
  status text not null default 'pendente',
  motivo_reprovacao text,
  revisado_por text,
  revisado_em timestamptz,
  refaz_de text,
  qr_validado boolean not null default false,
  nfc_validado boolean not null default false,
  pin_operadora text,
  colaboradora_id text,
  colaboradora_nome text,
  tipo_limpeza text,
  cor_kit text,
  alergenos_zona jsonb not null default '[]'::jsonb,
  alerta_alergeno text,
  dwell_cancelado_seg int,
  nc_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cleanings_unit_idx on public.cleanings(unit_id, executado_em desc);
grant select, insert, update on public.cleanings to authenticated;
grant all on public.cleanings to service_role;
alter table public.cleanings enable row level security;
create policy "cleanings_select" on public.cleanings for select to authenticated using (true);
create policy "cleanings_insert" on public.cleanings for insert to authenticated with check (true);
create policy "cleanings_admin_update" on public.cleanings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger cleanings_updated_at before update on public.cleanings for each row execute function public.update_updated_at_column();

-- ============ PRESENCAS ============
create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  colaboradora_id uuid not null references public.colaboradoras(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  data date not null,
  turno text not null,
  checkin timestamptz,
  checkout timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index presencas_unit_idx on public.presencas(unit_id, data);
grant select, insert, update, delete on public.presencas to authenticated;
grant all on public.presencas to service_role;
alter table public.presencas enable row level security;
create policy "presencas_select" on public.presencas for select to authenticated using (true);
create policy "presencas_insert" on public.presencas for insert to authenticated with check (true);
create policy "presencas_update" on public.presencas for update to authenticated using (true) with check (true);
create policy "presencas_admin_delete" on public.presencas for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger presencas_updated_at before update on public.presencas for each row execute function public.update_updated_at_column();

-- ============ INCIDENTES ============
create table public.incidentes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  unit_id uuid not null references public.units(id) on delete cascade,
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  tipo text not null,
  quantidade int not null default 1,
  descricao text not null default '',
  reportado_por text not null default '',
  ocorrido_em timestamptz not null default now(),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index incidentes_unit_idx on public.incidentes(unit_id, ocorrido_em desc);
grant select, insert on public.incidentes to authenticated;
grant all on public.incidentes to service_role;
alter table public.incidentes enable row level security;
create policy "incidentes_select" on public.incidentes for select to authenticated using (true);
create policy "incidentes_insert" on public.incidentes for insert to authenticated with check (true);

-- ============ NAO CONFORMIDADES ============
create table public.nao_conformidades (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  unit_id uuid not null references public.units(id) on delete cascade,
  prefeitura_id uuid references public.prefeituras(id) on delete cascade,
  local_id text,
  origem text not null,
  status text not null default 'bloqueada',
  descricao text not null default '',
  acao_corretiva text,
  responsavel text,
  aberta_em timestamptz not null default now(),
  liberada_em timestamptz,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index nc_unit_idx on public.nao_conformidades(unit_id, aberta_em desc);
grant select, insert, update on public.nao_conformidades to authenticated;
grant all on public.nao_conformidades to service_role;
alter table public.nao_conformidades enable row level security;
create policy "nc_select" on public.nao_conformidades for select to authenticated using (true);
create policy "nc_insert" on public.nao_conformidades for insert to authenticated with check (true);
create policy "nc_update" on public.nao_conformidades for update to authenticated using (true) with check (true);
create trigger nc_updated_at before update on public.nao_conformidades for each row execute function public.update_updated_at_column();

-- ============ FINANCEIRO ============
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  competencia text not null,
  valor numeric(12,2) not null default 0,
  vencimento date not null,
  pago_em date,
  metodo text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pagamentos to authenticated;
grant all on public.pagamentos to service_role;
alter table public.pagamentos enable row level security;
create policy "pagamentos_admin_all" on public.pagamentos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger pagamentos_updated_at before update on public.pagamentos for each row execute function public.update_updated_at_column();

create table public.despesas (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  data date not null,
  categoria text not null default 'outros',
  descricao text not null default '',
  valor numeric(12,2) not null default 0,
  quantidade numeric(12,2),
  unidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.despesas to authenticated;
grant all on public.despesas to service_role;
alter table public.despesas enable row level security;
create policy "despesas_admin_all" on public.despesas for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger despesas_updated_at before update on public.despesas for each row execute function public.update_updated_at_column();

-- ============ PERFIL AUTOMATICO NO SIGNUP ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'operador')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
