-- ============================================================================
-- MIGRATION: Adicionar campos de perfil WhatsApp
-- ============================================================================
-- Data: 2025-01-18
-- Descrição: Adiciona campos para armazenar dados do perfil WhatsApp
--            (nome, foto, número formatado)
-- ============================================================================

-- Adicionar colunas de perfil na tabela whatsapp_connections
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS profile_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_pic_url TEXT,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Criar índice para busca por nome de perfil
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_profile_name
  ON whatsapp_connections(profile_name);

-- Comentários para documentação
COMMENT ON COLUMN whatsapp_connections.profile_name IS 'Nome do perfil WhatsApp (obtido da UAZAPI após conexão)';
COMMENT ON COLUMN whatsapp_connections.profile_pic_url IS 'URL da foto de perfil WhatsApp';
COMMENT ON COLUMN whatsapp_connections.phone_number IS 'Número do WhatsApp no formato internacional (ex: 5511999999999)';

-- ============================================================================
-- Atualizar política RLS se necessário
-- ============================================================================
-- As políticas existentes já cobrem SELECT/UPDATE, então não precisa alterar

-- ============================================================================
-- ROLLBACK (caso necessário)
-- ============================================================================
/*
ALTER TABLE whatsapp_connections
  DROP COLUMN IF EXISTS profile_name,
  DROP COLUMN IF EXISTS profile_pic_url,
  DROP COLUMN IF EXISTS phone_number;

DROP INDEX IF EXISTS idx_whatsapp_connections_profile_name;
*/
