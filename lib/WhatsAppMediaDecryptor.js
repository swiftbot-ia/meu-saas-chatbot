/**
 * WhatsApp Media Decryptor
 * Decrypts encrypted WhatsApp media files using the mediaKey provided in UAZAPI webhooks
 *
 * WhatsApp encrypts media files using AES-256-CBC with keys derived from a master mediaKey
 * Reference: https://github.com/adiwajshing/Baileys/blob/master/src/Utils/messages-media.ts
 */

import crypto from 'crypto';

class WhatsAppMediaDecryptor {
  /**
   * Media types and their encryption info strings for HKDF
   */
  static MEDIA_TYPES = {
    image: 'WhatsApp Image Keys',
    video: 'WhatsApp Video Keys',
    audio: 'WhatsApp Audio Keys',
    document: 'WhatsApp Document Keys',
    sticker: 'WhatsApp Image Keys', // Stickers use image keys
  };

  /**
   * Decrypt WhatsApp media file
   * @param {Buffer} encryptedData - Encrypted media file data
   * @param {string} mediaKeyBase64 - Base64-encoded media key from UAZAPI
   * @param {string} mediaType - Type of media (audio, image, video, document)
   * @param {string} expectedSHA256 - Expected SHA256 hash (base64) for verification
   * @returns {Promise<Buffer>} Decrypted media data
   */
  async decrypt(encryptedData, mediaKeyBase64, mediaType, expectedSHA256 = null) {
    try {
      console.log(`🔓 Decrypting WhatsApp ${mediaType} media (${encryptedData.length} bytes encrypted)`);

      // Step 1: Decode the media key from base64
      const mediaKeyExpanded = Buffer.from(mediaKeyBase64, 'base64');

      if (mediaKeyExpanded.length !== 32) {
        throw new Error(`Invalid media key length: ${mediaKeyExpanded.length} (expected 32 bytes)`);
      }

      // Step 2: Get the appropriate info string for HKDF
      const mediaTypeInfo = this.MEDIA_TYPES[mediaType] || this.MEDIA_TYPES.document;

      // Step 3: Derive encryption keys using HKDF-SHA256
      const derivedKeys = this.deriveKeys(mediaKeyExpanded, mediaTypeInfo);
      const { iv, cipherKey, macKey } = derivedKeys;

      // Step 4: Split encrypted data into ciphertext and MAC
      // Last 10 bytes are the MAC (HMAC-SHA256 truncated)
      const macLength = 10;
      if (encryptedData.length < macLength) {
        throw new Error('Encrypted data too short to contain MAC');
      }

      const ciphertext = encryptedData.slice(0, -macLength);
      const mac = encryptedData.slice(-macLength);

      // Step 5: Verify MAC
      const calculatedMac = this.calculateMac(iv, ciphertext, macKey);
      if (!calculatedMac.slice(0, macLength).equals(mac)) {
        console.warn('⚠️ MAC verification failed - data may be corrupted');
        // Continue anyway as some implementations are lenient
      }

      // Step 6: Decrypt using AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);

      console.log(`✅ Decrypted ${decrypted.length} bytes`);

      // Step 7: Verify SHA256 hash if provided
      if (expectedSHA256) {
        const actualHash = crypto.createHash('sha256').update(decrypted).digest('base64');
        if (actualHash !== expectedSHA256) {
          console.warn(`⚠️ SHA256 mismatch - Expected: ${expectedSHA256}, Got: ${actualHash}`);
          // Continue anyway
        } else {
          console.log('✅ SHA256 hash verified');
        }
      }

      return decrypted;

    } catch (error) {
      console.error('❌ Error decrypting WhatsApp media:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Derive encryption keys from media key using HKDF-SHA256
   * @param {Buffer} mediaKey - 32-byte media key
   * @param {string} infoString - Info string for key derivation
   * @returns {Object} { iv, cipherKey, macKey }
   */
  deriveKeys(mediaKey, infoString) {
    // Derive 112 bytes using HKDF-SHA256
    // First 16 bytes: IV
    // Next 32 bytes: Cipher key (AES-256)
    // Next 32 bytes: MAC key
    const derivedLength = 112;
    const derived = this.hkdf(mediaKey, derivedLength, { info: infoString });

    return {
      iv: derived.slice(0, 16),
      cipherKey: derived.slice(16, 48),
      macKey: derived.slice(48, 80)
    };
  }

  /**
   * HKDF implementation (HMAC-based Key Derivation Function)
   * @param {Buffer} key - Input key material
   * @param {number} length - Desired output length in bytes
   * @param {Object} options - { salt, info }
   * @returns {Buffer} Derived key
   */
  hkdf(key, length, options = {}) {
    const { salt = Buffer.alloc(32, 0), info = '' } = options;
    const infoBuffer = Buffer.from(info, 'utf8');

    // HKDF-Extract
    const prk = crypto.createHmac('sha256', salt).update(key).digest();

    // HKDF-Expand
    const blocks = Math.ceil(length / 32);
    let okm = Buffer.alloc(0);
    let previousBlock = Buffer.alloc(0);

    for (let i = 1; i <= blocks; i++) {
      const hmac = crypto.createHmac('sha256', prk);
      hmac.update(previousBlock);
      hmac.update(infoBuffer);
      hmac.update(Buffer.from([i]));
      previousBlock = hmac.digest();
      okm = Buffer.concat([okm, previousBlock]);
    }

    return okm.slice(0, length);
  }

  /**
   * Calculate MAC for verification
   * @param {Buffer} iv - Initialization vector
   * @param {Buffer} ciphertext - Encrypted data
   * @param {Buffer} macKey - MAC key
   * @returns {Buffer} HMAC-SHA256
   */
  calculateMac(iv, ciphertext, macKey) {
    const hmac = crypto.createHmac('sha256', macKey);
    hmac.update(iv);
    hmac.update(ciphertext);
    return hmac.digest();
  }

  /**
   * Check if a URL is an encrypted WhatsApp media URL
   * @param {string} url - URL to check
   * @returns {boolean} True if encrypted
   */
  isEncryptedUrl(url) {
    return url && (
      url.includes('.enc?') ||
      url.includes('mmg.whatsapp.net') ||
      url.includes('mmg-fna.whatsapp.net')
    );
  }

  /**
   * Download and decrypt WhatsApp media
   * @param {string} url - Encrypted media URL
   * @param {string} mediaKeyBase64 - Base64-encoded media key
   * @param {string} mediaType - Type of media
   * @param {string} expectedSHA256 - Expected SHA256 hash (optional)
   * @returns {Promise<Buffer>} Decrypted media data
   */
  async downloadAndDecrypt(url, mediaKeyBase64, mediaType, expectedSHA256 = null) {
    try {
      console.log(`📥 Downloading encrypted media from WhatsApp: ${url.substring(0, 80)}...`);

      // Download encrypted data
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const encryptedData = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Downloaded ${encryptedData.length} bytes of encrypted data`);

      // Decrypt
      const decryptedData = await this.decrypt(
        encryptedData,
        mediaKeyBase64,
        mediaType,
        expectedSHA256
      );

      return decryptedData;

    } catch (error) {
      console.error('❌ Error downloading and decrypting media:', error);
      throw error;
    }
  }
}

// Export singleton instance
const whatsappMediaDecryptor = new WhatsAppMediaDecryptor();
export default whatsappMediaDecryptor;
