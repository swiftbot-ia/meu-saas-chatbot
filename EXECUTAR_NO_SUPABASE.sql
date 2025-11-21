-- ============================================================================
-- SCRIPT DE CORREÇÃO: Permitir Múltiplas Conexões por Usuário
-- ============================================================================
-- COPIE E EXECUTE NO SUPABASE SQL EDITOR
-- ============================================================================

-- 1. Remover o constraint UNIQUE que está bloqueando múltiplas conexões
ALTER TABLE public.whatsapp_connections
DROP CONSTRAINT IF EXISTS unique_user_instance;

-- 2. Adicionar índice não-único para manter performance nas consultas por user_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id
ON public.whatsapp_connections(user_id);

-- 3. Verificar que o constraint foi removido
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'whatsapp_connections'
  AND table_schema = 'public'
  AND constraint_type = 'UNIQUE';

-- RESULTADO ESPERADO:
-- Deve aparecer APENAS "whatsapp_connections_instance_name_key" (que é correto manter)
-- NÃO deve aparecer "unique_user_instance"
