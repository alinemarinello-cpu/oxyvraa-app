WITH t AS (
  INSERT INTO public.checklist_templates (codigo, norma, titulo, descricao, categoria) VALUES
    ('INF-TROCADOR', 'RDC 222/2018 · Boas Práticas em Educação Infantil', 'Rotina do Trocador de Fraldas', 'Checklist a cada troca: desinfecção da superfície, descarte da fralda em lixeira de pedal e higienização das mãos da berçarista.', 'infantil'),
    ('INF-LACTARIO', 'RDC 216/2004', 'Lactário e Preparo de Alimentos', 'Temperatura do refrigerador de leite materno/fórmulas (2 °C a 4 °C), higienização de mamadeiras e validade de insumos.', 'infantil'),
    ('INF-BRINQUEDOS', 'ABNT NBR 14318', 'Higienização de Brinquedos e Mordedores', 'Imersão/limpeza com Clean by Peroxy ou Peroxy 4D, enxágue e secagem completa antes de retornar ao uso dos bebês.', 'infantil'),
    ('INF-SEGURANCA', 'ABNT NBR 15860 · Diretrizes MEC', 'Vistoria de Segurança e Infraestrutura', 'Protetores de tomada, travas de portas e janelas, integridade de berços e colchonetes impermeáveis laváveis.', 'infantil'),
    ('INF-TRIAGEM', 'Diretrizes de Saúde Infantil', 'Triagem de Entrada e Saúde', 'Verificação de temperatura dos bebês na recepção, sinais clínicos e controle do cartão de vacinação atualizado.', 'infantil')
  RETURNING id, codigo
)
INSERT INTO public.checklist_template_itens
  (template_id, ordem, pergunta, tipo, critico, foto_obrigatoria, valor_min, valor_max, unidade_medida, ajuda, dwell_segundos)
