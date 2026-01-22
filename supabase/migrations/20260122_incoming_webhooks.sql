-- Migration: Create incoming_webhooks table
-- Description: Table to store incoming webhook configurations for external platforms

CREATE TABLE IF NOT EXISTS incoming_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Field mapping: { "phone": "$.buyer.phone", "name": "$.buyer.name" }
  -- Uses JSONPath-like syntax to extract fields from incoming payload
  field_mapping JSONB DEFAULT '{}',
  
  -- Actions to execute: ["create_contact", {"type": "add_tag", "tag_id": "uuid"}, {"type": "subscribe_sequence", "sequence_id": "uuid"}]
  actions JSONB DEFAULT '[]',
  
  -- Stats
  total_received INT DEFAULT 0,
  last_received_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_incoming_webhooks_connection ON incoming_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_incoming_webhooks_user ON incoming_webhooks(user_id);

-- Enable RLS
ALTER TABLE incoming_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own webhooks
CREATE POLICY "Users can manage their own webhooks" ON incoming_webhooks
  FOR ALL
  USING (user_id = auth.uid());

-- Grant access to service role (for API routes)
GRANT ALL ON incoming_webhooks TO service_role;
