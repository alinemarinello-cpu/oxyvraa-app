-- 1. Equipamentos de climatização (PMOC - Lei 13.589/2018)
CREATE TABLE IF NOT EXISTS public.equipamentos_climatizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  identificacao text NOT NULL DEFAULT '',
  ambiente text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'split',
  marca text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  numero_serie text,
  capacidade_btus numeric,
  instalado_em date,
  frequencia_limpeza_dias integer NOT NULL DEFAULT 90,
  ultima_limpeza date,
  responsavel_tecnico text NOT NULL DEFAULT '',
  registro_crea text,
  laudo_url text,
  laudo_nome text,
  laudo_emitido_em date,
  laudo_expira_em date,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.equipamentos_climatizacao TO authenticated;
GRANT ALL ON public.equipamentos_climatizacao TO service_role;

ALTER TABLE public.equipamentos_climatizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clima_select" ON public.equipamentos_climatizacao
  FOR SELECT TO authenticated USING (public.unit_da_minha_org(unit_id));
CREATE POLICY "clima_insert" ON public.equipamentos_climatizacao
  FOR INSERT TO authenticated WITH CHECK (public.unit_da_minha_org(unit_id));
CREATE POLICY "clima_update" ON public.equipamentos_climatizacao
  FOR UPDATE TO authenticated USING (public.unit_da_minha_org(unit_id))
  WITH CHECK (public.unit_da_minha_org(unit_id));

CREATE TRIGGER clima_updated_at BEFORE UPDATE ON public.equipamentos_climatizacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS clima_unit_idx ON public.equipamentos_climatizacao(unit_id);

-- 2. Manutenções PMOC
CREATE TABLE IF NOT EXISTS public.manutencoes_climatizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos_climatizacao(id) ON DELETE CASCADE,
  tipo_servico text NOT NULL DEFAULT 'limpeza_filtro',
  executado_em date NOT NULL DEFAULT CURRENT_DATE,
  proxima_em date,
  executante text NOT NULL DEFAULT '',
  registro_executante text,
  foto text,
  laudo_url text,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.manutencoes_climatizacao TO authenticated;
GRANT ALL ON public.manutencoes_climatizacao TO service_role;

ALTER TABLE public.manutencoes_climatizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manut_select" ON public.manutencoes_climatizacao
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.equipamentos_climatizacao e
    WHERE e.id = equipamento_id AND public.unit_da_minha_org(e.unit_id)));
CREATE POLICY "manut_insert" ON public.manutencoes_climatizacao
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.equipamentos_climatizacao e
    WHERE e.id = equipamento_id AND public.unit_da_minha_org(e.unit_id)));
CREATE POLICY "manut_update" ON public.manutencoes_climatizacao
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.equipamentos_climatizacao e
    WHERE e.id = equipamento_id AND public.unit_da_minha_org(e.unit_id)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.equipamentos_climatizacao e
    WHERE e.id = equipamento_id AND public.unit_da_minha_org(e.unit_id)));

CREATE INDEX IF NOT EXISTS manut_equip_idx ON public.manutencoes_climatizacao(equipamento_id, executado_em DESC);

-- 3. Templates nativos de Hotelaria e Meios de Hospedagem
WITH t AS (
  INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
    ('HOT-ABE', 'RDC 216/2004', 'Cozinha, Restaurante e Buffet de Café da Manhã', 'Controle de temperatura das pistas quente e fria, recebimento de mercadorias, higienização de utensílios e manipuladores.', 'hotelaria'),
    ('HOT-GOV', 'Boas Práticas de Governança', 'Governança — Higienização de Unidades Habitacionais (UHs)', 'Desinfecção de banheiro, superfícies de alto contato, troca de enxoval e conferência do quarto pós-checkout.', 'hotelaria'),
    ('HOT-AGUA', 'Portaria MS 888/2021', 'Potabilidade da Água e Reservatórios', 'Medição diária de cloro residual livre e pH nos reservatórios, cozinha e áreas comuns.', 'hotelaria'),
    ('HOT-PISC', 'Boas Práticas · Vigilância Sanitária', 'Gestão de Piscinas e Áreas de Lazer', 'Parâmetros químicos da água da piscina e higienização de deck, espreguiçadeiras e sanitários de apoio.', 'hotelaria'),
    ('HOT-LAV', 'Barreira Sanitária de Lavanderia', 'Lavanderia e Rouparia — Barreira Sanitária', 'Segregação entre enxoval sujo e limpo, sacos identificados/solúveis e higienização dos carros de transporte.', 'hotelaria')
  RETURNING id, codigo
)
INSERT INTO public.checklist_template_itens
  (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, ajuda)
