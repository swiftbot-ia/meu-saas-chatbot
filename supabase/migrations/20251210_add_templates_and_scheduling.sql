-- Migration: Add message templates and sequence scheduling
-- Description: Creates message_templates table and adds scheduling fields to sequence steps

-- 1. Create message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio', 'video', 'document')),
  media_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_connection_id ON public.message_templates(connection_id);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own templates" ON public.message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Add scheduling fields to automation_sequence_steps
ALTER TABLE public.automation_sequence_steps
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delay_value integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS delay_unit text DEFAULT 'hours' CHECK (delay_unit IN ('immediately', 'minutes', 'hours', 'days')),
  ADD COLUMN IF NOT EXISTS time_window_start time,
  ADD COLUMN IF NOT EXISTS time_window_end time,
  ADD COLUMN IF NOT EXISTS allowed_days text[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'];

-- Add comments
COMMENT ON TABLE public.message_templates IS 'Reusable message templates for automations';
COMMENT ON COLUMN public.automation_sequence_steps.template_id IS 'Reference to a saved message template';
COMMENT ON COLUMN public.automation_sequence_steps.delay_value IS 'Amount of time to wait before sending';
COMMENT ON COLUMN public.automation_sequence_steps.delay_unit IS 'Unit of delay: immediately, minutes, hours, days';
COMMENT ON COLUMN public.automation_sequence_steps.time_window_start IS 'Start of allowed sending window (null = any time)';
COMMENT ON COLUMN public.automation_sequence_steps.time_window_end IS 'End of allowed sending window';
COMMENT ON COLUMN public.automation_sequence_steps.allowed_days IS 'Days of week when sending is allowed';
