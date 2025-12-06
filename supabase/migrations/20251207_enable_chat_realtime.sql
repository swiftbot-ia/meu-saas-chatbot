-- ============================================
-- MIGRATION: Enable Realtime for Chat Tables
-- Created: 2025-12-07
-- Description: Configures Supabase Realtime for whatsapp_messages table
-- This is REQUIRED for postgres_changes to work
-- ============================================

-- Enable REPLICA IDENTITY FULL for whatsapp_messages
-- This allows Supabase to capture all column values in change events
ALTER TABLE whatsapp_messages REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for whatsapp_conversations 
-- This allows real-time updates for the conversation list sidebar
ALTER TABLE whatsapp_conversations REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
-- This is required for postgres_changes subscriptions to receive events
-- Note: If table is already in publication, this will be ignored
DO $$
BEGIN
  -- Check if whatsapp_messages is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'whatsapp_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
    RAISE NOTICE 'Added whatsapp_messages to supabase_realtime publication';
  END IF;

  -- Check if whatsapp_conversations is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'whatsapp_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_conversations;
    RAISE NOTICE 'Added whatsapp_conversations to supabase_realtime publication';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY (Run this to confirm)
-- ============================================
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Should show: whatsapp_messages, whatsapp_conversations

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE whatsapp_messages IS 'Stores all WhatsApp messages - Realtime enabled for live chat updates';
