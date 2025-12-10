-- ============================================================================
-- CRM Filters - Add won/lost tracking columns
-- Created: 2025-12-11
-- Description: Adds columns for tracking when opportunities are won or lost
-- ============================================================================

-- Add columns for won/lost tracking to conversations
ALTER TABLE whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Add origin_id to contacts if not exists (some contacts may not have it)
-- Note: This may already exist from previous migrations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_contacts' AND column_name = 'origin_id'
  ) THEN
    ALTER TABLE whatsapp_contacts ADD COLUMN origin_id UUID;
  END IF;
END $$;

-- ============================================================================
-- Indexes for filtering performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_won_at ON whatsapp_conversations(won_at);
CREATE INDEX IF NOT EXISTS idx_conversations_lost_at ON whatsapp_conversations(lost_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON whatsapp_conversations(created_at);

-- Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_conversations_status ON whatsapp_conversations(funnel_stage, won_at, lost_at);
