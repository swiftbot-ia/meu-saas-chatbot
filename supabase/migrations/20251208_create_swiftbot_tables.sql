-- =============================================================================
-- SwiftBot IA - Database Schema
-- Execute no Supabase PRINCIPAL (não no Chat)
-- =============================================================================

-- =============================================================================
-- 1. USER CREDITS - Saldo de créditos por usuário
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 500.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_credits_updated ON user_credits;
CREATE TRIGGER trigger_user_credits_updated
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_timestamp();

-- RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON user_credits
  FOR ALL USING (true);

-- =============================================================================
-- 2. SWIFTBOT CONVERSATIONS - Histórico de conversas
-- =============================================================================
CREATE TABLE IF NOT EXISTS swiftbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Nova Conversa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_swiftbot_conversations_user_id ON swiftbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_swiftbot_conversations_created_at ON swiftbot_conversations(created_at DESC);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_swiftbot_conversations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_swiftbot_conversations_updated ON swiftbot_conversations;
CREATE TRIGGER trigger_swiftbot_conversations_updated
  BEFORE UPDATE ON swiftbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_swiftbot_conversations_timestamp();

-- RLS
ALTER TABLE swiftbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON swiftbot_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON swiftbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON swiftbot_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON swiftbot_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 3. SWIFTBOT MESSAGES - Mensagens de cada conversa
-- =============================================================================
CREATE TABLE IF NOT EXISTS swiftbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES swiftbot_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  credits_charged DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_swiftbot_messages_conversation_id ON swiftbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_swiftbot_messages_created_at ON swiftbot_messages(created_at);

-- RLS (baseado na conversa do usuário)
ALTER TABLE swiftbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations" ON swiftbot_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM swiftbot_conversations c
      WHERE c.id = swiftbot_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations" ON swiftbot_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM swiftbot_conversations c
      WHERE c.id = swiftbot_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. CREDIT TRANSACTIONS - Log de uso/compra de créditos
-- =============================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial', 'usage', 'purchase', 'bonus', 'refund')),
  amount DECIMAL(10,4) NOT NULL,
  description TEXT,
  message_id UUID REFERENCES swiftbot_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 5. FUNÇÃO PARA INICIALIZAR CRÉDITOS DE NOVO USUÁRIO
-- =============================================================================
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar registro de créditos com saldo inicial
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 500.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Registrar transação inicial
  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'initial', 500.00, 'Créditos iniciais de boas-vindas');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar créditos automaticamente quando usuário é criado
DROP TRIGGER IF EXISTS trigger_init_user_credits ON auth.users;
CREATE TRIGGER trigger_init_user_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- =============================================================================
-- DONE!
-- =============================================================================
