/**
 * Chat Page - WhatsApp Live Chat
 * Real-time chat interface for managing WhatsApp conversations
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import { Loader2, AlertCircle } from 'lucide-react';
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { supabase } from '@/lib/supabase/client';
import NoSubscription from '../components/NoSubscription'

const chatSupabase = createChatSupabaseClient();

// Loading fallback for Suspense
function ChatLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#111111]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#00FF99] mx-auto mb-4" size={48} />
        <p className="text-gray-400">Carregando chat...</p>
      </div>
    </div>
  );
}

// Main chat content component
function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationIdParam = searchParams.get('conversation');
  const phoneParam = searchParams.get('phone');

  // Debug: Log URL params on mount
  console.log('🔗 [Chat] URL params:', { conversationIdParam, phoneParam });

  // 1. ESTADOS
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState(conversationIdParam);
  const [pendingPhone, setPendingPhone] = useState(phoneParam);

  // 2. FUNÇÕES
  const loadConnections = async () => {
    console.log('📡 [Chat] loadConnections called, pendingConversationId:', pendingConversationId, 'pendingPhone:', pendingPhone);
    try {
      // ✅ Check authentication first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/whatsapp/connections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar conexões');
      }

      setConnections(data.connections || []);

      if (data.connections && data.connections.length > 0) {
        let selectedConn = null;

        // If there's a pending conversation from URL, fetch it directly by ID
        if (pendingConversationId) {
          console.log('🔍 [Chat] Fetching conversation directly by ID:', pendingConversationId);
          try {
            // Fetch conversation directly by ID - this doesn't filter by is_archived
            const convRes = await fetch(`/api/chat/conversations/${pendingConversationId}`);
            if (convRes.ok) {
              const conversationData = await convRes.json();
              console.log('✅ [Chat] Found conversation:', conversationData.id);

              // Find which connection this conversation belongs to
              selectedConn = data.connections.find(c => c.instance_name === conversationData.instance_name);

              if (selectedConn) {
                console.log('✅ [Chat] Matched connection:', selectedConn.profile_name || selectedConn.instance_name);
              } else {
                console.warn('⚠️ [Chat] No matching connection for instance:', conversationData.instance_name);
              }
            } else {
              console.warn('⚠️ [Chat] Conversation not found:', pendingConversationId);
            }
          } catch (e) {
            console.error('Error fetching conversation:', e);
          }
        }

        // If there's a pending phone from URL, find which connection has a conversation with this phone
        // or use the first connected instance to create the conversation
        if (!selectedConn && pendingPhone) {
          console.log('🔍 [Chat] Searching for connection with phone:', pendingPhone);
          const normalizedPhone = pendingPhone.replace(/\D/g, '');

          for (const conn of data.connections) {
            try {
              const convRes = await fetch(`/api/chat/conversations?connectionId=${conn.id}&limit=100`);
              const convData = await convRes.json();
              const matchingConv = convData.conversations?.find(c => {
                const contactPhone = c.contact?.whatsapp_number?.replace(/\D/g, '') || '';
                return contactPhone.includes(normalizedPhone) || normalizedPhone.includes(contactPhone);
              });
              if (matchingConv) {
                selectedConn = conn;
                console.log('✅ [Chat] Found phone in connection:', conn.profile_name || conn.instance_name);
                break;
              }
            } catch (e) {
              console.error('Error checking connection for phone:', e);
            }
          }

          // If no connection found with this phone, use first connected instance
          if (!selectedConn) {
            selectedConn = data.connections.find(c => c.is_connected);
            console.log('🔄 [Chat] No conversation found for phone, using first connected:', selectedConn?.instance_name);
          }
        }

        // Fallback: Check for saved connection ID in localStorage
        if (!selectedConn && typeof window !== 'undefined') {
          const savedConnectionId = localStorage.getItem('activeConnectionId');
          if (savedConnectionId) {
            selectedConn = data.connections.find(c => c.id === savedConnectionId);
            if (selectedConn) {
              console.log('✅ [Chat] Restored saved connection from localStorage:', savedConnectionId);
            }
          }
        }

        // Final fallback: use first connected instance
        if (!selectedConn) {
          selectedConn = data.connections.find(c => c.is_connected);
        }

        if (selectedConn) {
          setSelectedConnection(selectedConn.id);
        }
      }


      // Load subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadSubscription(user.id);
      }

    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
      setError('Erro ao carregar conexões do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        const isActive = ['active', 'trial', 'trialing'].includes(data.status) || data.stripe_subscription_id === 'super_account_bypass';
        const isExpired = data.trial_end_date && new Date() > new Date(data.trial_end_date);

        console.log('✅ [CHAT] Validação:', {
          status: data.status,
          isActive,
          isExpired,
          trial_end_date: data.trial_end_date
        });

        if (isActive && !isExpired) {
          setSubscription(data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setSubscriptionChecked(true);
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

      // Auto-select conversation from URL parameter (by ID)
      if (pendingConversationId) {
        console.log('🔍 [Chat] Fetching conversation by ID for auto-select:', pendingConversationId);
        try {
          // Fetch conversation directly by ID (works even if not in list due to archived/filtered)
          const convRes = await fetch(`/api/chat/conversations/${pendingConversationId}`);
          if (convRes.ok) {
            const targetConversation = await convRes.json();

            // Add to list if not already there
            if (!data.conversations?.some(c => c.id === targetConversation.id)) {
              setConversations(prev => [targetConversation, ...prev]);
            }

            setSelectedConversation(targetConversation);
            console.log('✅ [Chat] Auto-selected conversation:', targetConversation.id);
          } else {
            console.warn('⚠️ [Chat] Could not fetch conversation:', pendingConversationId);
          }
        } catch (e) {
          console.error('Error fetching conversation for auto-select:', e);
        }
        setPendingConversationId(null);
      }
      // Auto-select conversation from URL parameter (by phone)
      else if (pendingPhone) {
        // Normalize phone number for comparison (remove special chars)
        const normalizedPhone = pendingPhone.replace(/\D/g, '');
        const targetConversation = data.conversations?.find(c => {
          const contactPhone = c.contact?.whatsapp_number?.replace(/\D/g, '') || '';
          return contactPhone.includes(normalizedPhone) || normalizedPhone.includes(contactPhone);
        });
        if (targetConversation) {
          setSelectedConversation(targetConversation);
          console.log('✅ [Chat] Auto-selected conversation by phone:', pendingPhone);
          setPendingPhone(null);
        } else {
          // No conversation found - create one!
          console.log('🔄 [Chat] Creating conversation for phone:', pendingPhone);
          try {
            const response = await fetch('/api/chat/conversations/find-or-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: pendingPhone,
                connectionId: selectedConnection
              })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.conversation) {
                // Add to conversations list and select it
                setConversations(prev => [result.conversation, ...prev]);
                setSelectedConversation(result.conversation);
                console.log('✅ [Chat] Created/found conversation:', result.conversation.id);
              }
            } else {
              console.error('❌ [Chat] Failed to create conversation');
            }
          } catch (err) {
            console.error('❌ [Chat] Error creating conversation:', err);
          }
          setPendingPhone(null);
        }
      }
      // Update selected conversation if it exists
      else if (selectedConversation) {
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

  const handleConnectionSelect = (connectionId) => {
    // Clear selected conversation when switching connections
    // This prevents showing messages from the wrong connection
    if (selectedConnection !== connectionId) {
      setSelectedConversation(null);
      console.log('🔄 [Chat] Switching connection, clearing selected conversation');
    }

    setSelectedConnection(connectionId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('activeConnectionId', connectionId);
      console.log('💾 [Chat] Saved connection to localStorage:', connectionId);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleArchiveConversation = (conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  const handleDeleteConversation = (conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  // 3. useEffect HOOKS
  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadConversations();

      // Polling apenas como fallback - realtime deve ser primário
      const interval = setInterval(loadConversations, 60000); // 60s ao invés de 10s

      const connection = connections.find(c => c.id === selectedConnection);
      let conversationsChannel = null;
      let messagesChannel = null;

      if (connection) {
        // Subscribe to conversations updates
        conversationsChannel = chatSupabase
          .channel(`conversations:${connection.instance_name}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'whatsapp_conversations',
              filter: `instance_name=eq.${connection.instance_name}`
            },
            (payload) => {
              console.log('📋 [Realtime] Conversation update:', payload.eventType);
              loadConversations();
            }
          )
          .subscribe((status) => {
            console.log('📋 [Realtime] Conversations subscription:', status);
          });

        // ALSO subscribe to messages updates to refresh conversation list
        messagesChannel = chatSupabase
          .channel(`messages-sidebar:${connection.instance_name}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'whatsapp_messages',
              filter: `instance_name=eq.${connection.instance_name}`
            },
            (payload) => {
              console.log('📨 [Realtime] New message for sidebar:', payload.new?.message_content?.substring(0, 30));
              loadConversations();
            }
          )
          .subscribe((status) => {
            console.log('📨 [Realtime] Messages sidebar subscription:', status);
          });
      }

      return () => {
        clearInterval(interval);
        if (conversationsChannel) chatSupabase.removeChannel(conversationsChannel);
        if (messagesChannel) chatSupabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedConnection, connections]);

  // 4. CHECKS CONDICIONAIS
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]"></div>
      </div>
    );
  }

  if (!loading && subscriptionChecked && !subscription) {
    return <NoSubscription />;
  }
  // No connections state
  if (!loading && connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111111]">
        <div className="text-center max-w-md">
          <AlertCircle className="text-yellow-400 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhuma conexão WhatsApp
          </h2>
          <p className="text-gray-400 mb-6">
            Você precisa conectar uma instância do WhatsApp para usar o chat ao vivo.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
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
      <div className="flex items-center justify-center h-screen bg-[#111111]">
        <div className="text-center max-w-md">
          <AlertCircle className="text-yellow-400 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">
            WhatsApp desconectado
          </h2>
          <p className="text-gray-400 mb-6">
            Todas as suas instâncias do WhatsApp estão desconectadas.
            Conecte pelo menos uma instância para usar o chat ao vivo.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
          >
            Conectar WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex h-screen bg-[#111111]">
      {/* Conversations list */}
      <div className="w-96">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          loading={false}
          connections={connections}
          selectedConnection={selectedConnection}
          onSelectConnection={handleConnectionSelect}
        />
      </div>

      {/* Chat window */}
      <ChatWindow
        conversation={selectedConversation}
        connection={connections.find(c => c.id === selectedConnection)}
        onArchive={handleArchiveConversation}
        onDelete={handleDeleteConversation}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 hover:bg-red-600/50 px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// Export with Suspense wrapper to handle useSearchParams
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatContent />
    </Suspense>
  );
}
