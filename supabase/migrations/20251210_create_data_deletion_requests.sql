-- =============================================================================
-- Facebook Data Deletion Requests - Database Schema
-- Execute no Supabase PRINCIPAL
-- Data: 2025-12-10
-- =============================================================================

-- =============================================================================
-- 1. TABELA DE SOLICITAÇÕES DE EXCLUSÃO DE DADOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  facebook_user_id VARCHAR(255) NOT NULL,
  
  -- Código de confirmação único (para o usuário verificar status)
  confirmation_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Status da solicitação
  status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  
  -- Timestamps do processo
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Detalhes da exclusão
  deleted_tables JSONB DEFAULT '[]'::jsonb,
  retained_tables JSONB DEFAULT '[]'::jsonb, -- Dados mantidos por obrigação legal (LGPD)
  error_message TEXT,
  
  -- Metadados
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps padrão
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE data_deletion_requests IS 'Solicitações de exclusão de dados via Facebook OAuth (Meta Platform Terms)';
COMMENT ON COLUMN data_deletion_requests.facebook_user_id IS 'App-Scoped User ID do Facebook';
COMMENT ON COLUMN data_deletion_requests.confirmation_code IS 'Código único para verificação do status';
COMMENT ON COLUMN data_deletion_requests.status IS 'pending, processing, completed, failed, partial';
COMMENT ON COLUMN data_deletion_requests.retained_tables IS 'Dados mantidos por obrigação legal (LGPD Art. 16, II)';

-- =============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id 
  ON data_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_facebook_id 
  ON data_deletion_requests(facebook_user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_confirmation_code 
  ON data_deletion_requests(confirmation_code);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status 
  ON data_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_at 
  ON data_deletion_requests(requested_at DESC);

-- =============================================================================
-- 3. TRIGGER PARA ATUALIZAR updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_deletion_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deletion_requests_updated ON data_deletion_requests;
CREATE TRIGGER trigger_deletion_requests_updated
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_deletion_requests_timestamp();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias solicitações
CREATE POLICY "Users can view own deletion requests" 
  ON data_deletion_requests
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Apenas service role pode inserir/atualizar (via API backend)
CREATE POLICY "Service role can manage deletion requests" 
  ON data_deletion_requests
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. FUNÇÃO PARA BUSCAR USUÁRIO POR FACEBOOK ID
-- Útil para encontrar o user_id do Supabase a partir do Facebook User ID
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_by_facebook_id(p_facebook_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar nas identidades do Supabase Auth
  SELECT user_id INTO v_user_id
  FROM auth.identities
  WHERE provider = 'facebook'
    AND (
      provider_id = p_facebook_id 
      OR identity_data->>'provider_id' = p_facebook_id
      OR identity_data->>'sub' = p_facebook_id
    )
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_by_facebook_id IS 'Busca user_id do Supabase a partir do Facebook App-Scoped User ID';

-- =============================================================================
-- 6. FUNÇÃO PARA GERAR CÓDIGO DE CONFIRMAÇÃO ÚNICO
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_deletion_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 12 caracteres
    v_code := 'DEL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM data_deletion_requests WHERE confirmation_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_deletion_confirmation_code IS 'Gera código de confirmação único para solicitação de exclusão';

-- =============================================================================
-- 7. TABELA DE LOG DE EXCLUSÃO (AUDITORIA)
-- Mantém registro do que foi excluído para compliance
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  deletion_request_id UUID REFERENCES data_deletion_requests(id) ON DELETE SET NULL,
  
  -- Detalhes da ação
  table_name VARCHAR(100) NOT NULL,
  records_deleted INTEGER DEFAULT 0,
  action_type VARCHAR(50) DEFAULT 'delete' CHECK (action_type IN ('delete', 'anonymize', 'retain')),
  
  -- Justificativa (para dados retidos)
  retention_reason TEXT,
  
  -- Timestamps
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE data_deletion_logs IS 'Log de auditoria das exclusões realizadas (compliance LGPD)';
COMMENT ON COLUMN data_deletion_logs.action_type IS 'delete=removido, anonymize=anonimizado, retain=mantido por obrigação legal';

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_deletion_logs_request_id 
  ON data_deletion_logs(deletion_request_id);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_executed_at 
  ON data_deletion_logs(executed_at DESC);

-- RLS para logs
ALTER TABLE data_deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage deletion logs" 
  ON data_deletion_logs
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- DONE! Execute este SQL no Supabase SQL Editor
-- =============================================================================
