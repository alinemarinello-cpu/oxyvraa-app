CREATE TABLE public.secretarias (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id),
  prefeitura_id uuid not null references public.prefeituras(id) on delete cascade,
  tipo text not null default 'educacao',
  nome text not null,
  responsavel text not null default '',
  email text,
  telefone text,
  observacoes text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.secretarias TO authenticated;
GRANT ALL ON public.secretarias TO service_role;

ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secretarias_select" ON public.secretarias FOR SELECT TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id));
CREATE POLICY "secretarias_insert" ON public.secretarias FOR INSERT TO authenticated
  WITH CHECK (public.pref_da_minha_org(prefeitura_id));
CREATE POLICY "secretarias_update" ON public.secretarias FOR UPDATE TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id)) WITH CHECK (public.pref_da_minha_org(prefeitura_id));
CREATE POLICY "secretarias_delete" ON public.secretarias FOR DELETE TO authenticated
  USING (public.pref_da_minha_org(prefeitura_id));

CREATE TRIGGER secretarias_updated_at BEFORE UPDATE ON public.secretarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX secretarias_prefeitura_idx ON public.secretarias(prefeitura_id);

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS secretaria_id uuid REFERENCES public.secretarias(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS units_secretaria_idx ON public.units(secretaria_id);

-- ================= Templates do setor público =================

INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
('PUB-MERENDA-01','FNDE / RDC 216-2004','Merenda escolar e cozinhas públicas','Controle de temperatura, amostragem de 72h e higienização de refeitórios em cozinhas municipais.','publico_merenda'),
('PUB-CRECHE-01','MEC / VISA / Portaria MS 888-2021','Escolas, creches e berçários municipais','Trocadores, brinquedos, tatames, caixa d''água e potabilidade dos bebedouros.','publico_educacao'),
('PUB-ODONTO-01','RDC 15-2012 / RDC 222-2018','Odontologia pública e saúde bucal','CME público, desinfecção da cadeira odontológica e manifesto de resíduos A e E.','publico_odonto'),
('PUB-CAPS-01','RDC 50 / RDC 222-2018','CAPS e residências terapêuticas','Dormitórios, banheiros coletivos, oficinas terapêuticas, pragas e caixa d''água.','publico_caps'),
('PUB-TEA-01','RDC 216 / Protocolo sensorial','Centros de atendimento TEA / autismo','Higienização hipoalergênica sem fragrância de salas sensoriais, piscina de bolinhas e estofados.','publico_tea');

-- Merenda escolar
INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Temperatura da câmara fria / geladeira de perecíveis','temperatura',true,true,0::numeric,5::numeric,'°C','Perecíveis refrigerados devem ficar entre 0 °C e 5 °C (RDC 216).',NULL::int),
 (2,'Temperatura do freezer de congelados','temperatura',true,true,-25::numeric,-12::numeric,'°C','Congelados a -18 °C (tolerância até -12 °C).',NULL::int),
 (3,'Temperatura da refeição no balcão de distribuição','temperatura',true,false,60::numeric,100::numeric,'°C','Alimentos quentes acima de 60 °C.',NULL::int),
 (4,'Amostra da refeição coletada e guardada por 72 h em recipiente esterilizado','conforme',true,true,NULL,NULL,NULL,'Mínimo 100 g por preparação, identificada com data, hora e responsável.',NULL::int),
 (5,'Higienização de bancadas e utensílios com desinfetante liberado para alimentos','conforme',true,false,NULL,NULL,NULL,'Cloroclean 1:50 — respeitar tempo de contato e enxaguar.',300),
 (6,'Higienização de fogões, coifas e exaustores','conforme',false,true,NULL,NULL,NULL,'IC-115 conforme grau de gordura.',600),
 (7,'Lavatório de merendeiras abastecido (sabonete antisséptico e papel)','conforme',true,false,NULL,NULL,NULL,'Xpress Antisseptical T-4 pronto uso.',NULL::int),
 (8,'Refeitório, mesas e cadeiras higienizados após cada turno','conforme',false,true,NULL,NULL,NULL,NULL,300),
 (9,'Merendeiras com uniforme, touca e sem adornos','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (10,'Observações e ocorrências do turno','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'PUB-MERENDA-01';

-- Creches e berçários
INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Trocador de fraldas desinfetado entre cada troca','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Clean by Peroxy — 3 min de contato, enxaguar e secar.',180),
 (2,'Banheiro infantil higienizado e abastecido','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (3,'Brinquedos, mordedores e objetos de boca sanitizados','conforme',true,true,NULL,NULL,NULL,'Imersão/aplicação por 5 min e enxágue em água potável.',300),
 (4,'Colchonetes, tatames e berços higienizados','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (5,'Pátio de recreação e parquinho higienizados','conforme',false,true,NULL,NULL,NULL,NULL,NULL::int),
 (6,'Cloro residual livre do bebedouro','numero',true,true,0.2::numeric,2::numeric,'mg/L','Portaria MS 888/2021: 0,2 a 2,0 mg/L.',NULL::int),
 (7,'Filtros dos bebedouros dentro da validade de troca','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (8,'Caixa d''água lacrada, limpa e com laudo semestral vigente','conforme',true,true,NULL,NULL,NULL,NULL,NULL::int),
 (9,'Salas de aula e maçanetas desinfetadas','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (10,'Ocorrências (surto, afastamento, avaria)','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'PUB-CRECHE-01';

-- Odontologia pública
INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Expurgo: instrumental recebido e separado sem manipulação manual de perfurocortantes','conforme',true,false,NULL::numeric,NULL::numeric,NULL,NULL,NULL::int),
 (2,'Lavagem enzimática do instrumental (Sparzyme 1:200)','conforme',true,true,NULL,NULL,NULL,'Imersão mínima de 5 min conforme fabricante.',300),
 (3,'Secagem, inspeção e embalagem com indicador químico','conforme',true,true,NULL,NULL,NULL,NULL,NULL::int),
 (4,'Temperatura do ciclo de autoclave','temperatura',true,false,121::numeric,135::numeric,'°C','121 °C/30 min ou 134 °C/4 min.',NULL::int),
 (5,'Indicador biológico do ciclo registrado','conforme',true,true,NULL,NULL,NULL,'RDC 15/2012 — periodicidade definida em POP.',NULL::int),
 (6,'Cadeira odontológica, refletor e sugadores desinfetados entre pacientes','conforme',true,true,NULL,NULL,NULL,'Peroxy 4D 1:40 — respeitar tempo de contato.',600),
 (7,'Descarte de resíduos do Grupo A (infectantes) em saco branco leitoso identificado','conforme',true,false,NULL,NULL,NULL,'RDC 222/2018.',NULL::int),
 (8,'Caixa de perfurocortantes (Grupo E) abaixo do limite de preenchimento','conforme',true,true,NULL,NULL,NULL,'Trocar ao atingir 2/3 da capacidade.',NULL::int),
 (9,'Manifesto de transporte de resíduos arquivado','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (10,'Observações do turno','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'PUB-ODONTO-01';

-- CAPS
INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Dormitórios higienizados, roupas de cama trocadas e identificadas','conforme',true,true,NULL::numeric,NULL::numeric,NULL,NULL,300),
 (2,'Banheiros coletivos desinfetados e abastecidos','conforme',true,false,NULL,NULL,NULL,'Peroxy 4D 1:40 — kit vermelho.',600),
 (3,'Oficinas terapêuticas e salas de convivência higienizadas','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (4,'Refeitório e copa higienizados','conforme',false,false,NULL,NULL,NULL,NULL,300),
 (5,'Controle de pragas com certificado vigente','conforme',true,true,NULL,NULL,NULL,'Empresa licenciada pela VISA.',NULL::int),
 (6,'Caixa d''água higienizada (laudo semestral)','conforme',true,true,NULL,NULL,NULL,NULL,NULL::int),
 (7,'Cloro residual livre da água','numero',true,false,0.2::numeric,2::numeric,'mg/L','Portaria MS 888/2021.',NULL::int),
 (8,'Resíduos segregados e armazenados em abrigo adequado','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (9,'Observações e intercorrências','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'PUB-CAPS-01';

-- TEA
INSERT INTO public.checklist_template_itens (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, opcoes, ajuda, dwell_segundos)
SELECT id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, '[]'::jsonb, v.ajuda, v.dwell
FROM public.checklist_templates t,
LATERAL (VALUES
 (1,'Produto utilizado é hipoalergênico e sem fragrância (Clean by Peroxy)','conforme',true,true,NULL::numeric,NULL::numeric,NULL,'Proibido produto perfumado/clorado em sala sensorial: risco de gatilho sensorial.',NULL::int),
 (2,'Sala de integração sensorial higienizada e ventilada antes do atendimento','conforme',true,false,NULL,NULL,NULL,'Aguardar secagem completa e ventilar 10 min antes da entrada.',300),
 (3,'Piscina de bolinhas: bolinhas sanitizadas e enxaguadas','conforme',true,true,NULL,NULL,NULL,'Imersão por 5 min, enxágue em água potável e secagem total.',300),
 (4,'Balanços, redes e plataformas de estímulo higienizados','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (5,'Objetos táteis e materiais pedagógicos sanitizados entre atendimentos','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (6,'Estofados, almofadas e tapetes higienizados','conforme',false,true,NULL,NULL,NULL,NULL,300),
 (7,'Banheiro adaptado higienizado e abastecido','conforme',true,false,NULL,NULL,NULL,NULL,300),
 (8,'Sala liberada apenas após secagem completa e ausência de odor','conforme',true,false,NULL,NULL,NULL,NULL,NULL::int),
 (9,'Observações sobre reações sensoriais dos atendidos','texto',false,false,NULL,NULL,NULL,NULL,NULL::int)
) AS v(ordem,pergunta,tipo,critico,foto,vmin,vmax,um,ajuda,dwell)
WHERE t.codigo = 'PUB-TEA-01';