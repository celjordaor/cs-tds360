-- ================================================================
-- Migration 013 — Adiciona campos de configuração Adsim na tabela emissoras
-- ================================================================

ALTER TABLE emissoras
  ADD COLUMN IF NOT EXISTS id_emissora_adsim   TEXT,
  ADD COLUMN IF NOT EXISTS grupo_empresa_adsim  TEXT;
