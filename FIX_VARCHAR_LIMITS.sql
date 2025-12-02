-- ============================================
-- FIX: VARCHAR limits causing save errors
-- Execute this in Supabase SQL Editor
-- ============================================

-- Increase whatsapp_number from VARCHAR(20) to VARCHAR(50)
ALTER TABLE whatsapp_contacts
  ALTER COLUMN whatsapp_number TYPE VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_contacts.whatsapp_number IS 'WhatsApp number (international format, up to 50 chars)';

-- Verify the change
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'whatsapp_contacts'
  AND column_name = 'whatsapp_number';
