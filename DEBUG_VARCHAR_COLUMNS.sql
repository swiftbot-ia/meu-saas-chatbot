-- ============================================
-- DEBUG: Check all VARCHAR columns in whatsapp_messages
-- ============================================

-- Check all columns with their data types and limits
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'whatsapp_messages'
  AND data_type = 'character varying'
ORDER BY column_name;
