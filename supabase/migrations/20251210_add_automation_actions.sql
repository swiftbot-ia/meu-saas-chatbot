-- Migration: Add action fields to automations
-- Description: Adds columns for tag assignment and webhook actions when automation triggers

-- Add action columns to automations table
ALTER TABLE public.automations 
  ADD COLUMN IF NOT EXISTS action_add_tags uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_webhook_url text,
  ADD COLUMN IF NOT EXISTS action_webhook_enabled boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.automations.action_add_tags IS 'Array of tag IDs to add to contact when automation triggers';
COMMENT ON COLUMN public.automations.action_webhook_url IS 'External webhook URL to send lead data when automation triggers';
COMMENT ON COLUMN public.automations.action_webhook_enabled IS 'Whether to send data to external webhook';
