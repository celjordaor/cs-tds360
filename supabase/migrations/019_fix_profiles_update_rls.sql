-- ============================================================
-- 019_fix_profiles_update_rls.sql
-- Permite que super_admin e admin atualizem perfis de outros usuários
-- (role, ativo). Antes, a política "profiles_update_own" só permitia
-- o próprio usuário atualizar seu próprio perfil.
-- ============================================================

-- Remove a política restritiva original
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Nova política: usuário atualiza o próprio perfil OU admin/super_admin atualiza qualquer um
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR get_user_role() IN ('super_admin', 'admin')
  )
  WITH CHECK (
    id = auth.uid()
    OR get_user_role() IN ('super_admin', 'admin')
  );
