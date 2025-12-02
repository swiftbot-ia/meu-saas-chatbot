-- ============================================
-- MIGRATION: Fix VARCHAR limits for phone numbers and JIDs
-- Created: 2025-12-01
-- Description: Increases VARCHAR limits to prevent truncation errors
-- Phone numbers with JID format (e.g., "447447021530@s.whatsapp.net") can exceed 20 chars
-- ============================================

-- Fix whatsapp_contacts
ALTER TABLE whatsapp_contacts
  ALTER COLUMN whatsapp_number TYPE VARCHAR(50);

-- Fix whatsapp_messages - phone number columns that can contain JID format
ALTER TABLE whatsapp_messages
  ALTER COLUMN from_number TYPE VARCHAR(100);

ALTER TABLE whatsapp_messages
  ALTER COLUMN to_number TYPE VARCHAR(100);

-- Ensure other columns are adequate
ALTER TABLE whatsapp_messages
  ALTER COLUMN direction TYPE VARCHAR(20);

ALTER TABLE whatsapp_messages
  ALTER COLUMN message_type TYPE VARCHAR(50);

ALTER TABLE whatsapp_messages
  ALTER COLUMN status TYPE VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN whatsapp_contacts.whatsapp_number IS 'WhatsApp number (international format, up to 50 chars)';
COMMENT ON COLUMN whatsapp_messages.from_number IS 'Sender number or JID (e.g., 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_messages.to_number IS 'Recipient number or JID (e.g., 5511999999999@s.whatsapp.net)';
