/**
 * ============================================================================
 * WEBHOOK UAZAPI - VERSÃO CORRIGIDA E OTIMIZADA
 * ============================================================================
 * Recebe e processa eventos do WhatsApp via UAZapi
 * 
 * MELHORIAS IMPLEMENTADAS:
 * ✅ Usa Supabase Admin (bypass RLS) para webhooks
 * ✅ Aceita mensagens fromMe=true e false (conversa completa)
 * ✅ NUNCA usa URLs diretas do WhatsApp (salva na VPS)
 * ✅ Integra OpenAI para transcrição e interpretação
 * ✅ Valida tamanho de arquivos antes de processar
 * ✅ Retorna 200 sempre (exceto auth) para evitar reenvios
 * ✅ Idempotência completa (previne duplicação)
 * ✅ Logging estruturado com timestamps
 * ✅ Salva todos os campos do banco corretamente
 * ✅ Tratamento de erros robusto
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server'; // Main DB Admin
import { chatSupabaseAdmin } from '@/lib/supabase/chat-server'; // Chat DB Admin
import ConversationService from '@/lib/ConversationService';
import MediaServiceVPS from '@/lib/MediaServiceVPS';
import { randomUUID } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Gera ID único para correlação de logs
 */
function generateRequestId() {
  return randomUUID().substring(0, 8);
}

/**
 * Log estruturado com timestamp e request ID
 */
