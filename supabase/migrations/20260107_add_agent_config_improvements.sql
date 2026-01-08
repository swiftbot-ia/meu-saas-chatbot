-- =============================================================================
-- Migração: Melhorias na Configuração do Agente IA
-- Data: 2026-01-07
-- Descrição: Adiciona 4 novos campos para melhorar a configuração do agente:
--   1. company_context: Contexto/história da empresa para a IA
--   2. product_urls: Array de links de produtos (substituindo product_url único)
--   3. response_mode: Modo de resposta (bloco único ou humanizado)
--   4. typing_speed: Velocidade de digitação simulada
-- =============================================================================

-- 1. Campo: Contexto da Empresa
-- Para armazenar informações institucionais que servem de contexto para a IA
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS company_context TEXT;

COMMENT ON COLUMN public.ai_agents.company_context IS 
'Informações institucionais da empresa (história, valores, políticas) que servem de contexto para a IA';

-- 2. Campo: Array de URLs de Produtos
-- Permite múltiplos links de produtos para o mesmo agente
-- Mantém compatibilidade retroativa com product_url existente
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS product_urls JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.ai_agents.product_urls IS 
'Array de links de produtos/serviços que o agente pode compartilhar';

-- 3. Campo: Modo de Resposta
-- 'single': Bloco único (uma mensagem grande)
-- 'humanized': Blocos humanizados (várias mensagens menores)
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'single';

COMMENT ON COLUMN public.ai_agents.response_mode IS 
'Modo de resposta: single (bloco único) ou humanized (blocos múltiplos humanizados)';

-- Constraint para garantir valores válidos
ALTER TABLE public.ai_agents 
DROP CONSTRAINT IF EXISTS ai_agents_response_mode_check;

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_response_mode_check 
CHECK (response_mode IN ('single', 'humanized'));

-- 4. Campo: Velocidade de Digitação
-- Controla o delay simulado de "digitando..." antes do envio
-- 'slow': Lento, 'normal': Normal, 'fast': Rápido
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS typing_speed TEXT DEFAULT 'normal';

COMMENT ON COLUMN public.ai_agents.typing_speed IS 
'Velocidade de digitação simulada: slow (lento), normal (padrão), fast (rápido)';

-- Constraint para garantir valores válidos
ALTER TABLE public.ai_agents 
DROP CONSTRAINT IF EXISTS ai_agents_typing_speed_check;

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_typing_speed_check 
CHECK (typing_speed IN ('slow', 'normal', 'fast'));

-- =============================================================================
-- Migração de dados existentes (product_url -> product_urls)
-- Se existir um product_url, adicionar ao array product_urls
-- =============================================================================
UPDATE public.ai_agents 
SET product_urls = jsonb_build_array(product_url)
WHERE product_url IS NOT NULL 
  AND product_url != '' 
  AND (product_urls IS NULL OR product_urls = '[]'::jsonb);

-- =============================================================================
-- Verificação da migração
-- =============================================================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'ai_agents'
      AND column_name IN ('company_context', 'product_urls', 'response_mode', 'typing_speed');
    
    IF col_count = 4 THEN
        RAISE NOTICE '✅ Migração concluída com sucesso! 4 novos campos adicionados à tabela ai_agents.';
    ELSE
        RAISE EXCEPTION '❌ Erro na migração: Esperados 4 campos, encontrados %', col_count;
    END IF;
END $$;
