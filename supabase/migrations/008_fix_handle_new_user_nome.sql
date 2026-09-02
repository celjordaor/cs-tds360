-- ============================================================
-- 008 — Corrige handle_new_user: usa coluna 'nome' (não 'full_name')
-- e lê nome/role dos metadados do usuário Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'cs'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
