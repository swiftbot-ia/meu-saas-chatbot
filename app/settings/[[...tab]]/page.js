'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ConnectionDropdown from '@/app/components/ConnectionDropdown'
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
  ArrowLeft,
  FileText,
  Plus,
  AlertCircle
} from 'lucide-react'

// ============================================================================
// TAB NAVIGATION
// ============================================================================
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'webhook', label: 'Webhook', icon: Webhook, soon: false },
    { id: 'custom-fields', label: 'Campos', icon: FileText, soon: false },
    { id: 'cadencia', label: 'Cadência', icon: Clock, soon: true },
    { id: 'gatilhos', label: 'Gatilhos', icon: Zap, soon: true }
  ]

  return (
    <div className="flex gap-2 border-b border-white/10 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
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
              border-b-2 -mb-[2px] whitespace-nowrap flex-shrink-0
              ${isActive
                ? 'text-[#00FF99] border-[#00FF99]'
                : tab.soon
                  ? 'text-gray-600 border-transparent cursor-not-allowed opacity-60'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}
            `}
          >
            <Icon size={16} />
            {tab.label}
            {tab.soon && (
              <span className="ml-1 text-[10px] bg-white/5 text-gray-500 border border-white/5 px-1.5 py-0.5 rounded-full font-normal">
                Breve
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
  const [fullKey, setFullKey] = useState(connection.fullApiKey || null)
  const [loadingKey, setLoadingKey] = useState(false)

  // Busca a chave completa do servidor
  const fetchFullKey = async () => {
    if (fullKey) return fullKey
    if (!connection.connectionId) return null

    setLoadingKey(true)
    try {
      const response = await fetch(`/api/settings/api-keys?connectionId=${connection.connectionId}&reveal=true`)
      const data = await response.json()
      if (data.success && data.apiKey) {
        setFullKey(data.apiKey)
        return data.apiKey
      }
    } catch (error) {
      console.error('Error fetching full API key:', error)
    } finally {
      setLoadingKey(false)
    }
    return null
  }

  const handleShowToggle = async () => {
    if (!showKey && !fullKey) {
      await fetchFullKey()
    }
    setShowKey(!showKey)
  }

  const handleCopy = async () => {
    let keyToCopy = fullKey
    if (!keyToCopy) {
      keyToCopy = await fetchFullKey()
    }
    if (keyToCopy) {
      await navigator.clipboard.writeText(keyToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 w-full overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Key className="text-[#00FF99]" size={18} />
            <h3 className="text-white font-medium truncate">{connection.connectionName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${connection.isConnected
              ? 'bg-[#00FF99]/20 text-[#00FF99]'
              : 'bg-red-500/20 text-red-400'
              }`}>
              {connection.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {connection.hasApiKey && connection.apiKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#252525] px-4 py-2 rounded-lg font-mono text-sm flex-1 truncate">
                  <span className="text-gray-400">
                    {showKey && fullKey
                      ? fullKey
                      : connection.apiKey.maskedKey}
                  </span>
                </div>
                <button
                  onClick={handleShowToggle}
                  disabled={loadingKey}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  title={showKey ? 'Ocultar' : 'Mostrar'}
                >
                  {loadingKey ? <Loader2 size={18} className="animate-spin" /> : showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-[#00FF99] hover:bg-[#00FF99]/10 rounded-lg transition-colors flex-shrink-0"
                  title="Copiar"
                >
                  {copied ? <Check size={18} className="text-[#00FF99]" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {connection.apiKey.lastUsedAt && (
                  <span>Último: {new Date(connection.apiKey.lastUsedAt).toLocaleDateString('pt-BR')}</span>
                )}
                {connection.apiKey.createdAt && (
                  <span>Criada: {new Date(connection.apiKey.createdAt).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma API key gerada para esta conexão</p>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => onGenerate(connection.connectionId)}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00FF99]/10 text-[#00FF99] rounded-lg text-sm font-medium hover:bg-[#00FF99]/20 transition-colors disabled:opacity-50"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Revogar</span>
              <span className="sm:hidden">Excluir</span>
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
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleCopyExample = async (example, index) => {
    await navigator.clipboard.writeText(example.replace(/\\\\/g, '\\'))
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/contact/update',
      description: 'Atualizar contato completo',
      example: `curl -X POST 'https://swiftbot.com.br/api/v1/contact/update' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone": "5511999999999",
    "name": "João Silva",
    "funnelStage": "negociacao",
    "originId": "uuid-da-origem",
    "metadata": {"idCRM": "12345"},
    "addTags": ["tag-uuid-1"],
    "agentEnabled": true
  }'`
    },
    {
      method: 'GET',
      path: '/api/v1/contact/phone/{phone}',
      description: 'Buscar contato por telefone',
      example: `curl -X GET 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'PATCH',
      path: '/api/v1/contact/phone/{phone}',
      description: 'Atualizar contato por telefone',
      example: `curl -X PATCH 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"name": "João Silva", "metadata": {"idCRM": "12345", "source": "landing"}}'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact',
      description: 'Criar novo contato',
      example: `curl -X POST 'https://swiftbot.com.br/api/v1/contact' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"phone": "5511999999999", "name": "João Silva"}'`
    },
    {
      method: 'GET',
      path: '/api/v1/contact/{contactId}/metadata',
      description: 'Buscar campos personalizados',
      example: `curl -X GET 'https://swiftbot.com.br/api/v1/contact/{contactId}/metadata' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'PATCH',
      path: '/api/v1/contact/{contactId}/metadata',
      description: 'Atualizar campos (merge)',
      example: `curl -X PATCH 'https://swiftbot.com.br/api/v1/contact/{contactId}/metadata' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"idCRM": "12345", "source": "landing_page", "segment": "premium"}'`
    },
    {
      method: 'PUT',
      path: '/api/v1/contact/{contactId}/metadata',
      description: 'Substituir todos campos',
      example: `curl -X PUT 'https://swiftbot.com.br/api/v1/contact/{contactId}/metadata' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"idCRM": "12345"}'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/phone/{phone}/agent',
      description: 'Ativar/desativar agente IA',
      example: `curl -X POST 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999/agent' \\
  -H 'X-API-KEY: sua-api-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"enabled": false, "reason": "Atendimento manual"}'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/phone/{phone}/sequences/{sequenceId}',
      description: 'Inscrever em sequência',
      example: `curl -X POST 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999/sequences/{sequenceId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'DELETE',
      path: '/api/v1/contact/phone/{phone}/sequences/{sequenceId}',
      description: 'Remover de sequência',
      example: `curl -X DELETE 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999/sequences/{sequenceId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'POST',
      path: '/api/v1/contact/phone/{phone}/tags/{tagId}',
      description: 'Adicionar tag',
      example: `curl -X POST 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999/tags/{tagId}' \\
  -H 'X-API-KEY: sua-api-key'`
    },
    {
      method: 'DELETE',
      path: '/api/v1/contact/phone/{phone}/tags/{tagId}',
      description: 'Remover tag',
      example: `curl -X DELETE 'https://swiftbot.com.br/api/v1/contact/phone/5511999999999/tags/{tagId}' \\
  -H 'X-API-KEY: sua-api-key'`
    }
  ]

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-500/20 text-blue-400'
      case 'POST': return 'bg-green-500/20 text-green-400'
      case 'PATCH': return 'bg-yellow-500/20 text-yellow-400'
      case 'PUT': return 'bg-orange-500/20 text-orange-400'
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
                <p className="text-sm text-gray-400 mb-3 block sm:hidden">{endpoint.description}</p>
                <div className="relative">
                  <button
                    onClick={() => handleCopyExample(endpoint.example, index)}
                    className="absolute top-2 right-2 p-1.5 bg-[#252525] hover:bg-[#333] rounded-md text-gray-400 hover:text-[#00FF99] transition-colors z-10"
                    title="Copiar"
                  >
                    {copiedIndex === index ? <Check size={14} className="text-[#00FF99]" /> : <Copy size={14} />}
                  </button>
                  <pre className="bg-[#1A1A1A] p-3 pr-12 rounded-lg overflow-x-auto text-xs text-gray-300">
                    {endpoint.example}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// CUSTOM FIELDS TAB - Global Custom Fields Management
// ============================================================================
const CustomFieldsTab = ({ connections, selectedConnection, onSelectConnection }) => {
  const [fieldName, setFieldName] = useState('')
  const [defaultValue, setDefaultValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [existingFields, setExistingFields] = useState([])
  const [loadingFields, setLoadingFields] = useState(false)

  const selectedConn = connections.find(c => c.connectionId === selectedConnection)

  // Load existing fields when connection changes
  useEffect(() => {
    const loadFields = async () => {
      if (!selectedConn?.instanceName) return

      setLoadingFields(true)
      try {
        const response = await fetch(`/api/contacts/global-field?instanceName=${selectedConn.instanceName}`)
        const data = await response.json()
        if (data.success) {
          setExistingFields(data.fields || [])
        }
      } catch (error) {
        console.error('Error loading fields:', error)
      } finally {
        setLoadingFields(false)
      }
    }

    loadFields()
  }, [selectedConn?.instanceName])

  const handleCreateField = async () => {
    if (!fieldName.trim()) {
      setResult({ type: 'error', message: 'Nome do campo é obrigatório' })
      return
    }

    if (!selectedConnection) {
      setResult({ type: 'error', message: 'Selecione uma conexão' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const conn = connections.find(c => c.connectionId === selectedConnection)
      if (!conn?.instanceName) {
        throw new Error('Conexão não encontrada')
      }

      const response = await fetch('/api/contacts/global-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: selectedConnection,
          instanceName: conn.instanceName,
          fieldName: fieldName.trim(),
          defaultValue: defaultValue.trim() || ''
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          type: 'success',
          message: `Campo "${fieldName}" criado em ${data.updatedCount} contatos!`
        })
        setFieldName('')
        setDefaultValue('')
        // Reload existing fields
        setExistingFields(prev => [
          ...prev.filter(f => f.name !== fieldName),
          { name: fieldName, sampleValue: defaultValue || '', contactCount: data.updatedCount }
        ])
      } else {
        setResult({ type: 'error', message: data.error || 'Erro ao criar campo' })
      }
    } catch (error) {
      console.error('Error creating global field:', error)
      setResult({ type: 'error', message: 'Erro ao criar campo global' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl p-5 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <FileText className="text-purple-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h2 className="text-white font-semibold mb-1">Campos Personalizados Globais</h2>
            <p className="text-gray-400 text-sm">
              Crie campos personalizados que serão adicionados a todos os contatos da sua conexão.
              Ideal para campos como ID do CRM, origem, segmento, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de conexão removido - agora está no header global */}

      {/* Existing Fields List */}
      <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <FileText size={18} className="text-purple-400" />
          Campos Existentes
          {loadingFields && <Loader2 size={14} className="animate-spin text-gray-500 ml-2" />}
        </h3>

        {existingFields.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {loadingFields ? 'Carregando campos...' : 'Nenhum campo personalizado criado ainda.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {existingFields.map((field, idx) => (
              <div key={idx} className="bg-[#252525] rounded-lg px-4 py-3 border border-white/5">
                <div className="font-mono text-[#00FF99] text-sm">{field.name}</div>
                {field.contactCount && (
                  <div className="text-xs text-gray-500 mt-1">
                    {field.contactCount} contatos
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Field Form */}
      <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Plus size={18} className="text-[#00FF99]" />
          Criar Novo Campo Global
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome do Campo *</label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Ex: idCRM, source, segment"
              className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            />
            <p className="text-xs text-gray-500 mt-1">Sem espaços, use camelCase</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Valor Padrão</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Ex: vazio ou valor inicial"
              className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            />
            <p className="text-xs text-gray-500 mt-1">Deixe vazio para adicionar sem valor</p>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${result.type === 'success'
            ? 'bg-[#00FF99]/10 text-[#00FF99] border border-[#00FF99]/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
            {result.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {result.message}
          </div>
        )}

        <button
          onClick={handleCreateField}
          disabled={loading || !fieldName.trim()}
          className="mt-4 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] disabled:opacity-50 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus size={18} />
              Criar Campo
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
// ============================================================================
// MAIN PAGE
// ============================================================================
import { useParams } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const params = useParams()

  // Tab ativa baseada na URL
  const activeTab = params?.tab?.[0] || 'webhook'

  // Redireciona para /settings/webhook se acessar /settings puro
  useEffect(() => {
    if (!params?.tab) {
      router.replace('/settings/webhook')
    }
  }, [params?.tab, router])

  const [loading, setLoading] = useState(true)
  // const [activeTab, setActiveTab] = useState('webhook') <-- REMOVIDO
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Handler para troca de tab
  const handleTabChange = (tabId) => {
    router.push(`/settings/${tabId}`)
  }

  // Fetch API keys data
  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch(`/api/settings/api-keys?t=${new Date().getTime()}`)
      const data = await response.json()

      if (data.success) {
        setConnections(data.connections || [])
        if (!selectedConnection && data.connections?.length > 0) {
          // Use localStorage to sync with other pages
          const saved = localStorage.getItem('activeConnectionId')
          const foundSaved = data.connections.find(c => c.connectionId === saved)
          if (foundSaved) {
            setSelectedConnection(saved)
          } else {
            setSelectedConnection(data.connections[0].connectionId)
          }
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
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
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

            {/* Connection Dropdown - Igual ao padrão Automações */}
            {connections.length > 0 && (
              <div className="w-64">
                <ConnectionDropdown
                  connections={connections}
                  selectedConnection={selectedConnection}
                  onSelectConnection={(connId) => {
                    setSelectedConnection(connId)
                    localStorage.setItem('activeConnectionId', connId)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

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

              {/* API Keys Section - Mostra apenas a conexão selecionada */}
              <div>
                <h3 className="text-white font-medium mb-4">API Key da Conexão</h3>
                <div className="space-y-4">
                  {(() => {
                    const selectedConn = connections.find(c => c.connectionId === selectedConnection)
                    if (!selectedConn) {
                      return (
                        <div className="bg-[#1A1A1A] rounded-xl p-8 text-center border border-white/5">
                          <Key className="mx-auto text-gray-600 mb-3" size={32} />
                          <p className="text-gray-400">Selecione uma conexão para gerenciar a API key</p>
                        </div>
                      )
                    }
                    return (
                      <ApiKeyCard
                        key={selectedConn.connectionId}
                        connection={selectedConn}
                        onGenerate={handleGenerateKey}
                        onRevoke={handleRevokeKey}
                        loading={actionLoading}
                      />
                    )
                  })()}
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

          {activeTab === 'custom-fields' && (
            <CustomFieldsTab
              connections={connections}
              selectedConnection={selectedConnection}
              onSelectConnection={(connId) => {
                setSelectedConnection(connId)
                localStorage.setItem('activeConnectionId', connId)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
