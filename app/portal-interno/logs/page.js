'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    checkAuth()
    loadLogs()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/portal-interno/auth/session')
      const data = await response.json()
      
      if (!data.success) {
        router.push('/portal-interno/login')
        return
      }
      
      setUser(data.user)
    } catch (error) {
      router.push('/portal-interno/login')
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/portal-interno/logs')
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'email_reset':
        return '📧'
      case 'password_reset':
        return '🔑'
      case 'plan_activation':
        return '✅'
      case 'account_suspend':
        return '🚫'
      case 'account_reactivate':
        return '✔️'
      default:
        return '📝'
    }
  }

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'email_reset':
        return 'text-blue-400'
      case 'password_reset':
        return 'text-purple-400'
      case 'plan_activation':
        return 'text-green-400'
      case 'account_suspend':
        return 'text-red-400'
      case 'account_reactivate':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.action_type === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04F5A0]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/portal-interno/dashboard')}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Dashboard
            </button>

            <div className="text-right">
              <div className="text-sm font-medium text-white">{user?.full_name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Logs de Ações</h1>
          <p className="text-gray-400">Histórico completo de todas as ações realizadas</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas ({logs.length})
          </FilterButton>
          <FilterButton active={filter === 'email_reset'} onClick={() => setFilter('email_reset')}>
            📧 Reset Email
          </FilterButton>
          <FilterButton active={filter === 'password_reset'} onClick={() => setFilter('password_reset')}>
            🔑 Reset Senha
          </FilterButton>
          <FilterButton active={filter === 'plan_activation'} onClick={() => setFilter('plan_activation')}>
            ✅ Ativar Plano
          </FilterButton>
          <FilterButton active={filter === 'account_suspend'} onClick={() => setFilter('account_suspend')}>
            🚫 Suspensão
          </FilterButton>
        </div>

        {/* Logs List */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                      </div>
                      <div>
                        <h3 className={`font-medium ${getActionColor(log.action_type)}`}>
                          {log.action_description}
                        </h3>
                        <div className="text-sm text-gray-400 mt-1">
                          Por <span className="text-white">{log.support_users?.full_name}</span>
                          {' • '}
                          Cliente: <span className="text-white">{log.user_profiles?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        IP: {log.ip_address}
                      </div>
                    </div>
                  </div>

                  {(log.previous_value || log.new_value) && (
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/10">
                      {log.previous_value && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Antes:</div>
                          <div className="text-sm text-gray-300 bg-black/30 rounded-lg p-2">
                            {JSON.stringify(log.previous_value, null, 2)}
                          </div>
                        </div>
                      )}
                      {log.new_value && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Depois:</div>
                          <div className="text-sm text-gray-300 bg-black/30 rounded-lg p-2">
                            {JSON.stringify(log.new_value, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
        active
          ? 'bg-[#04F5A0] text-black font-bold'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
}