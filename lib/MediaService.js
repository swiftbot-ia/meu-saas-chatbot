/**
 * Media Service
 * Handles media download, upload to Supabase Storage, and transcription
 */

import { createChatSupabaseClient } from './supabase/chat-client';
import OpenAI from 'openai';
import { createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

class MediaService {
  /**
   * Download media from URL to temporary file
   */
  static async downloadMedia(mediaUrl, fileName = null) {
    try {
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      // Generate temp file path
      const tempFileName = fileName || `${randomUUID()}`;
      const tempFilePath = path.join(tmpdir(), tempFileName);

      // Download to temp file
      await pipeline(response.body, createWriteStream(tempFilePath));

      return {
        filePath: tempFilePath,
        contentType: response.headers.get('content-type'),
        size: response.headers.get('content-length')
      };
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }

  /**
   * Upload media file to Supabase Storage
   * Returns public URL
   */
  static async uploadToStorage(filePath, fileName, contentType, bucket = 'whatsapp-media') {
    const chatSupabase = createChatSupabaseClient();

    try {
      // Read file
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(filePath);

      // Generate unique file name
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await chatSupabase.storage
        .from(bucket)
        .upload(uniqueFileName, fileBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to storage:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = chatSupabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadToStorage:', error);
      throw error;
    }
  }

  /**
   * Process media message: download and upload to storage
   * Returns public URL for the media
   */
  static async processMedia(mediaUrl, fileName, mediaType) {
    try {
      console.log(`📥 Downloading ${mediaType}:`, mediaUrl);

      // Download media
      const { filePath, contentType } = await this.downloadMedia(mediaUrl, fileName);

      // Upload to Supabase Storage
      const publicUrl = await this.uploadToStorage(
        filePath,
        fileName,
        contentType || this.getDefaultContentType(mediaType)
      );

      // Clean up temp file
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete temp file:', e);
      }

      console.log(`✅ Media uploaded:`, publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error processing media:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  static async transcribeAudio(audioFilePath) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY not configured, skipping transcription');
        return null;
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      console.log('🎤 Transcribing audio with OpenAI Whisper...');

      const fs = await import('fs');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: 'pt' // Portuguese
      });

      console.log('✅ Audio transcribed:', transcription.text);
      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Don't throw - transcription is optional
      return null;
    }
  }

  /**
   * Process audio message: download, upload, and transcribe
   */
  static async processAudio(audioUrl, fileName) {
    try {
      console.log('🎤 Processing audio message...');

      // Download audio
      const { filePath, contentType } = await this.downloadMedia(audioUrl, fileName);

      // Transcribe audio (optional)
      let transcription = null;
      if (process.env.OPENAI_API_KEY) {
        transcription = await this.transcribeAudio(filePath);
      }

      // Upload to storage
      const publicUrl = await this.uploadToStorage(
        filePath,
        fileName,
        contentType || 'audio/ogg'
      );

      // Clean up temp file
      try {
        unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete temp file:', e);
      }

      return {
        url: publicUrl,
        transcription
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Get default content type for media type
   */
  static getDefaultContentType(mediaType) {
    const contentTypes = {
      image: 'image/jpeg',
      video: 'video/mp4',
      audio: 'audio/ogg',
      document: 'application/pdf',
      sticker: 'image/webp'
    };

    return contentTypes[mediaType] || 'application/octet-stream';
  }

  /**
   * Get file extension from media type
   */
  static getFileExtension(mediaType) {
    const extensions = {
      image: 'jpg',
      video: 'mp4',
      audio: 'ogg',
      document: 'pdf',
      sticker: 'webp'
    };

    return extensions[mediaType] || 'bin';
  }

  /**
   * Generate file name for media
   */
  static generateFileName(messageId, mediaType) {
    const ext = this.getFileExtension(mediaType);
    return `${messageId}.${ext}`;
  }
}

export default MediaService;
