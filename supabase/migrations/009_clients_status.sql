-- ============================================================
-- 009 — Adiciona coluna status na tabela clients
-- ============================================================
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'implantacao'
  CHECK (status IN ('prospecto','implantacao','ativo','pausado','cancelado'));
