'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * ============================================================================
 * COMPONENTE: WhatsApp Connect Modal (TypeScript)
 * ============================================================================
 *
 * Features Implementadas:
 * - ✅ Polling automático a cada 5 segundos
 * - ✅ Timeout de 30 segundos com auto-close
 * - ✅ Cleanup de timers em todos os cenários
 * - ✅ TypeScript com tipos completos
 * - ✅ Estados de UI: loading, error, qrcode, connected
 * - ✅ Callback de sucesso com dados da instância
 *
 * @author Claude Code
 * @version 2.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ConnectModalProps {
  /** Se o modal está visível */
  isOpen: boolean
  /** Callback ao fechar modal */
  onClose: () => void
  /** ID da conexão no Supabase */
  connectionId: string
  /** QR Code inicial (opcional - será obtido via API se null) */
  initialQrCode?: string | null
  /** Token inicial (opcional - será obtido via API se null) */
  initialToken?: string | null
  /** Callback ao conectar com sucesso */
  onSuccess?: (data: InstanceData) => void
}

interface InstanceData {
  instanceName?: string
  profileName?: string | null
  profilePicUrl?: string | null
  owner?: string | null
  status: string
  connected: boolean
}

interface APIResponse {
  success: boolean
  status: string
  connected: boolean
  qrCode?: string
  instanceName?: string
  instanceToken?: string
  profileName?: string | null
  profilePicUrl?: string | null
  owner?: string | null
  message?: string
  error?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  connectionId,
  initialQrCode = null,
  initialToken = null,
  onSuccess
}: ConnectModalProps) {
  // ==========================================================================
  // 1. STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode)
  const [status, setStatus] = useState<string>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(30)

  // ==========================================================================
  // 2. REFS (para timers)
  // ==========================================================================
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const qrCodeTimestampRef = useRef<number>(Date.now())

  // ==========================================================================
  // 3. CLEANUP DE TIMERS
  // ==========================================================================
  const cleanupTimers = useCallback(() => {
    console.log('🧹 Limpando todos os timers')

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current)
      timeoutTimerRef.current = null
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  // ==========================================================================
  // 4. VERIFICAR STATUS (usado no polling)
  // ==========================================================================
  const checkStatus = useCallback(async () => {
    try {
      console.log('🔍 [Polling] Verificando status da conexão...')

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connectionId}`,
        { method: 'GET' }
      )

      const data: APIResponse = await response.json()

      if (!response.ok) {
        console.warn('⚠️ Erro ao verificar status:', data.error)
        return
      }

      console.log('📊 [Polling] Status atual:', data.status, '| Conectado:', data.connected)

      setStatus(data.status)
      setInstanceData({
        instanceName: data.instanceName,
        profileName: data.profileName,
        profilePicUrl: data.profilePicUrl,
        owner: data.owner,
        status: data.status,
        connected: data.connected
      })

      // ======================================================================
      // 5. FECHAR MODAL se conectado
      // ======================================================================
      if (data.connected || data.status === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!')
        cleanupTimers()

        // Callback com dados da instância
        if (onSuccess) {
          onSuccess({
            instanceName: data.instanceName,
            profileName: data.profileName,
            profilePicUrl: data.profilePicUrl,
            owner: data.owner,
            status: data.status,
            connected: data.connected
          })
        }

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
      // Fechar se desconectado/fechado
      else if (data.status === 'disconnected' || data.status === 'close') {
        console.log('❌ Conexão fechada/desconectada')
        cleanupTimers()
        setError('Conexão foi encerrada. Tente novamente.')
      }

    } catch (err) {
      console.error('❌ Erro ao verificar status:', err)
    }
  }, [connectionId, onSuccess, onClose, cleanupTimers])

  // ==========================================================================
  // 6. INICIAR POLLING (5 segundos)
  // ==========================================================================
  const startPolling = useCallback(() => {
    console.log('⏰ Iniciando polling de 5 segundos')

    // Limpar polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // ✅ Verificar status a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [Polling] Tick...')
      checkStatus()
    }, 5000) // 5 segundos

  }, [checkStatus])

  // ==========================================================================
  // 7. INICIAR TIMEOUT (30 segundos)
  // ==========================================================================
  const startTimeout = useCallback(() => {
    console.log('⏰ Iniciando timeout de 30 segundos')

    // Reset contador
    setTimeLeft(30)
    qrCodeTimestampRef.current = Date.now()

    // Limpar timeout anterior se existir
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current)
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    // ✅ Countdown visual (atualizar a cada 1 segundo)
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
        }
        return Math.max(0, newTime)
      })
    }, 1000)

    // ✅ Timeout principal (30 segundos)
    timeoutTimerRef.current = setTimeout(() => {
      console.log('⏱️ Timeout de 30s atingido')

      const elapsedTime = Math.floor((Date.now() - qrCodeTimestampRef.current) / 1000)
      console.log(`⏱️ Tempo decorrido: ${elapsedTime}s`)

      // Parar polling
      cleanupTimers()

      // Se ainda não conectou, mostrar mensagem e fechar
      if (status !== 'open') {
        console.log('❌ Conexão não estabelecida após 30s')
        setError('Tempo limite de 30 segundos atingido. Tente novamente.')

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    }, 30000) // 30 segundos

  }, [status, onClose, cleanupTimers])

  // ==========================================================================
  // 8. INICIAR CONEXÃO (quando modal abre)
  // ==========================================================================
  const handleConnect = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔌 Iniciando conexão WhatsApp...')

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      const data: APIResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      console.log('✅ Resposta da API:', data)

      // Salvar dados da instância
      setInstanceData({
        instanceName: data.instanceName,
        profileName: data.profileName,
        profilePicUrl: data.profilePicUrl,
        owner: data.owner,
        status: data.status,
        connected: data.connected
      })
      setStatus(data.status)
      setQrCode(data.qrCode || null)

      // Se já está conectado, não precisa de QR Code
      if (data.connected || data.status === 'open') {
        console.log('✅ Instância já conectada!')
        if (onSuccess) {
          onSuccess({
            instanceName: data.instanceName,
            profileName: data.profileName,
            profilePicUrl: data.profilePicUrl,
            owner: data.owner,
            status: data.status,
            connected: data.connected
          })
        }
        setTimeout(() => onClose(), 2000)
        return
      }

      // Se tem QR Code, iniciar polling + timeout
      if (data.qrCode) {
        console.log('📱 QR Code recebido, iniciando polling e timeout')
        startPolling()
        startTimeout()
      }

    } catch (err) {
      console.error('❌ Erro ao conectar:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [connectionId, onSuccess, onClose, startPolling, startTimeout])

  // ==========================================================================
  // 9. LIFECYCLE: Iniciar quando modal abre
  // ==========================================================================
  useEffect(() => {
    if (isOpen && connectionId) {
      console.log('🚀 Modal aberto, iniciando conexão...')
      handleConnect()
    }

    // Cleanup: parar todos os timers quando modal fecha ou unmount
    return () => {
      console.log('🧹 Modal fechado/desmontado, limpando recursos')
      cleanupTimers()
    }
  }, [isOpen, connectionId, handleConnect, cleanupTimers])

  // ==========================================================================
  // 10. RENDER
  // ==========================================================================

  // Não renderizar se modal não estiver aberto
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Conectar WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ================================================================ */}
        {/* LOADING STATE */}
        {/* ================================================================ */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Gerando QR Code...</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* ERROR STATE */}
        {/* ================================================================ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* CONNECTED STATE */}
        {/* ================================================================ */}
        {status === 'open' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Conectado com sucesso!
            </h3>
            {instanceData?.profileName && (
              <p className="text-gray-600">
                Bem-vindo, <strong>{instanceData.profileName}</strong>
              </p>
            )}
            {instanceData?.owner && (
              <p className="text-sm text-gray-500 mt-1">
                {instanceData.owner}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Fechando automaticamente...
            </p>
          </div>
        )}

        {/* ================================================================ */}
        {/* QR CODE STATE */}
        {/* ================================================================ */}
        {qrCode && status !== 'open' && (
          <div className="text-center">
            {/* QR Code Image */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="mx-auto w-64 h-64 object-contain"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p className="font-medium text-base">📱 Escaneie o QR Code com seu WhatsApp:</p>
              <ol className="text-left list-decimal list-inside space-y-1 pl-4">
                <li>Abra o WhatsApp no seu telefone</li>
                <li>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
                <li>Toque em <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Aponte seu telefone para esta tela</li>
              </ol>
            </div>

            {/* Status Info */}
            <div className="space-y-2">
              {/* Polling Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium">
                  ⏰ Verificando conexão automaticamente a cada 5 segundos
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  O modal fechará automaticamente quando conectado
                </p>
              </div>

              {/* Timeout Countdown */}
              <div className={`p-3 rounded-lg ${timeLeft <= 10 ? 'bg-red-50' : 'bg-orange-50'}`}>
                <p className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-700' : 'text-orange-700'}`}>
                  ⏱️ Tempo restante: {timeLeft} segundos
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      timeLeft <= 10 ? 'bg-red-600' : 'bg-orange-500'
                    }`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Manual Check Button */}
            <button
              onClick={checkStatus}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              🔄 Verificar Status Agora
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* CONNECTING STATE (sem QR Code ainda) */}
        {/* ================================================================ */}
        {!loading && !qrCode && status === 'connecting' && (
          <div className="text-center py-8">
            <div className="animate-pulse text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Aguardando QR Code...</p>
            <p className="text-sm text-gray-500 mt-2">
              Isso pode levar alguns segundos
            </p>
          </div>
        )}

        {/* ================================================================ */}
        {/* DISCONNECTED STATE (fallback) */}
        {/* ================================================================ */}
        {!loading && !qrCode && status === 'disconnected' && !error && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <p className="text-gray-600">Preparando conexão...</p>
          </div>
        )}

      </div>
    </div>
  )
}