SELECT t.id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, v.ajuda
FROM t
JOIN (VALUES
  -- A&B / café da manhã
  ('HOT-ABE', 1, 'Temperatura da pista quente do buffet', 'temperatura', true, false, 60::numeric, 95::numeric, '°C'::text, 'Alimentos quentes devem permanecer acima de 60 °C.'),
  ('HOT-ABE', 2, 'Temperatura da pista fria / geladeira de frios', 'temperatura', true, false, 0, 10, '°C', 'Alimentos frios devem permanecer abaixo de 10 °C.'),
  ('HOT-ABE', 3, 'Temperatura do freezer de estocagem', 'temperatura', true, false, -25, -12, '°C', NULL),
  ('HOT-ABE', 4, 'Recebimento de mercadorias conferido (temperatura, validade e embalagem)?', 'conforme', true, true, NULL, NULL, NULL, 'Fotografe a nota e o termômetro no ato do recebimento.'),
  ('HOT-ABE', 5, 'Alimentos identificados com data de manipulação e validade?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-ABE', 6, 'Utensílios e equipamentos higienizados conforme POP?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-ABE', 7, 'Manipuladores uniformizados, sem adornos e com touca?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-ABE', 8, 'Protetor salivar (sneeze guard) instalado e limpo sobre o buffet?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-ABE', 9, 'Amostras-testemunha coletadas e armazenadas por 72 h?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-ABE', 10, 'Lixeiras com tampa e pedal e área livre de pragas?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  -- Governança
  ('HOT-GOV', 1, 'Camareira paramentada com luvas e uniforme limpo?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 2, 'Banheiro higienizado (vaso, box, pia e espelho) com desinfetante?', 'conforme', true, true, NULL, NULL, NULL, 'Foto do banheiro após a higienização.'),
  ('HOT-GOV', 3, 'Superfícies de alto contato desinfetadas (maçanetas, interruptores, controle remoto, telefone)?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 4, 'Enxoval de cama e banho trocado por peças limpas?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 5, 'Frigobar higienizado e itens dentro da validade?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 6, 'Panos e mops separados por cor/área (kit correto)?', 'conforme', true, false, NULL, NULL, NULL, 'Nunca use o pano do banheiro em outras superfícies.'),
  ('HOT-GOV', 7, 'Amenities repostos e lacrados?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 8, 'Ar-condicionado do quarto com filtro limpo e sem odor?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 9, 'Conferência pós-checkout concluída (objetos esquecidos, avarias)?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-GOV', 10, 'Quarto liberado como HIGIENIZADO E PRÓPRIO PARA USO?', 'conforme', true, true, NULL, NULL, NULL, 'Foto final do quarto arrumado libera a UH.'),
  -- Água
  ('HOT-AGUA', 1, 'Cloro residual livre no reservatório principal', 'numero', true, false, 0.2, 5, 'mg/L', 'Portaria MS 888/2021: entre 0,2 e 5,0 mg/L.'),
  ('HOT-AGUA', 2, 'pH da água do reservatório principal', 'numero', true, false, 6, 9.5, 'pH', 'Faixa recomendada: 6,0 a 9,5.'),
  ('HOT-AGUA', 3, 'Cloro residual livre no ponto da cozinha', 'numero', true, false, 0.2, 5, 'mg/L', NULL),
  ('HOT-AGUA', 4, 'Cloro residual livre em ponto de área comum/apartamento', 'numero', true, false, 0.2, 5, 'mg/L', NULL),
  ('HOT-AGUA', 5, 'Turbidez aparente da água (limpa, sem cor ou odor)?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-AGUA', 6, 'Reservatórios tampados, vedados e sem infiltração?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-AGUA', 7, 'Laudo de limpeza semestral das caixas d''água dentro da validade?', 'conforme', true, false, NULL, NULL, NULL, 'Anexe o laudo no repositório de documentos.'),
  ('HOT-AGUA', 8, 'Análise laboratorial (microbiológica e físico-química) vigente?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  -- Piscina
  ('HOT-PISC', 1, 'Cloro residual livre da piscina', 'numero', true, false, 1, 3, 'mg/L', 'Faixa usual de operação: 1,0 a 3,0 mg/L.'),
  ('HOT-PISC', 2, 'pH da água da piscina', 'numero', true, false, 7.2, 7.8, 'pH', NULL),
  ('HOT-PISC', 3, 'Alcalinidade total', 'numero', false, false, 80, 120, 'mg/L', NULL),
  ('HOT-PISC', 4, 'Água transparente, sem algas e com fundo visível?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-PISC', 5, 'Filtro retrolavado e bomba em funcionamento?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-PISC', 6, 'Deck, escadas e bordas higienizados e antiderrapantes?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-PISC', 7, 'Espreguiçadeiras e mesas desinfetadas?', 'conforme', false, true, NULL, NULL, NULL, NULL),
  ('HOT-PISC', 8, 'Sinalização de profundidade e regras de uso visíveis?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-PISC', 9, 'Produtos químicos armazenados em local ventilado e trancado?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  -- Lavanderia
  ('HOT-LAV', 1, 'Fluxo unidirecional respeitado (área suja não cruza com área limpa)?', 'conforme', true, true, NULL, NULL, NULL, 'Barreira sanitária entre rouparia suja e limpa.'),
  ('HOT-LAV', 2, 'Enxoval sujo transportado em sacos identificados ou solúveis?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 3, 'Roupas com sangue/fluidos segregadas como infectantes?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 4, 'Temperatura de lavagem térmica registrada', 'temperatura', false, false, 60, 90, '°C', 'Lavagem térmica recomendada acima de 60 °C.'),
  ('HOT-LAV', 5, 'Carros de transporte de enxoval higienizados após cada uso?', 'conforme', true, true, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 6, 'Enxoval limpo armazenado em prateleiras fechadas e afastadas do piso?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 7, 'Colaborador de área suja com EPI (luvas, avental e máscara)?', 'conforme', true, false, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 8, 'Dosagem de produtos químicos conforme ficha técnica?', 'conforme', false, false, NULL, NULL, NULL, NULL),
  ('HOT-LAV', 9, 'Área livre de pragas, com ralos sifonados e telas nas janelas?', 'conforme', false, false, NULL, NULL, NULL, NULL)
) AS v(codigo, ordem, pergunta, tipo, critico, foto, vmin, vmax, um, ajuda)
  ON v.codigo = t.codigo;