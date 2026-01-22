-- REMOVE FK Constraint de whatsapp_conversations
-- Motivo: O banco de dados do Chat (onde whatsapp_conversations reside) pode ser separado do banco de Auth (Supabase),
-- fazendo com que a tabela auth.users esteja vazia ou incompleta no banco do Chat, causando erro de violação de FK.

ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_assigned_to_fkey;
