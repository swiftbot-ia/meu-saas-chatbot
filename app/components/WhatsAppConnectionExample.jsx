'use client'

import { useState, useEffect } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'

/**
 * Exemplo Completo: Dashboard WhatsApp com Polling Eficiente
 *
 * Este componente demonstra:
 * 1. Polling de 5 segundos durante a conexão
 * 2. Atualização automática do dashboard
 * 3. Fechamento automático do modal
 * 4. Sincronização com Supabase
 */
export default function WhatsAppConnectionExample({ connectionId }) {
  const [showModal, setShowModal] = useState(false)
  const [connectionData, setConnectionData] = useState(null)
  const [status, setStatus] = useState('disconnected')
  const [loading, setLoading] = useState(true)

  // ============================================================================
  // CARREGAR STATUS INICIAL
  // ============================================================================
  useEffect(() => {
    if (connectionId) {
      loadStatus()
    }
  }, [connectionId])

  const loadStatus = async () => {
    try {
      setLoading(true)
      console.log('📥 Carregando status da conexão:', connectionId)

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connectionId}`,
        { method: 'GET' }
      )

      const data = await response.json()
      console.log('📊 Dados recebidos:', data)

      if (response.ok) {
        setStatus(data.status)
        setConnectionData(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // CALLBACK: Quando conexão é bem-sucedida
  // ============================================================================
  const handleConnectionSuccess = async (data) => {
    console.log('✅ Conexão WhatsApp bem-sucedida!', data)

    // Atualizar estado local imediatamente
    setConnectionData(data)
    setStatus(data.status)

    // ✅ Recarregar do servidor para garantir sincronização
    console.log('🔄 Recarregando dados do servidor...')
    await loadStatus()

    // Opcional: Disparar eventos/analytics
    // trackEvent('whatsapp_connected', { profileName: data.profileName })

    console.log('✅ Dashboard atualizado!')
  }

  // ============================================================================
  // POLLING DURANTE CONEXÃO (Opcional - para debug)
  // ============================================================================
  useEffect(() => {
    // Se status for 'connecting', fazer polling mais agressivo no dashboard também
    if (status === 'connecting') {
      console.log('🔄 Status "connecting" detectado - iniciando polling no dashboard')

      const interval = setInterval(() => {
        console.log('🔄 Dashboard polling: verificando status...')
        loadStatus()
      }, 10000) // 10 segundos (mais lento que o modal)

      return () => {
        console.log('⏹️ Parando polling do dashboard')
        clearInterval(interval)
      }
    }
  }, [status])

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Conexão WhatsApp
          </h1>

          {/* Status Card */}
          <div className="border-2 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                {connectionData?.profilePicUrl ? (
                  <img
                    src={connectionData.profilePicUrl}
                    alt={connectionData.profileName || 'Avatar'}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {connectionData?.profileName || 'WhatsApp não conectado'}
                  </h3>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2 mt-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'connected' || status === 'open'
                          ? 'bg-green-500'
                          : status === 'connecting'
                          ? 'bg-yellow-500 animate-pulse'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm text-gray-600">
                      {status === 'connected' || status === 'open'
                        ? 'Conectado'
                        : status === 'connecting'
                        ? 'Conectando...'
                        : 'Desconectado'}
                    </span>
                  </div>

                  {/* Phone Number */}
                  {connectionData?.owner && (
                    <p className="text-sm text-gray-500 mt-1">
                      {connectionData.owner}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowModal(true)}
                disabled={status === 'connecting'}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  status === 'connecting'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : status === 'connected' || status === 'open'
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {status === 'connecting'
                  ? 'Conectando...'
                  : status === 'connected' || status === 'open'
                  ? 'Reconectar'
                  : 'Conectar WhatsApp'}
              </button>
            </div>
          </div>

          {/* Instance Info */}
          {connectionData?.instanceName && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Informações da Instância
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Nome da Instância</p>
                  <p className="font-medium text-gray-800">
                    {connectionData.instanceName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium text-gray-800">
                    {status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info (Desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 text-white rounded-lg p-4 text-xs font-mono">
            <h4 className="font-bold mb-2">🔧 Debug Info</h4>
            <pre className="overflow-auto">
              {JSON.stringify(
                {
                  connectionId,
                  status,
                  connected: connectionData?.connected,
                  profileName: connectionData?.profileName,
                  timestamp: new Date().toISOString()
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Modal de Conexão */}
      <WhatsAppConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        connectionId={connectionId}
        onConnectionSuccess={handleConnectionSuccess}
      />
    </div>
  )
}
