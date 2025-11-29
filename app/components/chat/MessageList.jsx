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
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 10 L60 30 L80 30 L65 45 L70 65 L50 50 L30 65 L35 45 L20 30 L40 30 Z\' fill=\'%23ffffff\' opacity=\'0.02\'/%3E%3C/svg%3E")',
        backgroundSize: '100px 100px'
      }}>
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-[#E9EDEF] text-lg font-medium">
            Nenhuma mensagem ainda
          </p>
          <p className="text-[#8696A0] text-sm mt-2">
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
      className="flex-1 overflow-y-auto bg-[#0A0A0A] p-4 scroll-smooth scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 10 L60 30 L80 30 L65 45 L70 65 L50 50 L30 65 L35 45 L20 30 L40 30 Z\' fill=\'%23ffffff\' opacity=\'0.02\'/%3E%3C/svg%3E")',
        backgroundSize: '100px 100px'
      }}
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          {loading ? (
            <Loader2 className="animate-spin text-[#8696A0]" size={24} />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-[#8696A0] hover:text-[#E9EDEF] hover:underline bg-[#1F1F1F] px-4 py-2 rounded-full"
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
                  <div className="bg-[#1F1F1F] text-[#E9EDEF] text-xs px-3 py-1.5 rounded-lg shadow-sm">
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
          <Loader2 className="animate-spin text-[#8696A0]" size={32} />
        </div>
      )}

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-[#00A884] text-white p-3 rounded-full shadow-lg hover:bg-[#00A884]/90 transition-colors"
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
