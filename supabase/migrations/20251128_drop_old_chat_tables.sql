-- ============================================
-- MIGRATION: Remove Old Chat System Tables
-- Created: 2025-11-28
-- Description: Drops old chat tables to use only the new whatsapp_* tables
-- ============================================

-- Drop tables in correct order (respecting foreign keys)
-- ============================================

-- Drop mensagens first (has FK to conversas)
DROP TABLE IF EXISTS public.mensagens CASCADE;

-- Drop conversas (has FK to instancias and contatos)
DROP TABLE IF EXISTS public.conversas CASCADE;

-- Drop contatos
DROP TABLE IF EXISTS public.contatos CASCADE;

-- Drop instancias
DROP TABLE IF EXISTS public.instancias CASCADE;

-- Drop other old tables
DROP TABLE IF EXISTS public.dados_cliente CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.n8n_chat_histories CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS public.dados_cliente_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.documents_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.n8n_chat_histories_id_seq CASCADE;

-- ============================================
-- Verify remaining tables
-- ============================================

-- After running this, you should only have:
-- ✓ whatsapp_contacts
-- ✓ whatsapp_conversations
-- ✓ whatsapp_messages

-- You can verify with:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

COMMENT ON SCHEMA public IS 'Using new WhatsApp chat system (whatsapp_* tables only)';
