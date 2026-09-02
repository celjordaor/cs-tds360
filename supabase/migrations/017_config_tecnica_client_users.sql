-- ================================================================
-- Migration 017 — Configurações Técnicas + Usuários do Cliente
-- ================================================================

-- 1. Adiciona config_tecnica JSONB à tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS config_tecnica JSONB DEFAULT '{}';

-- 2. Tabela de usuários do cliente (diferentes de profiles — são os usuários da emissora)
CREATE TABLE IF NOT EXISTS client_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL DEFAULT '',
  email      TEXT DEFAULT '',
  perfil     TEXT DEFAULT '',
  login      TEXT DEFAULT '',
  sistemas   TEXT[] DEFAULT '{}',
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_users_project_id_idx ON client_users(project_id);
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_users_authenticated_all" ON client_users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Seed de módulos Adsim
INSERT INTO config_options (category, value, label, ordem, ativo) VALUES
  ('modulo_adsim', 'crm_comercial',               'CRM Comercial',                  1,  true),
  ('modulo_adsim', 'programacao_grade',            'Programação / Grade',            2,  true),
  ('modulo_adsim', 'faturamento',                  'Faturamento',                    3,  true),
  ('modulo_adsim', 'relatorios_gerenciais',        'Relatórios Gerenciais',          4,  true),
  ('modulo_adsim', 'gestao_agencias',              'Gestão de Agências',             5,  true),
  ('modulo_adsim', 'contratos',                    'Contratos',                      6,  true),
  ('modulo_adsim', 'audiencias',                   'Audiências',                     7,  true),
  ('modulo_adsim', 'apresentadores_locutores',     'Apresentadores / Locutores',     8,  true),
  ('modulo_adsim', 'integracao_adsim_midiaplus',   'Integração Adsim ↔ Mídia+',    9,  true),
  ('modulo_adsim', 'integracao_traffic',           'Integração Traffic',             10, true),
  ('modulo_adsim', 'integracao_erp_contabilidade', 'Integração ERP/Contabilidade',  11, true),
  ('modulo_adsim', 'portal_anunciante',            'Portal do Anunciante',           12, true),
  ('modulo_adsim', 'dashboard_gerencial',          'Dashboard Gerencial',            13, true),
  ('modulo_adsim', 'operacao_comercial_opec',      'Operação Comercial (OPEC)',      14, true),
  ('modulo_adsim', 'financeiro',                   'Financeiro',                     15, true),
  ('modulo_adsim', 'gestao_produtos',              'Gestão de Produtos',             16, true),
  ('modulo_adsim', 'tabelas_precos',               'Tabelas de Preços',              17, true),
  ('modulo_adsim', 'workflow_aprovacao',           'Workflow de Aprovação',          18, true),
  ('modulo_adsim', 'adchecking',                   'Adchecking',                     19, true),
  ('modulo_adsim', 'roteiro_comercial',            'Roteiro Comercial',              20, true),
  ('modulo_adsim', 'roteiro_merchandising',        'Roteiro de Merchandising',       21, true),
  ('modulo_adsim', 'portal_cliente',               'Portal do Cliente',              22, true),
  ('modulo_adsim', 'modulo_materiais',             'Módulo de Materiais',            23, true),
  ('modulo_adsim', 'integracao_fiscal_erp',        'Integração Fiscal (ERP)',        24, true),
  ('modulo_adsim', 'backoffice',                   'Backoffice',                     25, true),
  ('modulo_adsim', 'relatorios_dashboards',        'Relatórios e Dashboards',        26, true)
ON CONFLICT (category, value) DO NOTHING;

-- 4. Seed de módulos Mídia+
INSERT INTO config_options (category, value, label, ordem, ativo) VALUES
  ('modulo_midiaplus', 'planejamento_midia',         'Planejamento de Mídia',          1,  true),
  ('modulo_midiaplus', 'compra_midia',               'Compra de Mídia',                2,  true),
  ('modulo_midiaplus', 'negociacao',                 'Negociação',                     3,  true),
  ('modulo_midiaplus', 'autorizacao_veiculacao',     'Autorização de Veiculação (PI)', 4,  true),
  ('modulo_midiaplus', 'adchecking',                 'Adchecking',                     5,  true),
  ('modulo_midiaplus', 'faturamento_nfe',            'Faturamento / NF-e',             6,  true),
  ('modulo_midiaplus', 'financeiro_contas_pagar',    'Financeiro / Contas a Pagar',    7,  true),
  ('modulo_midiaplus', 'relatorios',                 'Relatórios',                     8,  true),
  ('modulo_midiaplus', 'dashboard',                  'Dashboard',                      9,  true),
  ('modulo_midiaplus', 'portal_agencias',            'Portal de Agências',             10, true),
  ('modulo_midiaplus', 'portal_veiculos',            'Portal de Veículos',             11, true),
  ('modulo_midiaplus', 'integracao_adsim',           'Integração Mídia+ ↔ Adsim',    12, true),
  ('modulo_midiaplus', 'integracao_erp',             'Integração ERP',                 13, true),
  ('modulo_midiaplus', 'gestao_contratos',           'Gestão de Contratos',            14, true),
  ('modulo_midiaplus', 'verbas_budget',              'Verbas / Budget',                15, true)
ON CONFLICT (category, value) DO NOTHING;

NOTIFY pgrst, 'reload schema';
