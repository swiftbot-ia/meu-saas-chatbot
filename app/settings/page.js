'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Settings,
  Webhook,
  Clock,
  Zap,
  ChevronDown,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Code,
  ArrowLeft
} from 'lucide-react'

// ============================================================================
// CONNECTION DROPDOWN
// ============================================================================
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
  const [isOpen, setIsOpen] = useState(false)

  const selected = connections.find(c => c.connectionId === selectedConnection)
  const displayValue = selected?.connectionName || 'Selecione uma instância'

  return (
    <div className="relative">
      <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left outline-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold">
              {selected?.connectionName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {displayValue}
              </div>
              {selected && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className={selected.isConnected ? 'text-[#00FF99]' : 'text-red-400'}>
                    {selected.isConnected ? '●' : '○'}
                  </span>
                  <span>{selected.isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-[#1E1E1E]/95 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
            {connections.map((connection) => (
              <button
                key={connection.connectionId}
                type="button"
                onClick={() => {
                  onSelectConnection(connection.connectionId)
                  setIsOpen(false)
                }}
                className={`
                  w-full p-3 text-sm text-left transition-all duration-150 border-b border-white/5 last:border-0
                  ${selectedConnection === connection.connectionId
                    ? 'bg-[#00FF99]/10 text-[#00FF99]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold">
                    {connection.connectionName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{connection.connectionName}</div>
                    <div className="text-xs flex items-center gap-1.5 mt-0.5">
                      <span className={connection.isConnected ? 'text-[#00FF99]' : 'text-red-400'}>
                        {connection.isConnected ? '● Conectado' : '○ Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'webhook', label: 'Webhook', icon: Webhook, soon: false },
    { id: 'cadencia', label: 'Cadência', icon: Clock, soon: true },
    { id: 'gatilhos', label: 'Gatilhos Automáticos', icon: Zap, soon: true }
  ]

  return (
    <div className="flex gap-2 border-b border-white/10">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => !tab.soon && onTabChange(tab.id)}
            disabled={tab.soon}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
              border-b-2 -mb-[2px] relative
              ${isActive
                ? 'text-[#00FF99] border-[#00FF99]'
                : tab.soon
                  ? 'text-gray-600 border-transparent cursor-not-allowed'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}
            `}
          >
            <Icon size={16} />
            {tab.label}
            {tab.soon && (
              <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">
                Em breve
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// API KEY CARD
// ============================================================================
const ApiKeyCard = ({ connection, onGenerate, onRevoke, onCopy, loading }) => {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (connection.apiKey?.maskedKey && connection.fullApiKey) {
      await navigator.clipboard.writeText(connection.fullApiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Key className="text-[#00FF99]" size={18} />
            <h3 className="text-white font-medium">{connection.connectionName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${connection.isConnected
                ? 'bg-[#00FF99]/20 text-[#00FF99]'
                : 'bg-red-500/20 text-red-400'
              }`}>
              {connection.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {connection.hasApiKey && connection.apiKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#252525] px-4 py-2 rounded-lg font-mono text-sm flex-1">
                  <span className="text-gray-400">
                    {showKey && connection.fullApiKey
                      ? connection.fullApiKey
                      : connection.apiKey.maskedKey}
                  </span>
                </div>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title={showKey ? 'Ocultar' : 'Mostrar'}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-[#00FF99] hover:bg-[#00FF99]/10 rounded-lg transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check size={18} className="text-[#00FF99]" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {connection.apiKey.lastUsedAt && (
                  <span>Último uso: {new Date(connection.apiKey.lastUsedAt).toLocaleDateString('pt-BR')}</span>
                )}
                {connection.apiKey.createdAt && (
                  <span>Criada em: {new Date(connection.apiKey.createdAt).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma API key gerada para esta conexão</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onGenerate(connection.connectionId)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF99]/10 text-[#00FF99] rounded-lg text-sm font-medium hover:bg-[#00FF99]/20 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {connection.hasApiKey ? 'Regenerar' : 'Gerar'}
          </button>
          {connection.hasApiKey && (
            <button
              onClick={() => onRevoke(connection.connectionId)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Revogar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// API DOCUMENTATION
// ============================================================================
const ApiDocumentation = () => {
  const [expandedEndpoint, setExpandedEndpoint] = useState(null)

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/contact/phone/{phone}',
      description: 'Buscar contato por telefone',
      example: `curl -X GET 'https://app.swiftbot.com.br/api/v1/contact/phone/5511999999999' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact',
      description: 'Criar novo contato',
      example: `curl -X POST 'https://app.swiftbot.com.br/api/v1/contact' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"phone": "5511999999999", "name": "João Silva"}'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/{contactId}/agent',
      description: 'Ativar/desativar agente IA para contato',
      example: `curl -X POST 'https://app.swiftbot.com.br/api/v1/contact/{contactId}/agent' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"enabled": false, "reason": "Atendimento manual"}'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/{contactId}/sequences/{sequenceId}',
      description: 'Adicionar contato a uma sequência',
      example: `curl -X POST 'https://app.swiftbot.com.br/api/v1/contact/{contactId}/sequences/{sequenceId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'DELETE',
      path: '/api/v1/contact/{contactId}/sequences/{sequenceId}',
      description: 'Remover contato de uma sequência',
      example: `curl -X DELETE 'https://app.swiftbot.com.br/api/v1/contact/{contactId}/sequences/{sequenceId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/{contactId}/tags/{tagId}',
      description: 'Adicionar tag ao contato',
      example: `curl -X POST 'https://app.swiftbot.com.br/api/v1/contact/{contactId}/tags/{tagId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'DELETE',
      path: '/api/v1/contact/{contactId}/tags/{tagId}',
      description: 'Remover tag do contato',
      example: `curl -X DELETE 'https://app.swiftbot.com.br/api/v1/contact/{contactId}/tags/{tagId}' \\
  -H 'X-API-KEY: sua-api-key'`
    }
  ]

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-500/20 text-blue-400'
      case 'POST': return 'bg-green-500/20 text-green-400'
      case 'DELETE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Code className="text-[#00FF99]" size={18} />
        <h3 className="text-white font-medium">Documentação da API</h3>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        Use sua API key no header <code className="bg-[#252525] px-2 py-0.5 rounded text-[#00FF99]">X-API-KEY</code> em todas as requisições.
      </div>

      <div className="space-y-2">
        {endpoints.map((endpoint, index) => (
          <div key={index} className="border border-white/5 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === index ? null : index)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
            >
              <span className={`text-xs px-2 py-1 rounded font-mono ${getMethodColor(endpoint.method)}`}>
                {endpoint.method}
              </span>
              <span className="text-gray-300 font-mono text-sm flex-1 truncate">
                {endpoint.path}
              </span>
              <span className="text-gray-500 text-sm hidden sm:block">
                {endpoint.description}
              </span>
              <ChevronDown
                className={`text-gray-400 transition-transform ${expandedEndpoint === index ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>

            {expandedEndpoint === index && (
              <div className="px-4 py-3 bg-[#0A0A0A] border-t border-white/5">
                <p className="text-sm text-gray-400 mb-3">{endpoint.description}</p>
                <pre className="bg-[#1A1A1A] p-3 rounded-lg overflow-x-auto text-xs text-gray-300">
                  {endpoint.example}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('webhook')
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch API keys data
  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      const data = await response.json()

      if (data.success) {
        setConnections(data.connections || [])
        if (!selectedConnection && data.connections?.length > 0) {
          setSelectedConnection(data.connections[0].connectionId)
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }, [selectedConnection])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await fetchApiKeys()
      setLoading(false)
    }
    checkAuth()
  }, [router, fetchApiKeys])

  const handleGenerateKey = async (connectionId) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })
      const data = await response.json()

      if (data.success) {
        // Store the full API key temporarily
        setConnections(prev => prev.map(c =>
          c.connectionId === connectionId
            ? { ...c, hasApiKey: true, fullApiKey: data.apiKey }
            : c
        ))
        // Refresh to get masked version
        await fetchApiKeys()
        // Keep the full key for copying
        setConnections(prev => prev.map(c =>
          c.connectionId === connectionId
            ? { ...c, fullApiKey: data.apiKey }
            : c
        ))
      }
    } catch (error) {
      console.error('Error generating API key:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeKey = async (connectionId) => {
    if (!confirm('Tem certeza que deseja revogar esta API key? Todas as integrações usando esta chave deixarão de funcionar.')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })
      const data = await response.json()

      if (data.success) {
        await fetchApiKeys()
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00FF99]/10 rounded-xl">
                  <Settings className="text-[#00FF99]" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">Configurações</h1>
                  <p className="text-sm text-gray-500">Gerencie suas integrações e automações</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-[#00FF99]/10 to-transparent rounded-xl p-5 border border-[#00FF99]/20">
                <div className="flex items-start gap-4">
                  <Webhook className="text-[#00FF99] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h2 className="text-white font-semibold mb-1">API de Integração</h2>
                    <p className="text-gray-400 text-sm">
                      Use nossa API para integrar com n8n, Zapier, Make ou seu próprio sistema.
                      Gerencie contatos, tags, sequências e controle o agente de IA programaticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* API Keys Section */}
              <div>
                <h3 className="text-white font-medium mb-4">Suas API Keys</h3>
                <div className="space-y-4">
                  {connections.length === 0 ? (
                    <div className="bg-[#1A1A1A] rounded-xl p-8 text-center border border-white/5">
                      <Key className="mx-auto text-gray-600 mb-3" size={32} />
                      <p className="text-gray-400">Nenhuma conexão WhatsApp encontrada</p>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="mt-4 text-[#00FF99] text-sm hover:underline"
                      >
                        Conectar WhatsApp
                      </button>
                    </div>
                  ) : (
                    connections.map(connection => (
                      <ApiKeyCard
                        key={connection.connectionId}
                        connection={connection}
                        onGenerate={handleGenerateKey}
                        onRevoke={handleRevokeKey}
                        loading={actionLoading}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Documentation */}
              <ApiDocumentation />
            </div>
          )}

          {activeTab === 'cadencia' && (
            <div className="bg-[#1A1A1A] rounded-xl p-8 text-center border border-white/5">
              <Clock className="mx-auto text-gray-600 mb-3" size={48} />
              <h3 className="text-white font-medium mb-2">Cadência</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Configure webhooks de cadência para receber notificações quando contatos
                avançarem nas etapas do funil ou sequências.
              </p>
              <span className="inline-block mt-4 text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full">
                Em Desenvolvimento
              </span>
            </div>
          )}

          {activeTab === 'gatilhos' && (
            <div className="bg-[#1A1A1A] rounded-xl p-8 text-center border border-white/5">
              <Zap className="mx-auto text-gray-600 mb-3" size={48} />
              <h3 className="text-white font-medium mb-2">Gatilhos Automáticos</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Configure webhooks para disparar automaticamente quando eventos específicos
                ocorrerem, como novas mensagens, tags adicionadas ou mudanças de estágio.
              </p>
              <span className="inline-block mt-4 text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full">
                Em Desenvolvimento
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
