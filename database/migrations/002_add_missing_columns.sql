-- ============================================================================
-- MIGRATION: Adicionar colunas faltantes na tabela whatsapp_connections
-- ============================================================================
-- Data: 2025-01-19
-- Descrição: Adiciona todas as colunas necessárias que estão faltando
--            para compatibilidade com o código da aplicação
-- ============================================================================

-- ============================================================================
-- PARTE 1: Adicionar colunas essenciais
-- ============================================================================

-- Identificadores da instância
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS instance_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS instance_token TEXT;

-- Timestamps
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ;

-- Credenciais e Configuração
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Campos de Perfil WhatsApp (da migration 001)
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS profile_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_pic_url TEXT,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Campos Administrativos
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS admin_field_01 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS admin_field_02 VARCHAR(255);

-- Metadados
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- PARTE 2: Criar valores padrão para registros existentes
-- ============================================================================

-- Gerar instance_name para registros que não têm
UPDATE whatsapp_connections
SET instance_name = 'swiftbot_' || REPLACE(user_id::TEXT, '-', '_')
WHERE instance_name IS NULL;

-- ============================================================================
-- PARTE 3: Adicionar constraints após popular dados
-- ============================================================================

-- Tornar instance_name NOT NULL e UNIQUE
ALTER TABLE whatsapp_connections
  ALTER COLUMN instance_name SET NOT NULL;

-- Adicionar constraint única (ignorar se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_connections_instance_name_key'
  ) THEN
    ALTER TABLE whatsapp_connections
      ADD CONSTRAINT whatsapp_connections_instance_name_key UNIQUE (instance_name);
  END IF;
END $$;

-- Adicionar constraint única para user_id + instance_name (ignorar se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_instance'
  ) THEN
    ALTER TABLE whatsapp_connections
      ADD CONSTRAINT unique_user_instance UNIQUE(user_id, instance_name);
  END IF;
END $$;

-- ============================================================================
-- PARTE 4: Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id
  ON whatsapp_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance_name
  ON whatsapp_connections(instance_name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
  ON whatsapp_connections(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_phone
  ON whatsapp_connections(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_profile_name
  ON whatsapp_connections(profile_name);

-- ============================================================================
-- PARTE 5: Criar/Atualizar trigger para updated_at
-- ============================================================================

-- Criar função se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_whatsapp_connections_updated_at ON whatsapp_connections;

-- Criar novo trigger
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 6: Adicionar comentários para documentação
-- ============================================================================

COMMENT ON COLUMN whatsapp_connections.instance_name IS 'Nome único da instância UAZAPI (ex: swiftbot_user123)';
COMMENT ON COLUMN whatsapp_connections.instance_token IS 'Token/API Key da instância gerado pela UAZAPI';
COMMENT ON COLUMN whatsapp_connections.api_credentials IS 'JSON string com credenciais completas da instância';
COMMENT ON COLUMN whatsapp_connections.profile_name IS 'Nome do perfil WhatsApp (obtido após conexão)';
COMMENT ON COLUMN whatsapp_connections.profile_pic_url IS 'URL da foto de perfil WhatsApp';
COMMENT ON COLUMN whatsapp_connections.phone_number IS 'Número do WhatsApp no formato internacional';
COMMENT ON COLUMN whatsapp_connections.metadata IS 'Dados extras em formato JSON';

-- ============================================================================
-- VERIFICAÇÃO: Mostrar estrutura atualizada
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'whatsapp_connections'
ORDER BY ordinal_position;
