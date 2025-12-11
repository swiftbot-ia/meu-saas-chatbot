-- ============================================================================
-- Migração: Corrigir constraint UNIQUE de ai_agents
-- ============================================================================
-- Problema: A constraint ai_agents_user_id_unique impede que um usuário
--           tenha múltiplos agentes (um para cada conexão WhatsApp)
-- Solução:  Trocar para constraint composta (user_id, connection_id)
-- Data: 2025-12-11
-- ============================================================================

-- 1. Remover a constraint UNIQUE antiga do user_id
ALTER TABLE public.ai_agents
DROP CONSTRAINT IF EXISTS ai_agents_user_id_key;

-- Também tentar remover caso o nome seja diferente
ALTER TABLE public.ai_agents
DROP CONSTRAINT IF EXISTS ai_agents_user_id_unique;

-- 2. Adicionar nova constraint UNIQUE composta (user_id + connection_id)
-- Isso permite:
--   - Um usuário ter múltiplos agentes (um por conexão)
--   - Cada conexão ter apenas UM agente configurado
ALTER TABLE public.ai_agents
ADD CONSTRAINT ai_agents_user_connection_unique UNIQUE (user_id, connection_id);

-- 3. Criar índice para performance nas consultas por connection_id
CREATE INDEX IF NOT EXISTS idx_ai_agents_connection_id
ON public.ai_agents(connection_id);

-- 4. Comentário explicativo
COMMENT ON TABLE public.ai_agents IS
'Tabela de configuração de agentes IA. Cada usuário pode ter um agente por conexão WhatsApp (constraint: user_id + connection_id).';
