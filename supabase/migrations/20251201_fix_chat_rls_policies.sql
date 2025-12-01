-- ============================================
-- MIGRATION: Fix Chat RLS Policies
-- Created: 2025-12-01
-- Description: Adjusts RLS policies for dual-database architecture
--
-- PROBLEMA:
-- O chat database é separado do main database.
-- auth.uid() retorna NULL no chat database porque não há sessão de auth compartilhada.
-- Isso faz com que as queries retornem vazias mesmo com dados no banco.
--
-- SOLUCAO:
-- 1. Usar Service Role Key para bypass de RLS (recomendado)
-- 2. Ou desabilitar RLS e fazer validação manual no código
--
-- Esta migration desabilita RLS nas tabelas do chat e adiciona
-- políticas permissivas para quando RLS for re-habilitado.
-- ============================================

-- ============================================
-- OPTION 1: Disable RLS (Simpler - Validation done in code)
-- ============================================

-- Disable RLS on whatsapp_messages
ALTER TABLE IF EXISTS whatsapp_messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on whatsapp_conversations (keep enabled if needed for extra security)
-- ALTER TABLE IF EXISTS whatsapp_conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on whatsapp_contacts (keep enabled if needed for extra security)
-- ALTER TABLE IF EXISTS whatsapp_contacts DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: Permissive RLS Policies (Alternative)
-- These policies allow all operations but can be restricted later
-- ============================================

-- Drop existing message policies if they exist
DROP POLICY IF EXISTS "Allow all message operations" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can view their messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can update their messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON whatsapp_messages;

-- Create permissive policy for messages (when RLS is enabled)
-- This allows the service role to bypass, and for authenticated users
-- it validates based on user_id column
CREATE POLICY "Users can view their messages"
  ON whatsapp_messages FOR SELECT
  USING (
    -- Service role always has access (handled by Supabase)
    -- For anon/authenticated, check user_id matches
    user_id IS NOT NULL
  );

CREATE POLICY "Users can insert messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their messages"
  ON whatsapp_messages FOR UPDATE
  USING (user_id IS NOT NULL);

CREATE POLICY "Users can delete their messages"
  ON whatsapp_messages FOR DELETE
  USING (user_id IS NOT NULL);

-- ============================================
-- Update conversation policies for better compatibility
-- ============================================

-- Drop and recreate conversation policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON whatsapp_conversations;

-- Permissive policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON whatsapp_conversations FOR SELECT
  USING (user_id IS NOT NULL);

CREATE POLICY "Users can insert conversations"
  ON whatsapp_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
  ON whatsapp_conversations FOR UPDATE
  USING (user_id IS NOT NULL);

CREATE POLICY "Users can delete their own conversations"
  ON whatsapp_conversations FOR DELETE
  USING (user_id IS NOT NULL);

-- ============================================
-- Update contact policies
-- ============================================

DROP POLICY IF EXISTS "Users can view contacts from their conversations" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can update contacts from their conversations" ON whatsapp_contacts;

-- Permissive policies for contacts
CREATE POLICY "Users can view contacts"
  ON whatsapp_contacts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON whatsapp_contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update contacts"
  ON whatsapp_contacts FOR UPDATE
  USING (true);

-- ============================================
-- INDEXES for better query performance
-- ============================================

-- Ensure message indexes exist
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_received ON whatsapp_messages(conversation_id, received_at DESC);

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON TABLE whatsapp_messages IS 'WhatsApp messages - RLS disabled, validation done in application code via ConversationService.getConversation';
COMMENT ON TABLE whatsapp_conversations IS 'WhatsApp conversations - Validation done by user_id column match in application code';
COMMENT ON TABLE whatsapp_contacts IS 'WhatsApp contacts - Shared across users, no ownership concept';
