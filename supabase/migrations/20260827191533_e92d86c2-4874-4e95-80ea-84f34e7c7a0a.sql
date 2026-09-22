-- 1. Trava sanitária: tempo mínimo de recirculação/contato por item de checklist
ALTER TABLE public.checklist_template_itens ADD COLUMN IF NOT EXISTS dwell_segundos integer;
ALTER TABLE public.checklist_itens ADD COLUMN IF NOT EXISTS dwell_segundos integer;

-- 2. Suítes / unidades habitacionais de alta rotatividade
CREATE TABLE IF NOT EXISTS public.suites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  identificacao text NOT NULL DEFAULT '',
  bloco text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'standard',
  tem_hidro boolean NOT NULL DEFAULT false,
  tem_sauna boolean NOT NULL DEFAULT false,
  qr_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'disponivel',
  status_atualizado_em timestamptz NOT NULL DEFAULT now(),
  ultima_higienizacao timestamptz,
  ultima_sanitizacao_hidro timestamptz,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.suites TO authenticated;
GRANT ALL ON public.suites TO service_role;
ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suites_select" ON public.suites
  FOR SELECT TO authenticated USING (public.unit_da_minha_org(unit_id));
CREATE POLICY "suites_insert" ON public.suites
  FOR INSERT TO authenticated WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "suites_update" ON public.suites
  FOR UPDATE TO authenticated USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE TRIGGER suites_updated_at BEFORE UPDATE ON public.suites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS suites_qr_idx ON public.suites(qr_token);
CREATE INDEX IF NOT EXISTS suites_unit_idx ON public.suites(unit_id);

