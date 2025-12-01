/**
 * Media Service
 * Handles media download, storage, and serving
 * Downloads media from UAZAPI URLs and stores locally on VPS
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class MediaService {
  constructor() {
    // Base directory for media storage (public/media)
    this.mediaDir = path.join(process.cwd(), 'public', 'media');
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Initialize media storage directories
   */
  async initializeStorage() {
    try {
      // Create main media directory
      await fs.mkdir(this.mediaDir, { recursive: true });

      // Create subdirectories for different media types
      const subdirs = ['audio', 'image', 'video', 'document'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.mediaDir, subdir), { recursive: true });
      }

      console.log('✅ Media storage initialized:', this.mediaDir);
    } catch (error) {
      console.error('❌ Error initializing media storage:', error);
      throw error;
    }
  }

  /**
   * Download media from UAZAPI URL and save locally
   * @param {string} mediaUrl - URL from UAZAPI
   * @param {string} mediaType - Type: audio, image, video, document
   * @param {string} messageId - Message ID for unique filename
   * @param {string} knownMimeType - MIME type from UAZAPI payload (optional but preferred)
   * @returns {Promise<object>} { localPath, publicUrl, mimeType, size }
   */
  async downloadAndSaveMedia(mediaUrl, mediaType, messageId, knownMimeType = null) {
    try {
      console.log(`📥 Downloading media: ${mediaType} from ${mediaUrl}`);

      // Download media from UAZAPI
      const response = await fetch(mediaUrl);

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      // Determine MIME type (priority: knownMimeType > response header > default)
      let mimeType = knownMimeType;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const headerMimeType = response.headers.get('content-type');
        // Only use header if it's more specific than octet-stream
        if (headerMimeType && headerMimeType !== 'application/octet-stream') {
          mimeType = headerMimeType.split(';')[0].trim(); // Remove charset if present
        } else {
          mimeType = this.getMimeType(mediaType); // Fallback to default
        }
      }

      console.log(`📄 Detected MIME type: ${mimeType} (known: ${knownMimeType}, header: ${response.headers.get('content-type')})`);

      const contentLength = response.headers.get('content-length');

      // Get file extension from MIME type
      const extension = this.getExtensionFromMimeType(mimeType, mediaType);

      // Generate unique filename
      const filename = this.generateFilename(messageId, extension);

      // Build local path
      const subdir = this.getSubdirectory(mediaType);
      const localPath = path.join(this.mediaDir, subdir, filename);
      const relativePath = path.join('media', subdir, filename);

      // Download and save file
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(localPath, buffer);

      const fileSize = buffer.length;

      console.log(`✅ Media saved: ${relativePath} (${this.formatBytes(fileSize)})`);

      // Generate public URL
      const publicUrl = `${this.baseUrl}/${relativePath}`;

      return {
        localPath: relativePath,
        publicUrl,
        mimeType,
        size: fileSize
      };

    } catch (error) {
      console.error('❌ Error downloading media:', error);
      throw error;
    }
  }

  /**
   * Get subdirectory for media type
   */
  getSubdirectory(mediaType) {
    const subdirs = {
      audio: 'audio',
      image: 'image',
      video: 'video',
      document: 'document'
    };
    return subdirs[mediaType] || 'document';
  }

  /**
   * Generate unique filename
   */
  generateFilename(messageId, extension) {
    // Use message ID + timestamp + random hash for uniqueness
    const hash = crypto.createHash('md5').update(messageId + Date.now()).digest('hex').substring(0, 8);
    const sanitizedId = messageId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    return `${sanitizedId}_${hash}.${extension}`;
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type from headers or payload
   * @param {string} mediaType - Media type (audio, image, video, document) as fallback
   */
  getExtensionFromMimeType(mimeType, mediaType = null) {
    const mimeMap = {
      // Audio
      'audio/ogg': 'ogg',
      'audio/ogg; codecs=opus': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/aac': 'aac',

      // Image
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',

      // Video
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-matroska': 'mkv',

      // Documents
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar'
    };

    // Try exact match first
    if (mimeMap[mimeType]) {
      return mimeMap[mimeType];
    }

    // Try partial match (e.g., 'audio/ogg; codecs=opus' -> 'audio/ogg')
    const baseMimeType = mimeType?.split(';')[0]?.trim();
    if (baseMimeType && mimeMap[baseMimeType]) {
      return mimeMap[baseMimeType];
    }

    // Fallback based on mediaType if MIME type is unknown/generic
    if (mediaType) {
      const fallbackExtensions = {
        audio: 'ogg', // WhatsApp typically uses OGG for voice messages
        image: 'jpg',
        video: 'mp4',
        document: 'pdf'
      };
      const fallback = fallbackExtensions[mediaType];
      if (fallback) {
        console.warn(`⚠️ Unknown MIME type '${mimeType}', using fallback extension '${fallback}' for ${mediaType}`);
        return fallback;
      }
    }

    // Last resort
    console.warn(`⚠️ Unknown MIME type '${mimeType}' with no mediaType fallback, defaulting to 'bin'`);
    return 'bin';
  }

  /**
   * Get default MIME type for media type
   */
  getMimeType(mediaType) {
    const defaults = {
      audio: 'audio/ogg',
      image: 'image/jpeg',
      video: 'video/mp4',
      document: 'application/octet-stream'
    };
    return defaults[mediaType] || 'application/octet-stream';
  }

  /**
   * Check if file exists
   */
  async fileExists(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(relativePath) {
    try {
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      await fs.unlink(fullPath);
      console.log(`🗑️ Media deleted: ${relativePath}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting media:', error);
      return false;
    }
  }

  /**
   * Get public URL for local media
   */
  getPublicUrl(relativePath) {
    return `${this.baseUrl}/${relativePath}`;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Check if media type requires transcription
   */
  requiresTranscription(mediaType) {
    return mediaType === 'audio' || mediaType === 'video';
  }

  /**
   * Convert audio to format supported by OpenAI Whisper
   * UAZAPI sends OGG or MP3, both are supported by Whisper
   * @param {string} localPath - Path to audio file
   * @returns {Promise<string>} Path to converted file or original if already supported
   */
  async prepareAudioForTranscription(localPath) {
    // OpenAI Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    // UAZAPI typically sends OGG or MP3
    // OGG is not directly supported, we'd need to convert to MP3

    const fullPath = path.join(process.cwd(), 'public', localPath);
    const ext = path.extname(fullPath).toLowerCase();

    // Supported formats
    const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];

    if (supportedFormats.includes(ext)) {
      console.log(`✅ Audio format ${ext} is supported by Whisper`);
      return fullPath;
    }

    // If OGG, we need to convert to MP3
    // For now, we'll return the path and handle conversion if needed
    // This would require ffmpeg installed on the server
    console.warn(`⚠️ Audio format ${ext} may need conversion for Whisper`);
    return fullPath;
  }
}

// Export singleton instance
const mediaService = new MediaService();
export default mediaService;
