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

-- 3. Seed de módulos Adsim (gerenciável via Configurações)
INSERT INTO config_options (category, value, label, ordem, ativo) VALUES
  ('modulo_adsim', 'crm_comercial',              'CRM Comercial',                  1,  true),
  ('modulo_adsim', 'programacao_grade',           'Programação / Grade',            2,  true),
  ('modulo_adsim', 'faturamento',                 'Faturamento',                    3,  true),
  ('modulo_adsim', 'relatorios_gerenciais',       'Relatórios Gerenciais',          4,  true),
  ('modulo_adsim', 'gestao_agencias',             'Gestão de Agências',             5,  true),
  ('modulo_adsim', 'contratos',                   'Contratos',                      6,  true),
  ('modulo_adsim', 'audiencias',                  'Audiências',                     7,  true),
  ('modulo_adsim', 'apresentadores_locutores',    'Apresentadores / Locutores',     8,  true),
  ('modulo_adsim', 'integracao_adsim_midiaplus',  'Integração Adsim ↔ Mídia+',     9,  true),
  ('modulo_adsim', 'integracao_traffic',          'Integração Traffic',             10, true),
  ('modulo_adsim', 'integracao_erp_contabilidade','Integração ERP/Contabilidade',  11, true),
  ('modulo_adsim', 'portal_anunciante',           'Portal do Anunciante',           12, true),
  ('modulo_adsim', 'dashboard_gerencial',         'Dashboard Gerencial',            13, true),
  ('modulo_adsim', 'operacao_comercial_opec',     'Operação Comercial (OPEC)',      14, true),
  ('modulo_adsim', 'financeiro',                  'Financeiro',                     15, true),
  ('modulo_adsim', 'relatorios_dashboards',       'Relatórios e Dashboards',        16, true),
  ('modulo_adsim', 'gestao_produtos',             'Gestão de Produtos',             17, true),
  ('modulo_adsim', 'tabelas_precos',              'Tabelas de Preços',              18, true),
  ('modulo_adsim', 'workflow_aprovacao',          'Workflow de Aprovação',          19, true),
  ('modulo_adsim', 'adchecking',                  'Adchecking',                     20, true),
  ('modulo_adsim', 'roteiro_comercial',           'Roteiro Comercial',              21, true),
  ('modulo_adsim', 'roteiro_merchandising',       'Roteiro de Merchandising',       22, true),
  ('modulo_adsim', 'portal_cliente',              'Portal do Cliente',              23, true),
  ('modulo_adsim', 'modulo_materiais',            'Módulo de Materiais',            24, true),
  ('modulo_adsim', 'integracao_fiscal_erp',       'Integração Fiscal (ERP)',        25, true),
  ('modulo_adsim', 'backoffice',                  'Backoffice',                     26, true)
ON CONFLICT (category, value) DO NOTHING;

-- 4. Categoria vazia de módulos Mídia+ (admin adiciona via Configurações)
-- Inserimos um placeholder inativo para a categoria aparecer no painel de config
-- Os admins podem adicionar os módulos reais via Configurações > Módulos Mídia+

NOTIFY pgrst, 'reload schema';
