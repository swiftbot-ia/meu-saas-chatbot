-- Migration: Add action fields to automations
-- Description: Adds columns for tag assignment, origin and webhook actions when automation triggers

-- Add action columns to automations table
ALTER TABLE public.automations 
  ADD COLUMN IF NOT EXISTS action_add_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_webhook_url text,
  ADD COLUMN IF NOT EXISTS action_webhook_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_set_origin_id uuid;

-- Add comments for documentation
COMMENT ON COLUMN public.automations.action_add_tags IS 'Array of tag names to add to contact when automation triggers';
COMMENT ON COLUMN public.automations.action_webhook_url IS 'External webhook URL to send lead data when automation triggers';
COMMENT ON COLUMN public.automations.action_webhook_enabled IS 'Whether to send data to external webhook';
COMMENT ON COLUMN public.automations.action_set_origin_id IS 'Origin ID to set on contact when automation triggers';
