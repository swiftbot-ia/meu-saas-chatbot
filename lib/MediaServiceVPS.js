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
            const mimeType = response.headers.get('content-type') || metadata.mimetype || 'application/octet-stream';
            const extension = this.getExtensionFromMimeType(mimeType);

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
     * @param {object} metadata - Metadados (mimetype, caption, etc)
     * @returns {Promise<object>} { localPath, fullPath, mimeType, size, transcription, aiInterpretation, ... }
     */
    static async processMedia(mediaUrl, mediaType, messageId, metadata = {}) {
        try {
            console.log(`🔄 [MediaVPS] Processing ${mediaType}...`);

            // 1. Download e salvar
            const fileInfo = await this.downloadAndSave(mediaUrl, mediaType, messageId, metadata);

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
