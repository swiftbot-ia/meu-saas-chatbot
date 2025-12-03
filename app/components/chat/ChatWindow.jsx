/**
 * ChatWindow Component
 * Main chat window that combines MessageList and ChatInput
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { Phone, MoreVertical, Archive, Trash2, X } from 'lucide-react';
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';

const chatSupabase = createChatSupabaseClient();

export default function ChatWindow({
  conversation,
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

      // Setup real-time subscription for message updates
      const channel = chatSupabase
        .channel(`messages:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            const newMessage = payload.new;

            setMessages(prev => {
              // Check if we have an optimistic message with same content
              const tempIndex = prev.findIndex(m =>
                m.status === 'sending' &&
                m.message_content === newMessage.message_content &&
                m.direction === 'outbound'
              );

              if (tempIndex >= 0) {
                // Replace optimistic message with real one
                const updated = [...prev];
                updated[tempIndex] = {
                  ...newMessage,
                  status: 'sent'  // ✓✓ Confirmed!
                };
                return updated;
              }

              // New inbound message - add it
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

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
          if (prev.length === 0) {
            // First load
            return data.messages;
          }

          // Create a map of existing messages by ID
          const existingIds = new Set(prev.map(m => m.id));

          // Add only new messages
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));

          // Merge and sort by received_at
          return [...prev, ...newMessages].sort((a, b) =>
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

  const handleSend = async ({ text, file, caption }) => {
    if (!conversation) return;

    setSending(true);
    try {
      let response;

      if (file) {
        // Send media message with file upload
        const formData = new FormData();
        formData.append('conversationId', conversation.id);
        formData.append('file', file); // Send the actual file
        formData.append('caption', caption || '');
        formData.append('mediaType', detectMediaType(file.type));

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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-500 text-lg font-medium">
            Selecione uma conversa
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Escolha uma conversa da lista para começar a enviar mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          {conversation.contact?.profile_pic_url ? (
            <img
              src={conversation.contact.profile_pic_url}
              alt={conversation.contact.name || 'Contato'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
              {(conversation.contact?.name || conversation.contact?.whatsapp_number || '?')[0].toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900">
              {conversation.contact?.name || conversation.contact?.whatsapp_number}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <Phone size={12} className="mr-1" />
              {conversation.contact?.whatsapp_number}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                >
                  <Archive size={16} />
                  <span>Arquivar</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                >
                  <Trash2 size={16} />
                  <span>Deletar</span>
                </button>
              </div>
            )}
          </div>

          {/* Close button (mobile) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        currentUserId={conversation.user_id}
        connectionPhoneId={conversation.connection?.phone_number_id}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={sending}
      />
    </div>
  );
}
