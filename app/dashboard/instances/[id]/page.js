'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import WhatsAppConnectModal from '../../../components/WhatsAppConnectModal'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  BarChart3,
  MessageSquare,
  Users,
  Bot,
  Settings
} from 'lucide-react'

/**
 * Página Individual de Instância WhatsApp
 *
 * Exibe detalhes de uma instância específica
 * Permite reconectar e remover instância
 */
export default function InstanceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const instanceId = params.id

  const [user, setUser] = useState(null)
  const [instance, setInstance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tab state
  const [activeTab, setActiveTab] = useState('overview')

  // Modal states
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, disabled: false },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare, disabled: true },
    { id: 'contacts', label: 'Contatos', icon: Users, disabled: true },
    { id: 'automations', label: 'Automações', icon: Bot, disabled: true },
    { id: 'settings', label: 'Configurações', icon: Settings, disabled: false }
  ]

  // Check authentication and load instance
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      await loadInstance(user.id, instanceId)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      setError('Erro ao carregar dados de autenticação')
      router.push('/login')
    }
  }

  // Load instance data
  const loadInstance = async (userId, instId) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('id', instId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Instância não encontrada')
          return
        }
        throw fetchError
      }

      setInstance(data)
    } catch (error) {
      console.error('Erro ao carregar instância:', error)
      setError('Erro ao carregar dados da instância')
    } finally {
      setLoading(false)
    }
  }

  // Reconnect instance
  const handleReconnect = () => {
    setShowConnectModal(true)
  }

  // Handle connection success
  const handleConnectionSuccess = (instanceData) => {
    console.log('✅ Reconexão bem-sucedida:', instanceData)

    // Reload instance data
    if (user) {
      loadInstance(user.id, instanceId)
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowConnectModal(false)

    // Reload instance data
    if (user) {
      loadInstance(user.id, instanceId)
    }
  }

  // Delete instance
  const handleDelete = async () => {
    if (!user || !instance) return

    try {
      setDeleting(true)

      const { error: deleteError } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', instance.id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      console.log('✅ Instância removida')

      // Navigate back to instances list
      router.push('/dashboard/instances')
    } catch (error) {
      console.error('❌ Erro ao remover instância:', error)
      setError('Erro ao remover instância. Tente novamente.')
      setDeleting(false)
    }
  }

  // Determine connection status
  const isConnected = instance?.is_connected ||
    instance?.status === 'open' ||
    instance?.status === 'connected'

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard/instances')}
          className="
            flex items-center gap-2 mb-6
            text-[#B0B0B0] hover:text-white
            transition-colors duration-200
          "
        >
          <ArrowLeft size={20} />
          <span>Voltar para Instâncias</span>
        </button>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-[#00FF99] mx-auto mb-4" />
              <p className="text-[#B0B0B0]">Carregando instância...</p>
            </div>
          </div>
        )}

        {/* Instance not found */}
        {!loading && !instance && (
          <div className="bg-[#1F1F1F] rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Instância não encontrada
            </h3>
            <p className="text-[#B0B0B0] mb-6">
              A instância que você está procurando não existe ou foi removida
            </p>
            <button
              onClick={() => router.push('/dashboard/instances')}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-lg
                bg-[#00FF99] hover:bg-[#00E88C]
                text-black font-semibold
                transition-all duration-200
              "
            >
              <ArrowLeft size={20} />
              Voltar para Instâncias
            </button>
          </div>
        )}

        {/* Instance details */}
        {!loading && instance && (
          <>
            {/* Header with avatar and name */}
            <div className="bg-[#1F1F1F] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                {instance.profile_pic_url ? (
                  <img
                    src={instance.profile_pic_url}
                    alt={instance.profile_name || instance.instance_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00E88C] flex items-center justify-center">
                    <span className="text-4xl">📱</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {instance.profile_name || instance.instance_name}
                  </h1>
                  {instance.phone_number && (
                    <p className="text-[#B0B0B0] text-lg">
                      📞 {instance.phone_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      whitespace-nowrap transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-[#00FF99] text-black font-semibold'
                        : tab.disabled
                          ? 'bg-[#272727] text-gray-600 cursor-not-allowed opacity-50'
                          : 'bg-[#272727] text-[#B0B0B0] hover:bg-[#333] hover:text-white'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {tab.disabled && <span className="text-xs">🚧</span>}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <div>
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Status card */}
                  <div className="bg-[#1F1F1F] rounded-xl p-6 text-center">
                    {isConnected ? (
                      <>
                        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">
                          Conectado e Online
                        </h3>
                        <p className="text-sm text-[#B0B0B0]">
                          Pronto para enviar e receber mensagens
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle size={48} className="text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">
                          Desconectado
                        </h3>
                        <p className="text-sm text-[#B0B0B0]">
                          Reconecte para continuar usando
                        </p>
                      </>
                    )}
                  </div>

                  {/* Messages card (placeholder) */}
                  <div className="bg-[#1F1F1F] rounded-xl p-6 text-center opacity-50">
                    <MessageSquare size={48} className="text-[#B0B0B0] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">
                      Mensagens
                    </h3>
                    <p className="text-sm text-[#B0B0B0]">
                      🚧 Em desenvolvimento
                    </p>
                  </div>

                  {/* Contacts card (placeholder) */}
                  <div className="bg-[#1F1F1F] rounded-xl p-6 text-center opacity-50">
                    <Users size={48} className="text-[#B0B0B0] mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">
                      Contatos
                    </h3>
                    <p className="text-sm text-[#B0B0B0]">
                      🚧 Em desenvolvimento
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleReconnect}
                    className="
                      flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                      bg-[#00FF99] hover:bg-[#00E88C]
                      text-black font-semibold
                      transition-all duration-200
                      shadow-lg shadow-[#00FF99]/20
                    "
                  >
                    <RefreshCw size={20} />
                    Reconectar WhatsApp
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="
                      flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                      bg-red-500 hover:bg-red-600
                      text-white font-semibold
                      transition-all duration-200
                    "
                  >
                    <Trash2 size={20} />
                    Remover Instância
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[#1F1F1F] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Configurações da Instância
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
                      Nome da Instância
                    </label>
                    <input
                      type="text"
                      value={instance.instance_name}
                      readOnly
                      className="
                        w-full px-4 py-2 rounded-lg
                        bg-[#272727] text-white
                        border border-gray-700
                        cursor-not-allowed
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
                      Status
                    </label>
                    <input
                      type="text"
                      value={instance.status}
                      readOnly
                      className="
                        w-full px-4 py-2 rounded-lg
                        bg-[#272727] text-white
                        border border-gray-700
                        cursor-not-allowed
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
                      Criado em
                    </label>
                    <input
                      type="text"
                      value={new Date(instance.created_at).toLocaleString('pt-BR')}
                      readOnly
                      className="
                        w-full px-4 py-2 rounded-lg
                        bg-[#272727] text-white
                        border border-gray-700
                        cursor-not-allowed
                      "
                    />
                  </div>

                  <p className="text-sm text-[#B0B0B0] mt-4">
                    🚧 Edição de configurações em desenvolvimento
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* WhatsApp Connect Modal */}
      {showConnectModal && instance && (
        <WhatsAppConnectModal
          isOpen={showConnectModal}
          onClose={handleCloseModal}
          connectionId={instance.id}
          onConnectionSuccess={handleConnectionSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1F1F1F] rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmar Remoção
            </h3>
            <p className="text-[#B0B0B0] mb-6">
              Tem certeza que deseja remover esta instância?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="
                  flex-1 px-4 py-2 rounded-lg
                  bg-[#272727] hover:bg-[#333]
                  text-white
                  transition-all duration-200
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="
                  flex-1 px-4 py-2 rounded-lg
                  bg-red-500 hover:bg-red-600
                  text-white font-semibold
                  transition-all duration-200
                  disabled:opacity-50
                "
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Removendo...
                  </span>
                ) : (
                  'Remover'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
