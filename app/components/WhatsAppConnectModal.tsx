// app/components/WhatsAppConnectModal.tsx
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TIPOS
// ============================================================================
interface WhatsAppConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'timeout'
  message: string
  qrCode?: string
  profileName?: string
  profilePicUrl?: string
  phoneNumber?: string
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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    message: 'Iniciando conexão...'
  })
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
  // FUNÇÃO: Polling - Verificar Status da Conexão
  // ========================================================================
  const checkConnectionStatus = useCallback(async (connId: string) => {
    if (hasCompletedRef.current) {
      return
    }

    try {
      console.log('🔍 [Polling] Verificando status da conexão:', connId)

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
        throw new Error('Erro ao verificar status da conexão')
      }

      const data = await response.json()
      console.log('📥 [Polling] Resposta recebida:', data)

      // Verificar se conectou com sucesso
      if (data.connected && data.status === 'connected') {
        console.log('✅ [Polling] Conexão estabelecida com sucesso!')

        hasCompletedRef.current = true
        clearAllTimers()

        setConnectionStatus({
          status: 'connected',
          message: 'WhatsApp conectado com sucesso!',
          profileName: data.profileName,
          profilePicUrl: data.profilePicUrl,
          phoneNumber: data.phoneNumber
        })

        // Aguardar 2 segundos para mostrar sucesso antes de fechar
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        // Ainda aguardando conexão
        setConnectionStatus({
          status: 'connecting',
          message: data.message || 'Aguardando leitura do QR Code...'
        })
      }
    } catch (error) {
      console.error('❌ [Polling] Erro ao verificar status:', error)
      // Não parar o polling por erro temporário
    }
  }, [onSuccess, onClose, clearAllTimers])

  // ========================================================================
  // FUNÇÃO: Iniciar Polling
  // ========================================================================
  const startPolling = useCallback((connId: string) => {
    console.log('🔄 [Polling] Iniciando polling a cada 5 segundos')

    // Primeira verificação imediata
    checkConnectionStatus(connId)

    // Configurar polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      checkConnectionStatus(connId)
    }, POLLING_INTERVAL)

    // Configurar timeout de 30 segundos
    timeoutRef.current = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.log('⏰ [Timeout] 30 segundos sem conexão')

        hasCompletedRef.current = true
        clearAllTimers()

        setConnectionStatus({
          status: 'timeout',
          message: 'Tempo esgotado. Por favor, tente novamente.'
        })

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
    hasCompletedRef.current = false

    try {
      console.log('📝 [Create] Criando conexão WhatsApp para userId:', userId)

      // Primeiro, criar registro no Supabase
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

      console.log('✅ [Create] Conexão criada:', newConnectionId)
      setConnectionId(newConnectionId)

      // Agora, iniciar a conexão na UAZAPI
      setConnectionStatus({
        status: 'connecting',
        message: 'Conectando com WhatsApp...'
      })

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

      const connectData = await connectResponse.json()
      console.log('✅ [Connect] Resposta da conexão:', connectData)

      // Se já veio conectado
      if (connectData.connected) {
        hasCompletedRef.current = true

        setConnectionStatus({
          status: 'connected',
          message: 'WhatsApp já está conectado!',
          profileName: connectData.profileName,
          profilePicUrl: connectData.profilePicUrl,
          phoneNumber: connectData.phoneNumber
        })

        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        // Se tem QR Code, mostrar
        if (connectData.qrCode) {
          setConnectionStatus({
            status: 'connecting',
            message: 'Leia o QR Code com seu WhatsApp',
            qrCode: connectData.qrCode
          })
        }

        // Iniciar polling
        startPolling(newConnectionId)
      }

    } catch (error: any) {
      console.error('❌ [Create] Erro ao criar conexão:', error)

      setConnectionStatus({
        status: 'error',
        message: error.message || 'Erro ao conectar WhatsApp. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }, [userId, loading, startPolling, onSuccess, onClose])

  // ========================================================================
  // EFEITO: Criar Conexão Quando Modal Abre
  // ========================================================================
  useEffect(() => {
    if (isOpen && !connectionId) {
      createConnection()
    }

    // Cleanup ao fechar modal
    return () => {
      if (!isOpen) {
        clearAllTimers()
        hasCompletedRef.current = false
        setConnectionId(null)
        setConnectionStatus({
          status: 'connecting',
          message: 'Iniciando conexão...'
        })
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Conectar WhatsApp
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {connectionStatus.status === 'connecting' && (
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          )}
          {connectionStatus.status === 'connected' && (
            <div className="text-green-500 text-6xl">✓</div>
          )}
          {connectionStatus.status === 'error' && (
            <div className="text-red-500 text-6xl">✗</div>
          )}
          {connectionStatus.status === 'timeout' && (
            <div className="text-orange-500 text-6xl">⏰</div>
          )}
        </div>

        {/* QR Code */}
        {connectionStatus.qrCode && connectionStatus.status === 'connecting' && (
          <div className="flex justify-center mb-4">
            <img
              src={connectionStatus.qrCode}
              alt="QR Code WhatsApp"
              className="w-64 h-64 border-4 border-gray-300 rounded-lg"
            />
          </div>
        )}

        {/* Mensagem de Status */}
        <p className="text-center text-gray-700 mb-4">
          {connectionStatus.message}
        </p>

        {/* Informações do Perfil (quando conectado) */}
        {connectionStatus.status === 'connected' && connectionStatus.profileName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              {connectionStatus.profilePicUrl && (
                <img
                  src={connectionStatus.profilePicUrl}
                  alt="Foto de perfil"
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-semibold text-gray-800">
                  {connectionStatus.profileName}
                </p>
                {connectionStatus.phoneNumber && (
                  <p className="text-sm text-gray-600">
                    {connectionStatus.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        {connectionStatus.status === 'connecting' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Como conectar:</strong>
            </p>
            <ol className="text-sm text-gray-700 list-decimal list-inside mt-2">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
              <li>Toque em <strong>Aparelhos conectados</strong></li>
              <li>Toque em <strong>Conectar um aparelho</strong></li>
              <li>Aponte seu celular para esta tela para ler o QR Code</li>
            </ol>
          </div>
        )}

        {/* Botão de Fechar (erro ou timeout) */}
        {(connectionStatus.status === 'error' || connectionStatus.status === 'timeout') && (
          <button
            onClick={handleClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Fechar
          </button>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center text-sm text-gray-500">
            Carregando...
          </div>
        )}
      </div>
    </div>
  )
}
