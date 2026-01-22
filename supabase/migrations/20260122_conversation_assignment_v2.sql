-- Add assigned_to column to whatsapp_conversations table
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON whatsapp_conversations(assigned_to);

-- Comentário: O assigned_to será usado para definir o "dono" da conversa.
-- Se NULL, a conversa está "livre" (visível para todos os consultores com acesso à conexão).
-- Se preenchido, visível apenas para o assigned_to + Gestores/Owners.
