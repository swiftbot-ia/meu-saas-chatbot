/**
 * Chat Page - WhatsApp Live Chat
 * Real-time chat interface for managing WhatsApp conversations
 */

'use client';

import React, { useState, useEffect } from 'react';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load WhatsApp connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  // Load conversations when connection is selected
  useEffect(() => {
    if (selectedConnection) {
      loadConversations();

      // Auto-refresh conversations every 10 seconds
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConnection]);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/whatsapp/connections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar conexões');
      }

      setConnections(data.connections || []);

      // Auto-select first connected instance
      const connectedInstance = data.connections?.find(c => c.is_connected);
      if (connectedInstance) {
        setSelectedConnection(connectedInstance.id);
      }

    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
      setError('Erro ao carregar conexões do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!selectedConnection) return;

    try {
      const params = new URLSearchParams({
        connectionId: selectedConnection,
        limit: '100'
      });

      const response = await fetch(`/api/chat/conversations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar conversas');
      }

      setConversations(data.conversations || []);

      // Update selected conversation if it exists
      if (selectedConversation) {
        const updated = data.conversations?.find(c => c.id === selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
        }
      }

    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Erro ao carregar conversas');
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleArchiveConversation = (conversationId) => {
    // Remove from list
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  const handleDeleteConversation = (conversationId) => {
    // Remove from list
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Carregando chat...</p>
        </div>
      </div>
    );
  }

  // No connections state
  if (!loading && connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="text-yellow-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nenhuma conexão WhatsApp
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa conectar uma instância do WhatsApp para usar o chat ao vivo.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    );
  }

  // No connected instances state
  const hasConnectedInstance = connections.some(c => c.is_connected);
  if (!loading && !hasConnectedInstance) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="text-yellow-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            WhatsApp desconectado
          </h2>
          <p className="text-gray-600 mb-6">
            Todas as suas instâncias do WhatsApp estão desconectadas.
            Conecte pelo menos uma instância para usar o chat ao vivo.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Conectar WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Get selected connection object
  const activeConnection = connections.find(c => c.id === selectedConnection);

  // Main chat interface
  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {/* Left Sidebar - Connection Selector */}
      <div className="w-80 bg-[#111111] border-r border-[#2A2A2A] flex flex-col">
        {/* Connection Selector Header */}
        <div className="p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgb(16, 229, 124) 0%, rgb(0, 191, 255) 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Conexão Ativa</h3>
          </div>

          {/* Active Connection Display */}
          {activeConnection && (
            <div className="bg-[#0A0A0A] hover:bg-black rounded-xl p-4 transition-all duration-300 border border-[#2A2A2A]">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {activeConnection.profile_pic_url ? (
                    <img
                      alt={activeConnection.profile_name || activeConnection.instance_name}
                      className="w-12 h-12 rounded-full object-cover"
                      src={activeConnection.profile_pic_url}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold text-lg">
                      {(activeConnection.profile_name || activeConnection.instance_name || 'W')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="text-[15px] font-medium text-white">
                    {activeConnection.profile_name || activeConnection.instance_name}
                  </p>
                  <p className="text-[13px] text-[#8696A0]">
                    {activeConnection.phone_number_id}
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-2.5 h-2.5 rounded-full ${activeConnection.is_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-[#B0B0B0]">
                  {activeConnection.is_connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          )}

          {/* Multiple connections dropdown */}
          {connections.length > 1 && (
            <div className="mt-4">
              <select
                value={selectedConnection || ''}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00BFD8] transition-colors"
              >
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.profile_name || connection.instance_name} {connection.is_connected ? '●' : '○'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats or Additional Info */}
        <div className="p-6">
          <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#2A2A2A]">
            <div className="text-sm text-[#8696A0] mb-2">Conversas Ativas</div>
            <div className="text-2xl font-bold text-white">{conversations.length}</div>
          </div>
        </div>
      </div>

      {/* Conversations list - WhatsApp Dark Style */}
      <div className="w-96">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          loading={false}
        />
      </div>

      {/* Chat window */}
      <ChatWindow
        conversation={selectedConversation}
        onArchive={handleArchiveConversation}
        onDelete={handleDeleteConversation}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 hover:bg-red-800 px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
