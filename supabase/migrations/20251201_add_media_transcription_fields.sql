-- ============================================
-- MIGRATION: Add Media Storage and Transcription Fields
-- Created: 2025-12-01
-- Description: Adds fields to store local media files and transcriptions
-- ============================================

-- Add new columns to whatsapp_messages table
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS local_media_path TEXT,           -- Path to local media file on VPS
  ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(100),    -- MIME type of media
  ADD COLUMN IF NOT EXISTS media_size BIGINT,               -- File size in bytes
  ADD COLUMN IF NOT EXISTS transcription TEXT,              -- Transcription for audio/video
  ADD COLUMN IF NOT EXISTS transcription_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  ADD COLUMN IF NOT EXISTS ai_interpretation TEXT,          -- AI interpretation of media content
  ADD COLUMN IF NOT EXISTS media_downloaded_at TIMESTAMPTZ, -- When media was downloaded
  ADD COLUMN IF NOT EXISTS transcribed_at TIMESTAMPTZ;      -- When transcription was completed

-- Add index for transcription status
CREATE INDEX IF NOT EXISTS idx_messages_transcription_status
  ON whatsapp_messages(transcription_status)
  WHERE transcription_status IN ('pending', 'processing');

-- Add index for media type
CREATE INDEX IF NOT EXISTS idx_messages_media_type
  ON whatsapp_messages(message_type)
  WHERE message_type IN ('audio', 'video', 'document', 'image');

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_messages.local_media_path IS 'Local file path on VPS for downloaded media';
COMMENT ON COLUMN whatsapp_messages.transcription IS 'Audio/video transcription from OpenAI Whisper';
COMMENT ON COLUMN whatsapp_messages.transcription_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN whatsapp_messages.ai_interpretation IS 'AI interpretation/description of media content';
