-- Migration: Create custom_field_definitions table
-- This table stores field definitions (registry) for each connection
-- Values are still stored in whatsapp_contacts.metadata JSONB

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,           -- Field key (e.g. "anuncio", "campanha")
  display_name VARCHAR(255),            -- Optional display name for UI
  field_type VARCHAR(50) DEFAULT 'text', -- text, number, date, select
  default_value TEXT DEFAULT '',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(connection_id, name)
);

-- Index for fast lookups by connection
CREATE INDEX IF NOT EXISTS idx_cfd_connection ON custom_field_definitions(connection_id);

-- Comment
COMMENT ON TABLE custom_field_definitions IS 'Registry of custom fields available for contacts per connection';
