
-- 1) Catálogo de requisitos (padrão global + personalizados por organização)
CREATE TABLE public.rdc_requisitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  categoria text NOT NULL,
  titulo text NOT NULL,
  artigo text,
  referencia text NOT NULL DEFAULT 'RDC Anvisa nº 1.002/2025',
  descricao text NOT NULL DEFAULT '',
  como_fazer text NOT NULL DEFAULT '',
  evidencia text NOT NULL DEFAULT '',
  condicao text NOT NULL DEFAULT 'sempre',
  prazo_dias integer NOT NULL DEFAULT 30,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_requisitos TO authenticated;
GRANT ALL ON public.rdc_requisitos TO service_role;
ALTER TABLE public.rdc_requisitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_req_leitura" ON public.rdc_requisitos FOR SELECT TO authenticated
  USING (organizacao_id IS NULL OR organizacao_id = public.minha_organizacao(auth.uid()));
CREATE POLICY "rdc_req_insere" ON public.rdc_requisitos FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "rdc_req_atualiza" ON public.rdc_requisitos FOR UPDATE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));
CREATE POLICY "rdc_req_apaga" ON public.rdc_requisitos FOR DELETE TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()) OR public.is_master(auth.uid()));

-- 2) Diagnóstico
CREATE TABLE public.rdc_diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_aplicaveis integer NOT NULL DEFAULT 0,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_diagnosticos TO authenticated;
GRANT ALL ON public.rdc_diagnosticos TO service_role;
ALTER TABLE public.rdc_diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_diag_org" ON public.rdc_diagnosticos FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));

-- 3) Plano de adequação
CREATE TABLE public.rdc_plano_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  requisito_id uuid REFERENCES public.rdc_requisitos(id) ON DELETE SET NULL,
  codigo text NOT NULL,
  categoria text NOT NULL,
  titulo text NOT NULL,
  artigo text,
  status text NOT NULL DEFAULT 'PENDENTE',
  responsavel text,
  prazo date,
  observacoes text,
  evidencia_url text,
  concluido_em timestamptz,
  historico jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizacao_id, unit_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_plano_itens TO authenticated;
GRANT ALL ON public.rdc_plano_itens TO service_role;
ALTER TABLE public.rdc_plano_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_plano_org" ON public.rdc_plano_itens FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));
CREATE INDEX idx_rdc_plano_org ON public.rdc_plano_itens (organizacao_id, unit_id, status);

-- 4) Central de evidências
CREATE TABLE public.rdc_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  arquivo_url text,
  vinculo_tipo text NOT NULL DEFAULT 'REQUISITO',
  vinculo_id uuid,
  requisito_codigo text,
  artigo text,
  responsavel text,
  status text NOT NULL DEFAULT 'VALIDA',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_evidencias TO authenticated;
GRANT ALL ON public.rdc_evidencias TO service_role;
ALTER TABLE public.rdc_evidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_evid_org" ON public.rdc_evidencias FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));
CREATE INDEX idx_rdc_evid_org ON public.rdc_evidencias (organizacao_id, requisito_codigo);

-- 5) Matriz de riscos
CREATE TABLE public.rdc_riscos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  risco text NOT NULL,
  setor text,
  probabilidade integer NOT NULL DEFAULT 1,
  impacto integer NOT NULL DEFAULT 1,
  criticidade integer GENERATED ALWAYS AS (probabilidade * impacto) STORED,
  responsavel text,
  acao_preventiva text,
  acao_corretiva text,
  prazo date,
  evidencia_url text,
  status text NOT NULL DEFAULT 'ABERTO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_riscos TO authenticated;
GRANT ALL ON public.rdc_riscos TO service_role;
ALTER TABLE public.rdc_riscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_riscos_org" ON public.rdc_riscos FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));

-- 6) Histórico do score
CREATE TABLE public.rdc_score_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  por_categoria jsonb NOT NULL DEFAULT '{}'::jsonb,
  referencia date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rdc_score_historico TO authenticated;
GRANT ALL ON public.rdc_score_historico TO service_role;
ALTER TABLE public.rdc_score_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdc_score_org" ON public.rdc_score_historico FOR ALL TO authenticated
  USING (organizacao_id = public.minha_organizacao(auth.uid()))
  WITH CHECK (organizacao_id = public.minha_organizacao(auth.uid()));
CREATE INDEX idx_rdc_score_org ON public.rdc_score_historico (organizacao_id, unit_id, referencia);

