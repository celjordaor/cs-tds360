-- ============================================================
-- 004_checklist_templates.sql
-- Templates de checklist de go-live padrão
-- ============================================================

INSERT INTO checklist_templates (sistema, item, ordem) VALUES
  -- Geral
  ('geral', 'Contrato assinado e arquivado', 10),
  ('geral', 'Kickoff realizado com o cliente', 20),
  ('geral', 'Sponsor identificado e confirmado', 30),
  ('geral', 'Equipe técnica do cliente mapeada', 40),
  ('geral', 'Cronograma de implantação validado com o cliente', 50),

  -- Adsim
  ('adsim', 'Ambiente Adsim criado e configurado', 10),
  ('adsim', 'Emissoras, veículos e praças cadastrados', 20),
  ('adsim', 'Tipos de negociação configurados', 30),
  ('adsim', 'Naturezas configuradas', 40),
  ('adsim', 'Condições de pagamento configuradas', 50),
  ('adsim', 'Funil de vendas (pipelines) configurado', 60),
  ('adsim', 'Base de dados migrada / validada', 70),
  ('adsim', 'Usuários do cliente cadastrados no Adsim', 80),
  ('adsim', 'Treinamento de usuários concluído', 90),
  ('adsim', 'Validação interna realizada', 100),
  ('adsim', 'Go-live Adsim aprovado pelo cliente', 110),

  -- Mídia+
  ('midiaplus', 'Ambiente Mídia+ criado e configurado', 10),
  ('midiaplus', 'Integração com Adsim configurada (se aplicável)', 20),
  ('midiaplus', 'Adchecking configurado (se aplicável)', 30),
  ('midiaplus', 'Usuários do cliente cadastrados no Mídia+', 40),
  ('midiaplus', 'Treinamento de usuários Mídia+ concluído', 50),
  ('midiaplus', 'Validação interna Mídia+ realizada', 60),
  ('midiaplus', 'Go-live Mídia+ aprovado pelo cliente', 70);
