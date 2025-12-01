// app/api/webhooks/evolution/route.js
/**
 * ============================================================================
 * Webhook Handler: UAZAPI / UAZAPI
 * ============================================================================
 * Recebe e processa eventos da UAZAPI:
 * - MESSAGES_UPSERT: Novas mensagens recebidas
 * - CONNECTION_UPDATE: Mudanças no status de conexão
 * - E outros eventos do WhatsApp
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import MessageService from '@/lib/MessageService'

/**
 * POST - Processar eventos do webhook
 */
// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const payload = await request.json()

    // UAZAPI mudou o formato: EventType ao invés de event, instanceName ao invés de instance
    const eventType = payload.EventType || payload.event
    const instanceName = payload.instanceName || payload.instance

    console.log('📨 Webhook recebido da UAZAPI:', {
      event: eventType,
      instance: instanceName,
      timestamp: new Date().toISOString()
    })

    // Log completo para debug
    if (!eventType) {
      console.log('🔍 PAYLOAD COMPLETO:', JSON.stringify(payload, null, 2))
    }

    // Validar autenticação básica (opcional)
    const authHeader = request.headers.get('authorization')
    if (process.env.WEBHOOK_AUTH_USER && process.env.WEBHOOK_AUTH_PASS) {
      const expectedAuth = Buffer.from(
        `${process.env.WEBHOOK_AUTH_USER}:${process.env.WEBHOOK_AUTH_PASS}`
      ).toString('base64')

      if (authHeader !== `Basic ${expectedAuth}`) {
        console.warn('⚠️ Autenticação de webhook falhou')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Processar evento baseado no tipo
    // UAZAPI usa "messages" para MESSAGES_UPSERT
    if (eventType === 'messages' || eventType === 'MESSAGES_UPSERT') {
      await handleMessageReceived(payload, instanceName)
    } else if (eventType === 'CONNECTION_UPDATE') {
      await handleConnectionUpdate(payload, instanceName)
    } else if (eventType === 'QRCODE_UPDATED') {
      await handleQRCodeUpdate(payload, instanceName)
    } else if (eventType === 'CONNECTION_LOST' || eventType === 'CONNECTION_CLOSE') {
      await handleConnectionLost(payload, instanceName)
    } else {
      console.log(`ℹ️ Evento não tratado: ${eventType}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Processa atualização de status de conexão
 */
async function handleConnectionUpdate(payload, instanceName) {
  try {
    const state = payload.data?.state // 'open', 'close', 'connecting'

    console.log(`🔄 CONNECTION_UPDATE: ${instanceName} -> ${state}`)

    // Buscar conexão no banco
    const { data: connection, error } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('instance_name', instanceName)
      .single()

    if (error || !connection) {
      console.warn(`⚠️ Conexão não encontrada no banco: ${instanceName}`)
      return
    }

    // Atualizar status baseado no estado
    let status = 'disconnected'
    let isConnected = false

    if (state === 'open') {
      status = 'connected'
      isConnected = true
    } else if (state === 'connecting') {
      status = 'connecting'
    }

    const updates = {
      status,
      is_connected: isConnected,
      updated_at: new Date().toISOString()
    }

    // Se conectou, salvar timestamp
    if (isConnected) {
      updates.last_connected_at = new Date().toISOString()
    }

    // Extrair número do WhatsApp se disponível
    if (payload.data?.ownerJid) {
      updates.phone_number_id = payload.data.ownerJid.replace('@s.whatsapp.net', '')
    }

    await supabase
      .from('whatsapp_connections')
      .update(updates)
      .eq('id', connection.id)

    console.log(`✅ Status atualizado: ${instanceName} -> ${status}`)

    // Se desconectou, você pode querer notificar o usuário
    if (!isConnected && connection.is_connected) {
      console.log(`⚠️ WhatsApp desconectado: ${instanceName}`)
      // TODO: Enviar notificação para o usuário (email, push, etc)
    }

  } catch (error) {
    console.error('❌ Erro ao processar CONNECTION_UPDATE:', error)
  }
}

/**
 * Converte formato novo da UAZAPI para o formato antigo esperado pelo MessageService
 */
function convertUazapiMessage(uazapiMessage) {
  // Formato novo: payload.message = { id, messageType, content, sender, chatid, ... }
  // Formato antigo: { key: {...}, message: {...}, messageTimestamp }

  const messageId = uazapiMessage.id || uazapiMessage.messageid
  const sender = uazapiMessage.sender
  const fromMe = uazapiMessage.fromMe || false
  const timestamp = Math.floor(uazapiMessage.messageTimestamp / 1000)

  // Construir estrutura antiga
  const converted = {
    key: {
      remoteJid: sender,
      fromMe: fromMe,
      id: messageId
    },
    messageTimestamp: timestamp,
    pushName: uazapiMessage.senderName || ''
  }

  // Converter content baseado no messageType
  const messageType = uazapiMessage.messageType

  if (messageType === 'Conversation' || messageType === 'ExtendedTextMessage') {
    // Mensagem de texto
    converted.message = {
      conversation: uazapiMessage.text || uazapiMessage.content
    }
  } else if (messageType === 'AudioMessage') {
    // Mensagem de áudio
    // DEBUG: Log full audio message content to understand UAZAPI structure
    console.log('🔍 DEBUG - UAZAPI Audio Message Full Content:', JSON.stringify(uazapiMessage.content, null, 2))

    converted.message = {
      audioMessage: {
        url: uazapiMessage.content?.URL || uazapiMessage.content?.url,
        mimetype: uazapiMessage.content?.mimetype || 'audio/ogg',
        seconds: uazapiMessage.content?.seconds || 0,
        ptt: uazapiMessage.content?.PTT || uazapiMessage.mediaType === 'ptt'
      }
    }
  } else if (messageType === 'ImageMessage') {
    // Mensagem de imagem
    converted.message = {
      imageMessage: {
        url: uazapiMessage.content?.URL || uazapiMessage.content?.url,
        mimetype: uazapiMessage.content?.mimetype || 'image/jpeg',
        caption: uazapiMessage.text || ''
      }
    }
  } else if (messageType === 'VideoMessage') {
    // Mensagem de vídeo
    converted.message = {
      videoMessage: {
        url: uazapiMessage.content?.URL || uazapiMessage.content?.url,
        mimetype: uazapiMessage.content?.mimetype || 'video/mp4',
        caption: uazapiMessage.text || ''
      }
    }
  } else if (messageType === 'DocumentMessage') {
    // Mensagem de documento
    converted.message = {
      documentMessage: {
        url: uazapiMessage.content?.URL || uazapiMessage.content?.url,
        mimetype: uazapiMessage.content?.mimetype || 'application/octet-stream',
        fileName: uazapiMessage.content?.fileName || 'document'
      }
    }
  } else {
    // Tipo desconhecido - texto genérico
    converted.message = {
      conversation: uazapiMessage.text || JSON.stringify(uazapiMessage.content)
    }
  }

  return converted
}

/**
 * Processa nova mensagem recebida
 */
async function handleMessageReceived(payload, instanceName) {
  try {
    console.log(`💬 MESSAGES (novo formato): ${instanceName}`)

    // Buscar conexão no banco
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .single()

    if (!connection) {
      console.warn(`⚠️ Conexão não encontrada: ${instanceName}`)
      return
    }

    // Converter mensagem do formato novo para o antigo
    const uazapiMessage = payload.message

    if (!uazapiMessage) {
      console.warn('⚠️ Payload sem mensagem')
      return
    }

    try {
      // Converter para formato antigo
      const convertedMessage = convertUazapiMessage(uazapiMessage)

      console.log('🔍 DEBUG - Processando mensagem convertida:', {
        instanceName,
        connectionId: connection.id,
        userId: connection.user_id,
        messageId: convertedMessage.key?.id,
        fromMe: convertedMessage.key?.fromMe,
        remoteJid: convertedMessage.key?.remoteJid,
        hasMessage: !!convertedMessage.message,
        messageType: convertedMessage.message ? Object.keys(convertedMessage.message)[0] : 'unknown'
      })

      // Use MessageService to process incoming message
      // This will automatically create/update contact and conversation
      const savedMessage = await MessageService.processIncomingMessage(
        convertedMessage,
        instanceName,
        connection.id,
        connection.user_id
      )

      if (savedMessage) {
        console.log(`✅ Mensagem processada e salva:`, {
          message_id: savedMessage.message_id,
          conversation_id: savedMessage.conversation_id,
          contact_id: savedMessage.contact_id,
          message_type: savedMessage.message_type,
          direction: savedMessage.direction,
          has_media: !!savedMessage.local_media_path,
          has_transcription: !!savedMessage.transcription
        })
      } else {
        console.log(`ℹ️ Mensagem ignorada (provavelmente enviada por nós)`)
      }

    } catch (messageError) {
      console.error('❌ ERRO DETALHADO ao processar mensagem:', {
        error: messageError.message,
        code: messageError.code,
        hint: messageError.hint,
        details: messageError.details,
        stack: messageError.stack
      })
    }

  } catch (error) {
    console.error('❌ Erro ao processar MESSAGES:', error)
  }
}

/**
 * Processa atualização de QR Code
 */
async function handleQRCodeUpdate(payload, instanceName) {
  try {
    const qrCode = payload.data?.qrcode || payload.data?.base64

    console.log(`📱 QRCODE_UPDATED: ${instanceName}`)

    // Você pode armazenar o QR Code atualizado se necessário
    // Ou notificar o frontend via WebSocket/SSE

    if (qrCode) {
      await supabase
        .from('whatsapp_connections')
        .update({
          metadata: {
            last_qr_update: new Date().toISOString(),
            qr_code: qrCode // CUIDADO: QR Code é grande, considere não salvar
          },
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName)
    }

  } catch (error) {
    console.error('❌ Erro ao processar QRCODE_UPDATE:', error)
  }
}

/**
 * Processa perda de conexão
 */
async function handleConnectionLost(payload, instanceName) {
  try {
    console.log(`❌ CONNECTION_LOST: ${instanceName}`)

    await supabase
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        is_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName)

    // TODO: Notificar usuário sobre perda de conexão

  } catch (error) {
    console.error('❌ Erro ao processar CONNECTION_LOST:', error)
  }
}

/**
 * Helpers
 */
function getMessageType(messageInfo) {
  if (messageInfo.conversation || messageInfo.extendedTextMessage) return 'text'
  if (messageInfo.imageMessage) return 'image'
  if (messageInfo.videoMessage) return 'video'
  if (messageInfo.audioMessage) return 'audio'
  if (messageInfo.documentMessage) return 'document'
  if (messageInfo.stickerMessage) return 'sticker'
  if (messageInfo.locationMessage) return 'location'
  if (messageInfo.contactMessage) return 'contact'
  return 'unknown'
}

function extractMessageContent(messageInfo) {
  if (messageInfo.conversation) return messageInfo.conversation
  if (messageInfo.extendedTextMessage?.text) return messageInfo.extendedTextMessage.text
  if (messageInfo.imageMessage?.caption) return messageInfo.imageMessage.caption
  if (messageInfo.videoMessage?.caption) return messageInfo.videoMessage.caption
  return ''
}

// Método GET para verificar se webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'UAZAPI Webhook is running',
    timestamp: new Date().toISOString()
  })
}
