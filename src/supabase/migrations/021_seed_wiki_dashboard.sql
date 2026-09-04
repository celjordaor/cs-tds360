-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 021 — Seed do card WIKI - Base de Conhecimento
-- Adiciona o card de WIKI ao painel de Dashboards.
-- O arquivo HTML deve ser enviado via upload no próprio card após execução.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO dashboards (nome, descricao, categoria, icone, cor, storage_path, ativo, ordem, roles_acesso)
VALUES (
  'WIKI - Base de Conhecimento',
  'Base de conhecimento interna do Adsim para equipe de suporte e CS',
  'Suporte',
  '📚',
  'violet',
  'wiki-adsim.html',
  true,
  10,
  ARRAY['super_admin', 'admin', 'manager', 'cs']
)
ON CONFLICT (storage_path) DO NOTHING;
