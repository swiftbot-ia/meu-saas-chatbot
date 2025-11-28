/**
 * ============================================================================
 * Media Storage Service
 * ============================================================================
 * Gerencia download e armazenamento local de mídias do WhatsApp
 * - Download de imagens, vídeos, áudios, documentos
 * - Salvamento organizado em storage/media/{tipo}/
 * - Nomenclatura: YYYY-MM-DD_hash.ext
 * - Usa UazAPI para descriptografar mídias do WhatsApp
 * ============================================================================
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import uazapi from '../uazapi-client.js'

class MediaStorageService {
  constructor() {
    // Diretório base para armazenamento
    this.baseDir = path.join(process.cwd(), 'storage', 'media')

    // Garantir que diretórios existem
    this.ensureDirectoriesExist()
  }

  /**
   * Cria estrutura de diretórios se não existir
   */
  ensureDirectoriesExist() {
    const dirs = ['audio', 'images', 'videos', 'documents']

    dirs.forEach(dir => {
      const fullPath = path.join(this.baseDir, dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
        console.log(`📁 Diretório criado: ${fullPath}`)
      }
    })
  }

  /**
   * Determina o diretório baseado no tipo de mídia
   */
  getTypeDirectory(messageType) {
    const typeMap = {
      'audio': 'audio',
      'image': 'images',
      'video': 'videos',
      'document': 'documents'
    }

    return typeMap[messageType] || 'documents'
  }

  /**
   * Determina extensão do arquivo baseado no mimetype
   */
  getExtension(mimeType, messageType) {
    // Mapa de mimetypes para extensões
    const mimeMap = {
      // Áudio
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'audio/wav': '.wav',

      // Imagem
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',

      // Vídeo
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',

      // Documento
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    }

    // Tentar pelo mimetype
    if (mimeType && mimeMap[mimeType]) {
      return mimeMap[mimeType]
    }

    // Fallback por tipo de mensagem
    const typeDefaults = {
      'audio': '.ogg',
      'image': '.jpg',
      'video': '.mp4',
      'document': '.pdf'
    }

    return typeDefaults[messageType] || '.bin'
  }

  /**
   * Verifica se URL é do WhatsApp (retorna arquivos criptografados)
   */
  isWhatsAppUrl(url) {
    return url.includes('mmg.whatsapp.net') ||
           url.includes('pps.whatsapp.net') ||
           url.includes('web.whatsapp.net')
  }

  /**
   * Download e salvamento de mídia
   * @param {string} mediaUrl - URL da mídia
   * @param {string} messageType - Tipo (audio, image, video, document)
   * @param {string} messageId - ID da mensagem
   * @param {string} instanceToken - Token da instância (necessário para descriptografar)
   */
  async downloadAndSave(mediaUrl, messageType, messageId, instanceToken = null) {
    try {
      if (!mediaUrl) {
        console.warn('⚠️ URL de mídia não fornecida')
        return null
      }

      console.log(`📥 Baixando ${messageType}: ${mediaUrl.substring(0, 50)}...`)

      let buffer
      let mimeType

      // 1. Download do arquivo - usar UazAPI se for URL do WhatsApp
      if (this.isWhatsAppUrl(mediaUrl) && instanceToken) {
        console.log('🔓 URL do WhatsApp detectada - usando UazAPI para descriptografar...')

        try {
          // Usar UazAPI para baixar mídia descriptografada
          buffer = await uazapi.downloadMedia(instanceToken, mediaUrl)

          // Determinar mimetype pelo tipo de mensagem
          const mimeTypeMap = {
            'audio': 'audio/ogg',
            'image': 'image/jpeg',
            'video': 'video/mp4',
            'document': 'application/pdf'
          }
          mimeType = mimeTypeMap[messageType] || 'application/octet-stream'

        } catch (uazapiError) {
          console.error('❌ Erro ao baixar via UazAPI:', uazapiError.message)
          console.warn('⚠️ Tentando download direto como fallback...')

          // Fallback: tentar download direto
          const response = await fetch(mediaUrl)
          if (!response.ok) {
            throw new Error(`Erro ao baixar mídia: ${response.statusText}`)
          }
          buffer = Buffer.from(await response.arrayBuffer())
          mimeType = response.headers.get('content-type')
        }
      } else {
        // Download direto (não é WhatsApp ou sem token)
        if (this.isWhatsAppUrl(mediaUrl)) {
          console.warn('⚠️ URL do WhatsApp sem token - arquivo pode estar criptografado!')
        }

        const response = await fetch(mediaUrl)
        if (!response.ok) {
          throw new Error(`Erro ao baixar mídia: ${response.statusText}`)
        }
        buffer = Buffer.from(await response.arrayBuffer())
        mimeType = response.headers.get('content-type')
      }

      // 3. Determinar diretório e extensão
      const typeDir = this.getTypeDirectory(messageType)
      const ext = this.getExtension(mimeType, messageType)

      // 4. Gerar nome do arquivo
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const hash = crypto.createHash('md5').update(messageId).digest('hex').substring(0, 8)
      const filename = `${today}_${hash}${ext}`

      // 5. Caminho completo
      const fullPath = path.join(this.baseDir, typeDir, filename)

      // 6. Salvar arquivo
      fs.writeFileSync(fullPath, buffer)

      // 7. Calcular tamanho
      const sizeKB = (buffer.length / 1024).toFixed(2)

      console.log(`✅ Mídia salva: ${typeDir}/${filename} (${sizeKB} KB)`)

      // 8. Retornar informações
      return {
        localPath: fullPath,                          // /path/completo/storage/media/audio/2025-11-28_abc.ogg
        relativePath: `${typeDir}/${filename}`,       // audio/2025-11-28_abc.ogg
        publicUrl: `/api/media/${typeDir}/${filename}`, // URL pública
        fileSize: buffer.length,
        mimeType: mimeType,
        savedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Erro ao salvar mídia (${messageType}):`, error.message)
      return null
    }
  }

  /**
   * Verifica se arquivo existe
   */
  fileExists(relativePath) {
    const fullPath = path.join(this.baseDir, relativePath)
    return fs.existsSync(fullPath)
  }

  /**
   * Obtém caminho completo
   */
  getFullPath(relativePath) {
    return path.join(this.baseDir, relativePath)
  }

  /**
   * Remove arquivo
   */
  deleteFile(relativePath) {
    try {
      const fullPath = path.join(this.baseDir, relativePath)

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        console.log(`🗑️ Arquivo removido: ${relativePath}`)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Erro ao remover arquivo:', error)
      return false
    }
  }

  /**
   * Limpa arquivos antigos (mais de X dias)
   */
  static cleanupOldFiles(daysOld = 60) {
    try {
      const baseDir = path.join(process.cwd(), 'storage', 'media')
      const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000)

      const dirs = ['audio', 'images', 'videos', 'documents']
      let removedCount = 0

      dirs.forEach(dir => {
        const fullDir = path.join(baseDir, dir)

        if (!fs.existsSync(fullDir)) return

        const files = fs.readdirSync(fullDir)

        files.forEach(file => {
          const filePath = path.join(fullDir, file)
          const stats = fs.statSync(filePath)

          if (stats.mtimeMs < cutoffDate) {
            fs.unlinkSync(filePath)
            removedCount++
          }
        })
      })

      if (removedCount > 0) {
        console.log(`🗑️ Limpeza: ${removedCount} arquivos antigos removidos`)
      }

    } catch (error) {
      console.error('⚠️ Erro ao limpar arquivos antigos:', error)
    }
  }

  /**
   * Obtém estatísticas de armazenamento
   */
  getStorageStats() {
    try {
      const stats = {
        audio: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        documents: { count: 0, size: 0 }
      }

      const dirs = ['audio', 'images', 'videos', 'documents']

      dirs.forEach(dir => {
        const fullDir = path.join(this.baseDir, dir)

        if (!fs.existsSync(fullDir)) return

        const files = fs.readdirSync(fullDir)

        files.forEach(file => {
          const filePath = path.join(fullDir, file)
          const fileStats = fs.statSync(filePath)

          stats[dir].count++
          stats[dir].size += fileStats.size
        })
      })

      return stats

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return null
    }
  }
}

// Exportar instância singleton
const mediaStorageService = new MediaStorageService()

export default mediaStorageService

// Limpar arquivos antigos uma vez ao dia
setInterval(() => {
  MediaStorageService.cleanupOldFiles(60) // 60 dias
}, 24 * 60 * 60 * 1000)
