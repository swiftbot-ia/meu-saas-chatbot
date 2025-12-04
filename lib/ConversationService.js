/**
 * Conversation Service
 * Manages WhatsApp conversations and contacts
 * Uses TWO Supabase instances:
 * - Main DB: whatsapp_connections, auth.users
 * - Chat DB: whatsapp_contacts, whatsapp_conversations
 * Link: instance_name
 */

import { createServerSupabaseClient } from './supabase/client';
import { createChatSupabaseClient } from './supabase/chat-client';
import { chatSupabaseAdmin } from './supabase/chat-server';
import { UAZAPIClient } from './uazapi-client';

class ConversationService {
  /**
   * Get or create a contact by WhatsApp number
   * @param {object} customChatClient - Optional custom Supabase client (for bypassing RLS in webhooks)
   */
  static async getOrCreateContact(whatsappNumber, { name, jid, profilePicUrl } = {}, customChatClient = null) {
    const chatSupabase = customChatClient || createChatSupabaseClient();
    // ... (rest of getOrCreateContact)

    // Use the database function for atomicity
    const { data, error } = await chatSupabase
      .rpc('get_or_create_contact', {
        p_whatsapp_number: whatsappNumber,
        p_name: name || null,
        p_jid: jid || null,
        p_profile_pic_url: profilePicUrl || null
      });

    if (error) {
      console.error('Error getting/creating contact:', error);
      throw error;
    }

    // Get the full contact object
    const { data: contact, error: fetchError } = await chatSupabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching contact:', fetchError);
      throw fetchError;
    }

