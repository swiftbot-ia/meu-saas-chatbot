'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import InstanceCard from '../../components/InstanceCard'
import WhatsAppConnectModal from '../../components/WhatsAppConnectModal'
import { Plus, Loader2 } from 'lucide-react'

/**
 * Página de Lista de Instâncias WhatsApp
 *
 * Exibe todas as instâncias do usuário logado
 * Permite criar novas instâncias
 */
export default function InstancesPage() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [newConnectionId, setNewConnectionId] = useState(null)
  const [creatingInstance, setCreatingInstance] = useState(false)

  // Check authentication
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
      await loadInstances(user.id)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      setError('Erro ao carregar dados de autenticação')
      router.push('/login')
    }
  }

  // Load user's instances
  const loadInstances = async (userId) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('whatsapp_connections')
        .select(`
          id,
          instance_name,
          status,
          is_connected,
          profile_name,
          profile_pic_url,
          phone_number,
          created_at,
          last_connected_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setInstances(data || [])
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
      setError('Erro ao carregar suas instâncias. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Create new instance
  const handleCreateInstance = async () => {
    if (!user) return

    try {
      setCreatingInstance(true)

      // Create new connection in database
      const { data: newConnection, error: createError } = await supabase
        .from('whatsapp_connections')
        .insert([
          {
            user_id: user.id,
            instance_name: `Instância ${new Date().toLocaleString('pt-BR')}`,
            status: 'disconnected',
            is_connected: false
          }
        ])
        .select()
        .single()

      if (createError) throw createError

      console.log('✅ Nova instância criada:', newConnection)

      // Open connection modal
      setNewConnectionId(newConnection.id)
      setShowConnectModal(true)
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error)
      setError('Erro ao criar nova instância. Tente novamente.')
    } finally {
      setCreatingInstance(false)
    }
  }

  // Handle connection success
  const handleConnectionSuccess = (instanceData) => {
    console.log('✅ Conexão bem-sucedida:', instanceData)

    // Reload instances to show updated data
    if (user) {
      loadInstances(user.id)
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowConnectModal(false)
    setNewConnectionId(null)

    // Reload instances in case any changes happened
    if (user) {
      loadInstances(user.id)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Minhas Instâncias WhatsApp
            </h1>
            <p className="text-[#B0B0B0] text-sm md:text-base">
              Gerencie suas conexões e monitore o status de cada instância
            </p>
          </div>

          {/* New Instance Button */}
          <button
            onClick={handleCreateInstance}
            disabled={creatingInstance}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg
              bg-[#00FF99] hover:bg-[#00E88C]
              text-black font-semibold
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-[#00FF99]/20
            "
          >
            {creatingInstance ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus size={20} />
                Nova Instância
              </>
            )}
          </button>
        </div>

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
              <p className="text-[#B0B0B0]">Carregando suas instâncias...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && instances.length === 0 && (
          <div className="bg-[#1F1F1F] rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhuma instância criada ainda
            </h3>
            <p className="text-[#B0B0B0] mb-6">
              Crie sua primeira instância para começar a usar o WhatsApp
            </p>
            <button
              onClick={handleCreateInstance}
              disabled={creatingInstance}
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-lg
                bg-[#00FF99] hover:bg-[#00E88C]
                text-black font-semibold
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {creatingInstance ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Criar Primeira Instância
                </>
              )}
            </button>
          </div>
        )}

        {/* Instances grid */}
        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance) => (
              <InstanceCard key={instance.id} instance={instance} />
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp Connect Modal */}
      {showConnectModal && newConnectionId && (
        <WhatsAppConnectModal
          isOpen={showConnectModal}
          onClose={handleCloseModal}
          connectionId={newConnectionId}
          onConnectionSuccess={handleConnectionSuccess}
        />
      )}
    </div>
  )
}
