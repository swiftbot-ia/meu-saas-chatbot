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

  // Main chat interface
  return (
    <div className="flex h-screen bg-white">
      {/* Connection selector (if multiple connections) */}
      {connections.length > 1 && (
        <div className="w-64 border-r bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Instâncias</h3>
          <div className="space-y-2">
            {connections.map((connection) => (
              <button
                key={connection.id}
                onClick={() => setSelectedConnection(connection.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedConnection === connection.id
                    ? 'bg-green-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium">
                  {connection.profile_name || connection.instance_name}
                </div>
                <div className="text-sm opacity-75">
                  {connection.phone_number_id}
                </div>
                <div className={`text-xs mt-1 ${
                  connection.is_connected ? 'text-green-200' : 'text-red-300'
                }`}>
                  {connection.is_connected ? '● Conectado' : '○ Desconectado'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations list */}
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
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 hover:bg-red-600 px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
