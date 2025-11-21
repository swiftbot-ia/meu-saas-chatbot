// app/components/WhatsAppConnectModal.tsx
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TIPOS
// ============================================================================
interface ConnectionResponse {
  success: boolean
  status: 'connected' | 'connecting' | 'disconnected' | 'pending_qr'
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

interface WhatsAppConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

// ============================================================================
// CONSTANTES
// ============================================================================
const POLLING_INTERVAL = 5000 // 5 segundos
const TIMEOUT_DURATION = 30000 // 30 segundos

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  onSuccess,
  userId
}: WhatsAppConnectModalProps) {
  // Estados
  const [connectionData, setConnectionData] = useState<ConnectionResponse | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)

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
      console.log('🧹 [Modal] Polling cancelado')
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      console.log('🧹 [Modal] Timeout cancelado')
    }
  }, [])

  // ========================================================================
  // FUNÇÃO: Polling - Verificar Status da Conexão
  // ========================================================================
  const checkConnectionStatus = useCallback(async (connId: string) => {
    if (hasCompletedRef.current) {
      return
    }

    try {
      console.log('🔍 [Modal-Polling] Verificando status...', connId)

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao verificar status')
      }

      const data: ConnectionResponse = await response.json()
      console.log('📥 [Modal-Polling] Resposta:', {
        status: data.status,
        connected: data.connected,
        hasProfile: !!data.profileName
      })

      setConnectionData(data)

      // Verificar se conectou com sucesso
      if (data.connected && data.status === 'connected') {
        console.log('✅ [Modal-Polling] CONECTADO! Fechando modal...')

        hasCompletedRef.current = true
        setIsConnected(true)
        clearAllTimers()

        // Aguardar 2 segundos para mostrar sucesso
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('❌ [Modal-Polling] Erro:', err)
      // Não parar o polling por erro temporário
    }
  }, [onSuccess, onClose, clearAllTimers])

  // ========================================================================
  // FUNÇÃO: Iniciar Polling
  // ========================================================================
  const startPolling = useCallback((connId: string) => {
    console.log('🔄 [Modal] Iniciando polling a cada 5 segundos')

    // Primeira verificação imediata
    checkConnectionStatus(connId)

    // Configurar polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      checkConnectionStatus(connId)
    }, POLLING_INTERVAL)

    // Configurar timeout de 30 segundos
    timeoutRef.current = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.log('⏰ [Modal] TIMEOUT - 30 segundos sem conexão')

        hasCompletedRef.current = true
        setHasTimedOut(true)
        clearAllTimers()

        // Fechar modal após 3 segundos
        setTimeout(() => {
          onClose()
        }, 3000)
      }
    }, TIMEOUT_DURATION)
  }, [checkConnectionStatus, clearAllTimers, onClose])

  // ========================================================================
  // FUNÇÃO: Criar Conexão Inicial
  // ========================================================================
  const createConnection = useCallback(async () => {
    if (loading || !userId) return

    setLoading(true)
    setError(null)
    hasCompletedRef.current = false
    setIsConnected(false)
    setHasTimedOut(false)

    try {
      console.log('📝 [Modal] Criando conexão para userId:', userId)

      // Primeiro, criar registro no Supabase (se não existir)
      const createResponse = await fetch('/api/whatsapp/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          instanceName: `swiftbot_${userId.replace(/-/g, '_')}`
        })
      })

      if (!createResponse.ok) {
        throw new Error('Erro ao criar registro da conexão')
      }

      const createData = await createResponse.json()
      const newConnectionId = createData.connectionId || createData.id

      if (!newConnectionId) {
        throw new Error('ID da conexão não foi retornado')
      }

      console.log('✅ [Modal] Conexão criada:', newConnectionId)
      setConnectionId(newConnectionId)

      // Agora, iniciar a conexão na UAZAPI
      console.log('🔌 [Modal] Iniciando conexão WhatsApp...')

      const connectResponse = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: newConnectionId
        })
      })

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json()
        throw new Error(errorData.error || 'Erro ao conectar WhatsApp')
      }

      const connectData: ConnectionResponse = await connectResponse.json()
      console.log('✅ [Modal] Resposta da conexão:', {
        status: connectData.status,
        connected: connectData.connected,
        hasQR: !!connectData.qrCode
      })

      setConnectionData(connectData)

      // Se já veio conectado
      if (connectData.connected) {
        console.log('✅ [Modal] Já conectado imediatamente!')
        hasCompletedRef.current = true
        setIsConnected(true)

        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        // Iniciar polling
        console.log('🔄 [Modal] Iniciando polling...')
        startPolling(newConnectionId)
      }

    } catch (err: any) {
      console.error('❌ [Modal] Erro ao criar conexão:', err)
      setError(err.message || 'Erro ao conectar WhatsApp. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [userId, loading, startPolling, onSuccess, onClose])

  // ========================================================================
  // EFEITO: Criar Conexão Quando Modal Abre
  // ========================================================================
  useEffect(() => {
    if (isOpen && !connectionId && !loading) {
      createConnection()
    }

    // Cleanup ao fechar modal
    return () => {
      if (!isOpen) {
        clearAllTimers()
        hasCompletedRef.current = false
        setConnectionId(null)
        setConnectionData(null)
        setError(null)
        setIsConnected(false)
        setHasTimedOut(false)
      }
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // FUNÇÃO: Fechar Modal
  // ========================================================================
  const handleClose = useCallback(() => {
    clearAllTimers()
    hasCompletedRef.current = false
    onClose()
  }, [clearAllTimers, onClose])

  // ========================================================================
  // RENDERIZAÇÃO
  // ========================================================================
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Conectar WhatsApp
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {loading && (
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          )}
          {!loading && !error && !isConnected && !hasTimedOut && (
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          )}
          {isConnected && (
            <div className="text-green-500 text-6xl">✓</div>
          )}
          {error && (
            <div className="text-red-500 text-6xl">✗</div>
          )}
          {hasTimedOut && (
            <div className="text-orange-500 text-6xl">⏰</div>
          )}
        </div>

        {/* QR Code */}
        {connectionData?.qrCode && !isConnected && !hasTimedOut && !error && (
          <div className="flex justify-center mb-4">
            <img
              src={connectionData.qrCode}
              alt="QR Code WhatsApp"
              className="w-64 h-64 border-4 border-gray-300 rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Mensagem de Status */}
        <p className="text-center text-gray-700 mb-4 font-medium">
          {loading && 'Iniciando conexão...'}
          {!loading && connectionData?.message}
          {isConnected && 'WhatsApp conectado com sucesso!'}
          {error && error}
          {hasTimedOut && 'Tempo esgotado. Por favor, tente novamente.'}
        </p>

        {/* Informações do Perfil (quando conectado) */}
        {isConnected && connectionData?.profileName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              {connectionData.profilePicUrl && (
                <img
                  src={connectionData.profilePicUrl}
                  alt="Foto de perfil"
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-semibold text-gray-800">
                  {connectionData.profileName}
                </p>
                {connectionData.phoneNumber && (
                  <p className="text-sm text-gray-600">
                    {connectionData.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        {!loading && !error && !isConnected && !hasTimedOut && connectionData?.qrCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 font-semibold mb-2">
              Como conectar:
            </p>
            <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
              <li>Toque em <strong>Aparelhos conectados</strong></li>
              <li>Toque em <strong>Conectar um aparelho</strong></li>
              <li>Aponte seu celular para esta tela para ler o QR Code</li>
            </ol>
          </div>
        )}

        {/* Botão de Fechar (erro ou timeout) */}
        {(error || hasTimedOut) && (
          <button
            onClick={handleClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Fechar
          </button>
        )}

        {/* Indicador de Polling */}
        {!loading && !error && !isConnected && !hasTimedOut && (
          <div className="text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Aguardando leitura do QR Code...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
