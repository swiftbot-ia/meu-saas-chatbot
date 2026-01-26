-- Migration: Add instance_name and profile_pic_url columns to whatsapp_contacts
-- Description: Required for webhook contact creation
-- Apply this in Supabase SQL Editor

ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS instance_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;

COMMENT ON COLUMN whatsapp_contacts.instance_name IS 'Name of the WhatsApp instance connected';
COMMENT ON COLUMN whatsapp_contacts.profile_pic_url IS 'URL of the contact profile picture';
