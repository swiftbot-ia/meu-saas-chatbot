-- ============================================================================
-- Migration: Add Follow-up Fields to Sequences
-- Run this on MAIN DB (swiftbot-main)
-- ============================================================================

-- Add follow-up mode fields to automation_sequences
ALTER TABLE automation_sequences 
ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS restart_on_reply BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN automation_sequences.is_follow_up IS 'When true, sequence operates in follow-up/tracking mode';
COMMENT ON COLUMN automation_sequences.restart_on_reply IS 'When true and is_follow_up=true, restart sequence when lead replies';

