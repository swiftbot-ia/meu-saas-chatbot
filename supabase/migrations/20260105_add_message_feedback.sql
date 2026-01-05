-- ============================================
-- MIGRATION: Add Message Feedback Rating
-- Created: 2026-01-05
-- Description: Adds feedback rating (like/dislike) for agent messages
--              with context of lead's previous messages
-- ============================================

-- Add feedback columns to whatsapp_messages table
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS feedback_rating VARCHAR(10) CHECK (feedback_rating IN ('like', 'dislike')),
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_context TEXT; -- Last 3 lead messages before this response

-- Add index for feedback rating (for querying rated messages)
CREATE INDEX IF NOT EXISTS idx_messages_feedback_rating
  ON whatsapp_messages(feedback_rating)
  WHERE feedback_rating IS NOT NULL;

-- Add index for agent messages with feedback (outbound + has rating)
CREATE INDEX IF NOT EXISTS idx_messages_agent_feedback
  ON whatsapp_messages(conversation_id, feedback_rating)
  WHERE direction = 'outbound' AND feedback_rating IS NOT NULL;

-- Add index for good responses (for knowledge base queries)
CREATE INDEX IF NOT EXISTS idx_messages_good_responses
  ON whatsapp_messages(user_id, feedback_rating, created_at DESC)
  WHERE direction = 'outbound' AND feedback_rating = 'like';

-- Add comments for documentation
COMMENT ON COLUMN whatsapp_messages.feedback_rating IS 'User feedback: like (good response) or dislike (bad response)';
COMMENT ON COLUMN whatsapp_messages.feedback_at IS 'When the feedback was given';
COMMENT ON COLUMN whatsapp_messages.feedback_context IS 'Last 3 lead messages before this response - saved when feedback is given';
