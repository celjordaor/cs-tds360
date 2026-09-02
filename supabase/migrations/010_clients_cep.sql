-- Adiciona campo CEP à tabela clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
