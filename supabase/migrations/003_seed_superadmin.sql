-- ============================================================
-- 003_seed_superadmin.sql
-- Cria o usuário Super Admin (Celso Jordão)
--
-- INSTRUÇÕES:
-- 1. Crie o usuário no Supabase Authentication > Users > Add User
--    Email: celso.jordao@tdsoft.com.br
--    Password: (defina uma senha inicial segura)
--    Auto-confirm: SIM
--
-- 2. Copie o UUID gerado pelo Supabase para o usuário criado
--
-- 3. Substitua 'COLE-O-UUID-AQUI' abaixo pelo UUID copiado
--
-- 4. Execute este script no SQL Editor do Supabase
-- ============================================================

INSERT INTO profiles (id, email, nome, role, ativo)
VALUES (
  'COLE-O-UUID-AQUI',       -- UUID do usuário criado no Supabase Auth
  'celso.jordao@tdsoft.com.br',
  'Celso Jordão',
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  ativo = true;
