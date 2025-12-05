// app/components/WhatsAppConnectModal.tsx
// Modal SIMPLIFICADO - Apenas para conexão QR code
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TIPOS
// ============================================================================
interface ConnectionResponse {
  success: boolean
  status: 'connected' | 'connecting' | 'disconnected' | 'pending_qr' | 'open'
  connected: boolean
  qrCode?: string | null
  instanceToken?: string
  connectionId?: string
  instanceName?: string
  profileName?: string | null
  profilePicUrl?: string | null
  phoneNumber?: string | null
  message?: string
  error?: string
}

// Props flexíveis - aceita userId OU connectionId
interface WhatsAppConnectModalProps {
  isOpen: boolean
  onClose: () => void
  // Modo 1: Criar nova conexão (passa userId)
  userId?: string
  onSuccess?: () => void
  // Modo 2: Reconectar existente (passa connectionId)
  connectionId?: string
  onConnectionSuccess?: (data: any) => void
}

// ============================================================================
// CONSTANTES
// ============================================================================
const POLLING_INTERVAL = 5000 // 5 segundos
const TIMEOUT_DURATION = 120000 // 2 minutos

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
  connectionId: propConnectionId,
  onConnectionSuccess
}: WhatsAppConnectModalProps) {
  // Estados
  const [connectionData, setConnectionData] = useState<ConnectionResponse | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(propConnectionId || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Refs para controle de intervalos e timeouts
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasCompletedRef = useRef(false)

  // ========================================================================
  // FUNÇÃO: Limpar Intervalos e Timeouts
  // ========================================================================
  const clearAllTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // ========================================================================
  // FUNÇÃO: Callback de sucesso
  // ========================================================================
  const handleSuccess = useCallback((data?: any) => {
    console.log('✅ [Modal] Conexão bem-sucedida!')

    if (onConnectionSuccess) {
      onConnectionSuccess(data || connectionData)
    }
    if (onSuccess) {
      onSuccess()
    }

    // Fechar modal após 2 segundos
    setTimeout(() => {
      onClose()
    }, 2000)
  }, [onConnectionSuccess, onSuccess, onClose, connectionData])

  // ========================================================================
  // FUNÇÃO: Polling - Verificar Status da Conexão
  // ========================================================================
  const checkConnectionStatus = useCallback(async (connId: string) => {
    if (hasCompletedRef.current) return

    try {
      console.log('🔍 [Modal] Verificando status...', connId)

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connId}`,
        { method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Erro ao verificar status')
      }

      const data: ConnectionResponse = await response.json()
      console.log('📊 [Modal] Status:', data.status, '| Conectado:', data.connected)

      setConnectionData(data)

      // Verificar se conectou
      if (data.connected || data.status === 'connected' || data.status === 'open') {
        console.log('✅ [Modal] CONECTADO!')
        hasCompletedRef.current = true
        setIsConnected(true)
        clearAllTimers()
        handleSuccess(data)
      }
    } catch (err) {
      console.error('❌ [Modal] Erro no polling:', err)
    }
  }, [clearAllTimers, handleSuccess])

  // ========================================================================
  // FUNÇÃO: Iniciar Polling
  // ========================================================================
  const startPolling = useCallback((connId: string) => {
    console.log('🔄 [Modal] Iniciando polling...')

    // Primeira verificação imediata
    checkConnectionStatus(connId)

    // Polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      checkConnectionStatus(connId)
    }, POLLING_INTERVAL)

    // Timeout após 2 minutos
    timeoutRef.current = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.log('⏰ [Modal] Timeout!')
        clearAllTimers()
        setError('Tempo limite atingido. O QR code expirou.')
      }
    }, TIMEOUT_DURATION)
  }, [checkConnectionStatus, clearAllTimers])

  // ========================================================================
  // FUNÇÃO: Iniciar Conexão
  // ========================================================================
  const startConnection = useCallback(async (connId: string) => {
    try {
      console.log('🔌 [Modal] Iniciando conexão...', connId)

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao conectar')
      }

      const data: ConnectionResponse = await response.json()
      console.log('✅ [Modal] Resposta:', data.status, 'QR:', !!data.qrCode)

      setConnectionData(data)

      // Se já conectado
      if (data.connected || data.status === 'connected' || data.status === 'open') {
        console.log('✅ [Modal] Já conectado!')
        hasCompletedRef.current = true
        setIsConnected(true)
        handleSuccess(data)
      } else {
        // Iniciar polling
        startPolling(connId)
      }
    } catch (err: any) {
      console.error('❌ [Modal] Erro:', err)
      setError(err.message || 'Erro ao conectar')
    }
  }, [startPolling, handleSuccess])

  // ========================================================================
  // EFEITO: Iniciar quando modal abre
  // ========================================================================
  useEffect(() => {
    if (!isOpen) return

    // Reset states
    setLoading(true)
    setError(null)
    setIsConnected(false)
    hasCompletedRef.current = false

    const init = async () => {
      try {
        let connId = propConnectionId

        // Modo 1: Criar nova conexão
        if (userId && !propConnectionId) {
          console.log('📝 [Modal] Criando conexão...')

          const response = await fetch('/api/whatsapp/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })

          if (!response.ok) {
            throw new Error('Erro ao criar conexão')
          }

          const data = await response.json()
          connId = data.connectionId || data.id

          if (!connId) {
            throw new Error('ID da conexão não retornado')
          }
        }

        if (connId) {
          setConnectionId(connId)
          await startConnection(connId)
        }
      } catch (err: any) {
        console.error('❌ [Modal] Erro:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    init()

    // Cleanup
    return () => {
      clearAllTimers()
    }
  }, [isOpen, userId, propConnectionId, startConnection, clearAllTimers])

  // ========================================================================
  // FUNÇÃO: Fechar Modal
  // ========================================================================
  const handleClose = useCallback(() => {
    clearAllTimers()
    hasCompletedRef.current = false
    onClose()
  }, [clearAllTimers, onClose])

  // ========================================================================
  // FUNÇÃO: Tentar Novamente
  // ========================================================================
  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    hasCompletedRef.current = false

    const connId = propConnectionId || connectionId
    if (connId) {
      startConnection(connId)
    }
  }, [propConnectionId, connectionId, startConnection])

  // ========================================================================
  // RENDER
  // ========================================================================
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {isConnected ? '✅ Conectado!' : 'Conectar WhatsApp'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00FF99] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Gerando QR Code...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-[#00FF99] text-black font-semibold rounded-lg hover:bg-[#00E88C]"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          )}

          {/* Conectado - Sucesso */}
          {isConnected && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-[#00FF99] mb-2">
                Conectado com sucesso!
              </h3>
              {connectionData?.profileName && (
                <p className="text-white mb-2">
                  Olá, <strong>{connectionData.profileName}</strong>!
                </p>
              )}
              <p className="text-gray-400 text-sm">Fechando...</p>
            </div>
          )}

          {/* QR Code */}
          {!loading && !error && !isConnected && connectionData?.qrCode && (
            <div className="text-center">
              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 inline-block mb-4">
                <img
                  src={connectionData.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56"
                />
              </div>

              {/* Instruções */}
              <div className="text-left bg-[#272727] rounded-xl p-4 mb-4">
                <p className="text-white font-medium mb-2">📱 Como conectar:</p>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Abra o WhatsApp no celular</li>
                  <li>Vá em <strong className="text-white">Menu</strong> ou <strong className="text-white">Configurações</strong></li>
                  <li>Toque em <strong className="text-white">Aparelhos conectados</strong></li>
                  <li>Toque em <strong className="text-white">Conectar um aparelho</strong></li>
                  <li>Aponte a câmera para este QR Code</li>
                </ol>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-pulse w-2 h-2 bg-[#00FF99] rounded-full"></div>
                <span>Aguardando leitura do QR Code...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
