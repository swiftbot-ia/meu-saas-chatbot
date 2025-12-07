/**
 * Contacts Page - Gerenciamento de Contatos WhatsApp
 * Interface para visualizar, filtrar e gerenciar contatos
 */

'use client';

import { supabase } from '../../../lib/supabase/client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Phone,
  Calendar,
  Tag,
  X,
  Plus,
  Clock,
  MapPin,
  Trash2
} from 'lucide-react';
import NoSubscription from '../../components/NoSubscription'


// ============================================================================
// CONNECTION DROPDOWN - Mesmo estilo do chat/page.js
// ============================================================================
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selected = connections.find(c => c.id === selectedConnection);
  const displayValue = selected
    ? (selected.profile_name || selected.instance_name)
    : 'Selecione uma instância';

  return (
    <div className="relative">
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
                    {selected.is_connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {/* Dropdown options */}
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

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ContactsPage() {
  const router = useRouter();

  // States
  const [subscription, setSubscription] = useState(null)
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)
  const [contacts, setContacts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [origins, setOrigins] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // UI States
  const [selectedContact, setSelectedContact] = useState(null);
  const [originsExpanded, setOriginsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showCreateOriginModal, setShowCreateOriginModal] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  // New tag/origin form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#00FF99');
  const [newOriginName, setNewOriginName] = useState('');

  // Drag and drop state
  const [draggedTag, setDraggedTag] = useState(null);
  const [dragOverContactId, setDragOverContactId] = useState(null);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  // Load contacts when connection changes
  useEffect(() => {
    if (selectedConnection) {
      loadContacts();
    }
  }, [selectedConnection, selectedOrigin, selectedTag]);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/whatsapp/connections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar conexões');
      }

      setConnections(data.connections || []);

      if (data.connections && data.connections.length > 0) {
        let selectedConn = null;

        // ✅ Check for saved connection ID in localStorage
        if (typeof window !== 'undefined') {
          const savedConnectionId = localStorage.getItem('activeConnectionId');
          if (savedConnectionId) {
            selectedConn = data.connections.find(c => c.id === savedConnectionId);
            if (selectedConn) {
              console.log('✅ [Contacts] Restored saved connection from localStorage:', savedConnectionId);
            }
          }
        }

        // Fallback: use first connected instance or first in list
        if (!selectedConn) {
          selectedConn = data.connections.find(c => c.is_connected) || data.connections[0];
        }

        if (selectedConn) {
          setSelectedConnection(selectedConn.id);
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadSubscription(user.id);
      }
    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
      setError('Erro ao carregar conexões');
    }
  };
  const loadSubscription = async (userId) => {
    try {
      console.log('🔍 [CONTACTS] Carregando subscription para userId:', userId)

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('📦 [CONTACTS] Resultado da query:', { data, error })
      if (!error && data) {
        const isActive = ['active', 'trial', 'trialing'].includes(data.status) || data.stripe_subscription_id === 'super_account_bypass'
        const isExpired = data.trial_end_date && new Date() > new Date(data.trial_end_date)

        console.log('✅ [CONTACTS] Validação:', {
          status: data.status,
          isActive,
          isExpired,
          trial_end_date: data.trial_end_date
        })

        if (isActive && !isExpired) {
          setSubscription(data)
          console.log('✅ [CONTACTS] Subscription definida!')
        } else {
          console.log('❌ [CONTACTS] Subscription não é ativa ou está expirada')
        }
      } else {
        console.log('❌ [CONTACTS] Nenhuma subscription encontrada ou erro:', error)
      }
    } catch (error) {
      console.error('❌ [CONTACTS] Erro ao carregar assinatura:', error)
    } finally {
      setSubscriptionChecked(true)
    }
  }
  // Handle connection selection with localStorage sync
  const handleConnectionSelect = (connectionId) => {
    setSelectedConnection(connectionId);

    // ✅ Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeConnectionId', connectionId);
      console.log('💾 [Contacts] Saved connection to localStorage:', connectionId);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedConnection) params.set('connectionId', selectedConnection);
      if (selectedOrigin) params.set('originId', selectedOrigin);
      if (selectedTag) params.set('tagId', selectedTag);

      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar contatos');
      }

      setContacts(data.contacts || []);
      setOrigins(data.origins || []);
      setTags(data.tags || []);
      setError(null);

    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.whatsapp_number?.toLowerCase().includes(searchLower)
    );
  });

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
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

  // Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setTagLoading(true);
    try {
      const response = await fetch('/api/contacts/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor
        })
      });

      if (response.ok) {
        setNewTagName('');
        setNewTagColor('#00FF99');
        setShowCreateTagModal(false);
        await loadContacts();
      }
    } catch (err) {
      console.error('Erro ao criar tag:', err);
    } finally {
      setTagLoading(false);
    }
  };

  // Create new origin
  const handleCreateOrigin = async () => {
    if (!newOriginName.trim()) return;

    setTagLoading(true);
    try {
      const response = await fetch('/api/contacts/origins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOriginName.trim() })
      });

      if (response.ok) {
        setNewOriginName('');
        setShowCreateOriginModal(false);
        await loadContacts();
      }
    } catch (err) {
      console.error('Erro ao criar origem:', err);
    } finally {
      setTagLoading(false);
    }
  };

  // Add tag to contact
  const handleAddTag = async (tagId) => {
    if (!selectedContact) return;

    setTagLoading(true);
    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      });

      if (response.ok) {
        await loadContacts();
        setSelectedContact({
          ...selectedContact,
          tags: [...(selectedContact.tags || []), tags.find(t => t.id === tagId)]
        });
      }
    } catch (err) {
      console.error('Erro ao adicionar tag:', err);
    } finally {
      setTagLoading(false);
      setShowTagModal(false);
    }
  };

  // Remove tag from contact
  const handleRemoveTag = async (tagId) => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}/tags?tagId=${tagId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSelectedContact({
          ...selectedContact,
          tags: selectedContact.tags?.filter(t => t.id !== tagId) || []
        });
        await loadContacts();
      }
    } catch (err) {
      console.error('Erro ao remover tag:', err);
    }
  };

  // Delete tag permanently from system
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    setTagLoading(true);
    try {
      const response = await fetch(`/api/contacts/tags/${tagToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload contacts to update tag list
        await loadContacts();
        // Close modal
        setShowDeleteTagConfirm(false);
        setTagToDelete(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir tag');
      }
    } catch (err) {
      console.error('Erro ao excluir tag:', err);
      alert('Erro ao excluir tag');
    } finally {
      setTagLoading(false);
    }
  };

  // Set origin for contact
  const handleSetOrigin = async (originId) => {
    if (!selectedContact) return;

    setTagLoading(true);
    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}/origin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originId })
      });

      if (response.ok) {
        await loadContacts();
        setSelectedContact({
          ...selectedContact,
          origin: origins.find(o => o.id === originId)
        });
      }
    } catch (err) {
      console.error('Erro ao definir origem:', err);
    } finally {
      setTagLoading(false);
      setShowOriginModal(false);
    }
  };

  // Open chat with contact
  const handleOpenChat = () => {
    if (selectedContact?.conversation_id) {
      router.push(`/dashboard/chat?conversation=${selectedContact.conversation_id}`);
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================
  const handleTagDragStart = (e, tag) => {
    setDraggedTag(tag);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', tag.id);
    // Add drag image style
    e.target.style.opacity = '0.5';
  };

  const handleTagDragEnd = (e) => {
    setDraggedTag(null);
    setDragOverContactId(null);
    e.target.style.opacity = '1';
  };

  const handleContactDragOver = (e, contactId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverContactId(contactId);
  };

  const handleContactDragLeave = (e) => {
    // Only clear if leaving the contact element entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverContactId(null);
    }
  };

  const handleContactDrop = async (e, contact) => {
    e.preventDefault();
    setDragOverContactId(null);

    if (!draggedTag) return;

    // Check if contact already has this tag
    if (contact.tags?.some(t => t.id === draggedTag.id)) {
      console.log('Contact already has this tag');
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contact.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: draggedTag.id })
      });

      if (response.ok) {
        await loadContacts();
        // Update selected contact if it's the same one
        if (selectedContact?.id === contact.id) {
          setSelectedContact({
            ...selectedContact,
            tags: [...(selectedContact.tags || []), draggedTag]
          });
        }
        console.log('✅ Tag added via drag-drop:', draggedTag.name, '→', contact.name);
      }
    } catch (err) {
      console.error('Erro ao adicionar tag via drag-drop:', err);
    }

    setDraggedTag(null);
  };

  // Predefined colors for tags
  const tagColors = ['#00FF99', '#00BFFF', '#FFD700', '#FF6B6B', '#A78BFA', '#F472B6', '#34D399', '#FBBF24'];

  if (!loading && subscriptionChecked && !subscription) {
    return <NoSubscription />
  }
  // No connections state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]"></div>
      </div>
    );
  }
  if (!loading && connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111111]">
        <div className="text-center max-w-md">
          <Users className="text-gray-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhuma conexão WhatsApp
          </h2>
          <p className="text-gray-400 mb-6">
            Você precisa conectar uma instância do WhatsApp para visualizar os contatos.
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

  return (
    <div className="flex h-screen bg-[#111111]">

      {/* ========================================== */}
      {/* SIDEBAR - Filtros */}
      {/* ========================================== */}
      <div className="w-64 bg-[#111111] flex flex-col overflow-hidden border-r border-white/5">

        {/* Header */}
        <div className="p-4 pt-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {/* Origens Section - Marketing Source */}
          <div>
            <div className="flex items-center justify-between py-2">
              <button
                onClick={() => setOriginsExpanded(!originsExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors"
              >
                <MapPin size={16} />
                Origens
                {originsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                onClick={() => setShowCreateOriginModal(true)}
                className="text-[#00FF99] hover:text-white transition-colors"
                title="Criar nova origem"
              >
                <Plus size={16} />
              </button>
            </div>

            {originsExpanded && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setSelectedOrigin('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedOrigin === ''
                    ? 'bg-[#00FF99]/10 text-[#00FF99]'
                    : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-white'
                    }`}
                >
                  Todas as origens
                </button>
                {origins.map((origin) => (
                  <button
                    key={origin.id}
                    onClick={() => setSelectedOrigin(origin.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${selectedOrigin === origin.id
                      ? 'bg-[#00FF99]/10 text-[#00FF99]'
                      : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-white'
                      }`}
                  >
                    {origin.name}
                  </button>
                ))}
                {origins.length === 0 && (
                  <p className="text-xs text-gray-500 px-3 py-2">
                    Nenhuma origem criada
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between py-2">
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors"
              >
                <Tag size={16} />
                Tags
                {tagsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                onClick={() => setShowCreateTagModal(true)}
                className="text-[#00FF99] hover:text-white transition-colors"
                title="Criar nova tag"
              >
                <Plus size={16} />
              </button>
            </div>

            {tagsExpanded && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedTag === ''
                    ? 'bg-[#00FF99]/10 text-[#00FF99]'
                    : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-white'
                    }`}
                >
                  Todas as tags
                </button>
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    draggable
                    onDragStart={(e) => handleTagDragStart(e, tag)}
                    onDragEnd={handleTagDragEnd}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 group ${selectedTag === tag.id
                      ? 'bg-[#00FF99]/10 text-[#00FF99]'
                      : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-white'
                      } ${draggedTag?.id === tag.id ? 'opacity-50' : ''}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#00FF99' }}
                    />
                    <span
                      className="truncate flex-1 cursor-grab active:cursor-grabbing select-none"
                      onClick={() => setSelectedTag(tag.id)}
                    >
                      {tag.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagToDelete(tag);
                        setShowDeleteTagConfirm(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                      title="Excluir tag"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-gray-500 px-3 py-2">
                    Nenhuma tag criada
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* LISTA DE CONTATOS */}
      {/* ========================================== */}
      <div className="w-96 bg-[#111111] flex flex-col border-r border-white/5">

        {/* Connection Dropdown - Mesmo estilo do chat */}
        <div className="p-4 border-b border-white/5">
          <ConnectionDropdown
            connections={connections}
            selectedConnection={selectedConnection}
            onSelectConnection={handleConnectionSelect}
          />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Users className="mr-2" size={24} />
            Contatos
            <span className="ml-2 text-sm font-normal text-[#B0B0B0]">
              ({filteredContacts.length})
            </span>
          </h2>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] text-white placeholder-gray-500 pl-12 pr-4 py-3 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20 transition-all"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#00FF99]" size={32} />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Users className="text-gray-600 mb-2" size={48} />
              <p className="text-gray-400">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  onDragOver={(e) => handleContactDragOver(e, contact.id)}
                  onDragLeave={handleContactDragLeave}
                  onDrop={(e) => handleContactDrop(e, contact)}
                  className={`w-full p-4 hover:bg-[#1E1E1E] transition-all text-left cursor-pointer ${selectedContact?.id === contact.id
                    ? 'bg-[#00FF99]/10 border-l-4 border-[#00FF99]'
                    : ''
                    } ${dragOverContactId === contact.id ? 'bg-[#00FF99]/20 ring-2 ring-[#00FF99]/50 ring-inset' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    {contact.profile_pic_url ? (
                      <img
                        src={contact.profile_pic_url}
                        alt={contact.name || 'Contato'}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #00FF99 0%, #00E88C 100%)' }}
                      >
                        {getInitials(contact.name || contact.whatsapp_number)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {contact.name || contact.whatsapp_number}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatRelativeTime(contact.last_message_at)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 truncate">
                        {contact.whatsapp_number}
                      </p>

                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {contact.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* DETALHES DO CONTATO */}
      {/* ========================================== */}
      <div className="flex-1 bg-[#0A0A0A] flex flex-col">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar Grande */}
                  {selectedContact.profile_pic_url ? (
                    <img
                      src={selectedContact.profile_pic_url}
                      alt={selectedContact.name || 'Contato'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
                      style={{ background: 'linear-gradient(135deg, #00FF99 0%, #00E88C 100%)' }}
                    >
                      {getInitials(selectedContact.name || selectedContact.whatsapp_number)}
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedContact.name || 'Sem nome'}
                    </h2>
                    <p className="text-[#B0B0B0] flex items-center gap-1">
                      <Phone size={14} />
                      {selectedContact.whatsapp_number}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenChat}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
                  >
                    <MessageCircle size={18} />
                    Abrir Chat
                  </button>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#1E1E1E] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* Dados do Contato */}
              <div className="bg-[#111111] rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Dados do Contato
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#B0B0B0] mb-1">Telefone</p>
                    <p className="text-white">{selectedContact.whatsapp_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0] mb-1 flex items-center gap-1">
                      <MapPin size={14} />
                      Origem
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-white">{selectedContact.origin?.name || 'Não definida'}</p>
                      <button
                        onClick={() => setShowOriginModal(true)}
                        className="text-[#00FF99] hover:text-white text-xs transition-colors"
                      >
                        Alterar
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0] mb-1 flex items-center gap-1">
                      <Calendar size={14} />
                      Data de Cadastro
                    </p>
                    <p className="text-white">{formatDate(selectedContact.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#B0B0B0] mb-1 flex items-center gap-1">
                      <Clock size={14} />
                      Última Mensagem
                    </p>
                    <p className="text-white">{formatDate(selectedContact.last_message_at)}</p>
                  </div>
                  {selectedContact.funnel_stage && (
                    <div>
                      <p className="text-sm text-[#B0B0B0] mb-1">Etapa do Funil</p>
                      <p className="text-white capitalize">{selectedContact.funnel_stage}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-[#111111] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Tag size={20} />
                    Etiquetas
                  </h3>
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="flex items-center gap-1 text-sm text-[#00FF99] hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>

                {selectedContact.tags && selectedContact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma etiqueta atribuída</p>
                )}
              </div>

            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecione um contato
              </h3>
              <p className="text-gray-400">
                Clique em um contato para ver os detalhes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: ADICIONAR TAG AO CONTATO */}
      {/* ========================================== */}
      {showTagModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowTagModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-80 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Adicionar Etiqueta</h3>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {tags.filter(tag => !selectedContact?.tags?.some(t => t.id === tag.id)).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag.id)}
                  disabled={tagLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1E1E1E] transition-all text-left disabled:opacity-50"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color || '#00FF99' }} />
                  <span className="text-white flex-1">{tag.name}</span>
                  {tagLoading ? <Loader2 className="animate-spin text-gray-400" size={16} /> : <Plus size={16} className="text-gray-400" />}
                </button>
              ))}

              {tags.filter(tag => !selectedContact?.tags?.some(t => t.id === tag.id)).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  {tags.length === 0 ? 'Nenhuma tag criada ainda' : 'Todas as tags já foram atribuídas'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* MODAL: DEFINIR ORIGEM DO CONTATO */}
      {/* ========================================== */}
      {showOriginModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOriginModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-80 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Definir Origem</h3>
              <button onClick={() => setShowOriginModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {origins.map((origin) => (
                <button
                  key={origin.id}
                  onClick={() => handleSetOrigin(origin.id)}
                  disabled={tagLoading}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left disabled:opacity-50 ${selectedContact?.origin?.id === origin.id ? 'bg-[#00FF99]/10 text-[#00FF99]' : 'hover:bg-[#1E1E1E] text-white'
                    }`}
                >
                  <MapPin size={16} className="flex-shrink-0" />
                  <span className="flex-1">{origin.name}</span>
                </button>
              ))}

              {origins.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Nenhuma origem criada ainda</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* MODAL: CRIAR NOVA TAG */}
      {/* ========================================== */}
      {showCreateTagModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateTagModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Nova Tag</h3>
              <button onClick={() => setShowCreateTagModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#B0B0B0] block mb-2">Nome da tag</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Cliente VIP"
                  className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20"
                />
              </div>

              <div>
                <label className="text-sm text-[#B0B0B0] block mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {tagColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${newTagColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111111]' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || tagLoading}
                className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50"
              >
                {tagLoading ? 'Criando...' : 'Criar Tag'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* MODAL: CRIAR NOVA ORIGEM */}
      {/* ========================================== */}
      {showCreateOriginModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateOriginModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Nova Origem</h3>
              <button onClick={() => setShowCreateOriginModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#B0B0B0] block mb-2">Nome da origem</label>
                <input
                  type="text"
                  value={newOriginName}
                  onChange={(e) => setNewOriginName(e.target.value)}
                  placeholder="Ex: Facebook Ads, Indicação"
                  className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20"
                />
              </div>

              <button
                onClick={handleCreateOrigin}
                disabled={!newOriginName.trim() || tagLoading}
                className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50"
              >
                {tagLoading ? 'Criando...' : 'Criar Origem'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE TAG */}
      {/* ========================================== */}
      {showDeleteTagConfirm && tagToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => {
            setShowDeleteTagConfirm(false);
            setTagToDelete(null);
          }} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Excluir Tag
              </h3>
              <button
                onClick={() => {
                  setShowDeleteTagConfirm(false);
                  setTagToDelete(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Tem certeza que deseja excluir a tag <span className="text-white font-semibold">"{tagToDelete.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação irá remover a tag de todos os contatos e não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteTagConfirm(false);
                  setTagToDelete(null);
                }}
                className="flex-1 bg-[#1E1E1E] text-white py-3 rounded-xl hover:bg-[#2A2A2A] transition-colors"
                disabled={tagLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTag}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                disabled={tagLoading}
              >
                {tagLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 hover:bg-red-600/50 px-2 py-1 rounded">✕</button>
        </div>
      )}
    </div>
  );
}
