-- ============================================================================
-- SCHEMA SUPABASE: WhatsApp Instances Management
-- ============================================================================
-- Este schema gerencia as instâncias do WhatsApp dos usuários via Evolution/UAZAPI
-- ============================================================================

-- Tabela: whatsapp_connections
-- Armazena as instâncias do WhatsApp de cada usuário
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identificadores da instância
  instance_name VARCHAR(255) UNIQUE NOT NULL, -- Nome único da instância (ex: swiftbot_user123)
  instance_token TEXT, -- Token/API Key da instância gerado pela Evolution API
  waba_id VARCHAR(255), -- WhatsApp Business Account ID (opcional)
  phone_number_id VARCHAR(50), -- Número do WhatsApp conectado (formato: 5511999999999)

  -- Status e Conexão
  status VARCHAR(50) DEFAULT 'disconnected', -- disconnected, connecting, connected, failed
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,

  -- Credenciais e Configuração
  api_credentials TEXT, -- API Key específica da instância (hash retornado pela Evolution API)
  webhook_url TEXT, -- URL do webhook configurado para esta instância

  -- Campos Administrativos (para integração com outros sistemas)
  admin_field_01 VARCHAR(255), -- Ex: client_id externo
  admin_field_02 VARCHAR(255), -- Ex: integration_id, departamento, etc

  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados extras (ex: versão da API, logs, etc)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_instance UNIQUE(user_id, instance_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance_name ON whatsapp_connections(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_phone ON whatsapp_connections(phone_number_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Habilitar RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias conexões
CREATE POLICY "Users can view own connections" ON whatsapp_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir suas próprias conexões
CREATE POLICY "Users can insert own connections" ON whatsapp_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias conexões
CREATE POLICY "Users can update own connections" ON whatsapp_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar suas próprias conexões
CREATE POLICY "Users can delete own connections" ON whatsapp_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Tabela: whatsapp_messages (Opcional - para histórico de mensagens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados da mensagem
  message_id VARCHAR(255) UNIQUE NOT NULL, -- ID único da mensagem do WhatsApp
  from_number VARCHAR(50) NOT NULL, -- Número de quem enviou
  to_number VARCHAR(50) NOT NULL, -- Número de quem recebeu
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document, etc
  message_content TEXT, -- Conteúdo da mensagem
  media_url TEXT, -- URL da mídia (se aplicável)

  -- Direção
  direction VARCHAR(20) NOT NULL, -- inbound (recebida) ou outbound (enviada)

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, failed

  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_connection_id ON whatsapp_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);

-- RLS para mensagens
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON whatsapp_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Funções Auxiliares
-- ============================================================================

-- Função para buscar conexão ativa do usuário
CREATE OR REPLACE FUNCTION get_user_active_connection(p_user_id UUID)
RETURNS whatsapp_connections AS $$
  SELECT * FROM whatsapp_connections
  WHERE user_id = p_user_id
    AND is_connected = true
    AND status = 'connected'
  ORDER BY last_connected_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Função para contar conexões ativas do usuário
CREATE OR REPLACE FUNCTION count_user_connections(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM whatsapp_connections
  WHERE user_id = p_user_id
    AND is_connected = true
    AND status = 'connected';
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Seeds/Dados de exemplo (opcional - comentado)
-- ============================================================================

-- Exemplo de como inserir uma conexão
/*
INSERT INTO whatsapp_connections (
  user_id,
  instance_name,
  instance_token,
  phone_number_id,
  status,
  is_connected,
  admin_field_01,
  admin_field_02
) VALUES (
  'user-uuid-aqui',
  'swiftbot_user123',
  'token-gerado-pela-api',
  '5511999999999',
  'connected',
  true,
  'client_id_123',
  'departamento_vendas'
);
*/
