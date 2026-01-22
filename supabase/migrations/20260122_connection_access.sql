-- =============================================================================
-- Migration: Connection Access Control
-- Date: 2026-01-22
-- Description: Adiciona controle de acesso às conexões WhatsApp por membro
-- =============================================================================

-- Criar tabela de acesso a conexões
CREATE TABLE IF NOT EXISTS public.member_connection_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.account_members(id) ON DELETE CASCADE,
    connection_id uuid NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT member_connection_access_unique UNIQUE(member_id, connection_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_member_connection_access_member 
ON public.member_connection_access(member_id);

CREATE INDEX IF NOT EXISTS idx_member_connection_access_connection 
ON public.member_connection_access(connection_id);

-- Comentários para documentação
COMMENT ON TABLE public.member_connection_access IS 'Mapeia quais conexões WhatsApp cada membro pode acessar';
COMMENT ON COLUMN public.member_connection_access.member_id IS 'Referência ao membro da equipe';
COMMENT ON COLUMN public.member_connection_access.connection_id IS 'Referência à conexão WhatsApp';

-- Conceder acesso total aos owners e managers existentes
INSERT INTO public.member_connection_access (member_id, connection_id)
SELECT am.id, wc.id
FROM public.account_members am
JOIN public.accounts a ON am.account_id = a.id
JOIN public.whatsapp_connections wc ON wc.user_id = a.owner_user_id
WHERE am.role IN ('owner', 'manager')
ON CONFLICT (member_id, connection_id) DO NOTHING;

-- =============================================================================
-- NOTA IMPORTANTE:
-- Esta migration cria a base para controle granular de acesso às conexões.
-- 
-- Regras:
-- - Owners: Acesso automático a todas as conexões (mantido via trigger ou app)
-- - Managers: Acesso padrão a todas, mas pode ser limitado
-- - Consultants: Controle manual de quais conexões podem acessar
-- 
-- Queries importantes:
-- 
-- Ver acessos de um membro:
-- SELECT wc.phone_number, wc.status 
-- FROM member_connection_access mca
-- JOIN whatsapp_connections wc ON mca.connection_id = wc.id
-- WHERE mca.member_id = 'uuid-do-membro';
-- 
-- Ver quem tem acesso a uma conexão:
-- SELECT up.full_name, am.role
-- FROM member_connection_access mca
-- JOIN account_members am ON mca.member_id = am.id
-- JOIN user_profiles up ON am.user_id = up.user_id
-- WHERE mca.connection_id = 'uuid-da-conexao';
-- =============================================================================
