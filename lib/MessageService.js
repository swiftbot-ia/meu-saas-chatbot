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
import { UAZAPIClient } from './uazapi-client';
import ConversationService from './ConversationService';
import MediaService from './MediaService';

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

    console.log('[SendTextMessage] Looking for connection:', {
      instance_name: conversation.instance_name,
      conversation_id: conversationId,
      user_id: userId
    });

    // Get connection details - prefer by instance_name, fallback to user's active connection
    let connection;
    let connError;

    // Try by instance_name first
    const { data: connByName, error: err1 } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, instance_token, instance_name, user_id')
      .eq('instance_name', conversation.instance_name)
      .maybeSingle();

    if (connByName) {
      connection = connByName;
      console.log('[SendTextMessage] ✅ Connection found by instance_name');
    } else {
      console.log('[SendTextMessage] ⚠️ Connection not found by instance_name, trying fallback...');

      // Fallback: get user's first active connection
      const { data: connByUser, error: err2 } = await mainSupabase
        .from('whatsapp_connections')
        .select('id, instance_token, instance_name, user_id')
        .eq('user_id', userId)
        .eq('is_connected', true)
        .limit(1)
        .maybeSingle();

      connection = connByUser;
      connError = err2;

      if (connection) {
        console.log('[SendTextMessage] ✅ Connection found by user_id (fallback):', connection.instance_name);
      } else {
        console.log('[SendTextMessage] ❌ No connection found');
      }
    }

    if (connError || !connection) {
      console.error('[SendTextMessage] Connection lookup failed:', {
        error: connError?.message,
        instance_name: conversation.instance_name,
        user_id: userId
      });
      throw new Error('WhatsApp connection not found');
    }

    if (!connection.instance_token) {
      throw new Error('Instance token not configured');
    }

    console.log('[SendTextMessage] Using connection:', {
      id: connection.id,
      instance_name: connection.instance_name
    });

    // Initialize UazAPI client
    const uazClient = new UAZAPIClient();

    // Send message via UazAPI
    const response = await uazClient.sendMessage(
      connection.instance_token,
      conversation.contact.whatsapp_number,
      messageText
    );

    console.log('✅ Message sent successfully, webhook will save it');

    return { success: true, response };
  }

  /**
   * Send a media message (image, video, document, audio)
   */
  static async sendMediaMessage(conversationId, { mediaUrl, caption, mediaType, ptt }, userId) {
    const mainSupabase = createServerSupabaseClient();
    const chatSupabase = createChatSupabaseClient();

    // Get conversation details from chat DB
    const conversation = await ConversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    console.log('[SendMediaMessage] Looking for connection:', {
      instance_name: conversation.instance_name,
      conversation_id: conversationId,
      user_id: userId,
      media_type: mediaType
    });

    // Get connection details - prefer by instance_name, fallback to user's active connection
    let connection;
    let connError;

    // Try by instance_name first
    const { data: connByName, error: err1 } = await mainSupabase
      .from('whatsapp_connections')
      .select('id, instance_token, instance_name, user_id')
      .eq('instance_name', conversation.instance_name)
      .maybeSingle();

    if (connByName) {
      connection = connByName;
      console.log('[SendMediaMessage] ✅ Connection found by instance_name');
    } else {
      console.log('[SendMediaMessage] ⚠️ Connection not found by instance_name, trying fallback...');

      // Fallback: get user's first active connection
      const { data: connByUser, error: err2 } = await mainSupabase
        .from('whatsapp_connections')
        .select('id, instance_token, instance_name, user_id')
        .eq('user_id', userId)
        .eq('is_connected', true)
        .limit(1)
        .maybeSingle();

      connection = connByUser;
      connError = err2;

      if (connection) {
        console.log('[SendMediaMessage] ✅ Connection found by user_id (fallback):', connection.instance_name);
      } else {
        console.log('[SendMediaMessage] ❌ No connection found');
      }
    }

    if (connError || !connection) {
      console.error('[SendMediaMessage] Connection lookup failed:', {
        error: connError?.message,
        instance_name: conversation.instance_name,
        user_id: userId
      });
      throw new Error('WhatsApp connection not found');
    }

    if (!connection.instance_token) {
      throw new Error('Instance token not configured');
    }

    console.log('[SendMediaMessage] Using connection:', {
      id: connection.id,
      instance_name: connection.instance_name
    });

    // Initialize UazAPI client
    const uazClient = new UAZAPIClient();

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
          mediaUrl,
          !!ptt // Pass ptt flag if present
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

    console.log('✅ Media sent successfully, webhook will save it');

    return { success: true, response };
  }

  /**
   * Process incoming message from webhook
   * @param {object} messageData - Message data from webhook
   * @param {string} instanceName - WhatsApp instance name
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User ID
   * @param {object} customChatClient - Optional custom Supabase client (for bypassing RLS in webhooks)
   */
  static async processIncomingMessage(messageData, instanceName, connectionId, userId, customChatClient = null) {
    const chatSupabase = customChatClient || createChatSupabaseClient();

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

      // Create or get contact in chat DB
      const contact = await ConversationService.getOrCreateContact(whatsappNumber, {
        name: messageData.pushName || null,
        jid: remoteJid
      }, chatSupabase);

      // Create or get conversation in chat DB
      const conversation = await ConversationService.getOrCreateConversation(
        instanceName,
        connectionId,
        contact.id,
        userId,
        chatSupabase
      );

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
      let metadata = { raw_message: messageData };

      if (messageInfo.conversation) {
        messageType = 'text';
        messageContent = messageInfo.conversation;
      } else if (messageInfo.extendedTextMessage) {
        messageType = 'text';
        messageContent = messageInfo.extendedTextMessage.text;
      } else if (messageInfo.imageMessage) {
        messageType = 'image';
        messageContent = messageInfo.imageMessage.caption || '';
        const originalUrl = messageInfo.imageMessage.url;

        // Process image: download and upload to our storage
        try {
          const fileName = MediaService.generateFileName(messageKey.id, 'image');
          mediaUrl = await MediaService.processMedia(originalUrl, fileName, 'image');
          metadata.original_url = originalUrl;
        } catch (error) {
          console.error('Error processing image:', error);
          mediaUrl = originalUrl; // Fallback to original URL
        }
      } else if (messageInfo.videoMessage) {
        messageType = 'video';
        messageContent = messageInfo.videoMessage.caption || '';
        const originalUrl = messageInfo.videoMessage.url;

        // Process video: download and upload to our storage
        try {
          const fileName = MediaService.generateFileName(messageKey.id, 'video');
          mediaUrl = await MediaService.processMedia(originalUrl, fileName, 'video');
          metadata.original_url = originalUrl;
        } catch (error) {
          console.error('Error processing video:', error);
          mediaUrl = originalUrl; // Fallback to original URL
        }
      } else if (messageInfo.audioMessage) {
        messageType = 'audio';
        const originalUrl = messageInfo.audioMessage.url;

        // Process audio: download, upload to storage, and transcribe
        try {
          const fileName = MediaService.generateFileName(messageKey.id, 'audio');
          const audioResult = await MediaService.processAudio(originalUrl, fileName);
          mediaUrl = audioResult.url;
          metadata.original_url = originalUrl;

          // Add transcription to content if available
          if (audioResult.transcription) {
            messageContent = audioResult.transcription;
            metadata.transcription = audioResult.transcription;
            console.log('🎤 Audio transcribed:', audioResult.transcription);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          mediaUrl = originalUrl; // Fallback to original URL
        }
      } else if (messageInfo.documentMessage) {
        messageType = 'document';
        messageContent = messageInfo.documentMessage.fileName || '';
        const originalUrl = messageInfo.documentMessage.url;

        // Process document: download and upload to our storage
        try {
          const fileName = messageInfo.documentMessage.fileName || MediaService.generateFileName(messageKey.id, 'document');
          mediaUrl = await MediaService.processMedia(originalUrl, fileName, 'document');
          metadata.original_url = originalUrl;
          metadata.file_name = messageInfo.documentMessage.fileName;
        } catch (error) {
          console.error('Error processing document:', error);
          mediaUrl = originalUrl; // Fallback to original URL
        }
      }

      // Save message to chat DB
      // Extract phone number from participant or remoteJid (remove @s.whatsapp.net suffix)
      const toNumber = messageKey.participant
        ? messageKey.participant.split('@')[0]
        : whatsappNumber;

      let message;
      try {
        const { data: insertedMessage, error: msgError } = await chatSupabase
          .from('whatsapp_messages')
          .insert({
            instance_name: instanceName,
            connection_id: connectionId,
            conversation_id: conversation.id,
            contact_id: contact.id,
            user_id: userId,
            message_id: messageKey.id,
            from_number: whatsappNumber,
            to_number: toNumber,
            message_type: messageType,
            message_content: messageContent,
            media_url: mediaUrl,
            direction: 'inbound',
            status: 'received',
            received_at: new Date(messageTimestamp * 1000).toISOString(),
            metadata
          })
          .select()
          .single();

        if (msgError) throw msgError;
        message = insertedMessage;
      } catch (error) {
        // Handle duplicate key error (race condition)
        if (error.code === '23505') { // Postgres unique_violation code
          console.log('Message already exists (race condition handled):', messageKey.id);
          const { data: existing } = await chatSupabase
            .from('whatsapp_messages')
            .select('*')
            .eq('message_id', messageKey.id)
            .single();
          return existing;
        }
        throw error;
      }

      // Update conversation
      // Ensure messageContent is a string before substring
      const preview = typeof messageContent === 'string' && messageContent
        ? messageContent.substring(0, 100)
        : `[${messageType}]`;

      await ConversationService.updateConversation(conversation.id, {
        last_message_at: new Date(messageTimestamp * 1000).toISOString(),
        last_message_preview: preview,
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
