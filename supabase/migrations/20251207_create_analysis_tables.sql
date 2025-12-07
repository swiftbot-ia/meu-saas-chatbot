-- ============================================
-- MIGRATION: Conversation Analysis Tables
-- Created: 2025-12-07
-- Description: Tables for storing conversation analysis reports
-- Run this on MAIN Supabase (Sistema) - NOT on Chat
-- ============================================

-- ============================================
-- TABELA: conversation_analysis_reports
-- Armazena relatórios de análise por conexão
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_analysis_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    connection_id uuid NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
    connection_name character varying(255),
    
    -- Metadados da análise
    analysis_date timestamp with time zone DEFAULT now(),
    period_start timestamp with time zone,
    period_end timestamp with time zone,
    total_messages integer,
    total_contacts integer,
    messages_incoming integer,
    messages_outgoing integer,
    
    -- Status da análise
    status character varying(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    error_message text,
    processing_time_ms integer,
    
    -- Relatório Completo (JSON estruturado)
    report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Métricas resumidas (para queries rápidas)
    metrics jsonb,
    
    -- Base de conhecimento extraída (para IA)
    knowledge_base jsonb,
    
    -- Configuração sugerida de agente
    suggested_agent_config jsonb,
    
    -- Controle
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    
    CONSTRAINT conversation_analysis_reports_pkey PRIMARY KEY (id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analysis_reports_connection ON conversation_analysis_reports(connection_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_status ON conversation_analysis_reports(status);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_date ON conversation_analysis_reports(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_by ON conversation_analysis_reports(created_by);

-- Trigger para updated_at (reutiliza função existente se existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_analysis_reports_updated_at ON conversation_analysis_reports;
CREATE TRIGGER update_analysis_reports_updated_at
    BEFORE UPDATE ON conversation_analysis_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: knowledge_base_entries
-- Entradas individuais da base de conhecimento
-- Para consultas mais granulares
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES conversation_analysis_reports(id) ON DELETE CASCADE,
    connection_id uuid NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
    
    -- Categorização
    category character varying(100) NOT NULL, -- 'faq', 'objection', 'script', 'price', 'product', 'tone'
    subcategory character varying(100),
    
    -- Conteúdo
    question text,
    answer text,
    context text,
    
    -- Metadados
    frequency integer DEFAULT 1,
    effectiveness_score numeric(3,2),
    tags text[],
    
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT knowledge_base_entries_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kb_entries_connection ON knowledge_base_entries(connection_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_category ON knowledge_base_entries(category);
CREATE INDEX IF NOT EXISTS idx_kb_entries_report ON knowledge_base_entries(report_id);

-- ============================================
-- VIEW: latest_reports_per_connection
-- Último relatório de cada conexão
-- ============================================
DROP VIEW IF EXISTS latest_reports_per_connection;
CREATE VIEW latest_reports_per_connection AS
SELECT DISTINCT ON (connection_id)
    id,
    connection_id,
    connection_name,
    analysis_date,
    status,
    total_messages,
    total_contacts,
    metrics,
    knowledge_base,
    suggested_agent_config,
    created_by
FROM conversation_analysis_reports
WHERE status = 'completed'
ORDER BY connection_id, analysis_date DESC;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE conversation_analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports for their connections
CREATE POLICY "Users can view own reports" ON conversation_analysis_reports
    FOR SELECT
    USING (
        connection_id IN (
            SELECT id FROM whatsapp_connections WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert reports for their connections
CREATE POLICY "Users can insert own reports" ON conversation_analysis_reports
    FOR INSERT
    WITH CHECK (
        connection_id IN (
            SELECT id FROM whatsapp_connections WHERE user_id = auth.uid()
        )
    );

-- Policy: Knowledge base entries follow same pattern
CREATE POLICY "Users can view own kb entries" ON knowledge_base_entries
    FOR SELECT
    USING (
        connection_id IN (
            SELECT id FROM whatsapp_connections WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own kb entries" ON knowledge_base_entries
    FOR INSERT
    WITH CHECK (
        connection_id IN (
            SELECT id FROM whatsapp_connections WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- COMMENTS for Documentation
-- ============================================
COMMENT ON TABLE conversation_analysis_reports IS 'Stores AI-generated analysis reports for WhatsApp conversations';
COMMENT ON TABLE knowledge_base_entries IS 'Individual knowledge base entries extracted from analysis (FAQs, objections, etc)';
COMMENT ON VIEW latest_reports_per_connection IS 'Quick access to the most recent completed report for each connection';
