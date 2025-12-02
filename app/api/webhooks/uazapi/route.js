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

    // Support both payload formats from UAZAPI
    // Format 1: { event, instance, data }
    // Format 2: { EventType, instanceName, message }
    const eventType = payload.event || payload.EventType
    const instanceName = payload.instance || payload.instanceName

    console.log('📨 Webhook recebido da UAZAPI:', {
      event: eventType,
      instance: instanceName,
      timestamp: new Date().toISOString()
    })

    // Log full payload if event or instance is missing (for debugging)
    if (!eventType || !instanceName) {
      console.log('⚠️ Payload incompleto recebido:', JSON.stringify(payload, null, 2))
      return NextResponse.json({
        success: true,
        message: 'Payload incompleto, ignorando'
      })
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
    switch (eventType) {
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate({ instance: instanceName, ...payload })
        break

      case 'MESSAGES_UPSERT':
        await handleMessageReceived({ instance: instanceName, data: payload.data, ...payload })
        break

      case 'messages': // New format from UAZAPI
        await handleNewFormatMessage({ instance: instanceName, ...payload })
        break

      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate({ instance: instanceName, ...payload })
        break

      case 'CONNECTION_LOST':
      case 'CONNECTION_CLOSE':
        await handleConnectionLost({ instance: instanceName, ...payload })
        break

      default:
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
async function handleConnectionUpdate(payload) {
  try {
    const instanceName = payload.instance
    const state = payload.data?.state // 'open', 'close', 'connecting'

    console.log(`🔄 CONNECTION_UPDATE: ${instanceName} -> ${state}`)

    // Buscar conexão no banco
    const { data: connection, error } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('instance_name', instanceName)
      .maybeSingle()

    // Se não houver conexão no banco, apenas ignorar silenciosamente
    if (error || !connection) {
      console.log(`ℹ️ Conexão não encontrada no banco, ignorando evento: ${instanceName}`)
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
 * Processa nova mensagem recebida
 */
async function handleMessageReceived(payload) {
  try {
    const instanceName = payload.instance
    const messageData = payload.data

    console.log(`💬 MESSAGES_UPSERT: ${instanceName}`)

    // Buscar conexão no banco
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .maybeSingle()

    // Se não houver conexão no banco, apenas ignorar silenciosamente
    if (!connection || connectionError) {
      console.log(`ℹ️ Conexão não encontrada no banco, ignorando mensagem: ${instanceName}`)
      return
    }

    // Processar cada mensagem
    const messages = Array.isArray(messageData) ? messageData : [messageData]

    for (const message of messages) {
      try {
        console.log('🔍 DEBUG - Processando mensagem:', {
          instanceName,
          connectionId: connection.id,
          userId: connection.user_id,
          messageId: message.key?.id,
          fromMe: message.key?.fromMe,
          remoteJid: message.key?.remoteJid,
          hasMessage: !!message.message,
          messageType: message.message ? Object.keys(message.message)[0] : 'unknown'
        })

        // Use MessageService to process incoming message
        // This will automatically create/update contact and conversation
        const savedMessage = await MessageService.processIncomingMessage(
          message,
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
            direction: savedMessage.direction
          })
        } else {
          console.log(`ℹ️ Mensagem ignorada (provavelmente enviada por nós)`)
        }

        // TODO: Implementar lógica de resposta automática/bot se necessário

      } catch (messageError) {
        console.error('❌ ERRO DETALHADO ao processar mensagem:', {
          error: messageError.message,
          code: messageError.code,
          hint: messageError.hint,
          details: messageError.details,
          stack: messageError.stack
        })
        // Continue processando outras mensagens mesmo se uma falhar
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar MESSAGES_UPSERT:', error)
  }
}

/**
 * Handle new message format from UAZAPI
 * Converts new format to old format expected by MessageService
 */
async function handleNewFormatMessage(payload) {
  try {
    const instanceName = payload.instanceName
    const messageData = payload.message

    console.log(`💬 NEW FORMAT MESSAGE: ${instanceName}`)

    // Buscar conexão no banco
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .maybeSingle()

    // Se não houver conexão no banco, apenas ignorar silenciosamente
    if (!connection || connectionError) {
      console.log(`ℹ️ Conexão não encontrada no banco, ignorando mensagem: ${instanceName}`)
      return
    }

    // Convert new format to old format expected by MessageService
    const convertedMessage = {
      key: {
        remoteJid: messageData.chatid,
        fromMe: messageData.fromMe,
        id: messageData.messageid || messageData.id.split(':')[1]
      },
      messageTimestamp: Math.floor(messageData.messageTimestamp / 1000), // Convert ms to seconds
      pushName: messageData.senderName,
      message: {}
    }

    // Convert message type
    switch (messageData.messageType) {
      case 'AudioMessage':
        convertedMessage.message.audioMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          mediaKey: messageData.content.mediaKey,
          fileEncSha256: messageData.content.fileEncSHA256,
          fileSha256: messageData.content.fileSHA256,
          fileLength: messageData.content.fileLength,
          seconds: messageData.content.seconds
        }
        break

      case 'ImageMessage':
        convertedMessage.message.imageMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          caption: messageData.text || '',
          mediaKey: messageData.content.mediaKey,
          fileEncSha256: messageData.content.fileEncSHA256,
          fileSha256: messageData.content.fileSHA256
        }
        break

      case 'VideoMessage':
        convertedMessage.message.videoMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          caption: messageData.text || '',
          mediaKey: messageData.content.mediaKey,
          fileEncSha256: messageData.content.fileEncSHA256,
          fileSha256: messageData.content.fileSHA256,
          seconds: messageData.content.seconds
        }
        break

      case 'DocumentMessage':
        convertedMessage.message.documentMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          fileName: messageData.content.fileName || 'document',
          mediaKey: messageData.content.mediaKey,
          fileEncSha256: messageData.content.fileEncSHA256,
          fileSha256: messageData.content.fileSHA256
        }
        break

      case 'TextMessage':
      default:
        convertedMessage.message.conversation = messageData.text
        break
    }

    console.log('🔄 Converted message format:', {
      instanceName,
      messageId: convertedMessage.key.id,
      messageType: messageData.messageType
    })

    // Use MessageService to process incoming message
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

  } catch (error) {
    console.error('❌ Erro ao processar mensagem novo formato:', error)
  }
}

/**
 * Processa atualização de QR Code
 */
async function handleQRCodeUpdate(payload) {
  try {
    const instanceName = payload.instance
    const qrCode = payload.data?.qrcode || payload.data?.base64

    console.log(`📱 QRCODE_UPDATED: ${instanceName}`)

    // Verificar se conexão existe no banco
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('id')
      .eq('instance_name', instanceName)
      .maybeSingle()

    // Se não houver conexão no banco, apenas ignorar
    if (!connection) {
      console.log(`ℹ️ Conexão não encontrada no banco, ignorando QR Code: ${instanceName}`)
      return
    }

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
async function handleConnectionLost(payload) {
  try {
    const instanceName = payload.instance

    console.log(`❌ CONNECTION_LOST: ${instanceName}`)

    // Verificar se conexão existe no banco
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('id')
      .eq('instance_name', instanceName)
      .maybeSingle()

    // Se não houver conexão no banco, apenas ignorar
    if (!connection) {
      console.log(`ℹ️ Conexão não encontrada no banco, ignorando perda de conexão: ${instanceName}`)
      return
    }

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
