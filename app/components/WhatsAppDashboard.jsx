'use client'

import { useState, useEffect } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'

/**
 * Exemplo de Dashboard WhatsApp
 * Demonstra como integrar o WhatsAppConnectModal
 */
export default function WhatsAppDashboard({ userId, connectionId }) {
  const [showModal, setShowModal] = useState(false)
  const [instanceData, setInstanceData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // ============================================================================
  // CARREGAR STATUS INICIAL (quando página carrega)
  // ============================================================================
  useEffect(() => {
    if (connectionId) {
      loadConnectionStatus()
    }
  }, [connectionId])

  const loadConnectionStatus = async () => {
    try {
      console.log('📥 Carregando status da conexão:', connectionId)

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connectionId}`,
        { method: 'GET' }
      )

      const data = await response.json()

      console.log('📊 Status recebido:', data)

      if (response.ok) {
        setConnectionStatus(data.status)

        // Sempre atualizar instanceData se houver dados
        if (data.instanceName) {
          setInstanceData({
            instanceName: data.instanceName,
            profileName: data.profileName,
            profilePicUrl: data.profilePicUrl,
            owner: data.owner,
            status: data.status,
            connected: data.connected
          })

          console.log('✅ Dados da instância atualizados:', {
            profileName: data.profileName,
            status: data.status,
            connected: data.connected
          })
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status:', error)
    }
  }

  // ============================================================================
  // CALLBACK: Quando WhatsApp conecta com sucesso
  // ============================================================================
  const handleConnectionSuccess = async (data) => {
    console.log('✅ WhatsApp conectado! Dados recebidos:', data)

    // Atualizar estado do dashboard imediatamente
    setInstanceData(data)
    setConnectionStatus(data.status)

    // ✅ RECARREGAR dados do servidor para garantir sincronização
    console.log('🔄 Recarregando dados do servidor...')
    await loadConnectionStatus()

    // Aqui você pode:
    // - Atualizar estado global (Redux, Zustand, etc)
    // - Mostrar notificação de sucesso
    // - Disparar analytics events
    // - Etc.

    console.log('✅ Dashboard atualizado com sucesso!')
  }

  // ============================================================================
  // RENDER: UI do Dashboard
  // ============================================================================
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Dashboard WhatsApp
        </h1>

        {/* Status Card */}
        <div className="border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar/Status Indicator */}
              {instanceData?.profilePicUrl ? (
                <img
                  src={instanceData.profilePicUrl}
                  alt={instanceData.profileName}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Status Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {instanceData?.profileName || 'WhatsApp não conectado'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === 'open'
                        ? 'bg-green-500'
                        : connectionStatus === 'connecting'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {connectionStatus === 'open'
                      ? 'Conectado'
                      : connectionStatus === 'connecting'
                      ? 'Conectando...'
                      : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowModal(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                connectionStatus === 'open'
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {connectionStatus === 'open' ? 'Reconectar' : 'Conectar WhatsApp'}
            </button>
          </div>

          {/* Instance Details */}
          {instanceData && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nome da Instância</p>
                <p className="font-medium text-gray-800">
                  {instanceData.instanceName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Número</p>
                <p className="font-medium text-gray-800">
                  {instanceData.owner || 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Mensagens</p>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
              <div className="text-3xl">💬</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Contatos</p>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Grupos</p>
                <p className="text-2xl font-bold text-purple-900">0</p>
              </div>
              <div className="text-3xl">👨‍👩‍👧‍👦</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {connectionStatus !== 'open' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              ℹ️ Como conectar seu WhatsApp
            </h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Clique no botão "Conectar WhatsApp" acima</li>
              <li>Um QR Code será exibido</li>
              <li>Abra o WhatsApp no seu telefone</li>
              <li>Escaneie o QR Code</li>
              <li>Aguarde a confirmação (máximo 30 segundos)</li>
            </ol>
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
