'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

/**
 * ============================================================================
 * COMPONENTE FINAL: WhatsApp Connect Modal
 * ============================================================================
 *
 * Features:
 * - ✅ Polling automático a cada 5 segundos
 * - ✅ Timeout de 30 segundos com countdown visual
 * - ✅ Sincronização UAZAPI → Supabase
 * - ✅ Auto-close ao conectar ou timeout
 * - ✅ Cleanup completo de timers
 * - ✅ TypeScript com tipos completos
 */

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionResponse {
  status: 'connected' | 'connecting' | 'disconnected' | 'pending_qr' | 'open'
  qrCode: string | null
  instanceToken: string
  connectionId: string
  profileName?: string | null
  profilePicUrl?: string | null
  owner?: string | null
  connected: boolean
  message?: string
  success: boolean
  error?: string
}

interface ConnectModalProps {
  connectionId: string
  initialQrCode?: string | null
  initialToken?: string | null
  onClose: () => void
  onSuccess: (data: ConnectionResponse) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

const ConnectModal: React.FC<ConnectModalProps> = ({
  connectionId,
  initialQrCode = null,
  initialToken = null,
  onClose,
  onSuccess
}) => {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [instanceData, setInstanceData] = useState<Partial<ConnectionResponse> | null>(null)

  // ==========================================================================
  // REFS
  // ==========================================================================
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // ==========================================================================
  // CLEANUP DE TIMERS
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
  // VERIFICAR STATUS (Polling)
  // ==========================================================================
  const checkStatus = useCallback(async () => {
    try {
      console.log('🔍 [Polling] Verificando status...')

      const response = await fetch(
        `/api/whatsapp/connect?connectionId=${connectionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        console.warn('⚠️ Erro ao verificar status')
        return
      }

      const data: ConnectionResponse = await response.json()

      console.log('📊 [Polling] Status recebido:', {
        status: data.status,
        connected: data.connected
      })

      // Atualizar estado
      setCurrentStatus(data.status)
      setInstanceData(data)

      // Se tem QR Code novo, atualizar
      if (data.qrCode && data.qrCode !== qrCode) {
        setQrCode(data.qrCode)
      }

      // ======================================================================
      // 🔴 CRÍTICO: FECHAR MODAL SE CONECTADO
      // ======================================================================
      if (data.connected || data.status === 'open' || data.status === 'connected') {
        console.log('✅ WhatsApp CONECTADO! Status:', data.status)

        // Limpar timers
        cleanupTimers()

        // Chamar callback de sucesso
        if (onSuccess) {
          onSuccess(data)
        }

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
      // Fechar se desconectado/fechado
      else if (data.status === 'disconnected' || data.status === 'close') {
        console.log('❌ Conexão desconectada')
        cleanupTimers()
        setError('Conexão foi encerrada. Tente novamente.')
      }

    } catch (err) {
      console.error('❌ Erro ao verificar status:', err)
    }
  }, [connectionId, qrCode, onSuccess, onClose, cleanupTimers])

  // ==========================================================================
  // INICIAR POLLING (5 segundos)
  // ==========================================================================
  const startPolling = useCallback(() => {
    console.log('⏰ Iniciando polling de 5 segundos')

    // Limpar polling anterior
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Verificar imediatamente
    checkStatus()

    // Depois verificar a cada 5 segundos
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 [Polling] Tick...')
      checkStatus()
    }, 5000) // 5 segundos
  }, [checkStatus])

  // ==========================================================================
  // INICIAR TIMEOUT (30 segundos)
  // ==========================================================================
  const startTimeout = useCallback(() => {
    console.log('⏰ Iniciando timeout de 30 segundos')

    // Reset
    setTimeLeft(30)
    startTimeRef.current = Date.now()

    // Limpar timers anteriores
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current)
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    // Countdown visual (atualizar a cada 1 segundo)
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(0, 30 - elapsed)

      setTimeLeft(remaining)

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
      }
    }, 1000)

    // Timeout principal (30 segundos)
    timeoutTimerRef.current = setTimeout(() => {
      console.log('⏱️ Timeout de 30s atingido')

      const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      console.log(`⏱️ Tempo decorrido: ${elapsedTime}s`)

      // Limpar timers
      cleanupTimers()

      // Se ainda não conectou, mostrar erro e fechar
      if (currentStatus !== 'open' && currentStatus !== 'connected') {
        console.log('❌ Conexão não estabelecida após 30s')
        setError('Tempo limite de 30 segundos atingido. Tente novamente.')

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    }, 30000) // 30 segundos
  }, [currentStatus, onClose, cleanupTimers])

  // ==========================================================================
  // INICIAR CONEXÃO (quando modal abre)
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

      const data: ConnectionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      console.log('✅ Resposta da API:', data)

      // Atualizar estado
      setInstanceData(data)
      setCurrentStatus(data.status)
      setQrCode(data.qrCode || null)

      // Se já está conectado, não precisa polling
      if (data.connected || data.status === 'open' || data.status === 'connected') {
        console.log('✅ Já está conectado!')
        if (onSuccess) {
          onSuccess(data)
        }
        setTimeout(() => onClose(), 2000)
        return
      }

      // Se tem QR Code, iniciar polling + timeout
      if (data.qrCode || data.status === 'pending_qr' || data.status === 'connecting') {
        console.log('📱 Iniciando polling e timeout')
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
  // LIFECYCLE
  // ==========================================================================
  useEffect(() => {
    console.log('🚀 Modal aberto, iniciando conexão...')
    handleConnect()

    // Cleanup ao desmontar
    return () => {
      console.log('🧹 Modal desmontado, limpando recursos')
      cleanupTimers()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const isConnected = currentStatus === 'open' || currentStatus === 'connected'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
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
        {isConnected && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Conectado com sucesso!
            </h3>
            {instanceData?.profileName && (
              <p className="text-gray-700 font-medium">
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
        {qrCode && !isConnected && !loading && (
          <div className="text-center">
            {/* QR Code Image */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="mx-auto w-full max-w-[256px] h-auto object-contain"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p className="font-semibold text-base text-gray-800">
                📱 Escaneie o QR Code com seu WhatsApp:
              </p>
              <ol className="text-left list-decimal list-inside space-y-1 pl-2 text-xs md:text-sm">
                <li>Abra o WhatsApp no seu telefone</li>
                <li>Toque em <strong>Configurações</strong></li>
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
                  ⏰ Verificando conexão a cada 5 segundos
                </p>
              </div>

              {/* Timeout Countdown */}
              <div className={`p-3 rounded-lg ${timeLeft <= 10 ? 'bg-red-50' : 'bg-orange-50'}`}>
                <p className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-700' : 'text-orange-700'}`}>
                  ⏱️ Tempo restante: {timeLeft}s
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
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
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
            >
              🔄 Verificar Status Agora
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* WAITING STATE (sem QR Code ainda) */}
        {/* ================================================================ */}
        {!loading && !qrCode && !isConnected && (
          <div className="text-center py-8">
            <div className="animate-pulse text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Preparando conexão...</p>
            <p className="text-sm text-gray-500 mt-2">
              Status: {currentStatus}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default ConnectModal
