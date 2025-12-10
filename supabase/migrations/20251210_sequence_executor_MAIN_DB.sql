-- ============================================================================
-- Migration: Sequence Executor - MAIN DB (swiftbot)
-- Description: Add trigger fields to automation_sequences and subscription fields
-- Run this on the MAIN database (swiftbot)
-- ============================================================================

-- 1. Add trigger configuration to sequences
-- First, drop the constraint if it exists (in case of partial migration)
DO $$
BEGIN
  -- Try to drop the constraint if it exists
  ALTER TABLE public.automation_sequences 
    DROP CONSTRAINT IF EXISTS automation_sequences_trigger_type_check;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if it doesn't exist
  NULL;
END $$;

-- Add columns
ALTER TABLE public.automation_sequences
  ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS trigger_tag_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_origin_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_keywords text[] DEFAULT '{}';

-- Add check constraint separately
DO $$
BEGIN
  ALTER TABLE public.automation_sequences
    ADD CONSTRAINT automation_sequences_trigger_type_check 
    CHECK (trigger_type IN ('manual', 'new_contact', 'has_tag', 'has_origin', 'keyword'));
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists
  NULL;
END $$;

COMMENT ON COLUMN public.automation_sequences.trigger_type IS 
  'What triggers enrollment: manual, new_contact, has_tag, has_origin, keyword';
COMMENT ON COLUMN public.automation_sequences.trigger_tag_id IS 
  'For has_tag trigger: which tag triggers enrollment';
COMMENT ON COLUMN public.automation_sequences.trigger_origin_id IS 
  'For has_origin trigger: which origin triggers enrollment';
COMMENT ON COLUMN public.automation_sequences.trigger_keywords IS 
  'For keyword trigger: array of keywords that trigger enrollment';

-- 2. Add connection_id and conversation_id to subscription for easier queries
ALTER TABLE public.automation_sequence_subscriptions
  ADD COLUMN IF NOT EXISTS connection_id uuid,
  ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- 3. Create indexes for efficient worker queries
CREATE INDEX IF NOT EXISTS idx_sequence_subscriptions_next_step 
  ON public.automation_sequence_subscriptions(next_step_at) 
  WHERE status = 'active' AND next_step_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sequence_subscriptions_status 
  ON public.automation_sequence_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_sequences_trigger_type 
  ON public.automation_sequences(trigger_type) 
  WHERE is_active = true;
