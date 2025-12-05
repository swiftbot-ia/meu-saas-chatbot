// app/components/WhatsAppConnectModal.tsx
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

interface SyncProgress {
  currentPhase: 'contacts' | 'messages' | 'completed'
  total: number
  processed: number
}

interface SyncStats {
  contactsTotal: number
  contactsCreated: number
  contactsUpdated: number
  conversationsCreated: number
  messagesProcessed: number
  errors: number
}

type ModalStep = 'connecting' | 'syncing' | 'completed'

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
const SYNC_POLLING_INTERVAL = 3000 // 3 segundos para sync
const TIMEOUT_DURATION = 60000 // 60 segundos (aumentado para dar tempo de escanear)

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
  // Estados de conexão
  const [connectionData, setConnectionData] = useState<ConnectionResponse | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(propConnectionId || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Estados de sincronização
  const [step, setStep] = useState<ModalStep>('connecting')
  const [syncJobId, setSyncJobId] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('pending')

  // Refs para controle de intervalos e timeouts
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncPollingRef = useRef<NodeJS.Timeout | null>(null)
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
    if (syncPollingRef.current) {
      clearInterval(syncPollingRef.current)
      syncPollingRef.current = null
      console.log('🧹 [Modal] Sync polling cancelado')
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      console.log('🧹 [Modal] Timeout cancelado')
    }
  }, [])

  // ========================================================================
  // FUNÇÃO: Callback de sucesso (compatível com ambos os modos)
  // ========================================================================
  const handleSuccess = useCallback((data?: any) => {
    console.log('✅ [Modal] Conexão concluída com sucesso!')

    // Chamar callbacks apropriados
    if (onConnectionSuccess) {
      onConnectionSuccess(data || connectionData)
    }
    if (onSuccess) {
      onSuccess()
    }

    // Fechar modal após delay
    setTimeout(() => {
      onClose()
    }, 2000)
  }, [onConnectionSuccess, onSuccess, onClose, connectionData])

  // ========================================================================
  // FUNÇÃO: Iniciar Sincronização
  // ========================================================================
  const startSync = useCallback(async (connId: string) => {
    try {
      console.log('🔄 [Modal] Iniciando sincronização...', connId)

      const response = await fetch('/api/whatsapp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId })
      })

      const data = await response.json()

      if (data.success && data.jobId) {
        console.log('✅ [Modal] Sync job iniciado:', data.jobId)
        setSyncJobId(data.jobId)
        setSyncStatus('processing')

        // Iniciar polling do status do sync
        const pollSync = async () => {
          try {
            const statusRes = await fetch(`/api/whatsapp/sync?connectionId=${connId}`)
            const statusData = await statusRes.json()

            if (statusData.success && statusData.job) {
              setSyncStatus(statusData.job.status)
              setSyncProgress(statusData.job.progress)
              setSyncStats(statusData.job.stats)

              console.log('📊 [Modal] Sync progress:', statusData.job.progress)

              // Verificar se completou
              if (statusData.job.status === 'completed' || statusData.job.status === 'failed') {
                console.log('✅ [Modal] Sync finalizado:', statusData.job.status)
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current)
                  syncPollingRef.current = null
                }

                setStep('completed')
                handleSuccess(connectionData)
              }
            } else if (!statusData.hasActiveSync) {
              // Job não existe mais (pode ter completado muito rápido)
              console.log('⚠️ [Modal] Nenhum sync ativo, considerando completo')
              if (syncPollingRef.current) {
                clearInterval(syncPollingRef.current)
                syncPollingRef.current = null
              }
              setStep('completed')
              setSyncStatus('completed')
              handleSuccess(connectionData)
            }
          } catch (err) {
            console.error('❌ [Modal] Erro ao verificar sync:', err)
          }
        }

        // Primeira verificação imediata
        await pollSync()

        // Polling a cada 3 segundos
        syncPollingRef.current = setInterval(pollSync, SYNC_POLLING_INTERVAL)
      } else {
        console.error('❌ [Modal] Erro ao iniciar sync:', data.error)
        // Mesmo com erro, prosseguir para completed
        setStep('completed')
        handleSuccess(connectionData)
      }
    } catch (err) {
      console.error('❌ [Modal] Erro ao iniciar sync:', err)
      setStep('completed')
      handleSuccess(connectionData)
    }
  }, [handleSuccess, connectionData])

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

      // Atualizar QR code se disponível
      if (data.qrCode) {
        setConnectionData(prev => ({ ...prev, qrCode: data.qrCode } as ConnectionResponse))
      }

      // Verificar se conectou com sucesso
      if (data.connected || data.status === 'connected' || data.status === 'open') {
        console.log('✅ [Modal-Polling] CONECTADO! Iniciando sincronização...')

        hasCompletedRef.current = true
        setIsConnected(true)
        clearAllTimers()

        // Transicionar para etapa de sync
        setStep('syncing')

        // Aguardar 2 segundos para mostrar sucesso, depois iniciar sync
        setTimeout(() => {
          startSync(connId)
        }, 2000)
      }
    } catch (err) {
      console.error('❌ [Modal-Polling] Erro:', err)
      // Não parar o polling por erro temporário
    }
  }, [clearAllTimers, startSync])

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

    // Configurar timeout
    timeoutRef.current = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.log('⏰ [Modal] TIMEOUT - tempo limite atingido')
        hasCompletedRef.current = true
        setHasTimedOut(true)
        clearAllTimers()
      }
    }, TIMEOUT_DURATION)
  }, [checkConnectionStatus, clearAllTimers])

  // ========================================================================
  // FUNÇÃO: Iniciar Conexão (POST)
  // ========================================================================
  const startConnection = useCallback(async (connId: string) => {
    try {
      console.log('🔌 [Modal] Iniciando conexão WhatsApp...', connId)

      const connectResponse = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: connId
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
      if (connectData.connected || connectData.status === 'connected' || connectData.status === 'open') {
        console.log('✅ [Modal] Já conectado imediatamente! Iniciando sync...')
        hasCompletedRef.current = true
        setIsConnected(true)
        setStep('syncing')

        setTimeout(() => {
          startSync(connId)
        }, 2000)
      } else {
        // Iniciar polling
        console.log('🔄 [Modal] QR Code recebido, iniciando polling...')
        startPolling(connId)
      }

    } catch (err: any) {
      console.error('❌ [Modal] Erro ao conectar:', err)
      setError(err.message || 'Erro ao conectar WhatsApp. Tente novamente.')
    }
  }, [startPolling, startSync])

  // ========================================================================
  // FUNÇÃO: Criar Nova Conexão (quando passa userId)
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

      // Criar registro no Supabase
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

      // Iniciar a conexão
      await startConnection(newConnectionId)

    } catch (err: any) {
      console.error('❌ [Modal] Erro ao criar conexão:', err)
      setError(err.message || 'Erro ao conectar WhatsApp. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [userId, loading, startConnection])

  // ========================================================================
  // FUNÇÃO: Usar Conexão Existente (quando passa connectionId)
  // ========================================================================
  const useExistingConnection = useCallback(async () => {
    if (loading || !propConnectionId) return

    setLoading(true)
    setError(null)
    hasCompletedRef.current = false
    setIsConnected(false)
    setHasTimedOut(false)
    setConnectionId(propConnectionId)

    try {
      console.log('🔌 [Modal] Usando conexão existente:', propConnectionId)
      await startConnection(propConnectionId)
    } catch (err: any) {
      console.error('❌ [Modal] Erro:', err)
      setError(err.message || 'Erro ao conectar WhatsApp. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [propConnectionId, loading, startConnection])

  // ========================================================================
  // EFEITO: Iniciar quando modal abre
  // ========================================================================
  useEffect(() => {
    if (isOpen && !loading && !hasCompletedRef.current) {
      // Modo 1: Criar nova conexão
      if (userId && !propConnectionId) {
        createConnection()
      }
      // Modo 2: Reconectar existente
      else if (propConnectionId) {
        useExistingConnection()
      }
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
        setStep('connecting')
        setSyncJobId(null)
        setSyncProgress(null)
        setSyncStats(null)
        setSyncStatus('pending')
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
  // FUNÇÃO: Tentar Novamente
  // ========================================================================
  const handleRetry = useCallback(() => {
    setError(null)
    setHasTimedOut(false)
    hasCompletedRef.current = false

    if (propConnectionId) {
      useExistingConnection()
    } else if (userId) {
      createConnection()
    }
  }, [propConnectionId, userId, useExistingConnection, createConnection])

  // ========================================================================
  // RENDER: Não mostrar se modal fechado
  // ========================================================================
  if (!isOpen) return null

  // ========================================================================
  // RENDER: Modal
  // ========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {step === 'connecting' && 'Conectar WhatsApp'}
            {step === 'syncing' && 'Sincronizando Dados'}
            {step === 'completed' && 'Conexão Concluída'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading || step === 'syncing'}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00FF99] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Gerando QR Code...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-[#00FF99] text-black font-semibold rounded-lg hover:bg-[#00E88C] transition-colors"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          )}

          {/* Timeout State */}
          {hasTimedOut && !error && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-lg font-bold text-white mb-2">Tempo Limite Atingido</h3>
              <p className="text-gray-400 mb-4">A conexão não foi estabelecida a tempo.</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-[#00FF99] text-black font-semibold rounded-lg hover:bg-[#00E88C] transition-colors"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          )}

          {/* Step: Connecting (QR Code) */}
          {step === 'connecting' && !loading && !error && !hasTimedOut && connectionData?.qrCode && (
            <div className="text-center">
              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 inline-block mb-4">
                <img
                  src={connectionData.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56"
                />
              </div>

              {/* Instructions */}
              <div className="text-left bg-[#272727] rounded-xl p-4 mb-4">
                <p className="text-white font-medium mb-2">📱 Escaneie o QR Code:</p>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Abra o WhatsApp no seu telefone</li>
                  <li>Toque em <strong className="text-white">Configurações</strong></li>
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

          {/* Step: Syncing */}
          {step === 'syncing' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-lg font-bold text-white mb-2">Sincronizando seus dados</h3>
              <p className="text-gray-400 mb-4">
                Estamos importando seus contatos e conversas...
              </p>

              {/* Progress bar */}
              {syncProgress && (
                <div className="mb-4">
                  <div className="w-full bg-[#272727] rounded-full h-3 mb-2">
                    <div
                      className="bg-[#00FF99] h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${syncProgress.total > 0
                          ? Math.round((syncProgress.processed / syncProgress.total) * 100)
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {syncProgress.currentPhase === 'contacts' && '📇 Sincronizando contatos...'}
                    {syncProgress.currentPhase === 'messages' && '💬 Sincronizando mensagens...'}
                    {syncProgress.currentPhase === 'completed' && '✅ Concluído!'}
                    {' '}
                    ({syncProgress.processed}/{syncProgress.total})
                  </p>
                </div>
              )}

              {/* Stats */}
              {syncStats && syncStats.contactsCreated > 0 && (
                <div className="bg-[#272727] rounded-xl p-4 text-sm text-gray-400">
                  <div className="grid grid-cols-2 gap-2">
                    <div>📇 Contatos: {syncStats.contactsCreated}</div>
                    <div>💬 Conversas: {syncStats.conversationsCreated}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Completed */}
          {step === 'completed' && (
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
              <p className="text-gray-400 text-sm">
                Seu WhatsApp está conectado e sincronizado.
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Fechando automaticamente...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
