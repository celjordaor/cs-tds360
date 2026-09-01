-- ============================================================
-- 006 — Config Options: opções dinâmicas via banco
-- ============================================================

CREATE TABLE IF NOT EXISTS config_options (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category  TEXT NOT NULL,       -- 'sistema', 'segmento', 'status_cliente', etc.
  value     TEXT NOT NULL,
  label     TEXT NOT NULL,
  ordem     INT  DEFAULT 0,
  ativo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, value)
);

-- RLS
ALTER TABLE config_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem config_options"
  ON config_options FOR SELECT TO authenticated USING (ativo = true);

CREATE POLICY "Admins gerenciam config_options"
  ON config_options FOR ALL TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin'));

-- ============================================================
-- Seed inicial — sistemas
-- ============================================================
INSERT INTO config_options (category, value, label, ordem) VALUES
  ('sistema', 'adsim',       'Adsim',        1),
  ('sistema', 'midiaplus',   'Mídia+',       2),
  ('sistema', 'adanalytics', 'Ad Analytics', 3),
  ('sistema', 'adchecking',  'Adchecking',   4)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================================
-- Seed inicial — segmentos
-- ============================================================
INSERT INTO config_options (category, value, label, ordem) VALUES
  ('segmento', 'tv',       'TV',       1),
  ('segmento', 'radio',    'Rádio',    2),
  ('segmento', 'digital',  'Digital',  3),
  ('segmento', 'portal',   'Portal',   4),
  ('segmento', 'ooh',      'OOH',      5),
  ('segmento', 'jornal',   'Jornal',   6),
  ('segmento', 'revista',  'Revista',  7),
  ('segmento', 'agencia',  'Agência',  8)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================================
-- Seed — status do cliente (para filtros / referência)
-- ============================================================
INSERT INTO config_options (category, value, label, ordem) VALUES
  ('status_cliente', 'prospecto',   'Prospecto',   1),
  ('status_cliente', 'implantacao', 'Implantação', 2),
  ('status_cliente', 'ativo',       'Ativo',       3),
  ('status_cliente', 'pausado',     'Pausado',     4),
  ('status_cliente', 'cancelado',   'Cancelado',   5)
ON CONFLICT (category, value) DO NOTHING;
