/**
 * Message Service
 * Manages WhatsApp messages - sending, receiving, and listing
 * Uses TWO Supabase instances:
 * - Main DB: whatsapp_connections
 * - Chat DB: whatsapp_contacts, whatsapp_conversations, whatsapp_messages
 * Link: instance_name
 */

import { createServerSupabaseClient } from './supabase/client';
import { createChatSupabaseClient } from './supabase/chat-client';
import UazAPIClient from './uazapi-client';
import ConversationService from './ConversationService';

class MessageService {
  /**
   * List messages for a conversation
   */
  static async listMessages(conversationId, userId, { limit = 50, before = null } = {}) {
    const chatSupabase = createChatSupabaseClient();

    // Verify user has access to this conversation
    const conversation = await ConversationService.getConversation(conversationId, userId);

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    let query = chatSupabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('received_at', { ascending: false })
      .limit(limit);

    // Pagination: get messages before a specific timestamp
    if (before) {
      query = query.lt('received_at', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing messages:', error);
      throw error;
    }

    // Return in chronological order (oldest first)
    return (data || []).reverse();
  }

  /**
   * Get a single message
   */
  static async getMessage(messageId, userId) {
    const chatSupabase = createChatSupabaseClient();

    const { data, error } = await chatSupabase
      .from('whatsapp_messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching message:', error);
      throw error;
    }

    return data;
  }

  /**
   * Send a text message via WhatsApp
   */
  static async sendTextMessage(conversationId, messageText, userId) {
    const mainSupabase = createServerSupabaseClient();
    const chatSupabase = createChatSupabaseClient();

    // Get conversation details from chat DB
    const conversation = await ConversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Get connection details from main DB using instance_name
    const { data: connection, error: connError } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, instance_token, phone_number_id, instance_name')
      .eq('instance_name', conversation.instance_name)
      .single();

    if (connError || !connection) {
      throw new Error('WhatsApp connection not found');
    }

    if (!connection.instance_token) {
      throw new Error('Instance token not configured');
    }

    // Initialize UazAPI client
    const uazClient = new UazAPIClient();

    // Send message via UazAPI
    const response = await uazClient.sendMessage(
      connection.instance_token,
      conversation.contact.whatsapp_number,
      messageText
    );

    // Save message to chat database
    const messageId = response.key?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: message, error: msgError } = await chatSupabase
      .from('whatsapp_messages')
      .insert({
        instance_name: conversation.instance_name,
        connection_id: connection.id,
        conversation_id: conversationId,
        contact_id: conversation.contact_id,
        user_id: userId,
        message_id: messageId,
        from_number: connection.phone_number_id,
        to_number: conversation.contact.whatsapp_number,
        message_type: 'text',
        message_content: messageText,
        direction: 'outbound',
        status: 'sent',
        received_at: new Date().toISOString(),
        metadata: {
          uazapi_response: response
        }
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving sent message:', msgError);
      throw msgError;
    }

    // Update conversation last message
    await ConversationService.updateConversation(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: messageText.substring(0, 100)
    });

