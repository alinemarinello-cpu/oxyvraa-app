-- ============ 1. Templates nativos ============
insert into public.checklist_templates (codigo, norma, titulo, descricao, categoria) values
('RDC1002-ODONTO','RDC 1002/2025','Odontologia — Biossegurança e SDBPF','Vistoria diária de paramentação, desinfecção entre pacientes e fluxo de materiais.','odontologia'),
('RDC15-CME','RDC 15/2012','Validação de Esterilização e CME','Monitoramento diário de autoclaves: indicadores físicos, químicos integradores Classe 5/6 e teste biológico.','esterilizacao'),
('RDC306-PGRSS','RDC 306/2004 e RDC 222/2018','Gerenciamento de Resíduos — PGRSS','Controle de caixas de perfurocortantes, sacos infectantes e descarte de químicos/amálgama.','residuos'),
('RDC50-ESTRUTURA','RDC 50/2002','Análise de Estrutura e Fluxo Físico','Auditoria periódica de barreira sanitária, ventilação e integridade de superfícies laváveis.','estrutura')
on conflict do nothing;

insert into public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, ajuda)
select t.id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, v.ajuda
from public.checklist_templates t
join (values
 ('RDC1002-ODONTO',0,'Equipe paramentada corretamente (gorro, máscara, óculos, avental e luvas)?','conforme',true,true,null::numeric,null::numeric,null::text,'Conferir antes do primeiro atendimento.'),
 ('RDC1002-ODONTO',1,'Superfícies do consultório desinfetadas entre pacientes?','conforme',true,true,null,null,null,'Desinfecção de cadeira, refletor, bancada e equipo.'),
 ('RDC1002-ODONTO',2,'Barreiras de proteção descartáveis trocadas a cada paciente?','conforme',true,false,null,null,null,null),
 ('RDC1002-ODONTO',3,'Instrumentais críticos esterilizados e embalados com identificação e validade?','conforme',true,true,null,null,null,null),
 ('RDC1002-ODONTO',4,'Fluxo de materiais respeitado (sujo → limpo) sem cruzamento?','conforme',true,false,null,null,null,'Expurgo, preparo, esterilização e armazenagem.'),
 ('RDC1002-ODONTO',5,'Lavatório com sabonete líquido, papel toalha e antisséptico abastecidos?','conforme',false,false,null,null,null,null),
 ('RDC1002-ODONTO',6,'Registro de higienização das mãos realizado pela equipe?','conforme',false,false,null,null,null,null),
 ('RDC1002-ODONTO',7,'Observações da vistoria diária','texto',false,false,null,null,null,null),

 ('RDC15-CME',0,'Número do lote / ciclo da autoclave','texto',true,false,null,null,null,'Ex.: 2026-08-27-01'),
 ('RDC15-CME',1,'Temperatura máxima atingida no ciclo','temperatura',true,false,121,138,'°C','Faixa usual de 121 °C a 134 °C.'),
 ('RDC15-CME',2,'Tempo de exposição do ciclo','numero',true,false,15,60,'min',null),
 ('RDC15-CME',3,'Indicador físico (gráfico/impressão) dentro dos parâmetros?','conforme',true,true,null,null,null,null),
 ('RDC15-CME',4,'Indicador químico integrador Classe 5/6 aprovado (mudança de cor)?','conforme',true,true,null,null,null,'Anexar foto da fita integradora.'),
 ('RDC15-CME',5,'Teste biológico do dia/semana aprovado?','escolha',true,false,null,null,null,null),
 ('RDC15-CME',6,'Teste Bowie-Dick realizado no primeiro ciclo do dia?','conforme',false,true,null,null,null,null),
 ('RDC15-CME',7,'Embalagens íntegras, secas e devidamente identificadas?','conforme',true,false,null,null,null,null),

 ('RDC306-PGRSS',0,'Caixa de perfurocortantes abaixo de 2/3 da capacidade?','conforme',true,true,null,null,null,'Se estiver em 2/3 ou mais, trocar imediatamente.'),
 ('RDC306-PGRSS',1,'Nível de preenchimento da caixa rígida','numero',true,false,0,100,'%',null),
 ('RDC306-PGRSS',2,'Caixas identificadas com data de montagem e prazo de uso?','conforme',false,false,null,null,null,null),
 ('RDC306-PGRSS',3,'Sacos brancos leitosos (grupo A) corretamente fechados e identificados?','conforme',true,false,null,null,null,null),
 ('RDC306-PGRSS',4,'Resíduos químicos (grupo B) e amálgama armazenados em recipiente próprio?','conforme',true,true,null,null,null,null),
 ('RDC306-PGRSS',5,'Abrigo externo de resíduos limpo, sinalizado e trancado?','conforme',false,true,null,null,null,null),
 ('RDC306-PGRSS',6,'Comprovante de coleta da empresa licenciada arquivado?','conforme',true,false,null,null,null,null),
 ('RDC306-PGRSS',7,'Observações do PGRSS','texto',false,false,null,null,null,null),

 ('RDC50-ESTRUTURA',0,'Barreira sanitária entre área suja e área limpa preservada?','conforme',true,true,null,null,null,null),
 ('RDC50-ESTRUTURA',1,'Pisos, paredes e bancadas laváveis, íntegros e sem infiltração?','conforme',true,true,null,null,null,null),
 ('RDC50-ESTRUTURA',2,'Ventilação/exaustão em funcionamento e filtros limpos?','conforme',true,false,null,null,null,null),
 ('RDC50-ESTRUTURA',3,'Temperatura ambiente da sala clínica','temperatura',false,false,18,26,'°C',null),
 ('RDC50-ESTRUTURA',4,'Iluminação adequada e luminárias íntegras?','conforme',false,false,null,null,null,null),
 ('RDC50-ESTRUTURA',5,'Lavatório exclusivo para higienização das mãos na sala clínica?','conforme',true,false,null,null,null,null),
 ('RDC50-ESTRUTURA',6,'Sinalização de ambientes e fluxos conforme projeto aprovado?','conforme',false,false,null,null,null,null),
 ('RDC50-ESTRUTURA',7,'Registro fotográfico geral do ambiente','texto',false,true,null,null,null,null)
) as v(codigo,ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda) on v.codigo = t.codigo
where not exists (select 1 from public.checklist_template_itens i where i.template_id = t.id);

