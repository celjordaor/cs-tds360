-- ============================================================
-- 005_functions_triggers.sql
-- Funções e triggers automáticos
-- ============================================================

-- ---- Trigger: atualiza updated_at automaticamente ----
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','clients','projects','dashboards']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ---- Trigger: cria profile automaticamente após signup ----
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Só insere se não existir (evita conflito com o seed do super_admin)
  INSERT INTO profiles (id, email, nome, role, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cs'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---- Função: recalcula onboarding_pct de um projeto ----
CREATE OR REPLACE FUNCTION recalculate_onboarding_pct(project_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total INT;
  done  INT;
  pct   INT;
BEGIN
  SELECT COUNT(*) INTO total FROM checklist_items WHERE project_id = project_uuid;
  SELECT COUNT(*) INTO done  FROM checklist_items WHERE project_id = project_uuid AND done = true;
  IF total = 0 THEN
    pct := 0;
  ELSE
    pct := ROUND((done::NUMERIC / total) * 100);
  END IF;
  UPDATE projects SET onboarding_pct = pct WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: atualiza onboarding_pct ao marcar/desmarcar checklist
CREATE OR REPLACE FUNCTION trigger_recalculate_pct()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_onboarding_pct(
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_checklist_change ON checklist_items;
CREATE TRIGGER on_checklist_change
  AFTER INSERT OR UPDATE OF done OR DELETE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_pct();
