-- Migration: Add instance_name to contact_origins table
-- This links origins to specific WhatsApp connections

-- Add instance_name column
ALTER TABLE contact_origins ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_origins_instance_name ON contact_origins(instance_name);

-- Update existing origins: try to set instance_name from user's first connection
-- This is a best-effort migration for existing data
UPDATE contact_origins o
SET instance_name = (
    SELECT c.instance_name 
    FROM whatsapp_connections c 
    WHERE c.user_id = o.user_id 
    LIMIT 1
)
WHERE o.instance_name IS NULL;