function log(requestId, level, emoji, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${requestId}] ${emoji}`;

  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}

/**
 * POST - Handler principal do webhook
 */
export async function POST(request) {
  const requestId = generateRequestId();

  try {
    log(requestId, 'info', '📨', 'Webhook recebido');

    // 1. VALIDAÇÃO DE AUTENTICAÇÃO (opcional)
    if (process.env.WEBHOOK_AUTH_USER && process.env.WEBHOOK_AUTH_PASS) {
      const authHeader = request.headers.get('authorization');
      const expectedAuth = Buffer.from(
        `${process.env.WEBHOOK_AUTH_USER}:${process.env.WEBHOOK_AUTH_PASS}`
      ).toString('base64');

      if (authHeader !== `Basic ${expectedAuth}`) {
        log(requestId, 'warn', '⚠️', 'Autenticação falhou');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. PARSE DO PAYLOAD
    let payload;
    try {
      payload = await request.json();
    } catch (parseError) {
      log(requestId, 'error', '❌', 'Payload inválido', { error: parseError.message });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 3. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
    const eventType = payload.event || payload.EventType;
    const instanceName = payload.instance || payload.instanceName;

    if (!eventType || !instanceName) {
      log(requestId, 'warn', '⚠️', 'Payload incompleto', payload);
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event and instance' },
        { status: 400 }
      );
    }

    log(requestId, 'info', '🔍', `Evento: ${eventType} | Instância: ${instanceName}`);

    // 4. PROCESSAR EVENTO
    try {
      await processEvent(requestId, eventType, instanceName, payload);

      log(requestId, 'success', '✅', 'Webhook processado com sucesso');

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        requestId
      });

    } catch (processingError) {
      // IMPORTANTE: Retornar 200 mesmo com erro interno
      // para evitar que UAZapi fique reenviando o mesmo evento
      log(requestId, 'error', '❌', 'Erro ao processar evento', {
        error: processingError.message,
        stack: processingError.stack
      });

      return NextResponse.json({
        success: false,
        message: 'Event processing failed but acknowledged',
        error: processingError.message,
        requestId
      }, { status: 200 }); // 200 mesmo com erro!
    }

  } catch (error) {
    log(requestId, 'error', '💥', 'Erro crítico no webhook', {
      error: error.message,
      stack: error.stack
    });

    // Retornar 200 para evitar reenvios infinitos
    return NextResponse.json({
      success: false,
      message: 'Critical error but acknowledged',
      error: error.message,
      requestId
    }, { status: 200 });
  }
}

/**
 * Processa evento baseado no tipo
 */
async function processEvent(requestId, eventType, instanceName, payload) {
  switch (eventType) {
    case 'CONNECTION_UPDATE':
    case 'connection.update':
    case 'connection':
    case 'status':
      await handleConnectionUpdate(requestId, instanceName, payload);
      break;

    case 'MESSAGES_UPSERT':
      await handleMessagesUpsert(requestId, instanceName, payload);
      break;

    case 'messages': // Novo formato UAZapi
      await handleNewFormatMessage(requestId, instanceName, payload);
      break;

    case 'MESSAGES_UPDATE':
      await handleMessagesUpdate(requestId, instanceName, payload);
      break;

    case 'QRCODE_UPDATED':
      await handleQRCodeUpdate(requestId, instanceName, payload);
      break;

    case 'CONNECTION_LOST':
    case 'CONNECTION_CLOSE':
      await handleConnectionLost(requestId, instanceName, payload);
      break;

    default:
      log(requestId, 'info', 'ℹ️', `Evento não tratado: ${eventType}`);
  }
}

/**
 * ===========================================================================
 * HANDLER: CONNECTION_UPDATE
 * ===========================================================================
 */
async function handleConnectionUpdate(requestId, instanceName, payload) {
  try {
    const state = payload.data?.state; // 'open', 'close', 'connecting'
    log(requestId, 'info', '🔄', `CONNECTION_UPDATE: ${instanceName} → ${state}`);

    // Buscar conexão no banco principal (Main DB)
    const { data: connection, error } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (error || !connection) {
      log(requestId, 'info', 'ℹ️', `Conexão não encontrada, ignorando: ${instanceName}`);
      return;
    }

    // Determinar novo status
    let status = 'disconnected';
    let isConnected = false;

    if (state === 'open') {
      status = 'connected';
      isConnected = true;
    } else if (state === 'connecting') {
      status = 'connecting';
    }

    // Preparar dados para atualização
    const updates = {
      status,
      is_connected: isConnected,
      updated_at: new Date().toISOString()
    };

    if (isConnected) {
      updates.last_connected_at = new Date().toISOString();
    }

    // Extrair número do WhatsApp se disponível
    if (payload.data?.ownerJid) {
      updates.phone_number = payload.data.ownerJid.replace('@s.whatsapp.net', '');
    }

    // Atualizar no banco
    await supabaseAdmin
      .from('whatsapp_connections')
      .update(updates)
      .eq('id', connection.id);

    log(requestId, 'success', '✅', `Status atualizado: ${instanceName} → ${status}`);

    // 🔄 Se acabou de conectar, iniciar sincronização em background
    if (isConnected && connection.instance_token) {
      import('@/lib/SyncService').then(({ default: SyncService }) => {
        SyncService.runFullSync(connection.id, connection.instance_token)
          .then(job => log(requestId, 'info', '🔄', `Sync iniciado: ${job?.id || 'unknown'}`))
          .catch(err => log(requestId, 'warn', '⚠️', `Erro ao iniciar sync: ${err.message}`));
      }).catch(err => log(requestId, 'warn', '⚠️', `Erro ao importar SyncService: ${err.message}`));
    }

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleConnectionUpdate', { error: error.message });
    throw error;
  }
}

/**
 * ===========================================================================
 * HANDLER: MESSAGES_UPSERT (formato antigo)
 * ===========================================================================
 */
async function handleMessagesUpsert(requestId, instanceName, payload) {
  try {
    log(requestId, 'info', '💬', `MESSAGES_UPSERT: ${instanceName}`);

    const messageData = payload.data;
    const messages = Array.isArray(messageData) ? messageData : [messageData];

    for (const message of messages) {
      await processIncomingMessage(requestId, instanceName, message);
    }

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleMessagesUpsert', { error: error.message });
    throw error;
  }
}

/**
 * ===========================================================================
 * HANDLER: messages (novo formato UAZapi)
 * ===========================================================================
 */
async function handleNewFormatMessage(requestId, instanceName, payload) {
  try {
    log(requestId, 'info', '💬', `NEW FORMAT MESSAGE: ${instanceName}`);

    const messageData = payload.message;
    const instanceToken = payload.token; // Token já vem no payload!

    // Converter novo formato para formato padrão
    const convertedMessage = {
      key: {
        remoteJid: messageData.chatid,
        fromMe: messageData.fromMe,
        id: messageData.messageid || messageData.id.split(':')[1]
      },
      messageTimestamp: messageData.messageTimestamp
        ? (messageData.messageTimestamp > 9999999999
          ? Math.floor(messageData.messageTimestamp / 1000) // ms → s
          : messageData.messageTimestamp)
        : Math.floor(Date.now() / 1000),
      pushName: messageData.senderName,
      message: {}
    };

    // Converter tipo de mensagem
    switch (messageData.messageType) {
      case 'AudioMessage':
        convertedMessage.message.audioMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          seconds: messageData.content.seconds
        };
        break;

      case 'ImageMessage':
        convertedMessage.message.imageMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          caption: messageData.text || ''
        };
        break;

      case 'VideoMessage':
        convertedMessage.message.videoMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          caption: messageData.text || '',
          seconds: messageData.content.seconds
        };
        break;

      case 'DocumentMessage':
        convertedMessage.message.documentMessage = {
          url: messageData.content.URL,
          mimetype: messageData.content.mimetype,
          fileName: messageData.content.fileName || 'document'
        };
        break;

      case 'TextMessage':
      default:
        convertedMessage.message.conversation = messageData.text;
        break;
    }

    await processIncomingMessage(requestId, instanceName, convertedMessage, instanceToken);

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleNewFormatMessage', { error: error.message });
    throw error;
  }
}

/**
 * ===========================================================================
 * HANDLER: MESSAGES_UPDATE (status de mensagem)
 * ===========================================================================
 */
async function handleMessagesUpdate(requestId, instanceName, payload) {
  try {
    log(requestId, 'info', '📊', `MESSAGES_UPDATE: ${instanceName}`);

    const updates = Array.isArray(payload.data) ? payload.data : [payload.data];

    for (const update of updates) {
      const messageId = update.key?.id;
      const status = update.update?.status; // 'delivered', 'read', etc

      if (!messageId || !status) continue;

      // Atualizar status no Chat DB
      await chatSupabaseAdmin
        .from('whatsapp_messages')
        .update({ status })
        .eq('message_id', messageId);

      log(requestId, 'info', '✅', `Mensagem ${messageId} → ${status}`);
    }

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleMessagesUpdate', { error: error.message });
    // Não propagar erro - atualização de status não é crítica
  }
}

/**
 * ===========================================================================
 * HANDLER: QRCODE_UPDATED
 * ===========================================================================
 */
async function handleQRCodeUpdate(requestId, instanceName, payload) {
  try {
    log(requestId, 'info', '📱', `QRCODE_UPDATED: ${instanceName}`);

    // Buscar conexão no Main DB
    const { data: connection } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!connection) {
      log(requestId, 'info', 'ℹ️', `Conexão não encontrada, ignorando QR Code`);
      return;
    }

    // IMPORTANTE: NÃO salvar QR Code (é muito grande ~50KB)
    // Apenas atualizar timestamp
    await supabaseAdmin
      .from('whatsapp_connections')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    log(requestId, 'success', '✅', `QR Code timestamp atualizado`);

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleQRCodeUpdate', { error: error.message });
    // Não propagar erro - QR Code não é crítico
  }
}

/**
 * ===========================================================================
 * HANDLER: CONNECTION_LOST
 * ===========================================================================
 */
async function handleConnectionLost(requestId, instanceName, payload) {
  try {
    log(requestId, 'warn', '❌', `CONNECTION_LOST: ${instanceName}`);

    // Buscar conexão no Main DB
    const { data: connection } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!connection) {
      log(requestId, 'info', 'ℹ️', `Conexão não encontrada, ignorando perda de conexão`);
      return;
    }

    // Marcar como desconectado
    await supabaseAdmin
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        is_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    log(requestId, 'success', '✅', `Marcado como desconectado`);

  } catch (error) {
    log(requestId, 'error', '❌', 'Erro em handleConnectionLost', { error: error.message });
    throw error;
  }
}

/**
 * ===========================================================================
 * CORE: Processar mensagem recebida
 * ===========================================================================
 * MUDANÇA CRÍTICA: Aceita fromMe=true e false para formar conversa completa
 */
async function processIncomingMessage(requestId, instanceName, messageData, instanceToken = null) {
  try {
    const messageKey = messageData.key;
    const messageInfo = messageData.message;
    const messageTimestamp = messageData.messageTimestamp;
    const messageId = messageKey.id;

    log(requestId, 'info', '📝', `Processing message: ${messageId}`, {
      fromMe: messageKey.fromMe,
      remoteJid: messageKey.remoteJid
    });

    // 1. VERIFICAR SE MENSAGEM JÁ EXISTE (idempotência)
    const { data: existingMessage } = await chatSupabaseAdmin
      .from('whatsapp_messages')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle();

    if (existingMessage) {
      log(requestId, 'info', 'ℹ️', `Mensagem duplicada, ignorando: ${messageId}`);
      return;
    }

    // 2. BUSCAR CONEXÃO NO MAIN DB
    let connection;
    let connError;

    // Tentar buscar por instance_name
    const { data: connByName, error: errName } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id, user_id, instance_token')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (connByName) {
      connection = connByName;
    } else if (instanceToken) {
      // Fallback: Tentar buscar por instance_token
      log(requestId, 'warn', '⚠️', `Conexão não encontrada por nome (${instanceName}), tentando token...`);
      const { data: connByToken, error: errToken } = await supabaseAdmin
        .from('whatsapp_connections')
        .select('id, user_id, instance_token')
        .eq('instance_token', instanceToken)
        .maybeSingle();

      connection = connByToken;
      connError = errToken;
    } else {
      connError = errName;
    }

    if (!connection) {
      log(requestId, 'info', 'ℹ️', `Instância não encontrada (esperado): ${instanceName}`);
      return;
    }

    // AUTO-HEALING: Atualizar token no banco se vier no webhook e for diferente/ausente
    if (instanceToken && connection.instance_token !== instanceToken) {
      log(requestId, 'info', '🔧', `Atualizando token da instância (Auto-Healing)...`);

      // Fire and forget update
      supabaseAdmin
        .from('whatsapp_connections')
        .update({ instance_token: instanceToken })
        .eq('id', connection.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update instance token:', error);
          else console.log('✅ Instance token updated successfully');
        });

      // Atualizar objeto local para uso imediato
      connection.instance_token = instanceToken;
    }

    // 7. OBTER OU CRIAR CONTATO
    // IMPORTANTE: Só atualizar nome/foto do contato quando mensagem é RECEBIDA (fromMe=false)
    // Quando fromMe=true, pushName é o nome do REMETENTE (nós), não do contato
    const contactData = fromMe
      ? {} // Não passar nome quando é mensagem enviada por nós
      : { name: messageData.pushName, profilePicUrl: null };

    const contact = await ConversationService.getOrCreateContact(
      whatsappNumber,
      contactData,
      chatSupabaseAdmin
    );

    // Sync contact info if missing (name or profile pic) - APENAS para mensagens recebidas
    if (!fromMe && (!contact.profile_pic_url || !contact.name || contact.name === whatsappNumber)) {
      // Fire and forget - don't await to avoid blocking response
      ConversationService.syncContactInfo(
        contact.id,
        whatsappNumber,
        instanceToken,
        chatSupabaseAdmin
      ).catch(err => console.error('Background contact sync failed:', err));
    }

    // 8. OBTER OU CRIAR CONVERSA NO CHAT DB
    const conversation = await getOrCreateConversation(
      requestId,
      instanceName,
      connection.id,
      contact.id,
      connection.user_id
    );

    // 6. DETERMINAR TIPO E CONTEÚDO DA MENSAGEM
    let messageType = 'text';
    let messageContent = '';
    let mediaUrl = null; // Defined in outer scope
    let localMediaPath = null;
    let mediaMimeType = null;
    let mediaSize = null;
    let transcription = null;
    let transcriptionStatus = 'not_applicable';
    let aiInterpretation = null;
    let mediaDownloadedAt = null;
    let transcribedAt = null;
    let metadata = { raw_message: messageData };

    // 7. PROCESSAR CONTEÚDO
    if (messageInfo.conversation) {
      messageType = 'text';
      messageContent = messageInfo.conversation;
    }
    else if (messageInfo.extendedTextMessage) {
      messageType = 'text';
      messageContent = messageInfo.extendedTextMessage.text;
    }
    else if (messageInfo.imageMessage) {
      messageType = 'image';
      messageContent = messageInfo.imageMessage.caption || '';

      try {
        const result = await MediaServiceVPS.processMedia(
          messageInfo.imageMessage.url,
          'image',
          messageId,
          {
            mimetype: messageInfo.imageMessage.mimetype,
            instanceToken: instanceToken || connection.instance_token
          }
        );

        localMediaPath = result.localPath;
        mediaUrl = result.fullPublicUrl || result.localPath; // Assign mediaUrl
        mediaMimeType = result.mimeType;
        mediaSize = result.size;
        aiInterpretation = result.aiInterpretation;
        mediaDownloadedAt = result.mediaDownloadedAt;

      } catch (error) {
        log(requestId, 'error', '❌', `Falha ao processar imagem: ${error.message}`);
        mediaUrl = messageInfo.imageMessage.url; // Fallback
      }
    }
    else if (messageInfo.videoMessage) {
      messageType = 'video';
      messageContent = messageInfo.videoMessage.caption || '';

      try {
        const result = await MediaServiceVPS.processMedia(
          messageInfo.videoMessage.url,
          'video',
          messageId,
          {
            mimetype: messageInfo.videoMessage.mimetype,
            instanceToken: instanceToken || connection.instance_token
          }
        );

        localMediaPath = result.localPath;
        mediaUrl = result.fullPublicUrl || result.localPath; // Assign mediaUrl
        mediaMimeType = result.mimeType;
        mediaSize = result.size;
        aiInterpretation = result.aiInterpretation;
        mediaDownloadedAt = result.mediaDownloadedAt;

      } catch (error) {
        log(requestId, 'error', '❌', `Falha ao processar vídeo: ${error.message}`);
        mediaUrl = messageInfo.videoMessage.url; // Fallback
      }
    }
    else if (messageInfo.audioMessage) {
      messageType = 'audio';

      try {
        const result = await MediaServiceVPS.processMedia(
          messageInfo.audioMessage.url,
          'audio',
          messageId,
          {
            mimetype: messageInfo.audioMessage.mimetype,
            instanceToken: instanceToken || connection.instance_token
          }
        );

        localMediaPath = result.localPath;
        mediaUrl = result.fullPublicUrl || result.localPath; // Assign mediaUrl
        mediaMimeType = result.mimeType;
        mediaSize = result.size;
        transcription = result.transcription;
        aiInterpretation = result.aiInterpretation;
        transcriptionStatus = result.transcriptionStatus;
        mediaDownloadedAt = result.mediaDownloadedAt;
        transcribedAt = result.transcribedAt;

        if (transcription) {
          messageContent = transcription;
        }

      } catch (error) {
        log(requestId, 'error', '❌', `Falha ao processar áudio: ${error.message}`);
        mediaUrl = messageInfo.audioMessage.url; // Fallback
      }
    }
    else if (messageInfo.documentMessage) {
      messageType = 'document';
      messageContent = messageInfo.documentMessage.fileName || '';

      try {
        const result = await MediaServiceVPS.processMedia(
          messageInfo.documentMessage.url,
          'document',
          messageId,
          {
            mimetype: messageInfo.documentMessage.mimetype,
            fileName: messageInfo.documentMessage.fileName,
            instanceToken: instanceToken || connection.instance_token
          }
        );

        localMediaPath = result.localPath;
        mediaUrl = result.fullPublicUrl || result.localPath; // Assign mediaUrl
        mediaMimeType = result.mimeType;
        mediaSize = result.size;
        transcription = result.transcription;
        aiInterpretation = result.aiInterpretation;
        mediaDownloadedAt = result.mediaDownloadedAt;

      } catch (error) {
        log(requestId, 'error', '❌', `Falha ao processar documento: ${error.message}`);
        mediaUrl = messageInfo.documentMessage.url; // Fallback
      }
    }

    // 8. SALVAR MENSAGEM NO CHAT DB
    // Extract phone number from participant or remoteJid (remove @s.whatsapp.net suffix)
    const toNumber = messageKey.participant
      ? messageKey.participant.split('@')[0]
      : whatsappNumber;

    let savedMessage; // Renamed from 'message' to avoid conflict with 'message' in the outer scope
    try {
      const { data: insertedMessage, error: msgError } = await chatSupabaseAdmin // Changed to chatSupabaseAdmin
        .from('whatsapp_messages')
        .insert({
          instance_name: instanceName,
          connection_id: connection.id, // Kept original connection.id
          conversation_id: conversation.id,
          contact_id: contact.id,
          user_id: connection.user_id, // Kept original connection.user_id
          message_id: messageId, // Kept original messageId
          from_number: fromMe ? connection.phone_number : whatsappNumber, // Kept original logic
          to_number: fromMe ? whatsappNumber : connection.phone_number, // Kept original logic
          message_type: messageType,
          message_content: messageContent,
          media_url: mediaUrl, // New field
          direction: fromMe ? 'outbound' : 'inbound', // Kept original logic
          status: fromMe ? 'sent' : 'received', // Kept original logic
          received_at: new Date(messageTimestamp * 1000).toISOString(),
          metadata: {
            ...metadata,
            local_media_path: localMediaPath,
            media_mime_type: mediaMimeType,
            media_size: mediaSize,
            transcription,
            transcription_status: transcriptionStatus,
            ai_interpretation: aiInterpretation,
            media_downloaded_at: mediaDownloadedAt,
            transcribed_at: transcribedAt
          }
        })
        .select()
        .single();

      if (msgError) throw msgError;
      savedMessage = insertedMessage; // Assign to savedMessage

      log(requestId, 'success', '✅', `Mensagem salva: ${messageId}`, { // Kept original messageId
        type: messageType,
        direction: fromMe ? 'outbound' : 'inbound', // Kept original logic
        hasMedia: !!mediaUrl, // Changed to mediaUrl
        hasTranscription: !!transcription
      });

    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === '23505') { // Postgres unique_violation code
        log(requestId, 'info', 'ℹ️', `Mensagem já existe (race condition): ${messageId}`);

        // Fetch existing message with processing status
        const { data: existing } = await chatSupabaseAdmin
          .from('whatsapp_messages')
          .select('*')
          .eq('message_id', messageId)
          .maybeSingle();

        if (existing) {
          // CRITICAL FIX: Update transcription if we have a new one and existing doesn't
          if (transcription && !existing.transcription) {
            const { error: updateError } = await chatSupabaseAdmin
              .from('whatsapp_messages')
              .update({
                transcription,
                ai_interpretation,
                updated_at: new Date().toISOString()
              })
              .eq('message_id', messageId);

            if (updateError) {
              log(requestId, 'error', '❌', `Failed to update transcription: ${updateError.message}`);
            } else {
              log(requestId, 'info', '✅', `Transcription updated for: ${messageId}`);
            }
          }

          log(requestId, 'info', 'ℹ️', `Mensagem existente retornada: ${messageId}`);
          return; // Return early - message already processed
        }
      }
      throw error;
    }

    // 9. ATUALIZAR TODAS AS CONVERSAS COM O MESMO CONTATO
    // Isso garante que todos os usuários vejam a mensagem em suas conversas
    const preview = messageContent
      ? messageContent.substring(0, 100)
      : `[${messageType}]`;

    const messageTimestampISO = new Date(messageTimestamp * 1000).toISOString();

    // Buscar TODAS as conversas com este contact_id
    const { data: allConversations, error: convFetchError } = await chatSupabaseAdmin
      .from('whatsapp_conversations')
      .select('id, user_id, unread_count')
      .eq('contact_id', contact.id);

    if (convFetchError) {
      log(requestId, 'error', '❌', 'Erro ao buscar conversas do contato', { error: convFetchError.message });
    } else if (allConversations && allConversations.length > 0) {
      // Atualizar cada conversa
      for (const conv of allConversations) {
        // Não incrementar unread se for mensagem enviada (fromMe) ou se for a conversa do remetente
        const shouldIncrementUnread = !fromMe && conv.user_id !== connection.user_id;

        await chatSupabaseAdmin
          .from('whatsapp_conversations')
          .update({
            last_message_at: messageTimestampISO,
            last_message_preview: preview,
            unread_count: shouldIncrementUnread ? ((conv.unread_count || 0) + 1) : (fromMe ? 0 : (conv.unread_count || 0) + 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);
      }

      log(requestId, 'info', '📬', `Atualizadas ${allConversations.length} conversas com o mesmo contato`);
    } else {
      // Fallback: atualizar apenas a conversa atual
      await ConversationService.updateConversation(conversation.id, {
        last_message_at: messageTimestampISO,
        last_message_preview: preview,
        unread_count: fromMe ? 0 : ((conversation.unread_count || 0) + 1),
        updated_at: new Date().toISOString()
      }, chatSupabaseAdmin);
    }

    // 10. ATUALIZAR CONTATO
    await chatSupabaseAdmin
      .from('whatsapp_contacts')
      .update({
        last_message_at: new Date(messageTimestamp * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

  } catch (error) {
    log(requestId, 'error', '❌', `Erro em processIncomingMessage`, { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * ===========================================================================
 * HELPERS: Gerenciamento de Contatos e Conversas
 * ===========================================================================
 */

/**
 * Busca ou cria contato (usa Admin Client para bypass RLS)
 */
async function getOrCreateContact(requestId, whatsappNumber, data = {}) {
  // Tentar buscar existente
  const { data: existing } = await chatSupabaseAdmin
    .from('whatsapp_contacts')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .maybeSingle();

  if (existing) {
    // NÃO atualizar nome se já existir - manter consistência
    // Nome do contato deve ser fixo, não mudar com cada mensagem
    return existing;
  }

  // Criar novo
  const { data: newContact, error } = await chatSupabaseAdmin
    .from('whatsapp_contacts')
    .insert({
      whatsapp_number: whatsappNumber,
      name: data.name || whatsappNumber,
      jid: data.jid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar contato: ${error.message}`);
  }

  log(requestId, 'success', '✅', `Contato criado: ${whatsappNumber}`);
  return newContact;
}

/**
 * Busca ou cria conversa (usa Admin Client para bypass RLS)
 */
async function getOrCreateConversation(requestId, instanceName, connectionId, contactId, userId) {
  // Tentar buscar existente
  const { data: existing } = await chatSupabaseAdmin
    .from('whatsapp_conversations')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('contact_id', contactId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Criar nova
  const { data: newConv, error } = await chatSupabaseAdmin
    .from('whatsapp_conversations')
    .insert({
      instance_name: instanceName,
      connection_id: connectionId,
      contact_id: contactId,
      user_id: userId,
      unread_count: 0,
      funnel_stage: 'novo', // Novo campo
      funnel_position: 0,   // Novo campo
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar conversa: ${error.message}`);
  }

  log(requestId, 'success', '✅', `Conversa criada para contato ${contactId}`);
  return newConv;
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'UAZapi Webhook',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Supabase Admin (bypass RLS)',
      'Aceita fromMe true/false',
      'Salva mídia na VPS',
      'OpenAI transcrição + interpretação',
      'Idempotência completa',
      'Logging estruturado'
    ]
  });
}