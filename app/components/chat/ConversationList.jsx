/**
 * ConversationList Component
 * Displays list of conversations with search
 */

'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, Loader2, Phone } from 'lucide-react';

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const contactName = conv.contact?.name || conv.contact?.whatsapp_number || '';
    return contactName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return 'Sem mensagens';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#2A2A2A]">
      {/* Header - WhatsApp Dark Style */}
      <div className="p-4 bg-[#1F1F1F]">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <MessageCircle className="mr-2" size={24} />
          Chats
        </h2>
      </div>

      {/* Search - WhatsApp Style */}
      <div className="px-3 py-2 bg-[#1F1F1F]">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8696A0]"
            size={18}
          />
          <input
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] text-white text-sm rounded-lg placeholder-[#8696A0] focus:outline-none focus:bg-[#323232] transition-colors border border-transparent focus:border-[#00BFD8]"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696A0] p-8 text-center">
            <MessageCircle size={48} className="mb-4 text-[#404040]" />
            <p className="font-medium text-white">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            <p className="text-sm text-[#8696A0] mt-2">
              {searchTerm
                ? 'Tente outro termo de busca'
                : 'As conversas aparecerão aqui quando você receber mensagens'}
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b border-[#2A2A2A] ${
                    isSelected
                      ? 'bg-[#2A2F32]'
                      : 'hover:bg-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.contact?.profile_pic_url ? (
                        <img
                          src={conversation.contact.profile_pic_url}
                          alt={conversation.contact.name || 'Contato'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(conversation.contact?.name || conversation.contact?.whatsapp_number)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name and time */}
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-medium truncate text-[#E9EDEF] text-[15px]">
                          {conversation.contact?.name || conversation.contact?.whatsapp_number}
                        </h3>
                        <span className="text-xs text-[#8696A0] ml-2 flex-shrink-0">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>

                      {/* Last message and unread badge */}
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            hasUnread ? 'text-[#D1D7DB]' : 'text-[#8696A0]'
                          }`}
                        >
                          {truncateMessage(conversation.last_message_preview, 35)}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 bg-[#00A884] text-[#111] text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
