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
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b bg-green-600 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <MessageCircle className="mr-2" size={24} />
          Conversas
        </h2>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
            <MessageCircle size={48} className="mb-4 text-gray-300" />
            <p className="font-medium">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm
                ? 'Tente outro termo de busca'
                : 'As conversas aparecerão aqui quando você receber mensagens'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
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
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                          {getInitials(conversation.contact?.name || conversation.contact?.whatsapp_number)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name and time */}
                      <div className="flex items-baseline justify-between mb-1">
                        <h3
                          className={`font-semibold truncate ${
                            hasUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {conversation.contact?.name || conversation.contact?.whatsapp_number}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>

                      {/* Last message and unread badge */}
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm truncate ${
                            hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {truncateMessage(conversation.last_message_preview)}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 flex-shrink-0 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </span>
                        )}
                      </div>

                      {/* Connection indicator */}
                      {conversation.connection && (
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <Phone size={12} className="mr-1" />
                          {conversation.connection.profile_name || conversation.connection.instance_name}
                        </div>
                      )}
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
