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

    // UAZAPI envia formato diferente: EventType (não event), instanceName (não instance)
    const eventType = payload.EventType || payload.event
    const instanceName = payload.instanceName || payload.instance

    console.log('📨 Webhook recebido da UAZAPI:', {
      EventType: eventType,
      instanceName: instanceName,
      timestamp: new Date().toISOString()
    })

    // Log do payload completo para diagnóstico (apenas primeira vez para não poluir)
    if (Math.random() < 0.1) { // 10% das vezes
      console.log('🔍 PAYLOAD COMPLETO (amostra):', JSON.stringify(payload, null, 2))
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
    // UAZAPI envia EventType: "messages", "connection", etc
    switch (eventType) {
      case 'connection':
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(payload)
        break

      case 'messages':
      case 'MESSAGES_UPSERT':
        await handleMessageReceived(payload)
        break

      case 'qrcode':
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
    // UAZAPI formato: instanceName (não instance), message (não data)
    const instanceName = payload.instanceName || payload.instance
    const messageData = payload.message || payload.data

    console.log(`💬 MESSAGES_UPSERT: ${instanceName}`)

    // Buscar conexão no banco
    console.log(`🔍 Buscando conexão no banco para instância: "${instanceName}"`)

    // Tentar buscar por instance_name primeiro
    let { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('id, user_id, instance_name, phone_number, profile_name')
      .eq('instance_name', instanceName)
      .single()

    // Se não encontrou, tentar buscar por profile_name (nomes legíveis como "JTS Equipamentos")
    if (!connection && !connError?.code?.includes('PGRST116')) {
      console.log(`⚠️ Não encontrou por instance_name, tentando por profile_name...`)

      const { data: connByProfile } = await supabase
        .from('whatsapp_connections')
        .select('id, user_id, instance_name, phone_number, profile_name')
        .eq('profile_name', instanceName)
        .eq('is_connected', true)
        .single()

      if (connByProfile) {
        connection = connByProfile
        console.log(`✅ Encontrou conexão pelo profile_name!`)
      }
    }

    if (!connection) {
      console.error(`⚠️ Conexão não encontrada para instância: "${instanceName}"`)

      // Buscar todas as conexões para comparar
      const { data: allConnections } = await supabase
        .from('whatsapp_connections')
        .select('instance_name, profile_name, phone_number, is_connected')
        .eq('is_connected', true)

      console.log('📋 Conexões disponíveis no banco:', allConnections)
      console.log('❌ Erro ao buscar conexão:', connError)
      return
    }

    console.log('✅ Conexão encontrada:', {
      id: connection.id,
      instance_name: connection.instance_name,
      profile_name: connection.profile_name,
      phone_number: connection.phone_number
    })

    // UAZAPI envia mensagem diretamente, não em array
    // Converter para formato esperado pelo MessageService
    const uazapiMessage = {
      key: {
        remoteJid: messageData.chatid,
        fromMe: messageData.fromMe,
        id: messageData.messageid || messageData.id
      },
      message: {},
      messageTimestamp: Math.floor(messageData.messageTimestamp / 1000),
      pushName: messageData.senderName
    }

    // Mapear tipo de mensagem
    if (messageData.messageType === 'Conversation' || messageData.type === 'text') {
      uazapiMessage.message.conversation = messageData.content || messageData.text
    } else if (messageData.messageType === 'ImageMessage') {
      uazapiMessage.message.imageMessage = {
        url: messageData.content?.URL,
        caption: messageData.content?.caption || '',
        mimetype: messageData.content?.mimetype
      }
    } else if (messageData.messageType === 'AudioMessage') {
      uazapiMessage.message.audioMessage = {
        url: messageData.content?.URL,
        mimetype: messageData.content?.mimetype,
        seconds: messageData.content?.seconds,
        ptt: messageData.content?.PTT
      }
    } else if (messageData.messageType === 'VideoMessage') {
      uazapiMessage.message.videoMessage = {
        url: messageData.content?.URL,
        caption: messageData.content?.caption || '',
        mimetype: messageData.content?.mimetype
      }
    } else if (messageData.messageType === 'DocumentMessage') {
      uazapiMessage.message.documentMessage = {
        url: messageData.content?.URL,
        fileName: messageData.content?.fileName || '',
        mimetype: messageData.content?.mimetype
      }
    }

    try {
      console.log('🔍 DEBUG - Processando mensagem:', {
        instanceName,
        connectionId: connection.id,
        userId: connection.user_id,
        messageId: uazapiMessage.key.id,
        fromMe: uazapiMessage.key.fromMe,
        remoteJid: uazapiMessage.key.remoteJid,
        messageType: messageData.messageType
      })

      // Use MessageService to process incoming message
      // This will automatically create/update contact and conversation
      const savedMessage = await MessageService.processIncomingMessage(
        uazapiMessage,
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
