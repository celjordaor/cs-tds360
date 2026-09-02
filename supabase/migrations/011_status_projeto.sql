-- Migration 011: Consolida status em clients, remove status de projects
-- Renomeia categoria status_cliente → status_projeto em config_options
UPDATE config_options
   SET category = 'status_projeto'
 WHERE category = 'status_cliente';

-- Remove coluna status da tabela projects (status fica só em clients)
ALTER TABLE projects DROP COLUMN IF EXISTS status;