    return message;
  }

  /**
   * Send a media message (image, video, document, audio)
   */
  static async sendMediaMessage(conversationId, { mediaUrl, caption, mediaType }, userId) {
    const mainSupabase = createServerSupabaseClient();
    const chatSupabase = createChatSupabaseClient();

    // Get conversation details from chat DB
    const conversation = await ConversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Get connection details from main DB using instance_name
    const { data: connection, error: connError } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, instance_token, phone_number_id, instance_name')
      .eq('instance_name', conversation.instance_name)
      .single();

    if (connError || !connection) {
      throw new Error('WhatsApp connection not found');
    }

    if (!connection.instance_token) {
      throw new Error('Instance token not configured');
    }

    // Initialize UazAPI client
    const uazClient = new UazAPIClient();

    // Send media via UazAPI
    let response;
    switch (mediaType) {
      case 'image':
        response = await uazClient.sendImage(
          connection.instance_token,
          conversation.contact.whatsapp_number,
          mediaUrl,
          caption
        );
        break;
      case 'video':
        response = await uazClient.sendVideo(
          connection.instance_token,
          conversation.contact.whatsapp_number,
          mediaUrl,
          caption
        );
        break;
      case 'audio':
        response = await uazClient.sendAudio(
          connection.instance_token,
          conversation.contact.whatsapp_number,
          mediaUrl
        );
        break;
      case 'document':
        response = await uazClient.sendDocument(
          connection.instance_token,
          conversation.contact.whatsapp_number,
          mediaUrl,
          caption
        );
        break;
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }

    // Save message to chat database
    const messageId = response.key?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: message, error: msgError } = await chatSupabase
      .from('whatsapp_messages')
      .insert({
        instance_name: conversation.instance_name,
        connection_id: connection.id,
        conversation_id: conversationId,
        contact_id: conversation.contact_id,
        user_id: userId,
        message_id: messageId,
        from_number: connection.phone_number_id,
        to_number: conversation.contact.whatsapp_number,
        message_type: mediaType,
        message_content: caption || '',
        media_url: mediaUrl,
        direction: 'outbound',
        status: 'sent',
        received_at: new Date().toISOString(),
        metadata: {
          uazapi_response: response
        }
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving sent media message:', msgError);
      throw msgError;
    }

    // Update conversation last message
    const preview = caption || `[${mediaType}]`;
    await ConversationService.updateConversation(conversationId, {
      last_message_at: new Date().toISOString(),
      last_message_preview: preview.substring(0, 100)
    });

    return message;
  }

  /**
   * Process incoming message from webhook
   */
  static async processIncomingMessage(messageData, instanceName, connectionId, userId) {
    const chatSupabase = createChatSupabaseClient();

    try {
      // Extract message details
      const messageKey = messageData.key;
      const messageInfo = messageData.message;
      const messageTimestamp = messageData.messageTimestamp;

      // Identify sender
      const remoteJid = messageKey.remoteJid;
      const fromMe = messageKey.fromMe;
      const whatsappNumber = remoteJid.split('@')[0];

      // Skip if message is from us (already saved when sent)
      if (fromMe) {
        console.log('Skipping message from us:', messageKey.id);
        return null;
      }

      console.log('📇 Criando/buscando contato:', {
        whatsappNumber,
        name: messageData.pushName,
        jid: remoteJid
      });

      // Create or get contact in chat DB
      const contact = await ConversationService.getOrCreateContact(whatsappNumber, {
        name: messageData.pushName || null,
        jid: remoteJid
      });

      console.log('✅ Contato obtido:', {
        id: contact.id,
        whatsapp_number: contact.whatsapp_number
      });

      console.log('💬 Criando/buscando conversa:', {
        instanceName,
        connectionId,
        contactId: contact.id
      });

      // Create or get conversation in chat DB
      const conversation = await ConversationService.getOrCreateConversation(
        instanceName,
        connectionId,
        contact.id,
        userId
      );

      console.log('✅ Conversa obtida:', {
        id: conversation.id,
        instance_name: conversation.instance_name
      });

      // Check if message already exists (prevent duplicates)
      const { data: existingMessage } = await chatSupabase
        .from('whatsapp_messages')
        .select('id')
        .eq('message_id', messageKey.id)
        .maybeSingle();

      if (existingMessage) {
        console.log('Message already exists:', messageKey.id);
        return existingMessage;
      }

      // Determine message type and content
      let messageType = 'text';
      let messageContent = '';
      let mediaUrl = null;

      if (messageInfo.conversation) {
        messageType = 'text';
        messageContent = messageInfo.conversation;
      } else if (messageInfo.extendedTextMessage) {
        messageType = 'text';
        messageContent = messageInfo.extendedTextMessage.text;
      } else if (messageInfo.imageMessage) {
        messageType = 'image';
        messageContent = messageInfo.imageMessage.caption || '';
        mediaUrl = messageInfo.imageMessage.url;
      } else if (messageInfo.videoMessage) {
        messageType = 'video';
        messageContent = messageInfo.videoMessage.caption || '';
        mediaUrl = messageInfo.videoMessage.url;
      } else if (messageInfo.audioMessage) {
        messageType = 'audio';
        mediaUrl = messageInfo.audioMessage.url;
      } else if (messageInfo.documentMessage) {
        messageType = 'document';
        messageContent = messageInfo.documentMessage.fileName || '';
        mediaUrl = messageInfo.documentMessage.url;
      }

      // Save message to chat DB
      console.log('💾 Salvando mensagem no banco:', {
        instance_name: instanceName,
        conversation_id: conversation.id,
        contact_id: contact.id,
        message_id: messageKey.id,
        message_type: messageType,
        direction: 'inbound'
      });

      const { data: message, error: msgError } = await chatSupabase
        .from('whatsapp_messages')
        .insert({
          instance_name: instanceName,
          connection_id: connectionId,
          conversation_id: conversation.id,
          contact_id: contact.id,
          user_id: userId,
          message_id: messageKey.id,
          from_number: whatsappNumber,
          to_number: messageKey.participant || remoteJid,
          message_type: messageType,
          message_content: messageContent,
          media_url: mediaUrl,
          direction: 'inbound',
          status: 'received',
          received_at: new Date(messageTimestamp * 1000).toISOString(),
          metadata: {
            raw_message: messageData
          }
        })
        .select()
        .single();

      if (msgError) {
        console.error('❌ Erro ao salvar mensagem no banco:', {
          error: msgError.message,
          code: msgError.code,
          hint: msgError.hint,
          details: msgError.details
        });
        throw msgError;
      }

      console.log('✅ Mensagem salva com sucesso no banco:', message.id);

      // Update conversation
      await ConversationService.updateConversation(conversation.id, {
        last_message_at: new Date(messageTimestamp * 1000).toISOString(),
        last_message_preview: messageContent.substring(0, 100) || `[${messageType}]`,
        unread_count: (conversation.unread_count || 0) + 1
      });

      // Update contact last message time in chat DB
      await chatSupabase
        .from('whatsapp_contacts')
        .update({
          last_message_at: new Date(messageTimestamp * 1000).toISOString()
        })
        .eq('id', contact.id);

      return message;
    } catch (error) {
      console.error('Error processing incoming message:', error);
      throw error;
    }
  }

  /**
   * Update message status (delivered, read, etc)
   */
  static async updateMessageStatus(messageId, status) {
    const chatSupabase = createChatSupabaseClient();

    const { data, error } = await chatSupabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('message_id', messageId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating message status:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId, userId) {
    const chatSupabase = createChatSupabaseClient();

    // Verify ownership through conversation
    const message = await this.getMessage(messageId, userId);
    if (!message) {
      throw new Error('Message not found or access denied');
    }

    const { error } = await chatSupabase
      .from('whatsapp_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }

    return true;
  }

  /**
   * Get message statistics
   */
  static async getStats(userId, instanceName = null, dateRange = null) {
    const chatSupabase = createChatSupabaseClient();

    let query = chatSupabase
      .from('whatsapp_messages')
      .select('id, direction, status, received_at', { count: 'exact' })
      .eq('user_id', userId);

    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    }

    if (dateRange) {
      if (dateRange.start) {
        query = query.gte('received_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('received_at', dateRange.end);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error getting message stats:', error);
      throw error;
    }

    const inbound = data?.filter(m => m.direction === 'inbound').length || 0;
    const outbound = data?.filter(m => m.direction === 'outbound').length || 0;

    return {
      total: count || 0,
      inbound,
      outbound,
      sent: data?.filter(m => m.status === 'sent').length || 0,
      delivered: data?.filter(m => m.status === 'delivered').length || 0,
      read: data?.filter(m => m.status === 'read').length || 0,
      failed: data?.filter(m => m.status === 'failed').length || 0
    };
  }
}

export default MessageService;
