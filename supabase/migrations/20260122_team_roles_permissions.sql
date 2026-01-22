-- =============================================================================
-- Migration: Team Roles and Permissions Enhancement
-- Date: 2026-01-22
-- Description: Adiciona roles hierárquicos (manager, consultant) e permissões
--              de atribuição à tabela account_members
-- =============================================================================

-- 1. Remover a constraint antiga e criar nova com os roles expandidos
ALTER TABLE public.account_members 
DROP CONSTRAINT IF EXISTS account_members_role_check;

ALTER TABLE public.account_members 
ADD CONSTRAINT account_members_role_check 
CHECK (role::text = ANY (ARRAY['owner', 'manager', 'consultant', 'member']::text[]));

-- 2. Adicionar colunas de permissões de atribuição
ALTER TABLE public.account_members
ADD COLUMN IF NOT EXISTS can_assign_self boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_assign_others boolean DEFAULT true;

-- 3. Atualizar permissões padrão para roles existentes:

-- Proprietários e Gestores podem tudo
UPDATE public.account_members 
SET can_assign_self = true, can_assign_others = true 
WHERE role IN ('owner', 'manager');

-- Membros existentes (tratados como consultores na prática) 
-- podem atribuir a si mesmos mas não a outros
UPDATE public.account_members 
SET can_assign_self = true, can_assign_others = false 
WHERE role = 'member';

-- Consultores: mesma regra - podem atribuir a si mesmos, não a outros
UPDATE public.account_members 
SET can_assign_self = true, can_assign_others = false 
WHERE role = 'consultant';

-- =============================================================================
-- NOTA IMPORTANTE:
-- O limite de membros agora é calculado dinamicamente:
-- max_members = connections_purchased * 3
-- 
-- Exemplo:
-- - 1 conexão = 3 usuários máximo
-- - 2 conexões = 6 usuários máximo
-- - 3 conexões = 9 usuários máximo
--
-- A coluna accounts.max_members continua existindo para compatibilidade,
-- mas o cálculo dinâmico tem prioridade no código.
-- =============================================================================
