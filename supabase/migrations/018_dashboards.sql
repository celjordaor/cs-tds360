-- ================================================================
-- Migration 018 — Dashboards (galeria + Storage bucket)
-- ================================================================

-- 1. Bucket público para arquivos HTML dos dashboards
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dashboards',
  'dashboards',
  true,
  5242880,
  ARRAY['text/html', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies do Storage bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'dashboards_public_read'
  ) THEN
    CREATE POLICY "dashboards_public_read" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'dashboards');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'dashboards_authenticated_insert'
  ) THEN
    CREATE POLICY "dashboards_authenticated_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'dashboards');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'dashboards_authenticated_update'
  ) THEN
    CREATE POLICY "dashboards_authenticated_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'dashboards')
      WITH CHECK (bucket_id = 'dashboards');
  END IF;
END $$;

-- 3. Tabela de metadados — drop e recria para garantir schema correto
DROP TABLE IF EXISTS dashboards CASCADE;

CREATE TABLE dashboards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  descricao     TEXT,
  categoria     TEXT NOT NULL DEFAULT 'Geral',
  icone         TEXT NOT NULL DEFAULT '📊',
  cor           TEXT NOT NULL DEFAULT 'orange',
  storage_path  TEXT NOT NULL UNIQUE,
  tamanho_kb    INT,
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  ativo         BOOLEAN NOT NULL DEFAULT true,
  ordem         INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboards_authenticated_read" ON dashboards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dashboards_authenticated_write" ON dashboards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Seed — 7 dashboards iniciais
INSERT INTO dashboards (nome, descricao, categoria, icone, cor, storage_path, ordem) VALUES
  (
    'SenseData — Análise de Clientes',
    'KPIs de carteira, health scores, workload CS e churn 2026',
    'CS', '📊', 'blue', 'sensedata-clientes.html', 1
  ),
  (
    'Onboarding CS',
    'Acompanhamento de progresso de onboarding por cliente',
    'CS', '🚀', 'orange', 'onboarding-cs.html', 2
  ),
  (
    'Visão 360 do Cliente',
    'Painel interativo completo por cliente com abas e seleção dinâmica',
    'CS', '🔭', 'violet', 'visao-360-cliente.html', 3
  ),
  (
    'Dashboard Financeiro',
    'MRR, receita, churn financeiro e métricas de crescimento',
    'Financeiro', '💰', 'green', 'financeiro.html', 4
  ),
  (
    'Movidesk — Chamados',
    'Análise de tickets de suporte, SLA e categorias de atendimento',
    'Suporte', '🎫', 'red', 'movidesk-chamados.html', 5
  ),
  (
    'JIRA — Tarefas',
    'Acompanhamento de tarefas e sprints do time de desenvolvimento',
    'Operacional', '📋', 'sky', 'jira-dashboard.html', 6
  ),
  (
    'Planos e Sistemas',
    'Visão de planos contratados e sistemas ativos por cliente',
    'CS', '🗂️', 'amber', 'planos-sistemas.html', 7
  );

NOTIFY pgrst, 'reload schema';
