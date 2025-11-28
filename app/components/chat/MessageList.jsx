/**
 * MessageList Component
 * Displays list of messages with infinite scroll
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

export default function MessageList({
  messages,
  loading,
  hasMore,
  onLoadMore,
  currentUserId,
  connectionPhoneId
}) {
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages, autoScroll]);

  // Scroll to bottom initially
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Check if user is at bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMore && !loading) {
      onLoadMore?.();
    }
  };

  const isOwnMessage = (message) => {
    // Check if message is outbound or from the current connection
    return message.direction === 'outbound' ||
           message.from_number === connectionPhoneId;
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-500 text-lg font-medium">
            Nenhuma mensagem ainda
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Envie uma mensagem para começar a conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-gray-50 p-4 scroll-smooth"
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          {loading ? (
            <Loader2 className="animate-spin text-gray-400" size={24} />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Carregar mensagens antigas
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-1">
        {messages.map((message, index) => {
          const isOwn = isOwnMessage(message);
          const showDateDivider = shouldShowDateDivider(messages, index);

          return (
            <div key={message.id}>
              {/* Date divider */}
              {showDateDivider && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.received_at)}
                  </div>
                </div>
              )}

              {/* Message */}
              <MessageBubble message={message} isOwn={isOwn} />
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      )}

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="Ir para o final"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// Helper function to determine if date divider should be shown
function shouldShowDateDivider(messages, index) {
  if (index === 0) return true;

  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];

  const currentDate = new Date(currentMessage.received_at).toDateString();
  const previousDate = new Date(previousMessage.received_at).toDateString();

  return currentDate !== previousDate;
}

// Helper function to format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateString = date.toDateString();
  const todayString = today.toDateString();
  const yesterdayString = yesterday.toDateString();

  if (dateString === todayString) {
    return 'Hoje';
  } else if (dateString === yesterdayString) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
