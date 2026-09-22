-- 1. Alvará sanitário e RT por unidade
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS alvara_sanitario_numero text,
  ADD COLUMN IF NOT EXISTS alvara_sanitario_expiracao date,
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text,
  ADD COLUMN IF NOT EXISTS conselho_rt text;

-- 2. Rastreabilidade de dermocosméticos e validade pós-abertura
ALTER TABLE public.insumos_lotes
  ADD COLUMN IF NOT EXISTS marca text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS aberto_em date,
  ADD COLUMN IF NOT EXISTS validade_apos_aberto_dias integer,
  ADD COLUMN IF NOT EXISTS foto_frasco text;

-- 3. Aplicações de insumo em cliente (injetáveis / invasivos)
CREATE TABLE IF NOT EXISTS public.aplicacoes_insumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  insumo_id uuid REFERENCES public.insumos_lotes(id) ON DELETE SET NULL,
  execucao_id uuid REFERENCES public.execucoes(id) ON DELETE SET NULL,
  procedimento text NOT NULL DEFAULT '',
  cliente_iniciais text NOT NULL DEFAULT '',
  produto text NOT NULL DEFAULT '',
  marca text NOT NULL DEFAULT '',
  lote text NOT NULL DEFAULT '',
  validade date,
  registro_anvisa text,
  quantidade_utilizada numeric,
  unidade_medida text NOT NULL DEFAULT 'UI',
  foto_frasco text,
  profissional_nome text NOT NULL DEFAULT '',
  profissional_registro text,
  aplicado_em timestamptz NOT NULL DEFAULT now(),
  lat double precision,
  lng double precision,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.aplicacoes_insumo TO authenticated;
GRANT ALL ON public.aplicacoes_insumo TO service_role;

ALTER TABLE public.aplicacoes_insumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aplicacoes_select" ON public.aplicacoes_insumo
  FOR SELECT TO authenticated
  USING (public.unit_da_minha_org(unit_id));

CREATE POLICY "aplicacoes_insert" ON public.aplicacoes_insumo
  FOR INSERT TO authenticated
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE POLICY "aplicacoes_update" ON public.aplicacoes_insumo
  FOR UPDATE TO authenticated
  USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE TRIGGER aplicacoes_insumo_updated_at BEFORE UPDATE ON public.aplicacoes_insumo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS aplicacoes_insumo_unit_idx ON public.aplicacoes_insumo(unit_id, aplicado_em DESC);

-- 4. Templates nativos de Estética, Harmonização e Beleza
WITH t AS (
  INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
    ('EST-MICRO', 'RDC 44/2009 · MBP', 'POP — Micropigmentação e Microblading', 'Vistoria do procedimento de micropigmentação: paramentação, agulhas estéreis descartáveis, pigmentos com registro ANVISA e descarte de lâminas.', 'estetica'),
    ('EST-INJET', 'RDC 44/2009 · MBP', 'POP — Injetáveis e Harmonização Facial', 'Toxina botulínica, preenchedores e bioestimuladores: rastreabilidade de lote, cadeia de frio, antissepsia e descarte de agulhas.', 'estetica'),
    ('EST-PELE', 'RDC 44/2009 · MBP', 'POP — Limpeza de Pele e Peelings', 'Higienização de extratores, uso de ácidos com validade secundária, proteção do profissional e do cliente.', 'estetica'),
    ('EST-MASSA', 'RDC 44/2009 · MBP', 'POP — Massagens e Terapias Corporais', 'Higienização de macas e óleos, troca de lençóis descartáveis e higiene das mãos.', 'estetica'),
    ('EST-PODO', 'RDC 44/2009 · RDC 222/2018', 'POP — Podologia', 'Instrumentais esterilizados, brocas, uso de EPI, controle de sangramentos e descarte de perfurocortantes.', 'estetica'),
    ('EST-CABINE', 'RDC 44/2009', 'Higienização e Troca de Cabine', 'Protocolo entre atendimentos: desinfecção de maca, troca de lençol descartável, sanitização de equipamentos e higienização das mãos.', 'estetica'),
    ('EST-AUTOCLAVE', 'RDC 15/2012 · RDC 44/2009', 'Esterilização de Alicates e Instrumentais', 'Registro diário de ciclo de autoclave para alicates, tesouras, curetas e extratores, com foto do indicador químico/biológico.', 'estetica'),
    ('EST-RESIDUOS', 'RDC 222/2018', 'Gerenciamento de Resíduos em Estética e Beleza', 'Descarte de agulhas, seringas, lâminas de microblading, algodão e gaze com sangue, e resíduos químicos.', 'estetica')
  RETURNING id, codigo
)
INSERT INTO public.checklist_template_itens
  (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, ajuda)
