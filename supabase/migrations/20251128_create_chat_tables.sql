-- ============================================
-- MIGRATION: Chat Tables (Contacts & Conversations)
-- Created: 2025-11-28
-- Description: Creates tables for WhatsApp contacts and conversations
-- ============================================

-- ============================================
-- TABLE: whatsapp_contacts
-- Stores unique WhatsApp contacts across all instances
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255),
  profile_pic_url TEXT,
  jid VARCHAR(255), -- WhatsApp JID (e.g., 5511999999999@s.whatsapp.net)

  -- Metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: whatsapp_conversations
-- Links contacts to specific WhatsApp instances
-- One conversation per contact per instance
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation state
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,

  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One conversation per contact per instance
  UNIQUE(connection_id, contact_id)
);

-- ============================================
-- UPDATE: whatsapp_messages
-- Add conversation_id and contact_id for better relationships
-- ============================================
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE SET NULL;

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON whatsapp_contacts(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_last_message ON whatsapp_contacts(last_message_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_connection ON whatsapp_conversations(connection_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_unread ON whatsapp_conversations(unread_count) WHERE unread_count > 0;

-- Messages indexes (additional)
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_received_at ON whatsapp_messages(received_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can only see contacts from their conversations
CREATE POLICY "Users can view contacts from their conversations"
  ON whatsapp_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations
      WHERE whatsapp_conversations.contact_id = whatsapp_contacts.id
      AND whatsapp_conversations.user_id = auth.uid()
    )
  );

-- Contacts: Users can insert new contacts (needed for webhook processing)
CREATE POLICY "Users can insert contacts"
  ON whatsapp_contacts FOR INSERT
  WITH CHECK (true);

-- Contacts: Users can update their contacts
CREATE POLICY "Users can update contacts from their conversations"
  ON whatsapp_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations
      WHERE whatsapp_conversations.contact_id = whatsapp_contacts.id
      AND whatsapp_conversations.user_id = auth.uid()
    )
  );

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON whatsapp_conversations FOR SELECT
  USING (user_id = auth.uid());

-- Conversations: Users can insert conversations for their connections
CREATE POLICY "Users can insert conversations for their connections"
  ON whatsapp_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM whatsapp_connections
      WHERE whatsapp_connections.id = whatsapp_conversations.connection_id
      AND whatsapp_connections.user_id = auth.uid()
    )
  );

-- Conversations: Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
  ON whatsapp_conversations FOR UPDATE
  USING (user_id = auth.uid());

-- Conversations: Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
  ON whatsapp_conversations FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contacts
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to conversations
DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Get or Create Contact
-- Helper function to simplify contact management
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_contact(
  p_whatsapp_number VARCHAR,
  p_name VARCHAR DEFAULT NULL,
  p_jid VARCHAR DEFAULT NULL,
  p_profile_pic_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Try to find existing contact
  SELECT id INTO v_contact_id
  FROM whatsapp_contacts
  WHERE whatsapp_number = p_whatsapp_number;

  -- If not found, create new contact
  IF v_contact_id IS NULL THEN
    INSERT INTO whatsapp_contacts (whatsapp_number, name, jid, profile_pic_url)
    VALUES (p_whatsapp_number, p_name, p_jid, p_profile_pic_url)
    RETURNING id INTO v_contact_id;
  ELSE
    -- Update existing contact if new info provided
    UPDATE whatsapp_contacts
    SET
      name = COALESCE(p_name, name),
      jid = COALESCE(p_jid, jid),
      profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url),
      updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;

  RETURN v_contact_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get or Create Conversation
-- Helper function to simplify conversation management
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_connection_id UUID,
  p_contact_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM whatsapp_conversations
  WHERE connection_id = p_connection_id
  AND contact_id = p_contact_id;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO whatsapp_conversations (connection_id, contact_id, user_id)
    VALUES (p_connection_id, p_contact_id, p_user_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE whatsapp_contacts IS 'Stores unique WhatsApp contacts across all instances';
COMMENT ON TABLE whatsapp_conversations IS 'Links contacts to specific WhatsApp instances (one conversation per contact per instance)';
COMMENT ON COLUMN whatsapp_contacts.jid IS 'WhatsApp JID format: number@s.whatsapp.net';
COMMENT ON COLUMN whatsapp_conversations.unread_count IS 'Number of unread messages in this conversation';
COMMENT ON FUNCTION get_or_create_contact IS 'Helper function to find or create a contact by WhatsApp number';
COMMENT ON FUNCTION get_or_create_conversation IS 'Helper function to find or create a conversation';
