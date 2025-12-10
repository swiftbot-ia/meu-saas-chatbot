-- Migration: Sequence Executor
-- Description: Add fields needed for sequence trigger and execution

-- 1. Add agent_paused field to conversations
-- When true, automated messages will NOT be sent
ALTER TABLE public.whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS agent_paused boolean DEFAULT false;

COMMENT ON COLUMN public.whatsapp_conversations.agent_paused IS 
  'When true, automated sequences/messages will not be sent to this contact';

-- 2. Add first_message_at to contacts for "new contact" trigger detection
ALTER TABLE public.whatsapp_contacts
  ADD COLUMN IF NOT EXISTS first_message_at timestamptz;

COMMENT ON COLUMN public.whatsapp_contacts.first_message_at IS 
  'Timestamp of first message received, used to trigger new contact sequences';

-- 3. Add trigger configuration to sequences
ALTER TABLE public.automation_sequences
  ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'manual' 
    CHECK (trigger_type IN ('manual', 'new_contact', 'has_tag', 'has_origin', 'keyword')),
  ADD COLUMN IF NOT EXISTS trigger_tag_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_origin_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_keywords text[] DEFAULT '{}';

COMMENT ON COLUMN public.automation_sequences.trigger_type IS 
  'What triggers enrollment: manual, new_contact, has_tag, has_origin, keyword';
COMMENT ON COLUMN public.automation_sequences.trigger_tag_id IS 
  'For has_tag trigger: which tag triggers enrollment';
COMMENT ON COLUMN public.automation_sequences.trigger_origin_id IS 
  'For has_origin trigger: which origin triggers enrollment';
COMMENT ON COLUMN public.automation_sequences.trigger_keywords IS 
  'For keyword trigger: array of keywords that trigger enrollment';

-- 4. Add connection_id to subscription for easier queries
ALTER TABLE public.automation_sequence_subscriptions
  ADD COLUMN IF NOT EXISTS connection_id uuid,
  ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- 5. Create indexes for efficient worker queries
CREATE INDEX IF NOT EXISTS idx_sequence_subscriptions_next_step 
  ON public.automation_sequence_subscriptions(next_step_at) 
  WHERE status = 'active' AND next_step_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sequence_subscriptions_status 
  ON public.automation_sequence_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_sequences_trigger_type 
  ON public.automation_sequences(trigger_type) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_conversations_agent_paused 
  ON public.whatsapp_conversations(agent_paused) 
  WHERE agent_paused = true;

-- 6. Add FK constraint for contact_id (reference to whatsapp_contacts)
-- Note: Only add if not exists (may fail if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'automation_sequence_subscriptions_contact_id_fkey'
  ) THEN
    ALTER TABLE public.automation_sequence_subscriptions
      ADD CONSTRAINT automation_sequence_subscriptions_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE;
  END IF;
END $$;
