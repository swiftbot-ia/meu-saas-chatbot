/**
 * ConversationList Component
 * Displays list of conversations with search
 */

'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, Loader2, Phone, ChevronDown } from 'lucide-react';
import Avatar from '@/app/components/Avatar';
import ConnectionDropdown from '@/app/components/ConnectionDropdown';

// ConnectionDropdown agora importado de @/app/components/ConnectionDropdown

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  connections,
  selectedConnection,
  onSelectConnection
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchTerm.toLowerCase();
    const contactName = conv.contact?.name?.toLowerCase() || '';
    const contactNumber = conv.contact?.whatsapp_number?.toLowerCase() || '';
    const lastMessage = conv.last_message_preview?.toLowerCase() || '';

    return (
      contactName.includes(searchLower) ||
      contactNumber.includes(searchLower) ||
      lastMessage.includes(searchLower)
    );
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-white/5">
      {/* Header - Clean without colored background */}
      <div className="p-4 border-b border-white/5">
        {/* Connection Dropdown */}
        <ConnectionDropdown
          connections={connections}
          selectedConnection={selectedConnection}
          onSelectConnection={onSelectConnection}
        />

        <h2 className="text-xl font-bold text-white flex items-center">
          <MessageCircle className="mr-2" size={24} />
          Conversas
        </h2>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1E1E1E] text-white placeholder-gray-500 pl-12 pr-4 py-3 rounded-3xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20 focus:border-[#00FF99]/50 transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-[#00FF99]" size={32} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageCircle className="text-gray-600 mb-2" size={48} />
            <p className="text-gray-400">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 hover:bg-[#282828] transition-colors text-left ${selectedConversation?.id === conversation.id
                  ? 'bg-[#00FF99]/10 border-l-4 border-[#00FF99]'
                  : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <Avatar
                    src={conversation.contact?.profile_pic_url}
                    name={conversation.contact?.name || conversation.contact?.whatsapp_number}
                    size={48}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {conversation.contact?.name || conversation.contact?.whatsapp_number}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message_preview || 'Sem mensagens'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 bg-[#00FF99] text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
