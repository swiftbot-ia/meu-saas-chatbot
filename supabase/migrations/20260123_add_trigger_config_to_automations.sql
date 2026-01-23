-- Migration: Add trigger_config to automations table
-- Description: Stores configuration for event-based triggers (e.g., specific field values, tag IDs)

ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}';

-- Create index for faster querying of trigger types and config
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_config ON automations USING gin (trigger_config);
