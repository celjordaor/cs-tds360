-- ============================================================
-- 001_initial_schema.sql
-- TDSOFT Customer Success Portal — Schema inicial
-- Execute no Supabase SQL Editor
-- ============================================================

-- ---- PROFILES (usuários internos TDSOFT) ----
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('super_admin','admin','manager','cs')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- CLIENTS ----
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social    TEXT NOT NULL,
  fantasia        TEXT,
  cnpj            TEXT,
  cidade          TEXT,
  estado          CHAR(2),
  segmentos       TEXT[],
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- PROJECTS ----
CREATE TABLE IF NOT EXISTS projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sistemas_contratados    TEXT[],
  contrato_numero         TEXT,
  data_assinatura         DATE,
  data_kickoff            DATE,
  data_golive_prevista    DATE,
  data_golive_real        DATE,
  responsavel_comercial   TEXT,
  responsavel_cs_id       UUID REFERENCES profiles(id),
  apoio_cs_id             UUID REFERENCES profiles(id),
  responsavel_tecnico_id  UUID REFERENCES profiles(id),
  status                  TEXT NOT NULL DEFAULT 'em_andamento'
                          CHECK (status IN ('em_andamento','aguardando_cliente','concluido','suspenso')),
  movidesk_id             TEXT,
  sensedata_id            TEXT,
  licencas_midiaplus      INT DEFAULT 0,
  licencas_adsim          INT DEFAULT 0,
  licencas_adanalytics    INT DEFAULT 0,
  licencas_adchecking     INT DEFAULT 0,
  alertas_suporte         TEXT,
  obs_geral               TEXT,
  onboarding_pct          INT DEFAULT 0 CHECK (onboarding_pct BETWEEN 0 AND 100),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- CONTACTS ----
CREATE TABLE IF NOT EXISTS contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  cargo             TEXT,
  is_sponsor        BOOLEAN DEFAULT false,
  telefone          TEXT,
  email             TEXT,
  responsabilidade  TEXT,
  ordem             INT DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- EMISSORAS / VEICULOS / PRACAS ----
CREATE TABLE IF NOT EXISTS emissoras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  sigla       TEXT,
  ordem       INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS veiculos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emissora_id UUID NOT NULL REFERENCES emissoras(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  tipo        TEXT,
  ordem       INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pracas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  uf          CHAR(2),
  ordem       INT DEFAULT 0
);

-- ---- CONFIGURAÇÕES TÉCNICAS ----
CREATE TABLE IF NOT EXISTS project_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  modulos     TEXT[]
);

CREATE TABLE IF NOT EXISTS adsim_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  ad_status           TEXT DEFAULT 'nao_aplicavel'
                      CHECK (ad_status IN ('nao_aplicavel','pendente','configurado')),
  ad_url              TEXT,
  ad_obs              TEXT,
  tipos_negociacao    TEXT,
  naturezas           TEXT,
  condicoes_pagamento TEXT
);

CREATE TABLE IF NOT EXISTS midiaplus_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  adcheck_status   TEXT DEFAULT 'nao_aplicavel'
                   CHECK (adcheck_status IN ('nao_aplicavel','pendente','configurado')),
  adcheck_exibidor TEXT,
  adcheck_obs      TEXT
);

CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  etapas      TEXT,
  travas      TEXT
);

CREATE TABLE IF NOT EXISTS migrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sistema     TEXT,
  tipo        TEXT,
  origem      TEXT,
  responsavel TEXT,
  data        DATE,
  status      TEXT DEFAULT 'pendente'
              CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  obs         TEXT
);

CREATE TABLE IF NOT EXISTS integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sistema     TEXT,
  tipo        TEXT,
  status      TEXT DEFAULT 'pendente',
  obs         TEXT
);

CREATE TABLE IF NOT EXISTS validations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pendente'
              CHECK (status IN ('pendente','realizada','nao_aplicavel')),
  data        DATE,
  obs         TEXT
);

-- ---- USUÁRIOS DO CLIENTE ----
CREATE TABLE IF NOT EXISTS client_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  email            TEXT,
  cargo            TEXT,
  empresa          TEXT,
  perfil_adsim     TEXT,
  perfil_midiaplus TEXT,
  treinamentos     TEXT,
  has_adchecking   BOOLEAN DEFAULT false,
  is_apresentador  BOOLEAN DEFAULT false,
  obs              TEXT,
  ordem            INT DEFAULT 0
);

-- ---- PENDÊNCIAS / DOCUMENTOS / CHECKLIST ----
CREATE TABLE IF NOT EXISTS pendencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  responsavel TEXT,
  prazo       DATE,
  status      TEXT DEFAULT 'aberta'
              CHECK (status IN ('aberta','resolvida','cancelada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tipo        TEXT,
  descricao   TEXT,
  localizacao TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema     TEXT,
  item        TEXT NOT NULL,
  ordem       INT DEFAULT 0,
  ativo       BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES checklist_templates(id),
  item             TEXT NOT NULL,
  done             BOOLEAN DEFAULT false,
  done_at          TIMESTAMPTZ,
  done_by          UUID REFERENCES profiles(id),
  ordem            INT DEFAULT 0
);

-- ---- PORTAL DE DASHBOARDS GERENCIAIS ----
CREATE TABLE IF NOT EXISTS dashboards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo             TEXT NOT NULL,
  descricao          TEXT,
  categoria          TEXT,
  tipo               TEXT NOT NULL DEFAULT 'html_embed'
                     CHECK (tipo IN ('html_embed','html_url','supabase_live')),
  conteudo_html      TEXT,
  url_externa        TEXT,
  roles_acesso       TEXT[] DEFAULT ARRAY['super_admin','admin','manager'],
  ativo              BOOLEAN DEFAULT true,
  ordem              INT DEFAULT 0,
  icone              TEXT,
  fonte_dados        TEXT,
  ultima_atualizacao DATE,
  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- AUDIT LOG ----
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  client_id   UUID REFERENCES clients(id),
  project_id  UUID REFERENCES projects(id),
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
