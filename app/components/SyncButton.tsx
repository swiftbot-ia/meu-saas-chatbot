// app/components/SyncButton.tsx
// Botão de sincronização - aparece apenas uma vez após conexão
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface SyncButtonProps {
    connectionId: string
    isConnected: boolean
    onSyncComplete?: () => void
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

type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'

export default function SyncButton({
    connectionId,
    isConnected,
    onSyncComplete
}: SyncButtonProps) {
    const [status, setStatus] = useState<SyncStatus>('idle')
    const [progress, setProgress] = useState<SyncProgress | null>(null)
    const [stats, setStats] = useState<SyncStats | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [hasSynced, setHasSynced] = useState(false)

    // Verificar se há sync em andamento
    useEffect(() => {
        const checkSyncStatus = async () => {
            try {
                const response = await fetch(`/api/whatsapp/sync?connectionId=${connectionId}`)
                const data = await response.json()

                console.log('🔍 [SyncButton] Status check:', data)

                // Se tem sync ativo, mostrar progresso
                if (data.hasActiveSync && data.job) {
                    setStatus('syncing')
                    setProgress(data.job.progress)
                    setStats(data.job.stats)
                }
                // REMOVIDO: não esconder mais se já fez sync
            } catch (err) {
                console.error('Erro ao verificar status de sync:', err)
            }
        }

        if (connectionId && isConnected) {
            checkSyncStatus()
        }
    }, [connectionId, isConnected])

    // Iniciar sincronização
    const handleSync = useCallback(async () => {
        if (status === 'syncing' || hasSynced) return

        setStatus('syncing')
        setError(null)
        setProgress(null)
        setStats(null)

        try {
            console.log('🔄 [Sync] Iniciando sincronização...', connectionId)

            // Iniciar o job de sync
            const response = await fetch('/api/whatsapp/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao iniciar sincronização')
            }

            console.log('✅ [Sync] Job iniciado:', data.jobId)

            // Polling do progresso
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/whatsapp/sync?connectionId=${connectionId}`)
                    const statusData = await statusRes.json()

                    if (statusData.success && statusData.job) {
                        setProgress(statusData.job.progress)
                        setStats(statusData.job.stats)

                        console.log('📊 [Sync] Progresso:', statusData.job.progress)

                        if (statusData.job.status === 'completed') {
                            clearInterval(pollInterval)
                            setStatus('completed')
                            setHasSynced(true)
                            onSyncComplete?.()
                            console.log('✅ [Sync] Concluído!')
                        } else if (statusData.job.status === 'failed') {
                            clearInterval(pollInterval)
                            setStatus('error')
                            setError('Falha na sincronização')
                        }
                    } else if (!statusData.hasActiveSync) {
                        // Job não existe mais, considerar completo
                        clearInterval(pollInterval)
                        setStatus('completed')
                        setHasSynced(true)
                        onSyncComplete?.()
                    }
                } catch (err) {
                    console.error('Erro ao verificar progresso:', err)
                }
            }, 3000)

            // Timeout de 5 minutos
            setTimeout(() => {
                clearInterval(pollInterval)
                // O timeout apenas limpa o interval, não muda status
            }, 300000)

        } catch (err: any) {
            console.error('❌ [Sync] Erro:', err)
            setStatus('error')
            setError(err.message)
        }
    }, [connectionId, status, hasSynced, onSyncComplete])

    // Não mostrar se não está conectado
    if (!isConnected) return null

    // REMOVIDO: condição que escondia o botão após sync

    // Calcular porcentagem
    const percentage = progress && progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0

    return (
        <div className="bg-[#1F1F1F] rounded-xl p-6 border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {status === 'idle' && <RefreshCw className="text-[#00FF99]" size={24} />}
                    {status === 'syncing' && <Loader2 className="text-[#00FF99] animate-spin" size={24} />}
                    {status === 'completed' && <CheckCircle2 className="text-green-500" size={24} />}
                    {status === 'error' && <AlertCircle className="text-red-500" size={24} />}

                    <div>
                        <h3 className="text-lg font-bold text-white">
                            {status === 'idle' && 'Sincronizar Dados'}
                            {status === 'syncing' && 'Sincronizando...'}
                            {status === 'completed' && 'Sincronização Concluída'}
                            {status === 'error' && 'Erro na Sincronização'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {status === 'idle' && 'Importe seus contatos e conversas do WhatsApp'}
                            {status === 'syncing' && `${progress?.currentPhase === 'contacts' ? 'Importando contatos' : 'Importando mensagens'}...`}
                            {status === 'completed' && 'Todos os dados foram importados'}
                            {status === 'error' && error}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Bar (durante sync) */}
            {status === 'syncing' && progress && (
                <div className="mb-4">
                    <div className="w-full bg-[#272727] rounded-full h-3 mb-2">
                        <div
                            className="bg-[#00FF99] h-3 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>{progress.processed} / {progress.total}</span>
                        <span>{percentage}%</span>
                    </div>
                </div>
            )}

            {/* Stats (após completar) */}
            {status === 'completed' && stats && (
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-[#272727] rounded-lg p-3">
                        <p className="text-2xl font-bold text-[#00FF99]">{stats.contactsCreated}</p>
                        <p className="text-xs text-gray-400">Contatos</p>
                    </div>
                    <div className="bg-[#272727] rounded-lg p-3">
                        <p className="text-2xl font-bold text-[#00FF99]">{stats.conversationsCreated}</p>
                        <p className="text-xs text-gray-400">Conversas</p>
                    </div>
                    <div className="bg-[#272727] rounded-lg p-3">
                        <p className="text-2xl font-bold text-[#00FF99]">{stats.messagesProcessed}</p>
                        <p className="text-xs text-gray-400">Mensagens</p>
                    </div>
                </div>
            )}

            {/* Botão (apenas se idle) */}
            {status === 'idle' && (
                <button
                    onClick={handleSync}
                    className="
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
            bg-[#00FF99] hover:bg-[#00E88C]
            text-black font-semibold
            transition-all duration-200
          "
                >
                    <RefreshCw size={20} />
                    Iniciar Sincronização
                </button>
            )}

            {/* Botão retry (se erro) */}
            {status === 'error' && (
                <button
                    onClick={handleSync}
                    className="
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
            bg-red-500 hover:bg-red-600
            text-white font-semibold
            transition-all duration-200
          "
                >
                    <RefreshCw size={20} />
                    Tentar Novamente
                </button>
            )}
        </div>
    )
}
