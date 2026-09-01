-- ============================================================
-- 007 — Atualiza trigger handle_new_user
-- Ao criar um usuário via Auth, faz UPSERT no profiles por email
-- (suporte ao fluxo: admin pré-cadastra perfil → usuário usa magic link)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'cs',
    true
  )
  ON CONFLICT (email) DO UPDATE
    SET id    = EXCLUDED.id,
        ativo = COALESCE(profiles.ativo, true)
  WHERE profiles.id <> EXCLUDED.id;   -- só atualiza se era um perfil pré-criado sem ID Auth

  RETURN new;
END;
$$;
