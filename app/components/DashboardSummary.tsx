'use client'

import React, { useState, useEffect, useCallback } from 'react'

/**
 * ============================================================================
 * COMPONENTE: Dashboard Summary
 * ============================================================================
 *
 * Exibe resumo das conexões WhatsApp do usuário:
 * - Status principal (Conectado, Desconectado, etc.)
 * - Contador de conexões ativas (X de Y)
 * - Botão para adicionar nova conexão (desabilitado se limite atingido)
 * - Lista de conexões existentes
 */

// ============================================================================
// TYPES
// ============================================================================

interface Connection {
  id: string
  instanceName: string | null
  status: string
  isConnected: boolean
  profileName: string | null
  profilePicUrl: string | null
  phoneNumber: string | null
  lastConnectedAt: string | null
  createdAt: string
}

interface SummaryData {
  totalConnectionsPurchased: number
  currentActiveConnections: number
  displayStatus: 'Conectado' | 'Desconectado' | 'Conexão indefinida' | 'Aguardando QR'
  connections: Connection[]
  canAddNew: boolean
  subscription: {
    status: string
    connectionLimit: number
  }
}

interface DashboardSummaryProps {
  userId: string
  onAddNewConnection?: () => void
  onSelectConnection?: (connectionId: string) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  userId,
  onAddNewConnection,
  onSelectConnection
}) => {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)

  // ==========================================================================
  // CARREGAR DADOS DO DASHBOARD
  // ==========================================================================
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 Carregando dados do dashboard...')

      const response = await fetch(
        `/api/whatsapp/dashboard-summary?userId=${userId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar dados')
      }

      console.log('✅ Dados carregados:', data)

      setSummary({
        totalConnectionsPurchased: data.totalConnectionsPurchased,
        currentActiveConnections: data.currentActiveConnections,
        displayStatus: data.displayStatus,
        connections: data.connections,
        canAddNew: data.canAddNew,
        subscription: data.subscription
      })

    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  useEffect(() => {
    if (userId) {
      loadDashboardData()
    }
  }, [userId, loadDashboardData])

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Conectado':
        return 'text-green-600 bg-green-50'
      case 'Desconectado':
        return 'text-red-600 bg-red-50'
      case 'Aguardando QR':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Conectado':
        return '✅'
      case 'Desconectado':
        return '❌'
      case 'Aguardando QR':
        return '⏳'
      default:
        return '❓'
    }
  }

  const getConnectionStatusBadge = (status: string, isConnected: boolean) => {
    if (isConnected || status === 'connected' || status === 'open') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Conectado
        </span>
      )
    } else if (status === 'pending_qr' || status === 'connecting') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ⏳ Aguardando
        </span>
      )
    } else if (status === 'disconnected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ❌ Desconectado
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      )
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="ml-3 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ {error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className="space-y-6">

      {/* ================================================================== */}
      {/* CARD PRINCIPAL: STATUS E RESUMO */}
      {/* ================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Conexões WhatsApp</h2>
          <button
            onClick={loadDashboardData}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Atualizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Status Principal */}
        <div className={`rounded-lg p-4 mb-6 ${getStatusColor(summary.displayStatus)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Status da Conexão</p>
              <p className="text-2xl font-bold mt-1">
                {getStatusIcon(summary.displayStatus)} {summary.displayStatus}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium opacity-75">Conexões Ativas</p>
              <p className="text-3xl font-bold mt-1">
                {summary.currentActiveConnections} <span className="text-lg font-normal">de</span> {summary.totalConnectionsPurchased}
              </p>
            </div>
          </div>
        </div>

        {/* Informações da Assinatura */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Limite do Plano</p>
            <p className="text-xl font-bold text-gray-800 mt-1">
              {summary.totalConnectionsPurchased} {summary.totalConnectionsPurchased === 1 ? 'conexão' : 'conexões'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Status da Assinatura</p>
            <p className="text-xl font-bold text-gray-800 mt-1 capitalize">
              {summary.subscription.status}
            </p>
          </div>
        </div>

        {/* Botão Adicionar Nova Conexão */}
        <div className="flex items-center justify-between">
          <div>
            {!summary.canAddNew && (
              <p className="text-sm text-orange-600">
                ⚠️ Limite de conexões atingido. Faça upgrade para adicionar mais.
              </p>
            )}
          </div>
          <button
            onClick={onAddNewConnection}
            disabled={!summary.canAddNew}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              summary.canAddNew
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {summary.canAddNew ? '➕ Adicionar Nova Conexão' : '🔒 Limite Atingido'}
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* LISTA DE CONEXÕES */}
      {/* ================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Minhas Conexões</h3>

        {summary.connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-gray-600">Nenhuma conexão criada ainda</p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Adicionar Nova Conexão" para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.connections.map((connection) => (
              <div
                key={connection.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
                onClick={() => onSelectConnection?.(connection.id)}
              >
                <div className="flex items-center justify-between">
                  {/* Info da Conexão */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {connection.profilePicUrl ? (
                        <img
                          src={connection.profilePicUrl}
                          alt={connection.profileName || 'Perfil'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {connection.profileName || connection.instanceName || 'Sem Nome'}
                        </p>
                        {connection.phoneNumber && (
                          <p className="text-sm text-gray-500">{connection.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ID: {connection.id.slice(0, 8)}...</span>
                      {connection.lastConnectedAt && (
                        <span>
                          Última conexão: {new Date(connection.lastConnectedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {getConnectionStatusBadge(connection.status, connection.isConnected)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default DashboardSummary