-- gatilhos de updated_at
CREATE TRIGGER trg_rdc_requisitos_upd BEFORE UPDATE ON public.rdc_requisitos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rdc_diag_upd BEFORE UPDATE ON public.rdc_diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rdc_plano_upd BEFORE UPDATE ON public.rdc_plano_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rdc_evid_upd BEFORE UPDATE ON public.rdc_evidencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rdc_riscos_upd BEFORE UPDATE ON public.rdc_riscos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Catálogo padrão (editável pelo administrador)
INSERT INTO public.rdc_requisitos (codigo, categoria, titulo, artigo, descricao, como_fazer, evidencia, condicao, prazo_dias, ordem) VALUES
('DOC-01','Documentação','Licença sanitária vigente do estabelecimento','Capítulo II','O serviço odontológico deve funcionar com licença sanitária vigente emitida pela vigilância local.','Solicite ou renove a licença na vigilância sanitária do município e mantenha a via digitalizada no sistema.','Cópia da licença sanitária com data de validade','sempre',60,1),
('DOC-02','Documentação','Responsável técnico formalmente designado','Capítulo II','Deve haver responsável técnico habilitado, com registro no conselho de classe, formalmente designado.','Cadastre nome, número e conselho do RT e anexe o comprovante de inscrição/anotação de responsabilidade.','Documento de designação e registro no conselho','sempre',30,2),
('DOC-03','Documentação','Cadastro e dados do estabelecimento atualizados','Capítulo II','Manter dados cadastrais, endereço e atividades do serviço atualizados.','Revise os dados da clínica no cadastro e nos órgãos competentes.','Comprovante de cadastro atualizado','sempre',30,3),
('DOC-04','Documentação','Manual de boas práticas / rotinas do serviço','Capítulo III','O serviço deve manter documentado o conjunto de rotinas e procedimentos operacionais.','Monte a pasta de POPs no módulo Central de Documentos e mantenha versões aprovadas.','Manual/POPs assinados pelo responsável técnico','sempre',45,4),
('BIO-01','Biossegurança','POP de limpeza e desinfecção de superfícies','Capítulo IV','Procedimento escrito para limpeza e desinfecção de superfícies e equipos entre atendimentos.','Publique o POP, treine a equipe e registre as limpezas pelo aplicativo de campo.','POP vigente + registros de limpeza com foto','sempre',30,10),
('BIO-02','Biossegurança','Uso e disponibilidade de EPI','Capítulo IV','Disponibilizar e exigir o uso de equipamentos de proteção individual adequados a cada atividade.','Mantenha estoque mínimo, registre a entrega dos EPIs e treine a equipe.','Ficha de entrega de EPI assinada','sempre',30,11),
('BIO-03','Biossegurança','Barreiras de proteção nos equipos','Capítulo IV','Utilizar barreiras descartáveis nas superfícies de difícil limpeza.','Padronize as barreiras por consultório e inclua a conferência no checklist diário.','Foto do equipo barreirado no checklist','sempre',20,12),
('SP-01','Segurança do Paciente','Plano de Segurança do Paciente documentado','Capítulo V','O serviço deve manter ações documentadas de segurança do paciente compatíveis com seu porte.','Registre o plano na Central de Documentos e vincule as ações preventivas da matriz de riscos.','Plano de Segurança do Paciente vigente','sempre',60,20),
('SP-02','Segurança do Paciente','Notificação de incidentes e eventos adversos','Capítulo V','Registrar e analisar incidentes e eventos adversos relacionados à assistência.','Use o módulo de incidentes para registrar, analisar a causa e definir ação corretiva.','Registros de incidentes com tratativa','sempre',30,21),
('SP-03','Segurança do Paciente','Identificação segura do procedimento','Capítulo V','Adotar conferência prévia ao procedimento para evitar erro de sítio ou de procedimento.','Implante a checagem antes de procedimentos cirúrgicos e registre no prontuário do serviço.','Checklist de segurança preenchido','cirurgia',45,22),
('SP-04','Segurança do Paciente','Núcleo/Responsável pela Segurança do Paciente','Capítulo V','Serviços com maior porte devem designar responsável ou núcleo de segurança do paciente.','Formalize a designação e registre as reuniões e ações.','Ato de designação e atas','porte_grande',60,23),
('EST-01','Processamento/Esterilização','Registro completo dos ciclos de autoclave','Capítulo VI','Cada ciclo deve ter registro de data/hora, lote, equipamento, parâmetros, carga e operador.','Registre todos os ciclos pelo módulo de esterilização com foto do indicador.','Registros de ciclo com foto do integrador','esterilizacao',15,30),
('EST-02','Processamento/Esterilização','Monitoramento biológico periódico','Capítulo VI','Realizar monitoramento biológico da autoclave conforme rotina definida.','Faça o teste biológico semanal e registre lote e resultado; positivo interdita o equipamento.','Registros de teste biológico com foto da ampola','esterilizacao',15,31),
('EST-03','Processamento/Esterilização','Fluxo unidirecional sujo → limpo','Capítulo VI','O processamento deve seguir fluxo que impeça o cruzamento entre material sujo e limpo.','Sinalize expurgo e área limpa e treine a equipe no fluxo.','Foto das áreas sinalizadas + POP','esterilizacao',45,32),
('EST-04','Processamento/Esterilização','Identificação e rastreabilidade dos pacotes','Capítulo VI','Pacotes devem ser identificados com lote, data de esterilização e responsável.','Padronize a etiqueta de lote e confira na guarda do material.','Foto das embalagens identificadas','esterilizacao',30,33),
('EST-05','Processamento/Esterilização','Qualificação e manutenção da autoclave','Capítulo VI','Manter manutenção preventiva e comprovação de desempenho do equipamento.','Contrate manutenção periódica e arquive laudos e certificados.','Laudo/certificado de manutenção','esterilizacao',90,34),
('HM-01','Higiene das Mãos','Insumos para higiene das mãos disponíveis','Capítulo IV','Lavatórios devem dispor de sabonete líquido, papel toalha e lixeira sem contato.','Inclua a conferência dos insumos no checklist diário de abertura.','Checklist diário com foto do lavatório','sempre',15,40),
('HM-02','Higiene das Mãos','POP e treinamento de higiene das mãos','Capítulo IV','Procedimento escrito e treinamento periódico sobre higienização das mãos.','Publique o POP e registre o treinamento no módulo de treinamentos.','POP + lista de presença do treinamento','sempre',30,41),
('RES-01','Resíduos/PGRSS','PGRSS elaborado e vigente','RDC 222/2018','O serviço deve manter Plano de Gerenciamento de Resíduos de Serviços de Saúde.','Elabore o PGRSS com profissional habilitado e arquive a versão vigente no sistema.','PGRSS assinado pelo responsável habilitado','sempre',90,50),
('RES-02','Resíduos/PGRSS','Segregação e identificação dos resíduos','RDC 222/2018','Resíduos devem ser segregados na origem e acondicionados em recipientes identificados.','Padronize sacos e caixas por grupo e treine a equipe.','Foto dos recipientes identificados','sempre',30,51),
('RES-03','Resíduos/PGRSS','Perfurocortantes com controle de troca','RDC 222/2018','Caixas de perfurocortantes devem ser trocadas antes do limite de preenchimento.','Registre a troca das caixas no sistema com data e responsável.','Registros de troca de caixa','sempre',20,52),
('RES-04','Resíduos/PGRSS','Comprovantes de coleta e destinação','RDC 222/2018','Manter comprovantes de coleta e destinação final dos resíduos.','Arquive os manifestos mensais na Central de Documentos.','Manifestos de coleta arquivados','sempre',30,53),
('EQP-01','Equipamentos','Inventário de equipamentos críticos','Capítulo VII','Manter relação dos equipamentos com identificação e situação de manutenção.','Cadastre os equipamentos e as datas de manutenção.','Planilha/registro de inventário','sempre',45,60),
('EQP-02','Equipamentos','Manutenção preventiva registrada','Capítulo VII','Executar e registrar manutenção preventiva conforme orientação do fabricante.','Programe as manutenções e anexe as ordens de serviço.','Ordens de serviço e laudos','sempre',90,61),
('EQP-03','Equipamentos','Compressor e reservatório com manutenção','Capítulo VII','Compressor de ar odontológico deve ter manutenção e drenagem registradas.','Registre a drenagem e a troca de filtros.','Registro de manutenção do compressor','sempre',60,62),
('EF-01','Estrutura Física','Ambientes compatíveis com as atividades','Capítulo III','A estrutura deve ser compatível com os procedimentos realizados, com revestimentos laváveis.','Verifique pisos, paredes, bancadas e sinalização dos ambientes.','Fotos dos ambientes + planta/croqui','sempre',90,70),
('EF-02','Estrutura Física','Lavatório exclusivo para higiene das mãos','Capítulo III','Deve haver lavatório para higiene das mãos nos ambientes assistenciais.','Instale ou sinalize o lavatório exclusivo em cada consultório.','Foto do lavatório em cada consultório','sempre',60,71),
('EF-03','Estrutura Física','Área para processamento de produtos para saúde','Capítulo VI','Ambiente específico para o processamento, separado da área de atendimento.','Adeque a sala/área de expurgo e área limpa.','Foto da área e croqui','esterilizacao',90,72),
('MED-01','Medicamentos','Guarda e controle de medicamentos','Capítulo VIII','Medicamentos devem ser guardados em local adequado, com controle de validade.','Organize o armário, registre validades e faça conferência mensal.','Planilha de controle de validade','medicamentos',30,80),
('MED-02','Medicamentos','Controle de medicamentos sujeitos a controle especial','Portaria 344/1998','Medicamentos controlados exigem guarda com chave e escrituração.','Mantenha o armário com chave e a escrituração em dia.','Livro/registro de controle','controlados',30,81),
('MED-03','Medicamentos','Kit e rotina de urgência e emergência','Capítulo VIII','O serviço deve dispor de material e rotina para atendimento de urgência.','Monte o kit, confira validades e treine a equipe na rotina.','Foto do kit + checklist de conferência','sempre',45,82),
('TRE-01','Treinamentos','Programa de capacitação da equipe','Capítulo IX','A equipe deve ser capacitada nas rotinas de biossegurança e nos POPs do serviço.','Cadastre os treinamentos, participantes e reciclagens no módulo Treinamentos.','Lista de presença e certificados','sempre',60,90),
('TRE-02','Treinamentos','Imunização da equipe comprovada','Capítulo IX','Comprovar situação vacinal recomendada aos profissionais de saúde.','Solicite e arquive os comprovantes de vacinação da equipe.','Comprovantes de vacinação','sempre',60,91),
('GR-01','Gerenciamento de Riscos','Matriz de riscos do serviço','Capítulo V','Identificar, avaliar e tratar os riscos sanitários e assistenciais do serviço.','Preencha a matriz de riscos com probabilidade, impacto e ações.','Matriz de riscos preenchida e revisada','sempre',60,100),
('GR-02','Gerenciamento de Riscos','Ações corretivas com prazo e responsável','Capítulo V','Não conformidades devem gerar ação corretiva com responsável e prazo.','Use o módulo de não conformidades para registrar e encerrar as ocorrências.','Registro da ação corretiva concluída','sempre',30,101),
('PCI-01','Prevenção e Controle de Infecções','Rotinas escritas de prevenção de infecções','Capítulo IV','Manter rotinas documentadas de prevenção e controle de infecções.','Publique as rotinas na Central de Documentos e treine a equipe.','Rotinas vigentes + treinamento','sempre',45,110),
('PCI-02','Prevenção e Controle de Infecções','Controle da qualidade da água do equipo','Capítulo IV','Adotar medidas de controle da água utilizada nos equipos.','Defina a rotina de flush e desinfecção das linhas de água.','POP e registros da rotina','sempre',60,111),
('PCI-03','Prevenção e Controle de Infecções','Rotina para acidentes com material biológico','Capítulo IV','Deve haver conduta definida para exposição a material biológico.','Publique o fluxo de atendimento pós-exposição e treine a equipe.','POP de acidente biológico + treinamento','sempre',45,112),
('RX-01','Equipamentos','Levantamento radiométrico e proteção radiológica','Normas de radiologia','Serviços com radiologia devem manter documentação de proteção radiológica.','Contrate o levantamento radiométrico e arquive o laudo e o programa de proteção.','Laudo radiométrico vigente','radiologia',90,120),
('RX-02','Documentação','Responsável e supervisor de proteção radiológica','Normas de radiologia','Designar responsável pela proteção radiológica quando houver equipamentos de raios X.','Formalize a designação e arquive o documento.','Documento de designação','radiologia',60,121),
('SED-01','Segurança do Paciente','Protocolo de sedação e monitoramento','Capítulo V','Procedimentos com sedação exigem protocolo, monitoramento e material de suporte.','Documente o protocolo, o monitoramento e o kit de emergência.','Protocolo + registro de monitoramento','sedacao',60,130),
('PRO-01','Processamento/Esterilização','Controle de peças enviadas ao laboratório de prótese','Capítulo VI','Peças e moldagens devem ser desinfetadas antes do envio e no retorno.','Defina o POP de desinfecção de moldagens e registre os envios.','POP + registro de envio/retorno','protese',45,140);
