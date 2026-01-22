-- Migration: Add last_payload to incoming_webhooks
-- Description: Store the last received JSON payload to help with field mapping configuration

ALTER TABLE incoming_webhooks 
ADD COLUMN IF NOT EXISTS last_payload JSONB DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN incoming_webhooks.last_payload IS 'Last received JSON payload for debugging and field mapping';
