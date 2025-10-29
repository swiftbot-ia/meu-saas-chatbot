'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ClienteDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id

  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkAuth()
    if (clientId) {
      loadClientDetails()
    }
  }, [clientId])

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

  const loadClientDetails = async () => {
    try {
      const response = await fetch(`/api/portal-interno/clientes/${clientId}`)
      const data = await response.json()

      if (data.success) {
        setClient(data.client)
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionType, payload) => {
    setActionLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      let endpoint = ''
      let body = { clientId, ...payload }

      switch (actionType) {
        case 'reset-email':
          endpoint = '/api/portal-interno/clientes/reset-email'
          break
        case 'reset-password':
          endpoint = '/api/portal-interno/clientes/reset-password'
          break
        case 'activate-plan':
          endpoint = '/api/portal-interno/clientes/activate-plan'
          break
        case 'suspend':
          endpoint = '/api/portal-interno/clientes/suspend'
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(data.message)
        setActionModal(null)
        setTimeout(() => {
          loadClientDetails()
          setSuccessMessage('')
        }, 2000)
      } else {
        setErrorMessage(data.error)
      }
    } catch (error) {
      setErrorMessage('Erro ao executar ação')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04F5A0]"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Cliente não encontrado</p>
          <button
            onClick={() => router.push('/portal-interno/clientes')}
            className="mt-4 px-6 py-3 bg-[#04F5A0] text-black font-bold rounded-xl"
          >
            Voltar
          </button>
        </div>
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
              onClick={() => router.push('/portal-interno/clientes')}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Clientes
            </button>

            <div className="text-right">
              <div className="text-sm font-medium text-white">{user?.full_name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400">
            ✅ {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
            ❌ {errorMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold text-2xl">
                {client.profile.full_name?.[0] || client.profile.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{client.profile.full_name || 'Nome não definido'}</h1>
                <p className="text-gray-400">{client.profile.email}</p>
                {client.profile.company_name && (
                  <p className="text-gray-500 text-sm">🏢 {client.profile.company_name}</p>
                )}
              </div>
            </div>

            {client.profile.is_super_account && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium">
                Super Conta
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard label="ID do Cliente" value={client.profile.id.slice(0, 8) + '...'} />
            <InfoCard label="Telefone" value={client.profile.phone || 'Não informado'} />
            <InfoCard
              label="Membro desde"
              value={new Date(client.profile.created_at).toLocaleDateString('pt-BR')}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ActionButton
            title="Resetar Email"
            icon={(
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            onClick={() => setActionModal('reset-email')}
            color="blue"
          />

          <ActionButton
            title="Resetar Senha"
            icon={(
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )}
            onClick={() => setActionModal('reset-password')}
            color="purple"
          />

          <ActionButton
            title="Ativar Plano"
            icon={(
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            onClick={() => setActionModal('activate-plan')}
            color="green"
          />

          <ActionButton
            title="Suspender Conta"
            icon={(
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            onClick={() => setActionModal('suspend')}
            color="red"
          />
        </div>

        {/* Subscription Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Assinatura</h2>
            {client.subscription ? (
              <div className="space-y-3">
                <InfoRow label="Status" value={client.subscription.status} />
                <InfoRow label="Plano" value={client.subscription.plan_type || 'N/A'} />
                <InfoRow
                  label="Próxima cobrança"
                  value={client.subscription.current_period_end ? new Date(client.subscription.current_period_end).toLocaleDateString('pt-BR') : 'N/A'}
                />
              </div>
            ) : (
              <p className="text-gray-500">Sem assinatura ativa</p>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Conexões WhatsApp</h2>
            {client.connections && client.connections.length > 0 ? (
              <div className="space-y-2">
                {client.connections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <span className="text-gray-300">{conn.instance_name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${conn.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {conn.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma conexão</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Notas do Suporte</h2>
          {client.notes && client.notes.length > 0 ? (
            <div className="space-y-3">
              {client.notes.map((note) => (
                <div key={note.id} className="bg-white/5 rounded-lg p-4 border-l-4 border-[#04F5A0]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">{note.support_users.full_name}</span>
                    <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-400">{note.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma nota registrada</p>
          )}
        </div>
      </main>

      {/* Modals */}
      {actionModal === 'reset-email' && (
        <ActionModal
          title="Resetar Email"
          onClose={() => setActionModal(null)}
          onSubmit={(data) => handleAction('reset-email', data)}
          loading={actionLoading}
        >
          <input
            type="email"
            name="newEmail"
            placeholder="Novo email"
            required
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
          />
        </ActionModal>
      )}

      {actionModal === 'reset-password' && (
        <ActionModal
          title="Resetar Senha"
          onClose={() => setActionModal(null)}
          onSubmit={(data) => handleAction('reset-password', data)}
          loading={actionLoading}
        >
          <input
            type="password"
            name="newPassword"
            placeholder="Nova senha"
            required
            minLength={8}
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
          />
        </ActionModal>
      )}

      {actionModal === 'activate-plan' && (
        <ActionModal
          title="Ativar Plano"
          onClose={() => setActionModal(null)}
          onSubmit={(data) => handleAction('activate-plan', data)}
          loading={actionLoading}
        >
          <select
            name="planType"
            required
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            <option value="">Selecione o plano</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </ActionModal>
      )}

      {actionModal === 'suspend' && (
        <ActionModal
          title="Suspender Conta"
          onClose={() => setActionModal(null)}
          onSubmit={(data) => handleAction('suspend', { ...data, action: 'suspend' })}
          loading={actionLoading}
        >
          <textarea
            name="reason"
            placeholder="Motivo da suspensão"
            required
            rows={4}
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
          />
        </ActionModal>
      )}
    </div>
  )
}

// Componentes auxiliares
function InfoCard({ label, value }) {
  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-white font-medium">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

function ActionButton({ title, icon, onClick, color }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 hover:border-blue-500/50',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 hover:border-purple-500/50',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 hover:border-green-500/50',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 hover:border-red-500/50'
  }

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 text-left hover:scale-105 transition-all group`}
    >
      <div className="text-white mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-sm font-medium text-white">{title}</div>
    </button>
  )
}

function ActionModal({ title, children, onClose, onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    onSubmit(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl"
            >
              {loading ? 'Processando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}