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
import { createChatServiceClient } from '../supabase/chat-service'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

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
   * IMPORTANTE: Whisper aceita OGG nativamente - NÃO precisa converter!
   * Baseado no Coonver (que funciona perfeitamente)
   */
  async transcribeAudio(audioFilePath) {
    try {
      if (!this.openai) {
        console.warn('⚠️ OpenAI não configurado')
        return null
      }

      console.log(`🎤 Transcrevendo áudio: ${audioFilePath}`)

      // Whisper aceita: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
      // ✅ Enviar OGG direto - SEM conversão (igual ao Coonver)
      const audioStream = fs.createReadStream(audioFilePath)

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

      console.log(`✅ Transcrição obtida com sucesso (${transcription.length} caracteres)`)

      return transcription

    } catch (error) {
      console.error('❌ Erro ao chamar Whisper API:', error)
      return null
    }
  }

  /**
   * Atualiza mensagem com transcrição
   */
  async updateMessageTranscription(messageId, transcription) {
    try {
      const chatSupabase = createChatServiceClient() // ← Service Role Key (bypassa RLS)

      // Buscar mensagem atual
      const { data: message, error: fetchError } = await chatSupabase
        .from('whatsapp_messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle() // ← maybeSingle() não falha se não encontrar

      if (fetchError) {
        console.error('❌ Erro ao buscar mensagem:', fetchError)
        return null
      }

      if (!message) {
        console.error('❌ Mensagem não encontrada:', messageId)
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
