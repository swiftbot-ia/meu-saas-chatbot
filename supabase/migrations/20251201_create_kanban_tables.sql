-- Add columns to whatsapp_conversations if they don't exist
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50) DEFAULT 'novo';
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS funnel_position INTEGER DEFAULT 0;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  conversation_id UUID REFERENCES whatsapp_conversations(id),
  funnel_stage VARCHAR(50) DEFAULT 'onboarding',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create history table
CREATE TABLE IF NOT EXISTS funnel_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'lead' or 'client' or 'conversation'
  entity_id UUID NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Chat Database (allowing anon access for API usage)

-- whatsapp_conversations (already exists, just ensuring policy)
CREATE POLICY "Allow anon select conversations" ON whatsapp_conversations FOR SELECT USING (true);
CREATE POLICY "Allow anon update conversations" ON whatsapp_conversations FOR UPDATE USING (true);

-- clients
CREATE POLICY "Allow anon select clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow anon insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update clients" ON clients FOR UPDATE USING (true);

-- funnel_stage_history
CREATE POLICY "Allow anon select history" ON funnel_stage_history FOR SELECT USING (true);
CREATE POLICY "Allow anon insert history" ON funnel_stage_history FOR INSERT WITH CHECK (true);
