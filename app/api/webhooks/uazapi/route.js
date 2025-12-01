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
export async function POST(request) {
  try {
    const payload = await request.json()

    // Log detalhado do payload para debug
    console.log('📨 Webhook UAZAPI - Payload completo:', JSON.stringify(payload, null, 2))

    // UAZAPI pode enviar eventos em diferentes formatos
    // Tentar identificar o tipo de evento de várias formas
    let eventType = payload.event || payload.type || payload.action
    let instanceName = payload.instance || payload.instanceName || payload.data?.instance

    // Se não encontrou evento mas tem dados de mensagem, assumir MESSAGES_UPSERT
    if (!eventType && (payload.data?.messages || payload.messages || payload.message || payload.data?.key)) {
      eventType = 'MESSAGES_UPSERT'
      console.log('📨 Detectado como MESSAGES_UPSERT por estrutura do payload')
    }

    // Se não encontrou evento mas tem dados de conexão, assumir CONNECTION_UPDATE
    if (!eventType && (payload.data?.state || payload.state || payload.data?.status)) {
      eventType = 'CONNECTION_UPDATE'
      console.log('📨 Detectado como CONNECTION_UPDATE por estrutura do payload')
    }

    console.log('📨 Webhook identificado:', {
      event: eventType,
      instance: instanceName,
      timestamp: new Date().toISOString(),
      payloadKeys: Object.keys(payload),
      dataKeys: payload.data ? Object.keys(payload.data) : []
    })

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
        await handleConnectionUpdate(payload)
        break

      case 'MESSAGES_UPSERT':
        await handleMessageReceived(payload)
        break

      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(payload)
        break

      case 'CONNECTION_LOST':
      case 'CONNECTION_CLOSE':
        await handleConnectionLost(payload)
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
 * Processa nova mensagem recebida
 */
async function handleMessageReceived(payload) {
  try {
    // Extrair instance name de várias fontes possíveis
    const instanceName = payload.instance || payload.instanceName || payload.data?.instance

    // Extrair dados da mensagem de várias fontes possíveis
    let messageData = payload.data || payload

    // Se data contém messages array, usar isso
    if (messageData.messages) {
      messageData = messageData.messages
    }

    console.log(`💬 MESSAGES_UPSERT: ${instanceName}`)
    console.log(`💬 Message data structure:`, JSON.stringify(messageData, null, 2).substring(0, 500))

    if (!instanceName) {
      console.error('❌ Instance name não encontrado no payload')
      return
    }

    // Buscar conexão no banco
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .single()

    if (connError || !connection) {
      console.warn(`⚠️ Conexão não encontrada: ${instanceName}`, connError)
      return
    }

    console.log(`✅ Conexão encontrada: ${connection.id} para user ${connection.user_id}`)

    // Processar cada mensagem
    const messages = Array.isArray(messageData) ? messageData : [messageData]

    for (const message of messages) {
      try {
        // Verificar se a mensagem tem estrutura válida
        if (!message || (!message.key && !message.message)) {
          console.log('ℹ️ Mensagem sem estrutura válida, ignorando:', JSON.stringify(message).substring(0, 200))
          continue
        }

        // Use MessageService to process incoming message
        // This will automatically create/update contact and conversation
        const savedMessage = await MessageService.processIncomingMessage(
          message,
          instanceName,
          connection.id,
          connection.user_id
        )

        if (savedMessage) {
          console.log(`✅ Mensagem processada: ${savedMessage.message_id}`)
        } else {
          console.log(`ℹ️ Mensagem ignorada (provavelmente enviada por nós ou sem conteúdo)`)
        }

        // TODO: Implementar lógica de resposta automática/bot se necessário

      } catch (messageError) {
        console.error('❌ Erro ao processar mensagem individual:', messageError.message)
        // Continue processando outras mensagens mesmo se uma falhar
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar MESSAGES_UPSERT:', error)
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
