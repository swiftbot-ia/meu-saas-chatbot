/**
 * ChatWindow Component
 * Main chat window that combines MessageList and ChatInput
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import Avatar from '@/app/components/Avatar';
import { Phone, MoreVertical, Archive, Trash2, X, MessageSquare, Bot, ArrowLeft } from 'lucide-react';
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';

const chatSupabase = createChatSupabaseClient();

export default function ChatWindow({
  conversation,
  connection,
  onClose,
  onArchive,
  onDelete
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  // Agent toggle state
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (messages.length > previousMessageCount) {
      const messageList = document.querySelector('[data-message-list]');
      if (messageList) {
        // Only auto-scroll if user is near the bottom (within 100px)
        const isNearBottom =
          messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 100;

        if (isNearBottom || previousMessageCount === 0) {
          // Smooth scroll to bottom
          setTimeout(() => {
            messageList.scrollTo({
              top: messageList.scrollHeight,
              behavior: previousMessageCount === 0 ? 'auto' : 'smooth'
            });
          }, 100);
        }
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    // Limpar mensagens imediatamente ao trocar conversa
    setMessages([]);
    setPreviousMessageCount(0);

    if (conversation) {
      loadMessages();
      markAsRead();
      loadAgentStatus();

      // Setup real-time subscription for message updates
      // Use instance_name filter (like sidebar does) and filter by contact_id in JS
      const contactId = conversation.contact?.id;
      const instanceName = conversation.instance_name;

      console.log('🔔 [ChatWindow] Setting up realtime subscription:', {
        contactId,
        instanceName,
        contactName: conversation.contact?.name || conversation.contact?.whatsapp_number
      });

      if (!instanceName) {
        console.error('❌ [ChatWindow] Missing instance_name, cannot subscribe');
        return;
      }

      // Subscribe to ALL messages for this instance (like sidebar does)
      // Then filter by contact_id in the callback
      const channel = chatSupabase
        .channel(`chat-messages:${instanceName}:${contactId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `instance_name=eq.${instanceName}` // Use instance_name filter like sidebar
          },
          (payload) => {
            // Filter by contact_id in JavaScript
            if (payload.new?.contact_id !== contactId) {
              // Different contact, skip silently
              return;
            }

            console.log('📩 [ChatWindow] Message for this contact:', {
              eventType: payload.eventType,
              id: payload.new?.id,
              content: payload.new?.message_content?.substring(0, 30),
              direction: payload.new?.direction
            });

            if (payload.eventType === 'INSERT') {
              // Nova mensagem recebida
              const newMessage = payload.new;
              console.log('➕ [Realtime] INSERT - New message:', {
                id: newMessage.id,
                content: newMessage.message_content?.substring(0, 50),
                contact_id: newMessage.contact_id,
                instance_name: newMessage.instance_name,
                direction: newMessage.direction
              });

              setMessages(prev => {
                // Verificar se já existe (evitar duplicatas)
                const isDuplicate = prev.some(m => m.id === newMessage.id);
                if (isDuplicate) {
                  console.log('⚠️ [Realtime] Duplicate message ID, skipping:', newMessage.id);
                  return prev;
                }

                // For OUTBOUND messages, try to find and replace the optimistic message
                if (newMessage.direction === 'outbound') {
                  // Strategy 1: Match by exact content
                  let tempIndex = prev.findIndex(m => {
                    if (m.status !== 'sending' || m.direction !== 'outbound') return false;
                    if (m.message_type === 'text' && newMessage.message_type === 'text') {
                      return m.message_content === newMessage.message_content;
                    }
                    if (m.message_type === newMessage.message_type) {
                      return true;
                    }
                    return false;
                  });

                  // Strategy 2: If no exact match, find the most recent "sending" outbound message
                  if (tempIndex < 0) {
                    tempIndex = prev.findLastIndex(m =>
                      m.status === 'sending' &&
                      m.direction === 'outbound' &&
                      m.message_type === newMessage.message_type
                    );
                  }

                  // Strategy 3: Fallback - any sending outbound message of same type
                  if (tempIndex < 0) {
                    tempIndex = prev.findIndex(m =>
                      m.status === 'sending' &&
                      m.direction === 'outbound'
                    );
                  }

                  if (tempIndex >= 0) {
                    // Replace optimistic message with real one
                    console.log('🔄 [Realtime] Replacing optimistic message at index:', tempIndex);
                    const updated = [...prev];
                    updated[tempIndex] = {
                      ...newMessage,
                      status: 'sent'  // ✓✓ Confirmed!
                    };
                    return updated;
                  }

                  // Outbound message but no optimistic to replace - might be sent from another device
                  // Check if it's a truly new outbound message (not a duplicate content)
                  const hasSameContent = prev.some(m =>
                    m.direction === 'outbound' &&
                    m.message_content === newMessage.message_content &&
                    Math.abs(new Date(m.received_at) - new Date(newMessage.received_at)) < 5000 // Within 5 seconds
                  );

                  if (hasSameContent) {
                    console.log('⚠️ [Realtime] Duplicate outbound content detected, skipping');
                    return prev;
                  }

                  console.log('✅ [Realtime] Adding new outbound message (from another device?)');
                  return [...prev, newMessage];
                }

                // INBOUND messages - just add them
                console.log('✅ [Realtime] Adding new inbound message');
                return [...prev, newMessage];
              });
            } else if (payload.eventType === 'UPDATE') {
              // Atualização de mensagem existente (ex: status de 'sending' para 'sent')
              const updatedMessage = payload.new;
              console.log('🔄 [Realtime] UPDATE - Message status:', updatedMessage.status);
              setMessages(prev => prev.map(m =>
                m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
              ));
            }
          }
        )
        .subscribe((status, err) => {
          console.log('🔔 [Realtime] Subscription status:', status);
          if (err) {
            console.error('❌ [Realtime] Subscription error:', err);
          }
        });

      return () => {
        chatSupabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  const loadMessages = async (before = null) => {
    if (!conversation) return;

    // Don't show loading indicator on refresh
    if (!before && messages.length === 0) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        conversationId: conversation.id,
        limit: '50'
      });

      if (before) {
        params.append('before', before);
      }

      const response = await fetch(`/api/chat/messages?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens');
      }

      if (before) {
        // Prepend older messages
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        // Merge with existing messages to avoid duplicates
        setMessages(prev => {
          const apiMessages = data.messages || [];
          console.log('📥 [LoadMessages] API returned:', apiMessages.length, 'messages');
          console.log('📥 [LoadMessages] Current state has:', prev.length, 'messages');

          if (prev.length === 0) {
            // First load - just use API messages as-is
            console.log('📥 [LoadMessages] First load, using API messages');
            return apiMessages;
          }

          // Create a set of API message IDs for quick lookup
          const apiMessageIds = new Set(apiMessages.map(m => m.id));

          // Find realtime messages that are NOT in the API response yet
          // These are very recent messages that arrived via realtime but haven't been persisted/returned yet
          const realtimeOnlyMessages = prev.filter(m => !apiMessageIds.has(m.id));

          if (realtimeOnlyMessages.length > 0) {
            console.log('📥 [LoadMessages] Keeping', realtimeOnlyMessages.length, 'realtime-only messages');
            realtimeOnlyMessages.forEach(m => {
              console.log('   -', m.message_content?.substring(0, 20), '(status:', m.status, ')');
            });
          }

          // Combine: API messages (source of truth) + realtime-only messages
          const allMessages = [...apiMessages, ...realtimeOnlyMessages];

          console.log('📥 [LoadMessages] Total after merge:', allMessages.length, 'messages');

          // Sort by received_at ascending (oldest first)
          return allMessages.sort((a, b) =>
            new Date(a.received_at) - new Date(b.received_at)
          );
        });
      }

      // Check if there are more messages
      setHasMore(data.messages.length === 50);

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      if (messages.length === 0) {
        alert('Erro ao carregar mensagens. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (messages.length > 0) {
      const oldestMessage = messages[0];
      loadMessages(oldestMessage.received_at);
    }
  };

  const markAsRead = async () => {
    if (!conversation || conversation.unread_count === 0) return;

    try {
      await fetch(`/api/chat/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Load agent status for this conversation
  const loadAgentStatus = async () => {
    if (!conversation?.id) return;

    try {
      const response = await fetch(`/api/chat/agent-settings?conversationId=${conversation.id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAgentEnabled(data.agentEnabled);
      }
    } catch (error) {
      console.error('Erro ao carregar status do agente:', error);
      // Default to enabled on error
      setAgentEnabled(true);
    }
  };

  // Toggle agent for this conversation
  const toggleAgent = async () => {
    if (!conversation?.id || agentLoading) return;

    setAgentLoading(true);
    const newState = !agentEnabled;

    try {
      const response = await fetch('/api/chat/agent-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          agentEnabled: newState
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAgentEnabled(newState);
      } else {
        alert('Erro ao alterar status do agente');
      }
    } catch (error) {
      console.error('Erro ao alterar agente:', error);
      alert('Erro ao alterar status do agente');
    } finally {
      setAgentLoading(false);
    }
  };

  const handleSend = async ({ text, file, caption }) => {
    if (!conversation) return;

    setSending(true);
    try {
      let response;

      if (file) {
        // 1. Create Optimistic Message for Media
        const tempId = `temp_${Date.now()}`;
        const mediaType = detectMediaType(file.type);
        const optimisticMediaUrl = URL.createObjectURL(file);

        const optimisticMessage = {
          id: tempId,
          message_id: tempId,
          message_content: caption || '',
          direction: 'outbound',
          status: 'sending',
          created_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
          sender_name: 'Você',
          message_type: mediaType,
          media_url: optimisticMediaUrl, // Local preview URL
          caption: caption || ''
        };

        // Add to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => {
          const messageList = document.querySelector('[data-message-list]');
          if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
          }
        }, 100);

        // 2. Send media message
        const formData = new FormData();
        formData.append('conversationId', conversation.id);
        formData.append('file', file);
        formData.append('caption', caption || '');
        formData.append('mediaType', mediaType);

        response = await fetch('/api/chat/send-media', {
          method: 'POST',
          body: formData
        });
      } else {
        // Create optimistic message IMMEDIATELY
        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
          id: tempId,
          message_id: tempId,
          message_content: text,
          direction: 'outbound',
          status: 'sending',  // ⏰ Sending status
          created_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
          sender_name: 'Você',
          message_type: 'text'
        };

        // Add to UI INSTANTLY
        setMessages(prev => [...prev, optimisticMessage]);

        // Scroll to bottom immediately
        setTimeout(() => {
          const messageList = document.querySelector('[data-message-list]');
          if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
          }
        }, 50);

        // Send text message
        response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            message: text
          })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      // Message sent successfully
      // Webhook will update status from 'sending' to 'sent'
      console.log('✅ Message sent, waiting for webhook confirmation...');

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      // Mark optimistic message as error if it exists
      if (!file && text) {
        setMessages(prev => prev.map(m =>
          m.status === 'sending' && m.message_content === text
            ? { ...m, status: 'error' }
            : m
        ));
      }

      throw error; // Re-throw to let ChatInput handle the error
    } finally {
      setSending(false);
    }
  };

  const detectMediaType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleArchive = async () => {
    if (!conversation) return;

    try {
      await fetch(`/api/chat/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      });

      onArchive?.(conversation.id);
      setShowMenu(false);
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      alert('Erro ao arquivar conversa. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (!conversation) return;

    const confirmed = confirm('Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await fetch(`/api/chat/conversations/${conversation.id}`, {
        method: 'DELETE'
      });

      onDelete?.(conversation.id);
      setShowMenu(false);
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa. Tente novamente.');
    }
  };

  if (!conversation) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-[#0A0A0A] relative"
        style={{
          backgroundImage: 'url(/chat-pattern.png)',
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/50" /> {/* Overlay for better text visibility */}
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageSquare size={40} className="text-[#00FF99]" />
          </div>
          <h2 className="text-white text-2xl font-semibold mb-2">
            Selecione uma conversa
          </h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Escolha uma conversa da lista para começar a enviar mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <div className="bg-[#111111] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Back Button (Mobile only) */}
          {onClose && (
            <button
              onClick={onClose}
              className="mr-1 p-1 hover:bg-white/10 rounded-full transition-colors md:hidden text-gray-300"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {/* Avatar */}
          <Avatar
            src={conversation.contact?.profile_pic_url}
            name={conversation.contact?.name || conversation.contact?.whatsapp_number}
            size={40}
          />

          {/* Info */}
          <div>
            <h3 className="font-semibold text-white">
              {conversation.contact?.name || conversation.contact?.whatsapp_number}
            </h3>
            <p className="text-sm text-gray-400 flex items-center">
              <Phone size={12} className="mr-1" />
              {conversation.contact?.whatsapp_number}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Agent Toggle Button */}
          <button
            onClick={toggleAgent}
            disabled={agentLoading}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${agentLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/10'
              }`}
            title={agentEnabled ? 'Agente IA ativo - Clique para desativar' : 'Agente IA desativado - Clique para ativar'}
          >
            <div className="relative">
              <Bot
                size={20}
                className={`transition-colors ${agentEnabled ? 'text-[#00FF99]' : 'text-gray-500'
                  }`}
              />
              {!agentEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[2px] h-6 bg-red-500 rotate-45 transform origin-center" />
                </div>
              )}
            </div>
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] rounded-lg shadow-lg border border-white/10 z-10">
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center space-x-2 text-gray-300"
                >
                  <Archive size={16} />
                  <span>Arquivar</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center space-x-2 text-red-400"
                >
                  <Trash2 size={16} />
                  <span>Deletar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnected warning */}
      {!connection?.is_connected && (
        <div className="bg-yellow-900/20 border-b border-yellow-500/20 px-4 py-2 text-center">
          <p className="text-sm text-yellow-400">
            ⚠️ Status de conexão pode estar desatualizado. Envie uma mensagem para testar.
          </p>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        currentUserId={conversation.user_id}
        connectionPhoneId={conversation.connection?.phone_number_id}
        contact={conversation.contact}
        connectionAvatar={connection?.profile_pic_url}
      />

      {/* Input - Floating */}
      <div className="absolute bottom-0 left-0 right-0">
        <ChatInput
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
