-- ============================================================================
-- Migration: Sequence Executor - CHAT DB (swiftbot-chat)
-- Description: Add fields to whatsapp_conversations and whatsapp_contacts
-- Run this on the CHAT database (swiftbot-chat)
-- ============================================================================

-- 1. Add agent_paused field to conversations
-- When true, automated messages will NOT be sent
ALTER TABLE public.whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS agent_paused boolean DEFAULT false;

COMMENT ON COLUMN public.whatsapp_conversations.agent_paused IS 
  'When true, automated sequences/messages will not be sent to this contact';

-- 2. Add first_message_at to contacts for "new contact" trigger detection
ALTER TABLE public.whatsapp_contacts
  ADD COLUMN IF NOT EXISTS first_message_at timestamptz;

COMMENT ON COLUMN public.whatsapp_contacts.first_message_at IS 
  'Timestamp of first message received, used to trigger new contact sequences';

-- 3. Create index for agent_paused
CREATE INDEX IF NOT EXISTS idx_conversations_agent_paused 
  ON public.whatsapp_conversations(agent_paused) 
  WHERE agent_paused = true;
