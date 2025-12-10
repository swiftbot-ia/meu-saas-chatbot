-- ============================================================================
-- CRM Activities and Notes Tables
-- Created: 2025-12-11
-- Description: Tables for storing activities (calls, meetings, tasks, etc.)
--              and notes within each CRM opportunity (whatsapp_conversation)
-- ============================================================================

-- CRM Activities table
-- Stores scheduled activities for each opportunity
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'call', 'meeting', 'email', 'task', 'whatsapp', 'visit', 'closing'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- CRM Notes table
-- Stores notes for each opportunity (max 50 notes per opportunity, managed by application)
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for crm_activities
-- ============================================================================
CREATE POLICY "Allow anon select activities" ON crm_activities FOR SELECT USING (true);
CREATE POLICY "Allow anon insert activities" ON crm_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update activities" ON crm_activities FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete activities" ON crm_activities FOR DELETE USING (true);

-- ============================================================================
-- RLS Policies for crm_notes
-- ============================================================================
CREATE POLICY "Allow anon select notes" ON crm_notes FOR SELECT USING (true);
CREATE POLICY "Allow anon insert notes" ON crm_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update notes" ON crm_notes FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete notes" ON crm_notes FOR DELETE USING (true);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Activities indexes
CREATE INDEX idx_crm_activities_conversation ON crm_activities(conversation_id);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);
CREATE INDEX idx_crm_activities_instance ON crm_activities(instance_name);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_activities_completed ON crm_activities(completed_at);

-- Notes indexes
CREATE INDEX idx_crm_notes_conversation ON crm_notes(conversation_id);
CREATE INDEX idx_crm_notes_created ON crm_notes(created_at DESC);
CREATE INDEX idx_crm_notes_instance ON crm_notes(instance_name);
