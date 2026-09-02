-- ================================================================
-- Migration 012 — Emissoras, Veículos, Praças
-- Estrutura: emissoras (por projeto) → veículos → praças
-- ================================================================

-- Emissoras: vinculadas ao projeto do cliente
CREATE TABLE IF NOT EXISTS emissoras (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fantasia      TEXT NOT NULL DEFAULT '',
  razao_social  TEXT,
  cnpj          TEXT,
  tipo          TEXT CHECK (tipo IN ('tv','radio','digital','jornal','ooh')),
  cod_midiaplus TEXT,           -- Cód. Emissora Mídia+
  ordem         INTEGER NOT NULL DEFAULT 0,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Veículos: pertencem a uma emissora
CREATE TABLE IF NOT EXISTS veiculos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emissora_id UUID NOT NULL REFERENCES emissoras(id) ON DELETE CASCADE,
  sigla       TEXT NOT NULL DEFAULT '',
  nome        TEXT NOT NULL DEFAULT '',
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Praças: pertencem a um veículo
CREATE TABLE IF NOT EXISTS pracas (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id                UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  sigla                     TEXT NOT NULL DEFAULT '',
  nome                      TEXT NOT NULL DEFAULT '',
  exibidores                TEXT,
  layout_exportacao_roteiro TEXT,
  arquivo_retorno_asrun     TEXT,
  ordem                     INTEGER NOT NULL DEFAULT 0,
  ativo                     BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS emissoras_project_id_idx ON emissoras(project_id);
CREATE INDEX IF NOT EXISTS veiculos_emissora_id_idx ON veiculos(emissora_id);
CREATE INDEX IF NOT EXISTS pracas_veiculo_id_idx    ON pracas(veiculo_id);

-- Row Level Security
ALTER TABLE emissoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pracas    ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ler e escrever (mesmo padrão de contacts)
CREATE POLICY "emissoras_authenticated_all" ON emissoras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "veiculos_authenticated_all" ON veiculos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pracas_authenticated_all" ON pracas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
