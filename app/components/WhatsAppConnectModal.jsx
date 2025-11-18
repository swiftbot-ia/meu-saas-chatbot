'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Componente Modal para Conexão WhatsApp com Polling Automático
 *
 * Features:
 * - Exibe QR Code para conexão
 * - Polling automático a cada 30 segundos
 * - Fecha automaticamente quando conectado/desconectado
 * - Atualiza dashboard com dados da instância
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {string} props.connectionId - ID da conexão no Supabase
 * @param {Function} props.onConnectionSuccess - Callback com dados da instância conectada
 */
export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  connectionId,
  onConnectionSuccess
}) {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [status, setStatus] = useState('disconnected')
  const [error, setError] = useState(null)
  const [instanceData, setInstanceData] = useState(null)

  const pollingTimerRef = useRef(null)
  const qrCodeTimestampRef = useRef(null)

  // ============================================================================
  // 1. INICIAR CONEXÃO (quando modal abre)
  // ============================================================================
  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔌 Iniciando conexão WhatsApp...')

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      console.log('✅ Resposta da API:', data)

      // Salvar dados da instância
      setInstanceData(data)
      setStatus(data.status)
      setQrCode(data.qrCode)

      // Se já está conectado, não precisa de QR Code
      if (data.connected || data.status === 'open') {
        console.log('✅ Instância já conectada!')
        onConnectionSuccess?.(data)
        setTimeout(() => onClose(), 2000)
        return
      }

      // Se tem QR Code, iniciar polling de 30s
      if (data.qrCode) {
        qrCodeTimestampRef.current = Date.now()
        startPolling()
      }

    } catch (err) {
      console.error('❌ Erro ao conectar:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // 2. VERIFICAR STATUS (polling)
  // ============================================================================
  const checkStatus = async () => {
    try {
      console.log('🔍 Verificando status da conexão...')

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connectionId}`,
        { method: 'GET' }
      )

      const data = await response.json()

      if (!response.ok) {
        console.warn('⚠️ Erro ao verificar status:', data.error)
        return
      }

      console.log('📊 Status atual:', data.status, '| Conectado:', data.connected)

      setStatus(data.status)
      setInstanceData(prevData => ({ ...prevData, ...data }))

      // ============================================================================
      // 3. FECHAR MODAL se conectado OU desconectado
      // ============================================================================
      if (data.connected || data.status === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!')
        stopPolling()

        // Callback com dados da instância
        onConnectionSuccess?.({
          instanceName: data.instanceName,
          profileName: data.profileName,
          profilePicUrl: data.profilePicUrl,
          owner: data.owner,
          status: data.status
        })

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
      else if (data.status === 'disconnected' || data.status === 'close') {
        console.log('❌ Conexão fechada/desconectada')
        stopPolling()
        setError('Conexão foi encerrada. Tente novamente.')
      }

    } catch (err) {
      console.error('❌ Erro ao verificar status:', err)
    }
  }

  // ============================================================================
  // 4. POLLING: Verificar status a cada 5 segundos (eficiente)
  // ============================================================================
  const startPolling = () => {
    console.log('⏰ Iniciando polling de 5 segundos')

    // Limpar timer anterior se existir
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
    }

    // ✅ Verificar status a cada 5 segundos (mais responsivo)
    pollingTimerRef.current = setInterval(() => {
      console.log('🔄 Polling: Verificando status...')
      checkStatus()
    }, 5000) // 5 segundos
  }

  const stopPolling = () => {
    console.log('⏹️ Parando polling')
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }

  // ============================================================================
  // 5. LIFECYCLE: Iniciar conexão quando modal abre
  // ============================================================================
  useEffect(() => {
    if (isOpen && connectionId) {
      handleConnect()
    }

    // Cleanup: parar polling quando modal fecha
    return () => {
      stopPolling()
    }
  }, [isOpen, connectionId])

  // Não renderizar se modal não estiver aberto
  if (!isOpen) return null

  // ============================================================================
  // 6. RENDER: UI do Modal
  // ============================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Conectar WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Gerando QR Code...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Connected State */}
        {status === 'open' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Conectado com sucesso!
            </h3>
            {instanceData?.profileName && (
              <p className="text-gray-600">
                Bem-vindo, {instanceData.profileName}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Fechando automaticamente...
            </p>
          </div>
        )}

        {/* QR Code State */}
        {qrCode && status !== 'open' && (
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="mx-auto w-64 h-64"
              />
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium">📱 Escaneie o QR Code com seu WhatsApp:</p>
              <ol className="text-left list-decimal list-inside space-y-1">
                <li>Abra o WhatsApp no seu telefone</li>
                <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
                <li>Toque em <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Aponte seu telefone para esta tela para escanear o QR Code</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                ⏰ Verificando conexão automaticamente a cada 5 segundos
              </p>
              <p className="text-xs text-gray-600 mt-1">
                O modal fechará automaticamente quando conectado
              </p>
            </div>

            <button
              onClick={checkStatus}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🔄 Verificar Status Agora
            </button>
          </div>
        )}

        {/* Connecting State (sem QR Code ainda) */}
        {!loading && !qrCode && status === 'connecting' && (
          <div className="text-center py-8">
            <div className="animate-pulse text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Aguardando QR Code...</p>
          </div>
        )}
      </div>
    </div>
  )
}