SELECT t.id, v.ordem, v.pergunta, v.tipo, v.critico, v.foto, v.vmin, v.vmax, v.um, v.ajuda, v.dwell
FROM t
JOIN (VALUES
  ('INF-TROCADOR', 1, 'Berçarista higienizou as mãos antes de iniciar a troca?', 'conforme', true, false, NULL::numeric, NULL::numeric, NULL::text, 'Água e sabonete antisséptico por 30 s.'::text, NULL::integer),
  ('INF-TROCADOR', 2, 'Papel descartável / forro individual colocado sobre o trocador?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TROCADOR', 3, 'Fralda descartada em lixeira de pedal com saco plástico e tampa?', 'conforme', true, false, NULL, NULL, NULL, 'Lixeira sem contato manual (RDC 222/2018).', NULL),
  ('INF-TROCADOR', 4, 'Superfície do trocador desinfetada com Clean by Peroxy / Peroxy 4D após a troca (tempo de contato cumprido)?', 'conforme', true, true, NULL, NULL, NULL, 'O app libera este item apenas após 3 min de tempo de ação do produto.', 180),
  ('INF-TROCADOR', 5, 'Enxágue/remoção do excesso e secagem do trocador antes do próximo bebê?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TROCADOR', 6, 'Berçarista higienizou novamente as mãos ao final da troca?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TROCADOR', 7, 'Pertences do bebê (pomada, lenços) de uso individual e identificados?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),

  ('INF-LACTARIO', 1, 'Temperatura do refrigerador de leite materno / fórmulas', 'temperatura', true, false, 2, 4, '°C', 'Faixa obrigatória de 2 °C a 4 °C. Acima disso o app abre alerta imediato para a coordenação.', NULL),
  ('INF-LACTARIO', 2, 'Frascos de leite materno identificados com nome do bebê, data e hora da coleta?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-LACTARIO', 3, 'Mamadeiras e bicos higienizados, esterilizados e guardados protegidos?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-LACTARIO', 4, 'Insumos abertos (fórmulas, cereais) com data de abertura e validade secundária?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-LACTARIO', 5, 'Temperatura da papa/alimento servido aos bebês', 'temperatura', true, false, 35, 45, '°C', 'Servir morno, nunca acima de 45 °C.', NULL),
  ('INF-LACTARIO', 6, 'Bancadas e utensílios do lactário higienizados antes do preparo?', 'conforme', true, false, NULL, NULL, NULL, NULL, 300),
  ('INF-LACTARIO', 7, 'Manipulador uniformizado, sem adornos, com touca e mãos higienizadas?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-LACTARIO', 8, 'Lactário com acesso restrito e livre de pragas?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),

  ('INF-BRINQUEDOS', 1, 'Brinquedos e mordedores retirados de circulação antes da higienização?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-BRINQUEDOS', 2, 'Remoção da sujidade visível com detergente e água corrente?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-BRINQUEDOS', 3, 'Imersão / aplicação de Clean by Peroxy ou Peroxy 4D com tempo de contato cumprido?', 'conforme', true, true, NULL, NULL, NULL, 'Trava de 5 min: só libere após o cronômetro do app zerar.', 300),
  ('INF-BRINQUEDOS', 4, 'Enxágue abundante em água potável após o desinfetante?', 'conforme', true, false, NULL, NULL, NULL, 'Obrigatório: itens levados à boca dos bebês.', NULL),
  ('INF-BRINQUEDOS', 5, 'Secagem completa antes de devolver ao uso?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-BRINQUEDOS', 6, 'Brinquedos de tecido/pelúcia lavados conforme rotina e sem umidade?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-BRINQUEDOS', 7, 'Itens danificados, com peças soltas ou pequenas retirados de uso?', 'conforme', true, false, NULL, NULL, NULL, 'Risco de engasgo — ABNT NBR 14318.', NULL),

  ('INF-SEGURANCA', 1, 'Todas as tomadas com protetor instalado e íntegro?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 2, 'Portas com travas de segurança e protetor anti-esmagamento de dedos?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 3, 'Janelas e sacadas com trava/limitador de abertura e telas de proteção?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 4, 'Berços íntegros, com grades na altura correta e sem peças soltas?', 'conforme', true, true, NULL, NULL, NULL, 'ABNT NBR 15860: espaçamento entre grades e altura mínima.', NULL),
  ('INF-SEGURANCA', 5, 'Colchonetes impermeáveis, laváveis e sem rasgos?', 'conforme', true, true, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 6, 'Móveis pesados fixados na parede e quinas protegidas?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 7, 'Produtos de limpeza e medicamentos trancados fora do alcance das crianças?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-SEGURANCA', 8, 'Extintores, saídas e rotas de fuga sinalizados e desobstruídos (AVCB vigente)?', 'conforme', true, false, NULL, NULL, NULL, 'Anexe o AVCB no repositório de documentos.', NULL),
  ('INF-SEGURANCA', 9, 'Piso antiderrapante, seco e sem objetos que causem queda?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),

  ('INF-TRIAGEM', 1, 'Temperatura corporal aferida na recepção do bebê/criança', 'temperatura', true, false, 35, 37.5, '°C', 'Acima de 37,5 °C: acionar a família e não acolher na turma.', NULL),
  ('INF-TRIAGEM', 2, 'Criança sem sinais de doença respiratória, diarreia, vômito ou lesões de pele?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TRIAGEM', 3, 'Cartão de vacinação conferido e atualizado conforme calendário do Ministério da Saúde?', 'conforme', true, true, NULL, NULL, NULL, 'Anexe a carteira no repositório de documentos.', NULL),
  ('INF-TRIAGEM', 4, 'Responsável informou medicamentos, alergias e restrições alimentares do dia?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TRIAGEM', 5, 'Nome do responsável que entregou a criança', 'texto', false, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TRIAGEM', 6, 'Mãos da criança higienizadas na entrada?', 'conforme', false, false, NULL, NULL, NULL, NULL, NULL),
  ('INF-TRIAGEM', 7, 'Colaboradores do turno sem sintomas e com vacinação em dia?', 'conforme', true, false, NULL, NULL, NULL, NULL, NULL)
) AS v(codigo, ordem, pergunta, tipo, critico, foto, vmin, vmax, um, ajuda, dwell)
  ON v.codigo = t.codigo;