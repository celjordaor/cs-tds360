-- ================================================================
-- Migration 014 — Adiciona coluna ativo nas tabelas de emissoras
-- Necessário pois a migration 012 foi executada antes de incluir
-- a coluna ativo, e CREATE TABLE IF NOT EXISTS não atualiza schema.
-- ================================================================

ALTER TABLE emissoras ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE veiculos  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pracas    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
