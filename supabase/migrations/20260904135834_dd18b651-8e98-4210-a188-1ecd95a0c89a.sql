CREATE TABLE public.academia_areas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id),
  unit_id uuid not null references public.units(id) on delete cascade,
  nome text not null,
  tipo text not null default 'musculacao',
  detalhe text not null default '',
  produto_obrigatorio text not null default '',
  cor_kit text not null default 'azul',
  dwell_segundos integer not null default 300,
  qr_token text not null default encode(gen_random_bytes(6),'hex'),
  ultima_higienizacao timestamptz,
  ultimo_responsavel text not null default '',
  ativo boolean not null default true,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academia_areas TO authenticated;
GRANT ALL ON public.academia_areas TO service_role;
GRANT SELECT (id, unit_id, nome, tipo, detalhe, ultima_higienizacao, ultimo_responsavel, ativo) ON public.academia_areas TO anon;

ALTER TABLE public.academia_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academia_areas_select" ON public.academia_areas FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR public.gestor_acesso_unit(unit_id));
CREATE POLICY "academia_areas_public" ON public.academia_areas FOR SELECT TO anon
  USING (ativo);
CREATE POLICY "academia_areas_insert" ON public.academia_areas FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "academia_areas_update" ON public.academia_areas FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id)) WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "academia_areas_delete" ON public.academia_areas FOR DELETE TO authenticated
  USING (public.unit_da_minha_org(unit_id));

CREATE TRIGGER academia_areas_updated_at BEFORE UPDATE ON public.academia_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX academia_areas_unit_idx ON public.academia_areas(unit_id);

CREATE TABLE public.academia_higienizacoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id),
  area_id uuid not null references public.academia_areas(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  responsavel text not null default '',
  produto text not null default '',
  cor_kit text not null default '',
  dwell_segundos integer,
  qr_validado boolean not null default false,
  foto text,
  concluida_em timestamptz not null default now(),
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.academia_higienizacoes TO authenticated;
GRANT ALL ON public.academia_higienizacoes TO service_role;

ALTER TABLE public.academia_higienizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academia_hig_select" ON public.academia_higienizacoes FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR public.gestor_acesso_unit(unit_id));
CREATE POLICY "academia_hig_insert" ON public.academia_higienizacoes FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "academia_hig_update" ON public.academia_higienizacoes FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id)) WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE INDEX academia_hig_area_idx ON public.academia_higienizacoes(area_id);

CREATE TABLE public.medicoes_agua (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id),
  unit_id uuid not null references public.units(id) on delete cascade,
  area_id uuid references public.academia_areas(id) on delete set null,
  corpo_dagua text not null default 'piscina',
  medido_em timestamptz not null default now(),
  cloro_mg_l numeric,
  ph numeric,
  temperatura numeric,
  responsavel text not null default '',
  fora_faixa boolean not null default false,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.medicoes_agua TO authenticated;
GRANT ALL ON public.medicoes_agua TO service_role;

ALTER TABLE public.medicoes_agua ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicoes_agua_select" ON public.medicoes_agua FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR public.gestor_acesso_unit(unit_id));
CREATE POLICY "medicoes_agua_insert" ON public.medicoes_agua FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "medicoes_agua_update" ON public.medicoes_agua FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id)) WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE TRIGGER medicoes_agua_updated_at BEFORE UPDATE ON public.medicoes_agua
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX medicoes_agua_unit_idx ON public.medicoes_agua(unit_id, medido_em DESC);

CREATE TABLE public.academia_laudos_ar (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id),
  unit_id uuid not null references public.units(id) on delete cascade,
  tipo text not null default 'microbiologico',
  responsavel_tecnico text not null default '',
  registro_art text,
  emitido_em date not null default current_date,
  validade_meses integer not null default 6,
  expira_em date,
  arquivo_url text,
  arquivo_nome text,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academia_laudos_ar TO authenticated;
GRANT ALL ON public.academia_laudos_ar TO service_role;

ALTER TABLE public.academia_laudos_ar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academia_laudos_select" ON public.academia_laudos_ar FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id) OR public.gestor_acesso_unit(unit_id));
CREATE POLICY "academia_laudos_insert" ON public.academia_laudos_ar FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "academia_laudos_update" ON public.academia_laudos_ar FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id)) WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "academia_laudos_delete" ON public.academia_laudos_ar FOR DELETE TO authenticated
  USING (public.unit_da_minha_org(unit_id));

CREATE TRIGGER academia_laudos_updated_at BEFORE UPDATE ON public.academia_laudos_ar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX academia_laudos_unit_idx ON public.academia_laudos_ar(unit_id);

-- ================= Templates nativos: academias e centros esportivos =================

INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
('ACAD-MUSC-01','RDC 216 / NBR 16.783 / VISA municipal','Musculação e ergometria','Higienização de estofados, halteres, esteiras e colchonetes com produto neutro (Clean by Peroxy — Kit Azul).','academia_musculacao'),
('ACAD-VEST-01','Portaria MS 888-2021 / VISA municipal','Vestiários, chuveiros e saunas','Desinfecção de pisos úmidos, chuveiros, sanitários e saunas com Peroxy 4D (Kit Vermelho) e 5 min de contato.','academia_vestiario'),
('ACAD-AULAS-01','RDC 216 / VISA municipal','Salas de aulas coletivas','Pilates, bike indoor, lutas e dança: colchonetes, tatames, guidões e equipamentos compartilhados.','academia_aulas'),
('ACAD-AQUA-01','CVS 05-2013 / Portaria MS 888-2021','Parque aquático e área molhada','Controle diário de cloro e pH de piscinas e jacuzzis, bordas, raia e área molhada.','academia_aquatica'),
('ACAD-PMOC-01','Lei 13.589-2018 / Portaria 3.523-1998','PMOC de academia — climatização','Manutenção preventiva mensal dos climatizadores, análise microbiológica do ar e ART do responsável técnico.','academia_pmoc');

INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Estofados de aparelhos higienizados com Clean by Peroxy (Kit Azul)','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Produto neutro: não resseca couro nem vinil. Proibido clorado nos estofados.',300),
 (2,'Halteres, barras e anilhas higienizados','conforme',true,false,NULL,NULL,NULL,'Clean by Peroxy — Kit Azul.',300),
 (3,'Esteiras, bikes e elípticos (painéis e apoios) higienizados','conforme',true,true,NULL,NULL,NULL,'Aplicar no pano, nunca diretamente no painel eletrônico.',300),
 (4,'Colchonetes e tatames da área livre higienizados','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (5,'Bebedouros e pontos de hidratação limpos e abastecidos','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (6,'Espelhos, maçanetas e corrimãos desinfetados','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (7,'Borrifadores e toalhas de uso do aluno reabastecidos','conforme',false,false,NULL,NULL,NULL,NULL,NULL::int),
 (8,'Ocorrências do turno','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'ACAD-MUSC-01';

INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Piso úmido do vestiário desinfetado com Peroxy 4D (Kit Vermelho)','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Trava de 5 minutos de tempo de contato antes de liberar.',300),
 (2,'Chuveiros, registros e boxes desinfetados','conforme',true,true,NULL,NULL,NULL,'Prevenção de fungos e micobactérias.',300),
 (3,'Sanitários, mictórios e bancadas desinfetados','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (4,'Armários e bancos higienizados','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (5,'Sauna úmida/seca higienizada e ralos desobstruídos','conforme',true,true,NULL,NULL,NULL,'Verificar ausência de biofilme e limo nos ralos.',300),
 (6,'Ralos com fecho hídrico e sem odor','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (7,'Papel, sabonete antisséptico e lixeira com tampa abastecidos','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (8,'Ocorrências do turno','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'ACAD-VEST-01';

INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Colchonetes e tatames de Pilates/lutas higienizados entre turmas','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Clean by Peroxy — Kit Azul, 5 min de contato.',300),
 (2,'Guidões, selins e pedais das bikes higienizados','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (3,'Luvas, aparadores e sacos de pancada higienizados','conforme',true,true,NULL,NULL,NULL,NULL,300),
 (4,'Bolas, elásticos, halteres e acessórios higienizados','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (5,'Piso da sala e barras de dança limpos','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (6,'Ventilação/climatização da sala em funcionamento e filtro limpo','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (7,'Ocorrências do turno','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'ACAD-AULAS-01';

INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Cloro residual livre da piscina','numero',true,true,1.0::numeric,3.0::numeric,'mg/L','Faixa obrigatória: 1,0 a 3,0 mg/L.',NULL::int),
 (2,'pH da piscina','numero',true,true,7.2::numeric,7.8::numeric,'pH','Faixa obrigatória: 7,2 a 7,8.',NULL::int),
 (3,'Cloro residual livre da jacuzzi / hidromassagem','numero',true,false,1.0::numeric,3.0::numeric,'mg/L',NULL,NULL::int),
 (4,'pH da jacuzzi / hidromassagem','numero',true,false,7.2::numeric,7.8::numeric,'pH',NULL,NULL::int),
 (5,'Temperatura da água aquecida','temperatura',false,false,26::numeric,32::numeric,'°C',NULL,NULL::int),
 (6,'Bordas, raia e escadas higienizadas','conforme',true,true,NULL,NULL,NULL,NULL,300),
 (7,'Lava-pés e área molhada desinfetados com Peroxy 4D (Kit Vermelho)','conforme',true,false,NULL,NULL,NULL,'5 min de tempo de contato.',300),
 (8,'Filtros e retrolavagem executados conforme cronograma','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (9,'Transparência da água e ausência de algas','conforme',true,true,NULL,NULL,NULL,NULL,NULL::int),
 (10,'Ocorrências e correções químicas aplicadas','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'ACAD-AQUA-01';

INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Filtros dos climatizadores limpos ou substituídos','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Manutenção preventiva mensal obrigatória (Lei 13.589/2018).',NULL::int),
 (2,'Bandeja de condensado limpa e drenando','conforme',true,true,NULL,NULL,NULL,NULL,NULL::int),
 (3,'Serpentina e ventilador higienizados','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (4,'Tomadas de ar externo desobstruídas','conforme',false,false,NULL,NULL,NULL,NULL,NULL::int),
 (5,'Ausência de ruído, vibração ou vazamento anormal','conforme',false,false,NULL,NULL,NULL,NULL,NULL::int),
 (6,'Análise microbiológica do ar dentro da validade','conforme',true,true,NULL,NULL,NULL,'Renovação a cada 6 meses.',NULL::int),
 (7,'ART / laudo do responsável técnico vigente','conforme',true,true,NULL,NULL,NULL,'Renovação a cada 12 meses.',NULL::int),
 (8,'Registro da manutenção no livro do PMOC','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (9,'Ocorrências e peças substituídas','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'ACAD-PMOC-01';