    return contact;
  }

  /**
   * Update contact info (name, profile pic)
   */
  static async updateContactInfo(contactId, { name, profilePicUrl }, customChatClient = null) {
    const chatSupabase = customChatClient || createChatSupabaseClient();

    const updates = {};
    if (name) updates.name = name;
    if (profilePicUrl) updates.profile_pic_url = profilePicUrl;

    if (Object.keys(updates).length === 0) return;

    const { error } = await chatSupabase
      .from('whatsapp_contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) {
      console.error('Error updating contact info:', error);
    }
  }

  /**
   * Sync contact info from UAZapi
   */
  static async syncContactInfo(contactId, whatsappNumber, instanceToken, customChatClient = null) {
    try {
      console.log(`🔄 Syncing contact info for ${whatsappNumber}...`);
      const uazClient = new UAZAPIClient();
      const details = await uazClient.getContactDetails(instanceToken, whatsappNumber);

      if (details) {
        console.log(`✅ Got contact details for ${whatsappNumber}:`, JSON.stringify(details, null, 2));

        await this.updateContactInfo(contactId, {
          name: details.name || details.pushName, // UAZapi might return name or pushName
          profilePicUrl: details.image || details.imagePreview // Fix: API returns 'image' or 'imagePreview'
        }, customChatClient);
      }
    } catch (error) {
      console.error(`❌ Error syncing contact info for ${whatsappNumber}:`, error.message);
      // Don't throw, just log - this is a background enhancement
    }
  }

  /**
   * Get or create a conversation
   * @param {object} customChatClient - Optional custom Supabase client (for bypassing RLS in webhooks)
   */
  static async getOrCreateConversation(instanceName, connectionId, contactId, userId, customChatClient = null) {
    const chatSupabase = customChatClient || createChatSupabaseClient();

    // Use the database function for atomicity
    const { data, error } = await chatSupabase
      .rpc('get_or_create_conversation', {
        p_instance_name: instanceName,
        p_connection_id: connectionId,
        p_contact_id: contactId,
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }

    // Get the full conversation object
    const { data: conversation, error: fetchError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*, contact:whatsapp_contacts(*)')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      throw fetchError;
    }

    return conversation;
  }

  /**
   * List all conversations for a user
   */
  static async listConversations(userId, { connectionId, search, limit = 50, offset = 0 } = {}) {
    const mainSupabase = createServerSupabaseClient();
    // Use admin client to bypass RLS, but filter by user_id for security
    const chatSupabase = chatSupabaseAdmin || createChatSupabaseClient();

    // If connectionId provided, get instance_name from main DB
    let instanceName = null;
    if (connectionId) {
      const { data: connection } = await mainSupabase
        .from('whatsapp_connections')
        .select('instance_name')
        .eq('id', connectionId)
        .single();

      if (connection) {
        instanceName = connection.instance_name;
      }
    }

    let query = chatSupabase
      .from('whatsapp_conversations')
      .select(`
        *,
        contact:whatsapp_contacts(*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_archived', false)  // Não mostrar arquivadas por padrão
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Filter by instance if specified
    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    }

    // Search by contact name or number
    if (search) {
      // Note: This will be slow without proper filtering, consider full-text search
      const { data: conversations } = await query;
      const filtered = conversations?.filter(conv => {
        const name = conv.contact?.name || '';
        const number = conv.contact?.whatsapp_number || '';
        return name.toLowerCase().includes(search.toLowerCase()) ||
          number.includes(search);
      });

      return {
        conversations: filtered?.slice(offset, offset + limit) || [],
        total: filtered?.length || 0,
        hasMore: (offset + limit) < (filtered?.length || 0)
      };
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing conversations:', error);
      throw error;
    }

    // Enrich with connection data from main DB
    if (data && data.length > 0) {
      const instanceNames = [...new Set(data.map(c => c.instance_name))];
      const { data: connections } = await mainSupabase
        .from('whatsapp_connections')
        .select('id, instance_name, phone_number_id, profile_name, profile_pic_url, is_connected')
        .in('instance_name', instanceNames);

      // Map connections to conversations
      data.forEach(conv => {
        conv.connection = connections?.find(c => c.instance_name === conv.instance_name);
      });
    }

    return {
      conversations: data || [],
      total: count,
      hasMore: (offset + limit) < count
    };
  }

  /**
   * Get a single conversation with full details
   */
  static async getConversation(conversationId, userId) {
    const mainSupabase = createServerSupabaseClient();
    // Use admin client to bypass RLS, but filter by user_id for security
    const chatSupabase = chatSupabaseAdmin || createChatSupabaseClient();

    const { data, error } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*, contact:whatsapp_contacts(*)')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching conversation:', error);
      throw error;
    }

    // Get connection data from main DB
    if (data) {
      const { data: connection } = await mainSupabase
        .from('whatsapp_connections')
        .select('id, instance_name, phone_number_id, profile_name, profile_pic_url, is_connected')
        .eq('instance_name', data.instance_name)
        .single();

      data.connection = connection;
    }

    return data;
  }

  /**
   * Update conversation metadata (last message, unread count, etc)
   */
  static async updateConversation(conversationId, updates) {
    const chatSupabase = createChatSupabaseClient();

    const { data, error } = await chatSupabase
      .from('whatsapp_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark conversation as read (reset unread count)
   */
  static async markAsRead(conversationId, userId) {
    const chatSupabase = createChatSupabaseClient();

    // Update conversation
    const { error: convError } = await chatSupabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (convError) {
      console.error('Error marking conversation as read:', convError);
      throw convError;
    }

    // Update unread messages to 'read' status (if table exists)
    try {
      const { error: msgError } = await chatSupabase
        .from('whatsapp_messages')
        .update({ status: 'read' })
        .eq('conversation_id', conversationId)
        .eq('direction', 'inbound')
        .neq('status', 'read');

      if (msgError) {
        console.error('Error updating message status:', msgError);
        // Don't throw - marking messages as read is not critical
      }
    } catch (e) {
      // Ignore if table doesn't exist yet
      console.log('whatsapp_messages table not found in chat DB');
    }

    return true;
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId, userId) {
    return this.updateConversation(conversationId, {
      is_archived: true,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(conversationId, userId) {
    return this.updateConversation(conversationId, {
      is_archived: false,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Pin/Unpin a conversation
   */
  static async togglePin(conversationId, userId, isPinned) {
    return this.updateConversation(conversationId, {
      is_pinned: isPinned,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId, userId) {
    const chatSupabase = createChatSupabaseClient();

    const { error } = await chatSupabase
      .from('whatsapp_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }

    return true;
  }

  /**
   * Get conversation statistics
   */
  static async getStats(userId, instanceName = null) {
    const chatSupabase = createChatSupabaseClient();

    let query = chatSupabase
      .from('whatsapp_conversations')
      .select('id, unread_count, is_archived', { count: 'exact' })
      .eq('user_id', userId);

    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error getting conversation stats:', error);
      throw error;
    }

    const totalUnread = data?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
    const archivedCount = data?.filter(conv => conv.is_archived).length || 0;

    return {
      total: count || 0,
      unread: totalUnread,
      archived: archivedCount,
      active: (count || 0) - archivedCount
    };
  }

  /**
   * Search contacts
   */
  static async searchContacts(userId, searchTerm, limit = 20) {
    const chatSupabase = createChatSupabaseClient();

    // Get contacts that have conversations with this user
    const { data, error } = await chatSupabase
      .from('whatsapp_contacts')
      .select(`
        *,
        conversations:whatsapp_conversations!inner(
          id,
          instance_name,
          user_id
        )
      `)
      .eq('conversations.user_id', userId)
      .or(`name.ilike.%${searchTerm}%,whatsapp_number.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }

    return data || [];
  }
}

export default ConversationService;
