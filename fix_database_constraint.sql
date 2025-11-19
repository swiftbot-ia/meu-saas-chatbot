-- ============================================================================
-- Script de Correção: Remover Constraint UNIQUE de user_id
-- ============================================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Dashboard → SQL Editor → New Query → Cole e Execute
-- ============================================================================

-- 1. Remover a constraint única que está bloqueando múltiplas conexões
ALTER TABLE public.whatsapp_connections
DROP CONSTRAINT IF EXISTS whatsapp_connections_user_id_unique;

-- 2. Adicionar índice para manter performance (sem bloquear múltiplas conexões)
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id
ON public.whatsapp_connections(user_id);

-- 3. Verificar se foi removido corretamente
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'whatsapp_connections'
  AND table_schema = 'public';

-- RESULTADO ESPERADO:
-- Não deve aparecer "whatsapp_connections_user_id_unique" na lista
-- ============================================================================
