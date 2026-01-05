-- ============================================================================
-- Migration: Add Follow-up Fields to Sequence Subscriptions
-- Run this on CHAT DB (swiftbot-chat)
-- ============================================================================

-- Add lead_last_message_at to track when lead last responded
ALTER TABLE automation_sequence_subscriptions 
ADD COLUMN IF NOT EXISTS lead_last_message_at TIMESTAMPTZ;

-- Comment
COMMENT ON COLUMN automation_sequence_subscriptions.lead_last_message_at IS 'Timestamp of leads last message, used for follow-up restart logic';

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sequence_subs_lead_last_msg 
ON automation_sequence_subscriptions(lead_last_message_at) 
WHERE status = 'active';

