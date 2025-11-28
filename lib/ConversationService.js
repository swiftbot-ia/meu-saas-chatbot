/**
 * Conversation Service
 * Manages WhatsApp conversations and contacts
 */

import { createServerSupabaseClient } from './supabase/client';

class ConversationService {
  /**
   * Get or create a contact by WhatsApp number
   */
  static async getOrCreateContact(whatsappNumber, { name, jid, profilePicUrl } = {}) {
    const supabase = createServerSupabaseClient();

    // Use the database function for atomicity
    const { data, error } = await supabase
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
    const { data: contact, error: fetchError } = await supabase
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
   * Get or create a conversation
   */
  static async getOrCreateConversation(connectionId, contactId, userId) {
    const supabase = createServerSupabaseClient();

    // Use the database function for atomicity
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', {
        p_connection_id: connectionId,
        p_contact_id: contactId,
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }

    // Get the full conversation object
    const { data: conversation, error: fetchError } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        contact:whatsapp_contacts(*),
        connection:whatsapp_connections(*)
      `)
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
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        contact:whatsapp_contacts(*),
        connection:whatsapp_connections(
          id,
          instance_name,
          phone_number_id,
          profile_name,
          profile_pic_url
        )
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Filter by connection if specified
    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    // Search by contact name or number
    if (search) {
      query = query.or(`contact.name.ilike.%${search}%,contact.whatsapp_number.ilike.%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing conversations:', error);
      throw error;
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
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        contact:whatsapp_contacts(*),
        connection:whatsapp_connections(*)
      `)
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

    return data;
  }

  /**
   * Update conversation metadata (last message, unread count, etc)
   */
  static async updateConversation(conversationId, updates) {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
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
    const supabase = createServerSupabaseClient();

    // Update conversation
    const { error: convError } = await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (convError) {
      console.error('Error marking conversation as read:', convError);
      throw convError;
    }

    // Update unread messages to 'read' status
    const { error: msgError } = await supabase
      .from('whatsapp_messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .neq('status', 'read');

    if (msgError) {
      console.error('Error updating message status:', msgError);
      throw msgError;
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
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
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
  static async getStats(userId, connectionId = null) {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('whatsapp_conversations')
      .select('id, unread_count, is_archived', { count: 'exact' })
      .eq('user_id', userId);

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
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
    const supabase = createServerSupabaseClient();

    // Get contacts that have conversations with this user
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select(`
        *,
        conversations:whatsapp_conversations!inner(
          id,
          connection_id,
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
