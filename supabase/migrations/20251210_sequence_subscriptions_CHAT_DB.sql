-- ============================================================================
-- Migration: Sequence Subscriptions for CHAT DB
-- Description: Create automation_sequence_subscriptions table in Chat DB
-- Run this on the CHAT database (swiftbot-chat / wkaylttwkqkwiwihlixj)
-- ============================================================================

-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.automation_sequence_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sequence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  connection_id uuid,
  conversation_id uuid,
  current_step integer DEFAULT 0,
  status text DEFAULT 'active' NOT NULL,
  started_at timestamptz DEFAULT now(),
  next_step_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT automation_sequence_subscriptions_pkey PRIMARY KEY (id)
);

-- Add comments
COMMENT ON TABLE public.automation_sequence_subscriptions IS 'Tracks contacts enrolled in sequences and their progress';
COMMENT ON COLUMN public.automation_sequence_subscriptions.sequence_id IS 'Reference to sequence in Main DB';
COMMENT ON COLUMN public.automation_sequence_subscriptions.contact_id IS 'Reference to whatsapp_contacts in this Chat DB';
COMMENT ON COLUMN public.automation_sequence_subscriptions.current_step IS 'Current step index (0-based)';
COMMENT ON COLUMN public.automation_sequence_subscriptions.status IS 'active, paused, completed, unsubscribed';
COMMENT ON COLUMN public.automation_sequence_subscriptions.next_step_at IS 'When to send the next message';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sequence_subs_sequence_id 
  ON public.automation_sequence_subscriptions(sequence_id);

CREATE INDEX IF NOT EXISTS idx_sequence_subs_contact_id 
  ON public.automation_sequence_subscriptions(contact_id);

CREATE INDEX IF NOT EXISTS idx_sequence_subs_next_step 
  ON public.automation_sequence_subscriptions(next_step_at) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sequence_subs_status 
  ON public.automation_sequence_subscriptions(status);

-- Unique constraint: one active subscription per contact per sequence
CREATE UNIQUE INDEX IF NOT EXISTS idx_sequence_subs_unique_active 
  ON public.automation_sequence_subscriptions(sequence_id, contact_id) 
  WHERE status = 'active';

-- Foreign key to contacts (local table)
ALTER TABLE public.automation_sequence_subscriptions
  ADD CONSTRAINT automation_sequence_subscriptions_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE;

-- Foreign key to conversations (local table)
ALTER TABLE public.automation_sequence_subscriptions
  ADD CONSTRAINT automation_sequence_subscriptions_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL;

-- Disable RLS for this table (service role will manage it)
ALTER TABLE public.automation_sequence_subscriptions DISABLE ROW LEVEL SECURITY;
