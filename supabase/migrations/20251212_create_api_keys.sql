-- ============================================
-- MIGRATION: API Keys for Public Webhook API
-- Created: 2025-12-12
-- Description: Table to store API keys for external integrations
-- Execute on: MAIN DATABASE (Supabase Principal)
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  
  -- API Key data
  api_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Constraint: One API key per connection (can be regenerated)
  UNIQUE(connection_id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id 
  ON public.api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_connection_id 
  ON public.api_keys(connection_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_api_key 
  ON public.api_keys(api_key) 
  WHERE is_active = TRUE;

-- 3. Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow team members to view API keys from owner's account
DROP POLICY IF EXISTS "Team members can view account API keys" ON public.api_keys;
CREATE POLICY "Team members can view account API keys"
  ON public.api_keys
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.account_members WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

-- 5. Comments for documentation
COMMENT ON TABLE public.api_keys IS 'API keys for external integrations (n8n, Zapier, custom webhooks)';
COMMENT ON COLUMN public.api_keys.api_key IS 'UUID format API key for authentication';
COMMENT ON COLUMN public.api_keys.name IS 'User-friendly name for the API key';
COMMENT ON COLUMN public.api_keys.is_active IS 'If FALSE, key has been revoked';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Timestamp of last successful API call using this key';

-- ============================================
-- VERIFICATION: Check if table was created
-- ============================================
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'api_keys'
ORDER BY ordinal_position;