-- 3. Histórico imutável de giros de suíte (entrada/saída da camareira)
CREATE TABLE IF NOT EXISTS public.suite_higienizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  suite_id uuid NOT NULL REFERENCES public.suites(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  execucao_id uuid REFERENCES public.execucoes(id) ON DELETE SET NULL,
  colaboradora_nome text NOT NULL DEFAULT '',
  pin_colaboradora text,
  qr_validado boolean NOT NULL DEFAULT false,
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  concluida_em timestamptz,
  hidro_sanitizada boolean NOT NULL DEFAULT false,
  hidro_dwell_segundos integer,
  cloro_residual numeric,
  lat double precision,
  lng double precision,
  status_final text NOT NULL DEFAULT 'em_higienizacao',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.suite_higienizacoes TO authenticated;
GRANT ALL ON public.suite_higienizacoes TO service_role;
ALTER TABLE public.suite_higienizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suite_hig_select" ON public.suite_higienizacoes
  FOR SELECT TO authenticated USING (public.unit_da_minha_org(unit_id));
CREATE POLICY "suite_hig_insert" ON public.suite_higienizacoes
  FOR INSERT TO authenticated WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "suite_hig_update" ON public.suite_higienizacoes
  FOR UPDATE TO authenticated USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE INDEX IF NOT EXISTS suite_hig_idx ON public.suite_higienizacoes(suite_id, iniciada_em DESC);

-- 4. Templates nativos para motéis e alta rotatividade
WITH t AS (
  INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
    ('MOT-GIRO', 'Boas Práticas · Vigilância Sanitária', 'Giro de Suíte — Liberação pós-checkout', 'Troca de enxoval, desinfecção de superfícies de alto contato, sanitização do banheiro e reposição de amenites.', 'motel'),
    ('MOT-HIDRO', 'Portaria MS 888/2021', 'Hidromassagens, Jacuzzis e Saunas', 'Sanitização de tubulações e jatos com desinfetante, tempo de recirculação e cloro residual antes do próximo uso.', 'motel'),
    ('MOT-COZ24', 'RDC 216/2004', 'Cozinha 24h e Room Service', 'Manipulação contínua de alimentos, temperatura das geladeiras, validade de insumos abertos e higienização de bandejas.', 'motel'),
    ('MOT-LAV', 'Barreira Sanitária de Lavanderia', 'Lavanderia e Processamento de Enxoval', 'Lavagem térmica/química, dosagem de bactericidas e separação de rouparia limpa x suja.', 'motel'),
    ('MOT-PMOC', 'Lei 13.589/2018', 'PMOC e Manutenção Preventiva', 'Filtros de ar-condicionado das suítes, saunas, aquecedores centrais e caldeiras.', 'motel')
  RETURNING id, codigo
)
INSERT INTO public.checklist_template_itens
  (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, ajuda, dwell_segundos)
SELECT t.id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, v.ajuda, v.dwell
FROM t
JOIN (VALUES
  ('MOT-GIRO', 1, 'Camareira paramentada (luvas, uniforme limpo) e kit de cores correto?', 'conforme', true, false, NULL::numeric, NULL::numeric, NULL::text, 'Pano do banheiro nunca circula em outras superfícies.'::text, NULL::integer),
  ('MOT-GIRO', 2, 'Enxoval de cama e banho integralmente trocado por peças limpas?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-GIRO', 3, 'Superfícies de alto contato desinfetadas (maçanetas, interruptores, controles, telefone, cabeceira)?', 'conforme', true, true, NULL, NULL, NULL, 'Aplique o desinfetante e respeite o tempo de contato do rótulo.', 120),
  ('MOT-GIRO', 4, 'Banheiro sanitizado (vaso, box, pia, espelho e ralos) com desinfetante?', 'conforme', true, true, NULL, NULL, NULL, NULL, 120),
  ('MOT-GIRO', 5, 'Lixeiras esvaziadas e resíduos descartados corretamente?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-GIRO', 6, 'Amenities e descartáveis repostos e lacrados?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-GIRO', 7, 'Frigobar higienizado e itens dentro da validade?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-GIRO', 8, 'Hidro/banheira da suíte sanitizada nesta rotina (quando houver)?', 'conforme', true, true, NULL, NULL, NULL, 'Se a suíte tiver hidro, use também o checklist específico MOT-HIDRO.', NULL),
  ('MOT-GIRO', 9, 'Ar-condicionado funcionando, sem odor e com filtro limpo?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-GIRO', 10, 'Suíte liberada como HIGIENIZADA E PRÓPRIA PARA USO?', 'conforme', true, true, NULL, NULL, NULL, 'A foto final da suíte arrumada libera a locação.', NULL),

  ('MOT-HIDRO', 1, 'Hidro esvaziada completamente após o último uso?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-HIDRO', 2, 'Superfície interna, bordas e apoios esfregados com detergente?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-HIDRO', 3, 'Desinfetante clorado dosado conforme ficha técnica do produto?', 'conforme', true, false, NULL, NULL, NULL, 'Registre a dosagem usada na observação.', NULL),
  ('MOT-HIDRO', 4, 'Recirculação do desinfetante nas tubulações e jatos concluída (trava de tempo)?', 'conforme', true, true, NULL, NULL, NULL, 'O app só libera este item após o tempo mínimo de recirculação.', 600),
  ('MOT-HIDRO', 5, 'Enxágue final com água limpa e novo esvaziamento?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-HIDRO', 6, 'Cloro residual livre na água da hidro antes da liberação', 'numero', true, false, 0.2, 5, 'mg/L', 'Portaria MS 888/2021: 0,2 a 5,0 mg/L.', NULL),
  ('MOT-HIDRO', 7, 'pH da água da hidro', 'numero', true, false, 7.2, 7.8, 'pH', NULL, NULL),
  ('MOT-HIDRO', 8, 'Filtros e skimmer da hidro limpos?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-HIDRO', 9, 'Sauna higienizada (bancos, piso e ralo) e ventilada?', 'conforme', false, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-HIDRO', 10, 'Hidro liberada para o próximo uso com registro fotográfico?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),

  ('MOT-COZ24', 1, 'Temperatura da geladeira de estoque', 'temperatura', true, false, 0, 5, '°C', 'Refrigerados entre 0 °C e 5 °C.', NULL),
  ('MOT-COZ24', 2, 'Temperatura do freezer', 'temperatura', true, false, -25, -12, '°C', NULL, NULL),
  ('MOT-COZ24', 3, 'Temperatura de alimentos quentes prontos para entrega', 'temperatura', true, false, 60, 95, '°C', 'Room service deve sair acima de 60 °C.', NULL),
  ('MOT-COZ24', 4, 'Insumos abertos identificados com data de abertura e validade secundária?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-COZ24', 5, 'Manipuladores do turno da madrugada uniformizados, sem adornos e com touca?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-COZ24', 6, 'Higienização das mãos registrada na troca de turno?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-COZ24', 7, 'Bandejas, cloches e utensílios de entrega higienizados e protegidos?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-COZ24', 8, 'Elevador/carro de room service higienizado após cada entrega?', 'conforme', true, false, NULL, NULL, NULL, NULL, 60),
  ('MOT-COZ24', 9, 'Área livre de pragas, com ralos sifonados e lixeiras tampadas?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-COZ24', 10, 'Amostras-testemunha coletadas e mantidas por 72 h?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),

  ('MOT-LAV', 1, 'Fluxo unidirecional respeitado (enxoval sujo não cruza com limpo)?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 2, 'Enxoval sujo recolhido em sacos identificados ou solúveis?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 3, 'Peças com fluidos corporais segregadas como infectantes?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 4, 'Temperatura da lavagem térmica', 'temperatura', true, false, 60, 90, '°C', 'Lavagem térmica acima de 60 °C.', NULL),
  ('MOT-LAV', 5, 'Dosagem de alvejante/bactericida conforme ficha técnica?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 6, 'Tempo de contato do bactericida respeitado no ciclo?', 'conforme', true, false, NULL, NULL, NULL, NULL, 300),
  ('MOT-LAV', 7, 'Carros de transporte higienizados após cada uso?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 8, 'Rouparia limpa armazenada em prateleiras fechadas e afastadas do piso?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-LAV', 9, 'Colaborador da área suja com EPI completo?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),

  ('MOT-PMOC', 1, 'Filtros dos splits das suítes higienizados na frequência do PMOC?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 2, 'Bandejas de condensado limpas e drenando corretamente?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 3, 'Serpentinas e evaporadoras sem sujidade ou mofo?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 4, 'Resistências e bancos das saunas revisados?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 5, 'Aquecedores centrais e boilers inspecionados?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 6, 'Temperatura da água quente distribuída às suítes', 'temperatura', false, false, 40, 60, '°C', NULL, NULL),
  ('MOT-PMOC', 7, 'Caldeira com inspeção/NR-13 vigente e registro no livro?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('MOT-PMOC', 8, 'PMOC assinado por responsável técnico habilitado e disponível?', 'conforme', true, false, NULL, NULL, NULL, 'Anexe o PMOC no repositório de documentos.', NULL),
  ('MOT-PMOC', 9, 'Registro da manutenção lançado no histórico do equipamento?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL)
) AS v(codigo, ordem, pergunta, tipo, critico, foto, vmin, vmax, um, ajuda, dwell)
  ON v.codigo = t.codigo;