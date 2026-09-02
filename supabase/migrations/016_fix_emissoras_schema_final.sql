-- ================================================================
-- Migration 016 — Correção definitiva do schema de emissoras
-- Aplicada via SQL Editor (fora do fluxo normal de migrations)
-- pois a tabela foi criada com schema diferente do planejado.
-- Este arquivo documenta o estado final para referência.
-- ================================================================

-- Renomear nome → fantasia na tabela emissoras
-- ALTER TABLE emissoras RENAME COLUMN nome TO fantasia;

-- Adicionar colunas ausentes em emissoras
-- ALTER TABLE emissoras
--   ADD COLUMN IF NOT EXISTS razao_social TEXT,
--   ADD COLUMN IF NOT EXISTS cnpj TEXT,
--   ADD COLUMN IF NOT EXISTS tipo TEXT,
--   ADD COLUMN IF NOT EXISTS cod_midiaplus TEXT,
--   ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Adicionar colunas ausentes em veiculos
-- ALTER TABLE veiculos
--   ADD COLUMN IF NOT EXISTS sigla TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Adicionar colunas ausentes em pracas
-- ALTER TABLE pracas
--   ADD COLUMN IF NOT EXISTS sigla TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS exibidores TEXT,
--   ADD COLUMN IF NOT EXISTS layout_exportacao_roteiro TEXT,
--   ADD COLUMN IF NOT EXISTS arquivo_retorno_asrun TEXT,
--   ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- JÁ APLICADO DIRETAMENTE NO SUPABASE SQL EDITOR — não re-executar.
SELECT 'migration 016 documentada (ja aplicada)' AS status;
