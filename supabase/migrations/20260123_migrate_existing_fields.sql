-- Migration: Populate custom_field_definitions from existing contact metadata
-- This is a ONE-TIME migration to sync existing fields

-- Step 1: Create a temporary function to extract keys from metadata
-- Step 2: Insert distinct field names per connection into custom_field_definitions

-- For each distinct field in whatsapp_contacts.metadata, create a definition
INSERT INTO custom_field_definitions (connection_id, name, display_name, field_type, default_value)
SELECT DISTINCT
    conv.connection_id,
    field_key,
    field_key,
    'text',
    ''
FROM whatsapp_conversations conv
JOIN whatsapp_contacts c ON c.id = conv.contact_id
CROSS JOIN LATERAL jsonb_object_keys(COALESCE(c.metadata, '{}'::jsonb)) AS field_key
WHERE conv.connection_id IS NOT NULL
  AND field_key NOT IN ('', 'whatsapp_number', 'profile_pic_url')
ON CONFLICT (connection_id, name) DO NOTHING;

-- Verify the migration
SELECT connection_id, COUNT(*) as field_count 
FROM custom_field_definitions 
GROUP BY connection_id;
