/**
 * ============================================================================
 * Webhook Handler: UazAPI
 * ============================================================================
 * Recebe e processa eventos da UazAPI com estrutura correta
 * - EventType: "messages" (novas mensagens)
 * - EventType: "status" (status de mensagens enviadas)
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createChatSupabaseClient } from '@/lib/supabase/chat-client'
import transcriptionService from '@/lib/services/TranscriptionService'
import mediaStorageService from '@/lib/services/MediaStorageService'

/**
 * POST - Processar eventos do webhook
 */
export async function POST(request) {
  try {
    const payload = await request.json()

    console.log('📨 Webhook UazAPI recebido:', {
      EventType: payload.EventType,
      instanceName: payload.instanceName,
      timestamp: new Date().toISOString()
    })

    // Sempre responder 200 OK imediatamente (evitar timeout)
    // Processar de forma assíncrona
    setImmediate(() => {
      processWebhookAsync(payload).catch(error => {
        console.error('❌ Erro ao processar webhook assíncrono:', error)
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook recebido'
    })

  } catch (error) {
    console.error('❌ Erro ao receber webhook:', error)
    // Sempre retornar 200 para evitar retry infinito da UazAPI
    return NextResponse.json({
      success: true,
      message: 'Webhook recebido'
    })
  }
}

/**
 * Processa webhook de forma assíncrona
 */
async function processWebhookAsync(payload) {
  try {
    // Validar estrutura básica
    if (!payload.EventType || !payload.instanceName) {
      console.warn('⚠️ Webhook inválido: EventType ou instanceName ausente')
      return
    }

    // Processar baseado no tipo de evento
    const eventType = payload.EventType

    switch (eventType) {
      case 'messages':
        await handleIncomingMessage(payload)
        break

      case 'status':
        await handleMessageStatus(payload)
        break

      case 'connection':
        await handleConnectionUpdate(payload)
        break

      default:
        console.log(`ℹ️ Evento não tratado: ${eventType}`)
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
  }
}

/**
 * Processa mensagem recebida (EventType: "messages")
 */
async function handleIncomingMessage(payload) {
  try {
    const mainSupabase = createServerSupabaseClient()
    const chatSupabase = createChatSupabaseClient()

    // Extrair dados do payload UazAPI
    const instanceName = payload.instanceName // ← CORRETO: usar instanceName
    const message = payload.message
    const chat = payload.chat

    // Validar campos obrigatórios
    if (!message || !message.chatid) {
      console.warn('⚠️ Mensagem sem chatid')
      return
    }

    console.log(`💬 Processando mensagem: ${message.messageid}`)

    // 1. Buscar conexão pelo numeroInstancia (instanceName)
    const { data: connection, error: connError } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, user_id, instance_name')
      .eq('instance_name', instanceName) // ← CORRETO: buscar por instance_name
      .single()

    if (connError || !connection) {
      console.warn(`⚠️ Conexão não encontrada: ${instanceName}`)
      return
    }

    console.log(`✅ Conexão encontrada: ${connection.instance_name} (user: ${connection.user_id})`)

    // 2. Extrair dados da mensagem (estrutura UazAPI, NÃO Baileys)
    const remoteJid = message.chatid // ← CORRETO: usar chatid
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')
    const messageId = message.messageid // ← CORRETO: usar messageid
    const fromMe = message.fromMe || false
    const messageTimestamp = message.messageTimestamp || Date.now()

    // Ignorar mensagens enviadas por nós (já salvas ao enviar)
    if (fromMe) {
      console.log('ℹ️ Mensagem enviada por nós, ignorando')
      return
    }

    // 3. Criar/buscar CONTATO (padrão Coonver: SELECT primeiro, INSERT se não existir)
    const contactName = chat?.wa_name || chat?.name || message.senderName || null
    const profilePicUrl = chat?.imagePreview || null

    let contact
    const { data: existingContact, error: contactFetchError } = await chatSupabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('whatsapp_number', phoneNumber)
      .maybeSingle()

    if (contactFetchError) {
      console.error('❌ Erro ao buscar contato:', contactFetchError.message)
      return
    }

    if (existingContact) {
      // Atualizar contato existente
      const { data: updated, error: updateError } = await chatSupabase
        .from('whatsapp_contacts')
        .update({
          name: contactName || existingContact.name,
          jid: remoteJid,
          profile_pic_url: profilePicUrl || existingContact.profile_pic_url,
          last_message_at: new Date(messageTimestamp).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar contato:', updateError.message)
        // Usar contato existente mesmo se update falhar
        contact = existingContact
      } else {
        contact = updated
      }

      console.log(`✅ Contato atualizado: ${phoneNumber}`)
    } else {
      // Criar novo contato
      const { data: created, error: createError } = await chatSupabase
        .from('whatsapp_contacts')
        .insert({
          whatsapp_number: phoneNumber,
          name: contactName,
          jid: remoteJid,
          profile_pic_url: profilePicUrl,
          last_message_at: new Date(messageTimestamp).toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Erro ao criar contato:', createError.message)
        console.error('Detalhes:', createError)
        return
      }

      contact = created
      console.log(`✅ Contato criado: ${phoneNumber}`)
    }

    if (!contact) {
      console.error('❌ Erro ao criar/buscar contato')
      return
    }

    // 4. Criar/buscar CONVERSA (padrão Coonver: SELECT primeiro, INSERT se não existir)
    let conversation
    const { data: existingConversation, error: convFetchError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('contact_id', contact.id)
      .maybeSingle()

    if (convFetchError) {
      console.error('❌ Erro ao buscar conversa:', convFetchError.message)
      return
    }

    if (existingConversation) {
      conversation = existingConversation
      console.log(`✅ Conversa encontrada: ${conversation.id}`)
    } else {
      // Criar nova conversa
      const { data: created, error: createError } = await chatSupabase
        .from('whatsapp_conversations')
        .insert({
          instance_name: instanceName,
          connection_id: connection.id,
          contact_id: contact.id,
          user_id: connection.user_id
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Erro ao criar conversa:', createError.message)
        console.error('Detalhes:', createError)
        return
      }

      conversation = created
      console.log(`✅ Conversa criada: ${conversation.id}`)
    }

    if (!conversation) {
      console.error('❌ Erro ao criar/buscar conversa')
      return
    }

    // 5. Verificar DUPLICATA
    const { data: existingMessage } = await chatSupabase
      .from('whatsapp_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('conversation_id', conversation.id)
      .maybeSingle()

    if (existingMessage) {
      console.log('ℹ️ Mensagem duplicada ignorada:', messageId)
      return
    }

    // 6. Determinar tipo de mensagem e extrair conteúdo
    let messageType = 'text'
    let messageContent = ''
    let mediaUrl = null

    if (message.type === 'text') {
      messageType = 'text'
      messageContent = message.text || ''
    } else if (message.type === 'media') {
      // Processar mídia baseado no messageType
      if (message.messageType === 'AudioMessage') {
        messageType = 'audio'
        mediaUrl = message.content?.URL || null
        messageContent = ''
      } else if (message.messageType === 'ImageMessage') {
        messageType = 'image'
        mediaUrl = message.content?.URL || null
        messageContent = message.text || message.content?.caption || ''
      } else if (message.messageType === 'VideoMessage') {
        messageType = 'video'
        mediaUrl = message.content?.URL || null
        messageContent = message.text || message.content?.caption || ''
      } else if (message.messageType === 'DocumentMessage') {
        messageType = 'document'
        mediaUrl = message.content?.URL || null
        messageContent = message.text || message.content?.fileName || ''
      }
    }

    // 7. Download e salvamento local de mídia (se houver)
    let localMediaPath = null
    if (mediaUrl && messageType !== 'text') {
      // Extrair token da instância do payload para descriptografar mídia
      const instanceToken = payload.token || null

      const mediaResult = await mediaStorageService.downloadAndSave(
        mediaUrl,
        messageType,
        messageId,
        instanceToken // ← Passar token para descriptografar mídia do WhatsApp
      )

      if (mediaResult) {
        localMediaPath = mediaResult.localPath
        // Atualizar mediaUrl para caminho local ao invés da URL do WhatsApp
        mediaUrl = `/storage/media/${mediaResult.relativePath}`
      }
    }

    // 8. Salvar MENSAGEM
    const { data: savedMessage, error: msgError } = await chatSupabase
      .from('whatsapp_messages')
      .insert({
        instance_name: instanceName,
        connection_id: connection.id,
        conversation_id: conversation.id,
        contact_id: contact.id,
        user_id: connection.user_id,
        message_id: messageId,
        from_number: phoneNumber,
        to_number: phoneNumber,
        message_type: messageType,
        message_content: messageContent,
        media_url: mediaUrl,
        direction: 'inbound',
        status: 'received',
        received_at: new Date(messageTimestamp).toISOString(),
        metadata: {
          raw_payload: payload
        }
      })
      .select()
      .single()

    if (msgError) {
      console.error('❌ Erro ao salvar mensagem:', msgError)
      return
    }

    console.log(`✅ Mensagem salva: ${savedMessage.id} (tipo: ${messageType})`)

    // 9. Atualizar conversa com última mensagem
    await chatSupabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date(messageTimestamp).toISOString(),
        last_message_preview: messageContent.substring(0, 100) || `[${messageType}]`,
        unread_count: (conversation.unread_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // 10. Se for áudio, processar transcrição (assíncrono)
    if (messageType === 'audio' && localMediaPath) {
      console.log('🎤 Áudio detectado, iniciando transcrição...')
      setImmediate(() => {
        processAudioTranscription(savedMessage.id, localMediaPath).catch(error => {
          console.error('❌ Erro ao transcrever áudio:', error)
        })
      })
    }

    console.log('✅ Processamento completo!')

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
    throw error
  }
}

/**
 * Processa transcrição de áudio
 */
async function processAudioTranscription(messageId, localFilePath) {
  try {
    console.log(`🎤 Iniciando transcrição para mensagem: ${messageId}`)

    // Usar TranscriptionService com arquivo local
    const result = await transcriptionService.transcribeAndSave(messageId, localFilePath)

    if (result) {
      console.log(`✅ Transcrição salva com sucesso: ${messageId}`)
    } else {
      console.warn(`⚠️ Não foi possível transcrever: ${messageId}`)
    }

  } catch (error) {
    console.error('❌ Erro na transcrição:', error)
  }
}

/**
 * Processa atualização de status de mensagem
 */
async function handleMessageStatus(payload) {
  try {
    console.log('📊 Status de mensagem:', payload)
    // TODO: Implementar atualização de status (delivered, read, etc)
  } catch (error) {
    console.error('❌ Erro ao processar status:', error)
  }
}

/**
 * Processa atualização de conexão
 */
async function handleConnectionUpdate(payload) {
  try {
    console.log('🔄 Atualização de conexão:', payload)
    // TODO: Implementar atualização de status de conexão
  } catch (error) {
    console.error('❌ Erro ao processar conexão:', error)
  }
}

/**
 * GET - Verificar se webhook está funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'UazAPI Webhook is running',
    timestamp: new Date().toISOString(),
    version: '2.0'
  })
}
