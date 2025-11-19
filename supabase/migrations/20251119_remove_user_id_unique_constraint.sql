-- ============================================================================
-- Migração: Remover constraint UNIQUE de user_id
-- ============================================================================
-- Motivo: Permitir que um usuário tenha múltiplas conexões WhatsApp
-- Data: 2025-11-19
-- ============================================================================

-- Remover a constraint única de user_id
ALTER TABLE public.whatsapp_connections
DROP CONSTRAINT IF EXISTS whatsapp_connections_user_id_unique;

-- Adicionar índice não-único para performance (mantém consultas rápidas sem bloquear múltiplas conexões)
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id
ON public.whatsapp_connections(user_id);

-- Comentário explicativo
COMMENT ON TABLE public.whatsapp_connections IS
'Tabela de conexões WhatsApp. Um usuário pode ter múltiplas conexões (limite definido em user_subscriptions.connections_purchased)';