SELECT t.id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, v.ajuda
FROM t
JOIN (VALUES
  -- Micropigmentação
  ('EST-MICRO', 1, 'Profissional paramentado (luvas, máscara, avental e touca)?', 'conforme', true, true, NULL::numeric, NULL::numeric, NULL::text, 'Paramentação completa antes do contato com o cliente.'),
  ('EST-MICRO', 2, 'Agulhas/cartuchos estéreis, lacrados e dentro da validade?', 'conforme', true, true, NULL, NULL, NULL, 'Fotografe o lacre antes da abertura.'),
  ('EST-MICRO', 3, 'Lote e registro ANVISA do pigmento anotados na ficha do cliente?', 'texto', true, false, NULL, NULL, NULL, 'Registre marca, cor e lote do pigmento.'),
  ('EST-MICRO', 4, 'Antissepsia da pele realizada com degermante e antisséptico?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-MICRO', 5, 'Superfícies e dermógrafo protegidos com barreira descartável?', 'conforme', false, true, NULL, NULL, NULL, NULL),
  ('EST-MICRO', 6, 'Termo de consentimento assinado e ficha de anamnese preenchida?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-MICRO', 7, 'Lâminas e agulhas descartadas em caixa rígida imediatamente após o uso?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  -- Injetáveis / harmonização
  ('EST-INJET', 1, 'Produto injetável possui registro ANVISA válido?', 'conforme', true, false, NULL, NULL, NULL, 'Consulte o número de registro na embalagem.'),
  ('EST-INJET', 2, 'Marca e lote do produto registrados (toxina/preenchedor/bioestimulador)?', 'texto', true, true, NULL, NULL, NULL, 'Fotografe o frasco/ampola utilizado no cliente.'),
  ('EST-INJET', 3, 'Data de validade do produto conferida?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-INJET', 4, 'Temperatura da geladeira de armazenamento (cadeia de frio)', 'temperatura', true, false, 2, 8, '°C', 'Toxina botulínica deve permanecer entre 2 °C e 8 °C.'),
  ('EST-INJET', 5, 'Antissepsia da área com clorexidina alcoólica ou álcool 70%?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-INJET', 6, 'Seringas e agulhas descartáveis, de uso único, abertas na frente do cliente?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-INJET', 7, 'Ficha de anamnese, termo de consentimento e foto de antes arquivados?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-INJET', 8, 'Carrinho de emergência/antialérgico disponível e dentro da validade?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-INJET', 9, 'Perfurocortantes descartados em caixa rígida até 2/3 da capacidade?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  -- Limpeza de pele
  ('EST-PELE', 1, 'Extratores e agulhas esterilizados ou descartáveis?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-PELE', 2, 'Ácidos e séruns dentro da validade após abertura?', 'conforme', true, false, NULL, NULL, NULL, 'Confira a etiqueta de abertura do frasco.'),
  ('EST-PELE', 3, 'Data de abertura anotada nos produtos fracionados?', 'conforme', false, true, NULL, NULL, NULL, NULL),
  ('EST-PELE', 4, 'Profissional usou luvas e máscara durante toda a extração?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-PELE', 5, 'Vapor de ozônio e aparelhos higienizados antes do uso?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('EST-PELE', 6, 'Algodão e gaze com sangue descartados como resíduo infectante?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  -- Massagens
  ('EST-MASSA', 1, 'Maca higienizada com desinfetante entre atendimentos?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-MASSA', 2, 'Lençol e papel descartável trocados a cada cliente?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-MASSA', 3, 'Óleos e cremes fracionados em porções individuais?', 'conforme', false, false, NULL, NULL, NULL, 'Evite contato direto do pote com o cliente.'),
  ('EST-MASSA', 4, 'Higienização das mãos antes e depois do atendimento?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-MASSA', 5, 'Toalhas limpas armazenadas em armário fechado?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('EST-MASSA', 6, 'Ambiente ventilado e piso íntegro e lavável?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  -- Podologia
  ('EST-PODO', 1, 'Instrumentais (alicates, curetas, espátulas) esterilizados em autoclave?', 'conforme', true, true, NULL, NULL, NULL, 'Embalagem íntegra com indicador virado.'),
  ('EST-PODO', 2, 'Brocas higienizadas e esterilizadas entre clientes?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-PODO', 3, 'Profissional usou luvas, máscara, óculos e avental?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-PODO', 4, 'Cadeira e apoio de pés desinfetados após o atendimento?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-PODO', 5, 'Houve sangramento? Material descartado como infectante?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-PODO', 6, 'Lâminas e perfurocortantes na caixa rígida identificada?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-PODO', 7, 'Ficha do cliente atualizada com histórico e evolução?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  -- Cabine
  ('EST-CABINE', 1, 'Maca desinfetada com álcool 70% ou quaternário entre atendimentos?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 2, 'Lençol descartável trocado na presença do cliente?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 3, 'Equipamentos (ponteiras, cabeçotes, manoplas) sanitizados?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 4, 'Higienização das mãos realizada entre atendimentos?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 5, 'Tempo de contato do desinfetante respeitado', 'numero', false, false, 1, 10, 'min', 'Siga o tempo indicado pelo fabricante.'),
  ('EST-CABINE', 6, 'Lixeiras com tampa e acionamento por pedal, com saco correto?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 7, 'Pia com sabonete líquido, papel-toalha e álcool em gel abastecidos?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-CABINE', 8, 'Cabine ventilada, piso e paredes íntegros e laváveis?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  -- Autoclave estética
  ('EST-AUTOCLAVE', 1, 'Instrumentais limpos e secos antes do empacotamento?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-AUTOCLAVE', 2, 'Temperatura atingida no ciclo', 'temperatura', true, false, 121, 135, '°C', 'Ciclo padrão: 121 °C por 20 min ou 134 °C por 4 min.'),
  ('EST-AUTOCLAVE', 3, 'Tempo de exposição do ciclo', 'numero', true, false, 4, 40, 'min', NULL),
  ('EST-AUTOCLAVE', 4, 'Indicador químico (fita/integrador) virou corretamente?', 'conforme', true, true, NULL, NULL, NULL, 'Fotografe a fita integradora do pacote-teste.'),
  ('EST-AUTOCLAVE', 5, 'Teste biológico semanal realizado e registrado?', 'escolha', true, false, NULL, NULL, NULL, 'Registre o resultado do indicador biológico.'),
  ('EST-AUTOCLAVE', 6, 'Pacotes identificados com data, lote e validade da esterilização?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-AUTOCLAVE', 7, 'Autoclave com manutenção/calibração vigente?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  -- Resíduos
  ('EST-RESIDUOS', 1, 'Caixa rígida de perfurocortantes abaixo de 2/3 da capacidade?', 'conforme', true, true, NULL, NULL, NULL, 'Acima de 2/3 exige troca imediata.'),
  ('EST-RESIDUOS', 2, 'Nível de preenchimento da caixa rígida', 'numero', true, false, 0, 66, '%', NULL),
  ('EST-RESIDUOS', 3, 'Agulhas e lâminas de microblading descartadas sem reencape?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-RESIDUOS', 4, 'Algodão, gaze e luvas com sangue no saco branco leitoso (Grupo A)?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('EST-RESIDUOS', 5, 'Resíduos químicos (ácidos, reveladores) segregados no Grupo B?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-RESIDUOS', 6, 'Abrigo de resíduos limpo, identificado e de acesso restrito?', 'conforme', false, true, NULL, NULL, NULL, NULL),
  ('EST-RESIDUOS', 7, 'Comprovantes de coleta pela empresa licenciada arquivados?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('EST-RESIDUOS', 8, 'PGRSS da unidade disponível e atualizado?', 'conforme', true, false, NULL, NULL, NULL, NULL)
) AS v(codigo, ordem, pergunta, tipo, critico, foto, vmin, vmax, um, ajuda)
  ON v.codigo = t.codigo;

UPDATE public.checklist_template_itens
SET opcoes = '["Negativo (sem crescimento)","Positivo (reprovado)","Aguardando leitura"]'::jsonb
WHERE tipo = 'escolha'
  AND template_id IN (SELECT id FROM public.checklist_templates WHERE codigo = 'EST-AUTOCLAVE');