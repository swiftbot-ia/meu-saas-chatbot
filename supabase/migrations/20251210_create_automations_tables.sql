-- Migration: Create Automations Tables
-- Description: Creates tables for the automations module including keywords, responses, sequences, and folders

-- ============================================================================
-- Tabela principal de automações
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  type varchar(50) NOT NULL DEFAULT 'keyword', -- 'keyword', 'sequence', 'flow'
  trigger_type varchar(50), -- 'message_contains', 'message_is', 'message_starts_with', 'reaction'
  is_active boolean DEFAULT true,
  folder_id uuid,
  execution_count integer DEFAULT 0,
  ctr_percentage decimal(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automations_pkey PRIMARY KEY (id),
  CONSTRAINT automations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT automations_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE
);

-- ============================================================================
-- Palavras-chave/gatilhos para automações do tipo keyword
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL,
  keyword varchar(255) NOT NULL,
  match_type varchar(50) NOT NULL DEFAULT 'contains', -- 'contains', 'is', 'starts_with', 'word'
  is_case_sensitive boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_keywords_pkey PRIMARY KEY (id),
  CONSTRAINT automation_keywords_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Respostas/ações para automações
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL,
  response_type varchar(50) NOT NULL DEFAULT 'text', -- 'text', 'image', 'audio', 'document', 'button'
  content text NOT NULL,
  media_url text,
  delay_seconds integer DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_responses_pkey PRIMARY KEY (id),
  CONSTRAINT automation_responses_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Sequências (follow-ups programados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  subscribers_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT automation_sequences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT automation_sequences_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE
);

-- ============================================================================
-- Steps/etapas de uma sequência
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_sequence_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  automation_id uuid,
  delay_value integer NOT NULL DEFAULT 1,
  delay_unit varchar(20) NOT NULL DEFAULT 'days', -- 'minutes', 'hours', 'days'
  send_time time,
  send_day varchar(20), -- 'any', 'weekdays', 'weekends'
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_sequence_steps_pkey PRIMARY KEY (id),
  CONSTRAINT automation_sequence_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  CONSTRAINT automation_sequence_steps_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE SET NULL
);

-- ============================================================================
-- Inscrições de contatos em sequências
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_sequence_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  next_step_at timestamp with time zone,
  completed_at timestamp with time zone,
  status varchar(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'unsubscribed'
  CONSTRAINT automation_sequence_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT automation_sequence_subscriptions_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.automation_sequences(id) ON DELETE CASCADE
);

-- ============================================================================
-- Pastas para organização
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_folders_pkey PRIMARY KEY (id),
  CONSTRAINT automation_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT automation_folders_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE
);

-- ============================================================================
-- Índices para performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_connection_id ON public.automations(connection_id);
CREATE INDEX IF NOT EXISTS idx_automations_type ON public.automations(type);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_keywords_automation_id ON public.automation_keywords(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_keywords_keyword ON public.automation_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_automation_responses_automation_id ON public.automation_responses(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_sequences_user_id ON public.automation_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_sequences_connection_id ON public.automation_sequences(connection_id);
CREATE INDEX IF NOT EXISTS idx_automation_sequence_steps_sequence_id ON public.automation_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_automation_sequence_subscriptions_sequence_id ON public.automation_sequence_subscriptions(sequence_id);
CREATE INDEX IF NOT EXISTS idx_automation_sequence_subscriptions_contact_id ON public.automation_sequence_subscriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_folders_user_id ON public.automation_folders(user_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequence_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_folders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Automations policies
DROP POLICY IF EXISTS "Users can view own automations" ON public.automations;
CREATE POLICY "Users can view own automations" ON public.automations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own automations" ON public.automations;
CREATE POLICY "Users can insert own automations" ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own automations" ON public.automations;
CREATE POLICY "Users can update own automations" ON public.automations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own automations" ON public.automations;
CREATE POLICY "Users can delete own automations" ON public.automations
  FOR DELETE USING (auth.uid() = user_id);

-- Keywords policies
DROP POLICY IF EXISTS "Users can manage own keywords" ON public.automation_keywords;
CREATE POLICY "Users can manage own keywords" ON public.automation_keywords
  FOR ALL USING (automation_id IN (SELECT id FROM public.automations WHERE user_id = auth.uid()));

-- Responses policies
DROP POLICY IF EXISTS "Users can manage own responses" ON public.automation_responses;
CREATE POLICY "Users can manage own responses" ON public.automation_responses
  FOR ALL USING (automation_id IN (SELECT id FROM public.automations WHERE user_id = auth.uid()));

-- Sequences policies
DROP POLICY IF EXISTS "Users can view own sequences" ON public.automation_sequences;
CREATE POLICY "Users can view own sequences" ON public.automation_sequences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sequences" ON public.automation_sequences;
CREATE POLICY "Users can insert own sequences" ON public.automation_sequences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sequences" ON public.automation_sequences;
CREATE POLICY "Users can update own sequences" ON public.automation_sequences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sequences" ON public.automation_sequences;
CREATE POLICY "Users can delete own sequences" ON public.automation_sequences
  FOR DELETE USING (auth.uid() = user_id);

-- Sequence steps policies
DROP POLICY IF EXISTS "Users can manage own sequence steps" ON public.automation_sequence_steps;
CREATE POLICY "Users can manage own sequence steps" ON public.automation_sequence_steps
  FOR ALL USING (sequence_id IN (SELECT id FROM public.automation_sequences WHERE user_id = auth.uid()));

-- Sequence subscriptions policies
DROP POLICY IF EXISTS "Users can manage own sequence subscriptions" ON public.automation_sequence_subscriptions;
CREATE POLICY "Users can manage own sequence subscriptions" ON public.automation_sequence_subscriptions
  FOR ALL USING (sequence_id IN (SELECT id FROM public.automation_sequences WHERE user_id = auth.uid()));

-- Folders policies
DROP POLICY IF EXISTS "Users can view own folders" ON public.automation_folders;
CREATE POLICY "Users can view own folders" ON public.automation_folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own folders" ON public.automation_folders;
CREATE POLICY "Users can insert own folders" ON public.automation_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON public.automation_folders;
CREATE POLICY "Users can update own folders" ON public.automation_folders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON public.automation_folders;
CREATE POLICY "Users can delete own folders" ON public.automation_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key for folder_id in automations (after folders table is created)
ALTER TABLE public.automations 
  ADD CONSTRAINT automations_folder_id_fkey 
  FOREIGN KEY (folder_id) REFERENCES public.automation_folders(id) ON DELETE SET NULL;
