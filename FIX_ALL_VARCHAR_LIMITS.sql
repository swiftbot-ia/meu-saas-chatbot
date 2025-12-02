-- ============================================
-- FIX: All VARCHAR limits in whatsapp tables
-- Execute this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check current state
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('whatsapp_messages', 'whatsapp_contacts')
  AND data_type = 'character varying'
ORDER BY table_name, column_name;

-- STEP 2: Fix whatsapp_contacts
ALTER TABLE whatsapp_contacts
  ALTER COLUMN whatsapp_number TYPE VARCHAR(50);

-- STEP 3: Fix whatsapp_messages - phone number columns
-- These columns can contain JID format (e.g., "447447021530@s.whatsapp.net")
ALTER TABLE whatsapp_messages
  ALTER COLUMN from_number TYPE VARCHAR(100);

ALTER TABLE whatsapp_messages
  ALTER COLUMN to_number TYPE VARCHAR(100);

-- STEP 4: Ensure other columns are adequate
ALTER TABLE whatsapp_messages
  ALTER COLUMN direction TYPE VARCHAR(20);

ALTER TABLE whatsapp_messages
  ALTER COLUMN message_type TYPE VARCHAR(50);

ALTER TABLE whatsapp_messages
  ALTER COLUMN status TYPE VARCHAR(50);

-- STEP 5: Verify changes
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('whatsapp_messages', 'whatsapp_contacts')
  AND data_type = 'character varying'
ORDER BY table_name, column_name;

-- STEP 6: Add comments for documentation
COMMENT ON COLUMN whatsapp_messages.from_number IS 'Sender number or JID (e.g., 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_messages.to_number IS 'Recipient number or JID (e.g., 5511999999999@s.whatsapp.net)';
