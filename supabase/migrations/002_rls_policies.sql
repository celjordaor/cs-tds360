-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security — execute APÓS 001_initial_schema.sql
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissoras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pracas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE adsim_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE midiaplus_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;

-- ---- Função helper: retorna o role do usuário logado ----
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ---- Função helper: verifica se usuário é CS de um projeto ----
CREATE OR REPLACE FUNCTION is_cs_of_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
      AND (responsavel_cs_id = auth.uid() OR apoio_cs_id = auth.uid())
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR get_user_role() IN ('super_admin','admin','manager')
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (get_user_role() IN ('super_admin','admin'));

CREATE POLICY "profiles_delete_superadmin"
  ON profiles FOR DELETE
  USING (get_user_role() = 'super_admin');

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE POLICY "clients_select"
  ON clients FOR SELECT
  USING (
    get_user_role() IN ('super_admin','admin','manager')
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.client_id = clients.id
        AND (projects.responsavel_cs_id = auth.uid() OR projects.apoio_cs_id = auth.uid())
    )
  );

CREATE POLICY "clients_insert"
  ON clients FOR INSERT
  WITH CHECK (get_user_role() IN ('super_admin','admin','cs'));

CREATE POLICY "clients_update"
  ON clients FOR UPDATE
  USING (get_user_role() IN ('super_admin','admin'));

CREATE POLICY "clients_delete"
  ON clients FOR DELETE
  USING (get_user_role() IN ('super_admin','admin'));

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (
    get_user_role() IN ('super_admin','admin','manager')
    OR responsavel_cs_id = auth.uid()
    OR apoio_cs_id = auth.uid()
  );

CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  WITH CHECK (get_user_role() IN ('super_admin','admin','cs'));

CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  USING (
    get_user_role() IN ('super_admin','admin')
    OR responsavel_cs_id = auth.uid()
    OR apoio_cs_id = auth.uid()
  );

CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  USING (get_user_role() IN ('super_admin','admin'));

-- ============================================================
-- Tabelas dependentes de projects (política genérica por project_id)
-- ============================================================

-- Macro para tabelas filhas de projects: SELECT se tem acesso ao projeto
-- contacts, emissoras, veiculos, pracas, project_modules, adsim_config,
-- midiaplus_config, pipelines, migrations, integrations, validations,
-- client_users, pendencias, documents, checklist_items

DO $$ BEGIN
  -- contacts
  EXECUTE 'CREATE POLICY "contacts_select" ON contacts FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "contacts_write" ON contacts FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- emissoras
  EXECUTE 'CREATE POLICY "emissoras_select" ON emissoras FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "emissoras_write" ON emissoras FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- project_modules
  EXECUTE 'CREATE POLICY "project_modules_select" ON project_modules FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "project_modules_write" ON project_modules FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- adsim_config
  EXECUTE 'CREATE POLICY "adsim_config_select" ON adsim_config FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "adsim_config_write" ON adsim_config FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- midiaplus_config
  EXECUTE 'CREATE POLICY "midiaplus_config_select" ON midiaplus_config FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "midiaplus_config_write" ON midiaplus_config FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- pipelines
  EXECUTE 'CREATE POLICY "pipelines_select" ON pipelines FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "pipelines_write" ON pipelines FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- migrations
  EXECUTE 'CREATE POLICY "migrations_select" ON migrations FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "migrations_write" ON migrations FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- integrations
  EXECUTE 'CREATE POLICY "integrations_select" ON integrations FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "integrations_write" ON integrations FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- validations
  EXECUTE 'CREATE POLICY "validations_select" ON validations FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "validations_write" ON validations FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- client_users
  EXECUTE 'CREATE POLICY "client_users_select" ON client_users FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "client_users_write" ON client_users FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- pendencias
  EXECUTE 'CREATE POLICY "pendencias_select" ON pendencias FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "pendencias_write" ON pendencias FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- documents
  EXECUTE 'CREATE POLICY "documents_select" ON documents FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "documents_write" ON documents FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';

  -- checklist_items
  EXECUTE 'CREATE POLICY "checklist_items_select" ON checklist_items FOR SELECT
    USING (get_user_role() IN (''super_admin'',''admin'',''manager'') OR is_cs_of_project(project_id))';
  EXECUTE 'CREATE POLICY "checklist_items_write" ON checklist_items FOR ALL
    USING (get_user_role() IN (''super_admin'',''admin'') OR is_cs_of_project(project_id))';
END $$;

-- veiculos (depende de emissoras, não project_id direto)
CREATE POLICY "veiculos_select" ON veiculos FOR SELECT
  USING (
    get_user_role() IN ('super_admin','admin','manager')
    OR EXISTS (
      SELECT 1 FROM emissoras e
      WHERE e.id = veiculos.emissora_id
        AND is_cs_of_project(e.project_id)
    )
  );
CREATE POLICY "veiculos_write" ON veiculos FOR ALL
  USING (
    get_user_role() IN ('super_admin','admin')
    OR EXISTS (
      SELECT 1 FROM emissoras e
      WHERE e.id = veiculos.emissora_id
        AND is_cs_of_project(e.project_id)
    )
  );

-- pracas (depende de veiculos)
CREATE POLICY "pracas_select" ON pracas FOR SELECT
  USING (
    get_user_role() IN ('super_admin','admin','manager')
    OR EXISTS (
      SELECT 1 FROM veiculos v
        JOIN emissoras e ON e.id = v.emissora_id
      WHERE v.id = pracas.veiculo_id
        AND is_cs_of_project(e.project_id)
    )
  );
CREATE POLICY "pracas_write" ON pracas FOR ALL
  USING (
    get_user_role() IN ('super_admin','admin')
    OR EXISTS (
      SELECT 1 FROM veiculos v
        JOIN emissoras e ON e.id = v.emissora_id
      WHERE v.id = pracas.veiculo_id
        AND is_cs_of_project(e.project_id)
    )
  );

-- ============================================================
-- CHECKLIST TEMPLATES (somente admin/super_admin gerencia)
-- ============================================================
CREATE POLICY "checklist_templates_select"
  ON checklist_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "checklist_templates_write"
  ON checklist_templates FOR ALL
  USING (get_user_role() IN ('super_admin','admin'));

-- ============================================================
-- DASHBOARDS
-- ============================================================
CREATE POLICY "dashboards_select"
  ON dashboards FOR SELECT
  USING (
    ativo = true AND get_user_role() = ANY(roles_acesso)
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "dashboards_write"
  ON dashboards FOR ALL
  USING (get_user_role() IN ('super_admin','admin'));

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE POLICY "activity_log_select"
  ON activity_log FOR SELECT
  USING (get_user_role() IN ('super_admin','admin'));

CREATE POLICY "activity_log_insert"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
