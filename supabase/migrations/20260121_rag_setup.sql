-- ============================================================================
-- RAG (Retrieval-Augmented Generation) Setup for SwiftBot
-- Run this SQL in Supabase SQL Editor
-- This script is SAFE to run multiple times (uses IF NOT EXISTS and IF EXISTS)
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Update existing documents table OR create if not exists
-- ============================================================================

-- First, create table if it doesn't exist (for fresh installs)
CREATE TABLE IF NOT EXISTS documents (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding vector(1536),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Now add all the new columns to existing table
-- These are safe to run multiple times (ADD COLUMN IF NOT EXISTS)
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'text_input',
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS chunk_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_chunks integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS chunk_before text,
  ADD COLUMN IF NOT EXISTS chunk_after text,
  ADD COLUMN IF NOT EXISTS context_summary text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ============================================================================
-- STEP 3: Create document_categories table
-- Categories are created manually by the user
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#00FF99',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(agent_id, name)
);

-- ============================================================================
-- STEP 4: Add RAG and Media Response fields to ai_agents table
-- ============================================================================
ALTER TABLE ai_agents 
  ADD COLUMN IF NOT EXISTS rag_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rag_threshold numeric DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS rag_max_results integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS respond_to_text boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS respond_to_audio boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS respond_to_image boolean DEFAULT true;

-- ============================================================================
-- STEP 5: Create the match_documents function for similarity search
-- ============================================================================
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id bigint,
  content text,
  title text,
  category text,
  file_type text,
  chunk_number integer,
  context_summary text,
  chunk_before text,
  chunk_after text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.title,
    documents.category,
    documents.file_type,
    documents.chunk_number,
    documents.context_summary,
    documents.chunk_before,
    documents.chunk_after,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 
    -- Filter by agent_id (supports both new column and legacy metadata)
    (filter->>'agent_id' IS NULL 
      OR documents.agent_id::text = filter->>'agent_id'
      OR documents.metadata->>'agent_id' = filter->>'agent_id')
    -- Filter by category (optional)
    AND (filter->>'category' IS NULL OR documents.category = filter->>'category')
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- STEP 6: Enable RLS (Row Level Security)
-- ============================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can access all documents" ON documents;
DROP POLICY IF EXISTS "Service role can access all categories" ON document_categories;

-- Create policies for service role
CREATE POLICY "Service role can access all documents" ON documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all categories" ON document_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 7: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS documents_agent_id_idx ON documents (agent_id);
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents (category);
CREATE INDEX IF NOT EXISTS documents_agent_category_idx ON documents (agent_id, category);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'documents table' as check_item, 
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') as exists;

SELECT 'document_categories table' as check_item,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_categories') as exists;

SELECT 'match_documents function' as check_item,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'match_documents') as exists;

-- Check new columns in ai_agents
SELECT 'ai_agents new columns' as check_item, column_name 
FROM information_schema.columns 
WHERE table_name = 'ai_agents' 
AND column_name IN ('rag_enabled', 'respond_to_text', 'respond_to_audio', 'respond_to_image');

-- Check new columns in documents
SELECT 'documents new columns' as check_item, column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('agent_id', 'title', 'category', 'file_type', 'chunk_number');