update public.checklist_template_itens
set opcoes = '["Aprovado","Reprovado","Não aplicável"]'::jsonb
where tipo = 'escolha' and opcoes = '[]'::jsonb;

-- ============ 2. POPs ============
create table public.pops (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  norma text not null default '',
  versao text not null default '1.0',
  descricao text not null default '',
  arquivo_url text,
  revisado_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pops to authenticated;
grant all on public.pops to service_role;
alter table public.pops enable row level security;
create policy pops_select on public.pops for select to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy pops_insert on public.pops for insert to authenticated
  with check (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy pops_update on public.pops for update to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy pops_delete on public.pops for delete to authenticated
  using ((organizacao_id = public.minha_organizacao(auth.uid()) and (public.has_role(auth.uid(),'gestor') or public.has_role(auth.uid(),'admin'))) or public.is_master(auth.uid()));
create trigger pops_updated_at before update on public.pops for each row execute function public.update_updated_at_column();

alter table public.checklists add column if not exists pop_id uuid references public.pops(id) on delete set null;

-- ============ 3. Documentos SDBPF ============
create table public.documentos_sdbpf (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  categoria text not null,
  titulo text not null,
  numero text,
  orgao_emissor text,
  arquivo_url text,
  arquivo_nome text,
  emitido_em date,
  expires_at date,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.documentos_sdbpf to authenticated;
grant all on public.documentos_sdbpf to service_role;
alter table public.documentos_sdbpf enable row level security;
create policy doc_select on public.documentos_sdbpf for select to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy doc_insert on public.documentos_sdbpf for insert to authenticated
  with check (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy doc_update on public.documentos_sdbpf for update to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy doc_delete on public.documentos_sdbpf for delete to authenticated
  using ((organizacao_id = public.minha_organizacao(auth.uid()) and (public.has_role(auth.uid(),'gestor') or public.has_role(auth.uid(),'admin'))) or public.is_master(auth.uid()));
create trigger doc_updated_at before update on public.documentos_sdbpf for each row execute function public.update_updated_at_column();
create index documentos_sdbpf_expires_idx on public.documentos_sdbpf (expires_at);

-- ============ 4. Ciclos de autoclave ============
create table public.ciclos_autoclave (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  equipamento text not null default '',
  lote text not null,
  ciclo text not null default '',
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  temperatura numeric,
  tempo_exposicao_min numeric,
  indicador_fisico boolean not null default false,
  indicador_quimico boolean not null default false,
  indicador_biologico text not null default 'nao_aplicavel',
  foto_integrador text,
  operador_nome text not null default '',
  operador_pin text,
  registrado_por uuid references auth.users(id),
  status text not null default 'pendente',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.ciclos_autoclave to authenticated;
grant all on public.ciclos_autoclave to service_role;
alter table public.ciclos_autoclave enable row level security;
create policy ciclo_select on public.ciclos_autoclave for select to authenticated
  using (public.unit_da_minha_org(unit_id) or registrado_por = auth.uid());
create policy ciclo_insert on public.ciclos_autoclave for insert to authenticated
  with check (public.unit_da_minha_org(unit_id));
create policy ciclo_update on public.ciclos_autoclave for update to authenticated
  using (public.unit_da_minha_org(unit_id));
create trigger ciclo_updated_at before update on public.ciclos_autoclave for each row execute function public.update_updated_at_column();

-- ============ 5. Treinamentos ============
create table public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  colaboradora_id uuid references public.colaboradoras(id) on delete set null,
  participante text not null,
  funcao text not null default '',
  tema text not null,
  pop_id uuid references public.pops(id) on delete set null,
  realizado_em date not null,
  validade date,
  carga_horaria numeric,
  instrutor text not null default '',
  certificado_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.treinamentos to authenticated;
grant all on public.treinamentos to service_role;
alter table public.treinamentos enable row level security;
create policy trein_select on public.treinamentos for select to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy trein_insert on public.treinamentos for insert to authenticated
  with check (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy trein_update on public.treinamentos for update to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy trein_delete on public.treinamentos for delete to authenticated
  using ((organizacao_id = public.minha_organizacao(auth.uid()) and (public.has_role(auth.uid(),'gestor') or public.has_role(auth.uid(),'admin'))) or public.is_master(auth.uid()));
create trigger trein_updated_at before update on public.treinamentos for each row execute function public.update_updated_at_column();

-- ============ 6. Insumos com lote e validade ============
create table public.insumos_lotes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  nome text not null,
  categoria text not null default 'geral',
  fabricante text not null default '',
  codigo_barras text,
  lote text not null,
  validade date not null,
  quantidade numeric not null default 0,
  unidade text not null default 'un',
  registro_anvisa text,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.insumos_lotes to authenticated;
grant all on public.insumos_lotes to service_role;
alter table public.insumos_lotes enable row level security;
create policy insumo_select on public.insumos_lotes for select to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy insumo_insert on public.insumos_lotes for insert to authenticated
  with check (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy insumo_update on public.insumos_lotes for update to authenticated
  using (organizacao_id = public.minha_organizacao(auth.uid()) or public.is_master(auth.uid()));
create policy insumo_delete on public.insumos_lotes for delete to authenticated
  using ((organizacao_id = public.minha_organizacao(auth.uid()) and (public.has_role(auth.uid(),'gestor') or public.has_role(auth.uid(),'admin'))) or public.is_master(auth.uid()));
create trigger insumo_updated_at before update on public.insumos_lotes for each row execute function public.update_updated_at_column();
create index insumos_lotes_validade_idx on public.insumos_lotes (validade);

-- ============ 7. Caixas de perfurocortantes ============
create table public.caixas_perfurocortantes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  local text not null default '',
  capacidade_litros numeric not null default 13,
  montada_em date not null default current_date,
  nivel_percentual numeric not null default 0,
  status text not null default 'em_uso',
  trocada_em timestamptz,
  foto_troca text,
  responsavel text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.caixas_perfurocortantes to authenticated;
grant all on public.caixas_perfurocortantes to service_role;
alter table public.caixas_perfurocortantes enable row level security;
create policy caixa_select on public.caixas_perfurocortantes for select to authenticated
  using (public.unit_da_minha_org(unit_id));
create policy caixa_insert on public.caixas_perfurocortantes for insert to authenticated
  with check (public.unit_da_minha_org(unit_id));
create policy caixa_update on public.caixas_perfurocortantes for update to authenticated
  using (public.unit_da_minha_org(unit_id));
create policy caixa_delete on public.caixas_perfurocortantes for delete to authenticated
  using (public.unit_da_minha_org(unit_id) and (public.has_role(auth.uid(),'gestor') or public.has_role(auth.uid(),'admin') or public.is_master(auth.uid())));
create trigger caixa_updated_at before update on public.caixas_perfurocortantes for each row execute function public.update_updated_at_column();