/**
 * ============================================================================
 * Media Service VPS
 * ============================================================================
 * Gerencia download e armazenamento de mídias do WhatsApp na VPS
 * 
 * - Salva arquivos em /public/media/{tipo}/
 * - Valida tamanho limite por tipo
 * - Integra com OpenAI para transcrição e interpretação
 * - NUNCA usa URLs diretas do WhatsApp (expiram em 24h)
 * 
 * Limites:
 * - Imagens: 5MB
 * - Vídeos: 50MB
 * - Documentos: 1MB
 * - Áudios: 10MB
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { randomBytes } from 'crypto';
import OpenAIService from './OpenAIService';

class MediaServiceVPS {
    // Limites de tamanho por tipo (em bytes)
    static MAX_SIZES = {
        image: 5 * 1024 * 1024,     // 5MB
        video: 50 * 1024 * 1024,    // 50MB
        document: 1 * 1024 * 1024,  // 1MB
        audio: 10 * 1024 * 1024     // 10MB
    };

    // Diretórios base para cada tipo de mídia
    static MEDIA_DIRS = {
        image: 'image',
        video: 'video',
        document: 'document',
        audio: 'audio'
    };

    /**
     * Gera nome único para arquivo
     * Formato: {messageId}_{random}.{ext}
     */
    static generateFileName(messageId, extension) {
        const random = randomBytes(4).toString('hex');
        return `${messageId}_${random}.${extension}`;
    }

    /**
     * Detecta extensão do arquivo baseado no mimetype
     */
    static getExtensionFromMimeType(mimeType) {
        const mimeMap = {
            // Imagens
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',

            // Vídeos
            'video/mp4': 'mp4',
            'video/3gpp': '3gp',
            'video/quicktime': 'mov',
            'video/webm': 'webm',

            // Áudios
            'audio/ogg': 'ogg',
            'audio/ogg; codecs=opus': 'ogg',
            'audio/mpeg': 'mp3',
            'audio/mp4': 'm4a',
            'audio/aac': 'aac',
            'audio/wav': 'wav',

            // Documentos
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/plain': 'txt'
        };

        return mimeMap[mimeType] || 'bin';
    }

    /**
     * Baixa imagem via UAZapi (descriptografa automaticamente)
     * Usado para imagens criptografadas do WhatsApp (.enc)
     * 
     * @param {string} messageId - ID da mensagem
     * @param {string} token - Token da instância UAZapi
     * @returns {Promise<object>} { localPath, fullPath, mimeType, size, fileName }
     */
    static async downloadImageFromUAZapi(messageId, token) {
        try {
            console.log(`📥 [MediaVPS] Downloading image via UAZapi (decryption)...`);

            const response = await fetch('https://swiftbot.uazapi.com/message/download', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'token': token
                },
                body: JSON.stringify({
                    id: messageId,
                    return_base64: false
                })
            });

            if (!response.ok) {
                throw new Error(`UAZapi download failed: ${response.status}`);
            }

            const data = await response.json();

            // DEBUG: Ver o que UAZapi retorna
            console.log(`🔍 [MediaVPS] UAZapi Response:`, JSON.stringify(data).substring(0, 200));

            // UAZapi retorna formato diferente para imagem vs áudio:
            // Imagem: { fileURL: "...", mimetype: "..." }
            // Áudio: { success: true, fileURL: "..." }
            if (!data.fileURL) {
                console.error(`❌ [MediaVPS] UAZapi response missing fileURL:`, data);
                throw new Error('UAZapi did not return fileURL');
            }

            // Corrigir typo comum (htps → https)
            let imageUrl = data.fileURL.replace(/^htps:\/\//, 'https://');

            console.log(`📥 [MediaVPS] Downloading decrypted image from: ${imageUrl}`);

            // Baixar a imagem descriptografada
            const imageResponse = await fetch(imageUrl);

            if (!imageResponse.ok) {
                throw new Error(`Failed to download image from ${imageUrl}: ${imageResponse.status}`);
            }

            // Detectar extensão do Content-Type
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            const extension = this.getExtensionFromMimeType(contentType);

            // Salvar imagem
            const fileName = this.generateFileName(messageId, extension);
            const fullPath = path.join(process.cwd(), 'public', 'media', 'image', fileName);
            const localPath = `/media/image/${fileName}`;

            // Garantir diretório existe
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Salvar arquivo
            const fileStream = createWriteStream(fullPath);
            await pipeline(imageResponse.body, fileStream);

            const stats = fs.statSync(fullPath);

            // VALIDAR: Imagem deve ter pelo menos 1KB
            if (stats.size < 1024) {
                fs.unlinkSync(fullPath); // Deletar arquivo inválido
                throw new Error(`Downloaded image is too small (${stats.size} bytes) - likely corrupted`);
            }

            console.log(`✅ [MediaVPS] Image saved (decrypted): ${localPath} (${(stats.size / 1024).toFixed(2)}KB)`);

            return {
                localPath,
                fullPath,
                mimeType: contentType,
                size: stats.size,
                fileName
            };

        } catch (error) {
            console.error(`❌ [MediaVPS] UAZapi image download failed:`, error.message);
            throw error;
        }
    }

    /**
     * Baixa mídia da URL do WhatsApp e salva na VPS
     * 
     * @param {string} mediaUrl - URL da mídia (WhatsApp)
     * @param {string} mediaType - Tipo: image, video, audio, document
     * @param {string} messageId - ID da mensagem (para nome do arquivo)
     * @param {object} metadata - Metadados adicionais (mimetype, fileName, etc)
     * @returns {Promise<object>} { localPath, fullPath, mimeType, size, fileName }
     */
    static async downloadAndSave(mediaUrl, mediaType, messageId, metadata = {}) {
        try {
            console.log(`📥 [MediaVPS] Downloading ${mediaType} from WhatsApp...`);

            // 1. Download da URL
            const response = await fetch(mediaUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SwiftBot/1.0)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 2. Validar tamanho
            const contentLength = parseInt(response.headers.get('content-length') || '0');
            const maxSize = this.MAX_SIZES[mediaType] || this.MAX_SIZES.document;

            if (contentLength > maxSize) {
                throw new Error(
                    `File too large: ${(contentLength / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024)}MB`
                );
            }

            // 3. Determinar extensão
            // IMPORTANTE: Priorizar metadata.mimetype (do payload) sobre Content-Type (HTTP)
            // Porque URLs do WhatsApp frequentemente não retornam Content-Type correto
            const mimeType = metadata.mimetype || response.headers.get('content-type') || 'application/octet-stream';
            let extension = this.getExtensionFromMimeType(mimeType);

            // Fallback: se não conseguiu detectar extensão, usar tipo de mídia
            if (extension === 'bin') {
                const fallbackExtensions = {
                    audio: 'ogg',
                    image: 'jpg',
                    video: 'mp4',
                    document: 'pdf'
                };
                extension = fallbackExtensions[mediaType] || 'bin';
                console.log(`⚠️ [MediaVPS] Content-Type não detectado, usando fallback: .${extension}`);
            }

            // 4. Gerar nome e caminho do arquivo
            const fileName = metadata.fileName || this.generateFileName(messageId, extension);
            const mediaDir = this.MEDIA_DIRS[mediaType] || 'document';

            // Caminho relativo (para salvar no banco): /media/{tipo}/{arquivo}
            const relativePath = `/media/${mediaDir}/${fileName}`;

            // Caminho completo no sistema: /var/www/swiftbot/public/media/{tipo}/{arquivo}
            const fullPath = path.join(process.cwd(), 'public', 'media', mediaDir, fileName);

            // 5. Garantir que o diretório existe
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 6. Salvar arquivo
            const fileStream = createWriteStream(fullPath);
            await pipeline(response.body, fileStream);

            // 7. Verificar tamanho real do arquivo salvo
            const stats = fs.statSync(fullPath);
            const actualSize = stats.size;

            console.log(`✅ [MediaVPS] Saved: ${relativePath} (${(actualSize / 1024).toFixed(2)}KB)`);

            return {
                localPath: relativePath,      // /media/audio/msg_123_a1b2c3d4.ogg
                fullPath: fullPath,            // /var/www/swiftbot/public/media/audio/...
                mimeType: mimeType,
                size: actualSize,
                fileName: fileName
            };

        } catch (error) {
            console.error(`❌ [MediaVPS] Download failed:`, error.message);
            throw error;
        }
    }

    /**
     * Processa mídia: download + transcrição/interpretação OpenAI
     * 
     * @param {string} mediaUrl - URL da mídia
     * @param {string} mediaType - image, audio, video, document
     * @param {string} messageId - ID da mensagem
     * @param {object} metadata - Metadados (mimetype, caption, instanceToken, etc)
     * @returns {Promise<object>} { localPath, fullPath, mimeType, size, transcription, aiInterpretation, ... }
     */
    static async processMedia(mediaUrl, mediaType, messageId, metadata = {}) {
        try {
            console.log(`🔄 [MediaVPS] Processing ${mediaType}...`);

            let fileInfo;

            // IMAGEM: Usar endpoint UAZapi para descriptografar (.enc)
            if (mediaType === 'image' && metadata.instanceToken) {
                try {
                    fileInfo = await this.downloadImageFromUAZapi(messageId, metadata.instanceToken);
                } catch (uazapiError) {
                    console.warn(`⚠️ [MediaVPS] UAZapi image decryption failed, using direct download:`, uazapiError.message);
                    // Fallback: download direto (pode ser criptografado)
                    fileInfo = await this.downloadAndSave(mediaUrl, mediaType, messageId, metadata);
                }
            }
            // ÁUDIO: Usar endpoint UAZapi para converter OGG/OPUS para MP3
            else if (mediaType === 'audio' && metadata.instanceToken) {
                try {
                    console.log(`🎵 [MediaVPS] Downloading audio via UAZapi (MP3 conversion)...`);

                    const response = await fetch('https://swiftbot.uazapi.com/message/download', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'token': metadata.instanceToken
                        },
                        body: JSON.stringify({
                            id: messageId,
                            return_base64: false,
                            generate_mp3: true
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`UAZapi download failed: ${response.status}`);
                    }

                    // UAZapi retorna JSON com fileURL, não o arquivo direto
                    const jsonData = await response.json();

                    if (!jsonData.fileURL) {
                        throw new Error(`UAZapi response missing fileURL: ${JSON.stringify(jsonData)}`);
                    }

                    // CORRIGIR TYPO: htps:// → https://
                    let mp3Url = jsonData.fileURL;
                    if (mp3Url.startsWith('htps://')) {
                        mp3Url = mp3Url.replace('htps://', 'https://');
                        console.log(`🔧 [MediaVPS] Fixed typo in URL: htps → https`);
                    }

                    console.log(`📥 [MediaVPS] Downloading MP3 from: ${mp3Url}`);

                    // Baixar o MP3 da URL fornecida
                    const mp3Response = await fetch(mp3Url);

                    if (!mp3Response.ok) {
                        throw new Error(`Failed to download MP3 from ${mp3Url}: ${mp3Response.status}`);
                    }

                    // Salvar MP3
                    const fileName = this.generateFileName(messageId, 'mp3');
                    const fullPath = path.join(process.cwd(), 'public', 'media', 'audio', fileName);
                    const localPath = `/media/audio/${fileName}`;

                    // Garantir diretório existe
                    const dir = path.dirname(fullPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    // Salvar MP3
                    const fileStream = createWriteStream(fullPath);
                    await pipeline(mp3Response.body, fileStream);

                    const stats = fs.statSync(fullPath);

                    // VALIDAR: MP3 deve ter pelo menos 1KB
                    if (stats.size < 1024) {
                        fs.unlinkSync(fullPath); // Deletar arquivo inválido
                        throw new Error(`Downloaded MP3 is too small (${stats.size} bytes) - likely corrupted`);
                    }

                    fileInfo = {
                        localPath,
                        fullPath,
                        mimeType: 'audio/mpeg',
                        size: stats.size,
                        fileName
                    };

                    console.log(`✅ [MediaVPS] Audio saved as MP3: ${localPath} (${(stats.size / 1024).toFixed(2)}KB)`);
                } catch (uazapiError) {
                    console.warn(`⚠️ [MediaVPS] UAZapi MP3 conversion failed, using fallback:`, uazapiError.message);
                    // Fallback: download direto (pode ter problema no Whisper)
                    fileInfo = await this.downloadAndSave(mediaUrl, mediaType, messageId, metadata);
                }
            } else {
                // OUTRAS MÍDIAS: Download normal
                fileInfo = await this.downloadAndSave(mediaUrl, mediaType, messageId, metadata);
            }

            // 2. Preparar resultado base
            const result = {
                ...fileInfo,
                transcription: null,
                aiInterpretation: null,
                transcriptionStatus: 'not_applicable',
                mediaDownloadedAt: new Date().toISOString()
            };

            // 3. Processar com OpenAI (se disponível)
            if (!OpenAIService.isConfigured()) {
                console.warn(`⚠️ [MediaVPS] OpenAI não configurado, pulando interpretação`);
                return result;
            }

            try {
                // Construir URL pública para OpenAI Vision (imagens e documentos)
                // Next.js serve automaticamente arquivos em /public/
                const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${fileInfo.localPath}`;

                // DEBUG: Log completo
                console.log(`🔍 [MediaVPS] DEBUG URL Construction:`, {
                    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
                    localPath: fileInfo.localPath,
                    fileName: fileInfo.fileName,
                    fullPublicUrl: publicUrl
                });

                switch (mediaType) {
                    case 'audio': {
                        console.log(`🎤 [MediaVPS] Transcribing audio...`);
                        const audioResult = await OpenAIService.interpretMedia('audio', publicUrl, fileInfo.localPath);

                        result.transcription = audioResult.transcription;
                        result.aiInterpretation = audioResult.interpretation;
                        result.transcriptionStatus = audioResult.transcription ? 'completed' : 'failed';
                        result.transcribedAt = new Date().toISOString();

                        console.log(`✅ [MediaVPS] Audio transcribed: "${result.transcription?.substring(0, 50)}..."`);
                        break;
                    }

                    case 'image': {
                        console.log(`🖼️ [MediaVPS] Analyzing image...`);
                        const imageResult = await OpenAIService.interpretMedia('image', publicUrl);

                        result.aiInterpretation = imageResult.interpretation;

                        console.log(`✅ [MediaVPS] Image analyzed`);
                        break;
                    }

                    case 'document': {
                        console.log(`📄 [MediaVPS] Analyzing document...`);
                        const docResult = await OpenAIService.interpretMedia('document', publicUrl);

                        result.transcription = docResult.transcription; // Texto extraído
                        result.aiInterpretation = docResult.interpretation; // Resumo

                        console.log(`✅ [MediaVPS] Document analyzed`);
                        break;
                    }

                    case 'video': {
                        // Vídeo: apenas salvar, não processar
                        result.aiInterpretation = 'Vídeo salvo (processamento automático não disponível)';
                        break;
                    }
                }

            } catch (aiError) {
                console.error(`⚠️ [MediaVPS] OpenAI processing failed:`, aiError.message);
                result.transcriptionStatus = 'failed';
                // Continuar mesmo se OpenAI falhar - mídia já foi salva
            }

            return result;

        } catch (error) {
            console.error(`❌ [MediaVPS] Process failed:`, error.message);
            throw error;
        }
    }

    /**
     * Deleta arquivo de mídia da VPS
     * 
     * @param {string} localPath - Caminho relativo (/media/audio/...)
     */
    static async deleteMedia(localPath) {
        try {
            if (!localPath) return;

            const fullPath = path.join(process.cwd(), 'public', localPath);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ [MediaVPS] Deleted: ${localPath}`);
            }
        } catch (error) {
            console.error(`⚠️ [MediaVPS] Delete failed:`, error.message);
            // Não propagar erro - não é crítico
        }
    }

    /**
     * Verifica se arquivo existe
     * 
     * @param {string} localPath - Caminho relativo
     * @returns {boolean}
     */
    static fileExists(localPath) {
        if (!localPath) return false;

        const fullPath = path.join(process.cwd(), 'public', localPath);
        return fs.existsSync(fullPath);
    }

    /**
     * Retorna estatísticas de uso de disco
     * 
     * @returns {Promise<object>} { totalSize, fileCount, byType }
     */
    static async getStorageStats() {
        const stats = {
            totalSize: 0,
            fileCount: 0,
            byType: {}
        };

        try {
            const mediaDir = path.join(process.cwd(), 'public', 'media');

            for (const [type, dir] of Object.entries(this.MEDIA_DIRS)) {
                const typePath = path.join(mediaDir, dir);

                if (!fs.existsSync(typePath)) continue;

                const files = fs.readdirSync(typePath);
                let typeSize = 0;

                for (const file of files) {
                    const filePath = path.join(typePath, file);
                    const fileStats = fs.statSync(filePath);
                    typeSize += fileStats.size;
                }

                stats.byType[type] = {
                    count: files.length,
                    size: typeSize,
                    sizeMB: (typeSize / 1024 / 1024).toFixed(2)
                };

                stats.totalSize += typeSize;
                stats.fileCount += files.length;
            }

            stats.totalSizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);

        } catch (error) {
            console.error('Error getting storage stats:', error);
        }

        return stats;
    }
}

export default MediaServiceVPS;
