-- ============================================
-- MIGRATION: Fix Column Lengths for Phone Numbers and Message IDs
-- Created: 2025-12-01
-- Description: Increases VARCHAR(20) columns to accommodate longer values
-- Issue: WhatsApp message IDs and phone numbers can exceed 20 characters
-- Example: 639610391368:2A81E64AA5E6058EF7B2 (34 characters)
-- ============================================

-- ============================================
-- TABLE: whatsapp_contacts
-- Fix whatsapp_number length
-- ============================================

-- Increase whatsapp_number from VARCHAR(20) to VARCHAR(50)
ALTER TABLE whatsapp_contacts
  ALTER COLUMN whatsapp_number TYPE VARCHAR(50);

-- ============================================
-- TABLE: whatsapp_messages
-- Fix message_id and phone number columns if they exist
-- ============================================

-- These columns might not all exist, so we use DO block for safety
DO $$
BEGIN
  -- Increase message_id if it exists and is VARCHAR(20)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_messages'
    AND column_name = 'message_id'
    AND data_type = 'character varying'
    AND character_maximum_length = 20
  ) THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN message_id TYPE VARCHAR(255);
    RAISE NOTICE 'Updated message_id to VARCHAR(255)';
  END IF;

  -- Increase from_number if it exists and is VARCHAR(20)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_messages'
    AND column_name = 'from_number'
    AND data_type = 'character varying'
    AND character_maximum_length = 20
  ) THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN from_number TYPE VARCHAR(50);
    RAISE NOTICE 'Updated from_number to VARCHAR(50)';
  END IF;

  -- Increase to_number if it exists and is VARCHAR(20)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_messages'
    AND column_name = 'to_number'
    AND data_type = 'character varying'
    AND character_maximum_length = 20
  ) THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN to_number TYPE VARCHAR(50);
    RAISE NOTICE 'Updated to_number to VARCHAR(50)';
  END IF;

  -- Increase sender if it exists and is VARCHAR(20)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_messages'
    AND column_name = 'sender'
    AND data_type = 'character varying'
    AND character_maximum_length = 20
  ) THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN sender TYPE VARCHAR(50);
    RAISE NOTICE 'Updated sender to VARCHAR(50)';
  END IF;

  -- Increase recipient if it exists and is VARCHAR(20)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_messages'
    AND column_name = 'recipient'
    AND data_type = 'character varying'
    AND character_maximum_length = 20
  ) THEN
    ALTER TABLE whatsapp_messages ALTER COLUMN recipient TYPE VARCHAR(50);
    RAISE NOTICE 'Updated recipient to VARCHAR(50)';
  END IF;
END $$;

-- ============================================
-- VERIFY
-- ============================================

-- Show updated column sizes for verification
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('whatsapp_contacts', 'whatsapp_messages')
  AND column_name IN ('whatsapp_number', 'message_id', 'from_number', 'to_number', 'sender', 'recipient')
ORDER BY table_name, column_name;
