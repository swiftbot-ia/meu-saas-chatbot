-- Migration: Add email column to whatsapp_contacts
-- Description: Required because incoming webhooks are trying to insert email addresses
-- Apply this in Supabase SQL Editor

ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_email ON whatsapp_contacts(email);

COMMENT ON COLUMN whatsapp_contacts.email IS 'Email address from external integrations';
