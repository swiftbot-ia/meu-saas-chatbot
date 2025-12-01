-- ============================================
-- MIGRATION: Fix VARCHAR limits for phone numbers
-- Created: 2025-12-01
-- Description: Increases VARCHAR limits to prevent truncation errors
-- ============================================

-- Increase whatsapp_number from VARCHAR(20) to VARCHAR(50)
ALTER TABLE whatsapp_contacts
  ALTER COLUMN whatsapp_number TYPE VARCHAR(50);

-- Ensure direction field is adequate (already 20, should be fine)
-- but let's make it explicit for clarity
ALTER TABLE whatsapp_messages
  ALTER COLUMN direction TYPE VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_contacts.whatsapp_number IS 'WhatsApp number (international format, up to 50 chars)';
