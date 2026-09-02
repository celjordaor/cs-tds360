-- ================================================================
-- Migration 015 — Completa o schema de emissoras, veiculos e pracas
-- Adiciona todas as colunas que podem estar faltando após a tabela
-- ter sido criada com um schema inicial incompleto.
-- Todos os comandos usam IF NOT EXISTS — seguro re-executar.
-- ================================================================

-- Emissoras: colunas possivelmente ausentes
ALTER TABLE emissoras
  ADD COLUMN IF NOT EXISTS cnpj          TEXT,
  ADD COLUMN IF NOT EXISTS tipo          TEXT,
  ADD COLUMN IF NOT EXISTS cod_midiaplus TEXT;

-- Veículos: ativo já adicionado por 014, mas garantimos aqui também
ALTER TABLE veiculos
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Praças: idem
ALTER TABLE pracas
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Recarrega o schema cache do PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
