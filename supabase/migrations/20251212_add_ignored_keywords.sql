-- ============================================
-- MIGRATION: Add ignored_keywords to ai_agents
-- Created: 2025-12-12
-- Description: Keywords that will auto-disable agent for contact
-- Execute on: MAIN DATABASE (Supabase Principal)
-- ============================================

-- Add ignored_keywords column
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS ignored_keywords TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.ai_agents.ignored_keywords IS 
  'Palavras-chave que fazem o agente ignorar a mensagem e ser desativado para o contato. Ex: ["Preenchi seu formulário", "email:"]';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agents' AND column_name = 'ignored_keywords';
