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

interface SyncJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: SyncProgress
  stats: SyncStats
}

type ModalStep = 'connecting' | 'syncing' | 'completed'

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
const SYNC_POLLING_INTERVAL = 3000 // 3 segundos para sync
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
  // Estados de conexão
  const [connectionData, setConnectionData] = useState<ConnectionResponse | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(null)
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

                // Fechar modal após 3 segundos
                setTimeout(() => {
                  onSuccess()
                  onClose()
                }, 3000)
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

              setTimeout(() => {
                onSuccess()
                onClose()
              }, 3000)
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
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      }
    } catch (err) {
      console.error('❌ [Modal] Erro ao iniciar sync:', err)
      setStep('completed')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 3000)
    }
  }, [onSuccess, onClose])

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
        console.log('✅ [Modal] Já conectado imediatamente! Iniciando sync...')
        hasCompletedRef.current = true
        setIsConnected(true)
        setStep('syncing')

        setTimeout(() => {
          startSync(newConnectionId)
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
  // RENDERIZAÇÃO
  // ========================================================================
  if (!isOpen) return null

  // Calcular progresso percentual
  const progressPercent = syncProgress && syncProgress.total > 0
    ? Math.round((syncProgress.processed / syncProgress.total) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 'connecting' && 'Conectar WhatsApp'}
            {step === 'syncing' && 'Sincronizando Dados'}
            {step === 'completed' && 'Sincronização Completa'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            disabled={loading || step === 'syncing'}
          >
            ×
          </button>
        </div>

        {/* ============================================================ */}
        {/* STEP: CONNECTING */}
        {/* ============================================================ */}
        {step === 'connecting' && (
          <>
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
              {!loading && !isConnected && !error && !hasTimedOut && connectionData?.message}
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
          </>
        )}

        {/* ============================================================ */}
        {/* STEP: SYNCING */}
        {/* ============================================================ */}
        {step === 'syncing' && (
          <>
            {/* Icon de Sync */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#00FF99]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
              </div>
            </div>

            {/* Mensagem Principal */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Preparando seu assistente de IA
              </h3>
              <p className="text-sm text-gray-600">
                Estamos sincronizando seus contatos e mensagens para que a SwiftBot AI possa oferecer a melhor experiência.
              </p>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {syncProgress?.currentPhase === 'contacts' && '👥 Sincronizando contatos...'}
                  {syncProgress?.currentPhase === 'messages' && '💬 Sincronizando mensagens...'}
                  {!syncProgress?.currentPhase && '🔄 Iniciando...'}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-[#00FF99] to-[#00CC7A] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Estatísticas */}
            {syncStats && (
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{syncStats.contactsTotal || 0}</p>
                  <p className="text-xs text-gray-500">Contatos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{syncStats.conversationsCreated || 0}</p>
                  <p className="text-xs text-gray-500">Conversas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{syncStats.messagesProcessed || 0}</p>
                  <p className="text-xs text-gray-500">Mensagens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00FF99]">
                    {syncProgress?.processed || 0}/{syncProgress?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">Progresso</p>
                </div>
              </div>
            )}

            {/* Aviso */}
            <p className="text-center text-xs text-gray-400 mt-4">
              Por favor, não feche esta janela durante a sincronização.
            </p>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP: COMPLETED */}
        {/* ============================================================ */}
        {step === 'completed' && (
          <>
            {/* Icon de Sucesso */}
            <div className="flex justify-center mb-6">
              <div className="bg-[#00FF99] rounded-full p-4">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Mensagem de Sucesso */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🎉 Tudo Pronto!
              </h3>
              <p className="text-gray-600">
                Seu WhatsApp foi conectado e seus dados foram sincronizados com sucesso.
              </p>
            </div>

            {/* Estatísticas Finais */}
            {syncStats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-green-600">{syncStats.contactsTotal || 0}</p>
                    <p className="text-xs text-gray-600">Contatos</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{syncStats.conversationsCreated || 0}</p>
                    <p className="text-xs text-gray-600">Conversas</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{syncStats.messagesProcessed || 0}</p>
                    <p className="text-xs text-gray-600">Mensagens</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fechando automaticamente */}
            <p className="text-center text-sm text-gray-500">
              Fechando automaticamente...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
