-- ============================================================================
-- Migration: Tags por Instância (ao invés de por Usuário)
-- Created: 2025-12-11
-- Description: Altera contact_tags para usar instance_name ao invés de user_id
-- ============================================================================

-- Adicionar coluna instance_name à tabela contact_tags
ALTER TABLE contact_tags ADD COLUMN IF NOT EXISTS instance_name VARCHAR(255);

-- Criar índice para busca por instance_name
CREATE INDEX IF NOT EXISTS idx_contact_tags_instance ON contact_tags(instance_name);

-- Nota: As tags existentes terão instance_name NULL temporariamente.
-- Você pode optar por migrar as tags existentes ou simplesmente criar novas.
-- Para manter compatibilidade, a API vai filtrar por instance_name quando fornecido.
