/**
 * ============================================================================
 * Transcription Service
 * ============================================================================
 * Processa transcrição de áudios usando OpenAI Whisper
 * - Download de áudio da URL
 * - Transcrição via OpenAI Whisper API
 * - Atualização da mensagem com transcrição
 * ============================================================================
 */

import { createChatSupabaseClient } from '../supabase/chat-client'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

class TranscriptionService {
  constructor() {
    // Verificar se OpenAI API Key está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY não configurada - transcrições desabilitadas')
      this.openai = null
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  /**
   * Transcreve um áudio e salva no banco
   */
  async transcribeAndSave(messageId, localFilePath) {
    try {
      if (!this.openai) {
        console.warn('⚠️ OpenAI não configurado - ignorando transcrição')
        return null
      }

      console.log(`🎤 Iniciando transcrição para mensagem: ${messageId}`)

      // 1. Verificar se arquivo local existe
      if (!fs.existsSync(localFilePath)) {
        console.error(`❌ Arquivo de áudio não encontrado: ${localFilePath}`)
        return null
      }

      console.log(`✅ Áudio já está salvo localmente: ${localFilePath}`)

      // 2. Transcrever com OpenAI Whisper
      const transcription = await this.transcribeAudio(localFilePath)

      if (!transcription) {
        console.error('❌ Erro ao transcrever áudio')
        return null
      }

      console.log(`✅ Transcrição concluída: "${transcription.substring(0, 50)}..."`)

      // 3. Atualizar mensagem no banco com transcrição
      const updated = await this.updateMessageTranscription(messageId, transcription)

      // Nota: NÃO removemos o arquivo - ele permanece salvo na VPS

      return updated

    } catch (error) {
      console.error('❌ Erro no processo de transcrição:', error)
      return null
    }
  }

  /**
   * Download do áudio da URL
   */
  async downloadAudio(audioUrl) {
    let tempFilePath = null

    try {
      // Criar diretório temporário se não existir
      const tempDir = path.join(os.tmpdir(), 'swiftbot-audio')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      // Gerar nome único para o arquivo
      const fileHash = crypto.randomBytes(16).toString('hex')
      tempFilePath = path.join(tempDir, `audio_${fileHash}.ogg`)

      // Download do áudio
      const response = await fetch(audioUrl)

      if (!response.ok) {
        throw new Error(`Erro ao baixar áudio: ${response.statusText}`)
      }

      // Salvar em arquivo
      const buffer = await response.buffer()
      fs.writeFileSync(tempFilePath, buffer)

      console.log(`✅ Áudio salvo: ${tempFilePath} (${buffer.length} bytes)`)

      return tempFilePath

    } catch (error) {
      console.error('❌ Erro ao baixar áudio:', error)

      // Limpar arquivo se houver erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }

      return null
    }
  }

  /**
   * Transcreve áudio usando OpenAI Whisper
   * Converte OGG → MP3 automaticamente se necessário
   */
  async transcribeAudio(audioFilePath) {
    let mp3FilePath = null

    try {
      if (!this.openai) {
        console.warn('⚠️ OpenAI não configurado')
        return null
      }

      console.log(`🎤 Transcrevendo áudio: ${audioFilePath}`)

      // Verificar se é OGG e converter para MP3
      const ext = path.extname(audioFilePath).toLowerCase()
      let fileToTranscribe = audioFilePath

      if (ext === '.ogg') {
        console.log('🔄 Arquivo OGG detectado, convertendo para MP3...')

        // Gerar caminho do arquivo MP3
        mp3FilePath = audioFilePath.replace(/\.ogg$/, '.mp3')

        // Converter usando FFmpeg
        const ffmpegCommand = `ffmpeg -i "${audioFilePath}" -acodec libmp3lame -ar 16000 -ac 1 -b:a 32k "${mp3FilePath}" -y`

        try {
          await execAsync(ffmpegCommand)
          console.log(`✅ Conversão concluída: ${mp3FilePath}`)
          fileToTranscribe = mp3FilePath
        } catch (conversionError) {
          console.error('❌ Erro ao converter OGG → MP3:', conversionError.message)
          // Se falhar a conversão, tenta usar o OGG mesmo assim
          console.warn('⚠️ Tentando usar arquivo OGG original...')
        }
      }

      // Criar stream do arquivo (OGG original ou MP3 convertido)
      const audioStream = fs.createReadStream(fileToTranscribe)

      // Chamar API do Whisper
      const response = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'pt', // Português
        response_format: 'text'
      })

      // A resposta é o texto diretamente
      const transcription = response.trim()

      if (!transcription) {
        console.warn('⚠️ Transcrição vazia')
        return null
      }

      return transcription

    } catch (error) {
      console.error('❌ Erro ao chamar Whisper API:', error)
      return null
    } finally {
      // Limpar arquivo MP3 temporário se foi criado
      if (mp3FilePath && fs.existsSync(mp3FilePath)) {
        try {
          fs.unlinkSync(mp3FilePath)
          console.log(`🗑️ Arquivo MP3 temporário removido: ${mp3FilePath}`)
        } catch (cleanupError) {
          console.error('⚠️ Erro ao remover MP3:', cleanupError)
        }
      }
    }
  }

  /**
   * Atualiza mensagem com transcrição
   */
  async updateMessageTranscription(messageId, transcription) {
    try {
      const chatSupabase = createChatSupabaseClient()

      // Buscar mensagem atual
      const { data: message, error: fetchError } = await chatSupabase
        .from('whatsapp_messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (fetchError || !message) {
        console.error('❌ Erro ao buscar mensagem:', fetchError)
        return null
      }

      // Atualizar com transcrição
      const { data: updated, error: updateError } = await chatSupabase
        .from('whatsapp_messages')
        .update({
          message_content: transcription, // Salvar transcrição no campo message_content
          metadata: {
            ...message.metadata,
            transcription: transcription,
            transcribed_at: new Date().toISOString()
          }
        })
        .eq('id', messageId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar mensagem:', updateError)
        return null
      }

      console.log(`✅ Mensagem atualizada com transcrição: ${messageId}`)

      return updated

    } catch (error) {
      console.error('❌ Erro ao atualizar mensagem:', error)
      return null
    }
  }

  /**
   * Limpa arquivo temporário
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ Arquivo temporário removido: ${filePath}`)
      }
    } catch (error) {
      console.error('⚠️ Erro ao remover arquivo temporário:', error)
    }
  }

  /**
   * Limpa arquivos antigos (mais de 1 hora)
   */
  static cleanupOldFiles() {
    try {
      const tempDir = path.join(os.tmpdir(), 'swiftbot-audio')

      if (!fs.existsSync(tempDir)) {
        return
      }

      const files = fs.readdirSync(tempDir)
      const oneHourAgo = Date.now() - (60 * 60 * 1000)

      files.forEach(file => {
        const filePath = path.join(tempDir, file)
        const stats = fs.statSync(filePath)

        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Arquivo antigo removido: ${file}`)
        }
      })

    } catch (error) {
      console.error('⚠️ Erro ao limpar arquivos antigos:', error)
    }
  }
}

// Exportar instância singleton
const transcriptionService = new TranscriptionService()

export default transcriptionService

// Limpar arquivos antigos a cada hora
setInterval(() => {
  TranscriptionService.cleanupOldFiles()
}, 60 * 60 * 1000)
