/**
 * ConversationList Component
 * Displays list of conversations with search
 */

'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, Loader2, Phone, ChevronDown } from 'lucide-react';

// Custom Dropdown Component for Connections
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!connections || connections.length <= 1) return null;

  const selected = connections.find(c => c.id === selectedConnection);
  const displayValue = selected
    ? (selected.profile_name || selected.instance_name)
    : 'Selecione uma instância';

  return (
    <div className="relative mb-3">
      <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left outline-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            {selected && (
              <div className="flex-shrink-0">
                {selected.profile_pic_url ? (
                  <img
                    src={selected.profile_pic_url}
                    alt={selected.profile_name || 'Conexão'}
                    className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${selected.profile_pic_url ? 'hidden' : 'flex'}`}
                  style={{ display: selected.profile_pic_url ? 'none' : 'flex' }}
                >
                  {selected.profile_name ? selected.profile_name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
            )}

            {/* Text info */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {displayValue}
              </div>
              {selected && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className={selected.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                    {selected.is_connected ? '●' : '○'}
                  </span>
                  <span className="truncate">
                    {selected.phone_number_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {/* Dropdown options - position absolute para não empurrar conteúdo */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-[#1E1E1E]/95 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
            {connections.map((connection, index) => (
              <button
                key={connection.id}
                type="button"
                onClick={() => {
                  onSelectConnection(connection.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full p-3 text-sm text-left transition-all duration-150 border-b border-white/5 last:border-0
                  ${selectedConnection === connection.id
                    ? 'bg-[#00FF99]/10 text-[#00FF99]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {connection.profile_pic_url ? (
                      <img
                        src={connection.profile_pic_url}
                        alt={connection.profile_name || `Conexão ${index + 1}`}
                        className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${connection.profile_pic_url ? 'hidden' : 'flex'}`}
                      style={{ display: connection.profile_pic_url ? 'none' : 'flex' }}
                    >
                      {connection.profile_name ? connection.profile_name.charAt(0).toUpperCase() : (index + 1)}
                    </div>
                  </div>

                  {/* Text info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {connection.profile_name || connection.instance_name}
                    </div>
                    <div className="text-xs flex items-center gap-1.5 mt-0.5">
                      <span className={connection.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                        {connection.is_connected ? '● Conectado' : '○ Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay - z-index menor que o dropdown */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

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
                  {conversation.contact?.profile_pic_url ? (
                    <img
                      src={conversation.contact.profile_pic_url}
                      alt={conversation.contact.name || 'Contato'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: 'linear-gradient(135deg, #00FF99 0%, #00E88C 100%)' }}
                    >
                      {getInitials(conversation.contact?.name || conversation.contact?.whatsapp_number)}
                    </div>
                  )}

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
