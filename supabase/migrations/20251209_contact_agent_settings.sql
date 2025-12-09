-- ============================================
-- MIGRATION: Contact Agent Settings
-- Created: 2025-12-09
-- Description: Per-contact AI agent enable/disable settings
-- Execute on: MAIN DATABASE (Supabase Principal)
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.contact_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Unique identification per contact+connection
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  whatsapp_number VARCHAR(50) NOT NULL,  -- Contact number (e.g., 5511999999999)
  
  -- Agent configuration for this contact
  agent_enabled BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE = agent responds automatically
  
  -- Metadata
  disabled_at TIMESTAMP WITH TIME ZONE,  -- When it was disabled
  disabled_reason TEXT,                  -- Optional reason
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One record per contact per connection
  UNIQUE(connection_id, whatsapp_number)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_agent_connection 
  ON public.contact_agent_settings(connection_id);

CREATE INDEX IF NOT EXISTS idx_contact_agent_number 
  ON public.contact_agent_settings(whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_contact_agent_disabled 
  ON public.contact_agent_settings(agent_enabled) 
  WHERE agent_enabled = FALSE;

-- 3. Trigger for updated_at (reuse existing function if available)
DO $$
BEGIN
  -- Check if the function already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END
$$;

DROP TRIGGER IF EXISTS update_contact_agent_settings_updated_at ON public.contact_agent_settings;
CREATE TRIGGER update_contact_agent_settings_updated_at
  BEFORE UPDATE ON public.contact_agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE public.contact_agent_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can manage their contact agent settings" ON public.contact_agent_settings;
CREATE POLICY "Users can manage their contact agent settings"
  ON public.contact_agent_settings
  FOR ALL
  USING (
    connection_id IN (
      SELECT id FROM public.whatsapp_connections WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    connection_id IN (
      SELECT id FROM public.whatsapp_connections WHERE user_id = auth.uid()
    )
  );

-- 6. Comments for documentation
COMMENT ON TABLE public.contact_agent_settings IS 'Per-contact AI agent settings (enable/disable auto-response per contact)';
COMMENT ON COLUMN public.contact_agent_settings.agent_enabled IS 'If TRUE (default), AI agent will respond to this contact. If FALSE, agent is silenced for this contact.';
COMMENT ON COLUMN public.contact_agent_settings.whatsapp_number IS 'WhatsApp number without @s.whatsapp.net suffix';
COMMENT ON COLUMN public.contact_agent_settings.disabled_at IS 'Timestamp when agent was disabled for this contact';

-- ============================================
-- VERIFICATION: Check if table was created
-- ============================================
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'contact_agent_settings'
ORDER BY ordinal_position;
