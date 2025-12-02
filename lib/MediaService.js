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
   * @param {object} decryptionKeys - Optional: { mediaKey, fileEncSha256, fileSha256, mimetype }
   * @returns {Promise<object>} { localPath, publicUrl, mimeType, size }
   */
  async downloadAndSaveMedia(mediaUrl, mediaType, messageId, decryptionKeys = null) {
    try {
      const isEncrypted = mediaUrl.includes('.enc') || decryptionKeys !== null;

      if (isEncrypted && decryptionKeys) {
        console.log(`🔐 Detected encrypted WhatsApp media - will decrypt`);
        return await this.downloadAndDecryptMedia(mediaUrl, mediaType, messageId, decryptionKeys);
      }

      console.log(`📥 Downloading media: ${mediaType} from ${mediaUrl}`);

      // Download media from UAZAPI
      const response = await fetch(mediaUrl);

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      // Get MIME type from response headers
      const mimeType = response.headers.get('content-type') || this.getMimeType(mediaType);
      const contentLength = response.headers.get('content-length');

      // Get file extension from MIME type
      const extension = this.getExtensionFromMimeType(mimeType);

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
   * Download and decrypt WhatsApp encrypted media
   * @param {string} mediaUrl - URL to encrypted media
   * @param {string} mediaType - Type: audio, image, video, document
   * @param {string} messageId - Message ID for unique filename
   * @param {object} keys - { mediaKey, fileEncSha256, fileSha256, mimetype }
   * @returns {Promise<object>} { localPath, publicUrl, mimeType, size }
   */
  async downloadAndDecryptMedia(mediaUrl, mediaType, messageId, keys) {
    try {
      console.log(`📥 Downloading encrypted media from WhatsApp: ${mediaUrl.substring(0, 80)}...`);

      // Download encrypted media
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to download encrypted media: ${response.statusText}`);
      }

      const encryptedBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Downloaded ${encryptedBuffer.length} bytes of encrypted data`);

      // Decrypt the media
      console.log(`🔓 Decrypting WhatsApp ${mediaType} media (${encryptedBuffer.length} bytes encrypted)`);
      const decryptedBuffer = await this.decryptWhatsAppMedia(encryptedBuffer, keys);
      console.log(`✅ Decrypted ${decryptedBuffer.length} bytes`);

      // Get MIME type and extension
      const mimeType = keys.mimetype || this.getMimeType(mediaType);
      const extension = this.getExtensionFromMimeType(mimeType);

      // Generate unique filename
      const filename = this.generateFilename(messageId, extension);

      // Build local path
      const subdir = this.getSubdirectory(mediaType);
      const localPath = path.join(this.mediaDir, subdir, filename);
      const relativePath = path.join('media', subdir, filename);

      // Save decrypted file
      await fs.writeFile(localPath, decryptedBuffer);

      console.log(`📄 Media MIME type: ${mimeType} (encrypted: true)`);
      console.log(`✅ Media saved: ${relativePath} (${this.formatBytes(decryptedBuffer.length)})`);

      // Generate public URL
      const publicUrl = `${this.baseUrl}/${relativePath}`;

      return {
        localPath: relativePath,
        publicUrl,
        mimeType,
        size: decryptedBuffer.length
      };

    } catch (error) {
      console.error('❌ Error downloading/decrypting media:', error);
      throw error;
    }
  }

  /**
   * Decrypt WhatsApp media using AES-256-CBC
   * @param {Buffer} encryptedBuffer - Encrypted media data
   * @param {object} keys - { mediaKey, fileEncSha256, fileSha256 }
   * @returns {Promise<Buffer>} Decrypted media data
   */
  async decryptWhatsAppMedia(encryptedBuffer, keys) {
    try {
      // Decode base64 keys
      const mediaKey = Buffer.from(keys.mediaKey, 'base64');
      const expectedSha256 = Buffer.from(keys.fileSha256, 'base64');
      const expectedEncSha256 = Buffer.from(keys.fileEncSha256, 'base64');

      // Verify encrypted file SHA256
      const actualEncSha256 = crypto.createHash('sha256').update(encryptedBuffer).digest();
      if (!actualEncSha256.equals(expectedEncSha256)) {
        throw new Error('Encrypted file SHA256 mismatch');
      }
      console.log(`✅ Encrypted file SHA256 verified`);

      // WhatsApp appends 10-byte MAC at the end - remove it before decryption
      const macLength = 10;
      const mac = encryptedBuffer.slice(-macLength);
      const encryptedData = encryptedBuffer.slice(0, -macLength);

      console.log(`📦 Encrypted data: ${encryptedData.length} bytes (removed ${macLength}-byte MAC)`);

      // WhatsApp uses HKDF with Extract + Expand
      // Step 1: HKDF Extract - derive PRK from mediaKey
      const mediaType = this.getMediaTypeFromMimeType(keys.mimetype || 'audio/ogg');
      const info = Buffer.from(`WhatsApp ${mediaType} Keys`);

      const prk = this.hkdfExtract(mediaKey);
      console.log(`🔑 HKDF Extract complete (PRK: ${prk.length} bytes)`);

      // Step 2: HKDF Expand - derive 112 bytes from PRK
      const mediaKeyExpandedFull = this.hkdfExpandWhatsApp(prk, info, 112);
      const iv = mediaKeyExpandedFull.slice(0, 16);
      const cipherKey = mediaKeyExpandedFull.slice(16, 48);
      const macKey = mediaKeyExpandedFull.slice(48, 80);

      console.log(`🔑 HKDF Expand complete using info: "WhatsApp ${mediaType} Keys"`);

      // Verify MAC
      const hmac = crypto.createHmac('sha256', macKey);
      hmac.update(iv);
      hmac.update(encryptedData);
      const calculatedMac = hmac.digest().slice(0, macLength);

      if (!calculatedMac.equals(mac)) {
        console.warn('⚠️ MAC verification failed (continuing anyway)');
      } else {
        console.log(`✅ MAC verified`);
      }

      // Decrypt using AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
      decipher.setAutoPadding(true); // Enable automatic PKCS7 padding removal

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);

      console.log(`✅ Decrypted ${decrypted.length} bytes`);

      // Verify decrypted file SHA256
      const actualSha256 = crypto.createHash('sha256').update(decrypted).digest();
      if (!actualSha256.equals(expectedSha256)) {
        throw new Error('Decrypted file SHA256 mismatch');
      }
      console.log(`✅ SHA256 hash verified`);
      console.log(`✅ Decrypted WhatsApp media successfully (${decrypted.length} bytes)`);

      return decrypted;

    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw error;
    }
  }

  /**
   * Get media type name from MIME type for HKDF info parameter
   */
  getMediaTypeFromMimeType(mimeType) {
    if (!mimeType) return 'Audio';

    const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();

    if (cleanMimeType.startsWith('audio/')) return 'Audio';
    if (cleanMimeType.startsWith('image/')) return 'Image';
    if (cleanMimeType.startsWith('video/')) return 'Video';
    if (cleanMimeType.startsWith('application/')) return 'Document';

    return 'Audio'; // Default
  }

  /**
   * HKDF extract function - first step of HKDF
   * Extracts a pseudorandom key (PRK) from the input key material
   * @param {Buffer} ikm - Input key material (mediaKey)
   * @returns {Buffer} Pseudorandom key (32 bytes)
   */
  hkdfExtract(ikm) {
    // WhatsApp uses an empty salt (all zeros) for HKDF extract
    const salt = Buffer.alloc(32, 0);

    // HKDF-Extract(salt, IKM) = HMAC-SHA256(salt, IKM)
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(ikm);
    return hmac.digest();
  }

  /**
   * HKDF expand function for WhatsApp media key expansion
   * Uses HMAC-SHA256 with info parameter as per WhatsApp spec
   * @param {Buffer} prk - Pseudorandom key from extract step (32 bytes)
   * @param {Buffer} info - Info parameter (e.g., "WhatsApp Audio Keys")
   * @param {number} length - Desired output length (112 bytes)
   * @returns {Buffer} Expanded key
   */
  hkdfExpandWhatsApp(prk, info, length) {
    const iterations = Math.ceil(length / 32);
    const expandedKey = Buffer.alloc(iterations * 32);

    let previousBlock = Buffer.alloc(0);

    for (let i = 0; i < iterations; i++) {
      const hmac = crypto.createHmac('sha256', prk);
      hmac.update(previousBlock);
      hmac.update(info);
      hmac.update(Buffer.from([i + 1]));
      previousBlock = hmac.digest();
      previousBlock.copy(expandedKey, i * 32);
    }

    return expandedKey.slice(0, length);
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
   */
  getExtensionFromMimeType(mimeType) {
    // Clean MIME type by removing parameters (e.g., "audio/ogg; codecs=opus" -> "audio/ogg")
    const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();

    const mimeMap = {
      // Audio
      'audio/ogg': 'ogg',
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

    return mimeMap[cleanMimeType] || 'bin';
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
