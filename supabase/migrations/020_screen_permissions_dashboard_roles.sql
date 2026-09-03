-- ============================================================
-- 020_screen_permissions_dashboard_roles.sql
-- 1. Cria tabela screen_permissions (controle de acesso por tela)
-- 2. Adiciona roles_acesso TEXT[] à tabela dashboards
-- 3. Corrige RLS da tabela dashboards (recriada em 018 sem policies)
-- ============================================================

-- ─── screen_permissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS screen_permissions (
  screen     TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  roles      TEXT[] NOT NULL DEFAULT ARRAY['super_admin','admin','manager','cs'],
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO screen_permissions (screen, label, roles) VALUES
  ('clients',    'Customer Success', ARRAY['super_admin','admin','manager','cs']),
  ('dashboards', 'Dashboards',       ARRAY['super_admin','admin','manager','cs']),
  ('analytics',  'Analytics CS',     ARRAY['super_admin','admin','manager']),
  ('settings',   'Configurações',    ARRAY['super_admin','admin'])
ON CONFLICT (screen) DO NOTHING;

ALTER TABLE screen_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "screen_permissions_select" ON screen_permissions;
DROP POLICY IF EXISTS "screen_permissions_write"  ON screen_permissions;

CREATE POLICY "screen_permissions_select"
  ON screen_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "screen_permissions_write"
  ON screen_permissions FOR UPDATE
  USING (get_user_role() IN ('super_admin','admin'));

-- ─── dashboards: adicionar roles_acesso ──────────────────────
ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS roles_acesso TEXT[]
  NOT NULL DEFAULT ARRAY['super_admin','admin','manager','cs'];

UPDATE dashboards
  SET roles_acesso = ARRAY['super_admin','admin','manager','cs']
  WHERE roles_acesso IS NULL OR array_length(roles_acesso, 1) IS NULL;

-- ─── dashboards: corrigir RLS ────────────────────────────────
-- A tabela foi recriada em 018 com DROP TABLE CASCADE, o que removeu
-- as policies criadas em 002. Aqui recriamos corretamente.
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboards_select" ON dashboards;
DROP POLICY IF EXISTS "dashboards_write"  ON dashboards;

-- admin/super_admin veem todos (inclusive inativos, para gerenciar)
-- demais roles só veem dashboards ativos onde seu role está em roles_acesso
CREATE POLICY "dashboards_select"
  ON dashboards FOR SELECT
  USING (
    get_user_role() IN ('super_admin','admin')
    OR (ativo = true AND get_user_role() = ANY(roles_acesso))
  );

CREATE POLICY "dashboards_write"
  ON dashboards FOR ALL
  USING (get_user_role() IN ('super_admin','admin'));
