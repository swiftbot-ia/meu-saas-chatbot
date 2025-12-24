'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardSuportePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    acoesHoje: 0,
    totalEquipe: 0
  })
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadStats()
    loadTickets()
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
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/portal-interno/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadTickets = async () => {
    try {
      const response = await fetch('/api/portal-interno/tickets/dashboard?status=open&limit=5')
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setTicketsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/portal-interno/auth/logout', { method: 'POST' })
    router.push('/portal-interno/login')
  }

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
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#04F5A0] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Portal Interno</h1>
                <p className="text-xs text-gray-400">SwiftBot Support System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user?.full_name}</div>
                <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Clientes"
            value={stats.totalClientes}
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
            color="purple"
          />
          <StatCard
            title="Clientes Ativos"
            value={stats.clientesAtivos}
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            color="green"
          />
          <StatCard
            title="Ações Hoje"
            value={stats.acoesHoje}
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            color="yellow"
          />
          <StatCard
            title="Equipe"
            value={stats.totalEquipe}
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            color="blue"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Buscar Clientes"
            description="Pesquisar e gerenciar clientes"
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            onClick={() => router.push('/portal-interno/clientes')}
          />

          {(user?.role === 'admin' || user?.role === 'gerente') && (
            <QuickActionCard
              title="Gerenciar Equipe"
              description="Adicionar e gerenciar usuários"
              icon={(
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              onClick={() => router.push('/portal-interno/equipe')}
            />
          )}

          <QuickActionCard
            title="Ver Logs"
            description="Histórico de ações realizadas"
            icon={(
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            onClick={() => router.push('/portal-interno/logs')}
          />

          {(user?.role === 'admin' || user?.role === 'gerente') && (
            <QuickActionCard
              title="Afiliados"
              description="Gerenciar candidaturas de afiliados"
              icon={(
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              onClick={() => router.push('/portal-interno/affiliates')}
            />
          )}
        </div>

        {/* Tickets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🎫 Tickets de Suporte</h2>
            <button
              onClick={() => router.push('/portal-interno/tickets')}
              className="text-[#04F5A0] hover:text-[#03E691] text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          {ticketsLoading ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#04F5A0] mx-auto"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg">Nenhum ticket pendente</p>
              <p className="text-gray-500 text-sm mt-2">Todos os tickets foram resolvidos! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/portal-interno/tickets/${ticket.id}`)}
                  className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-black/60 hover:border-[#04F5A0]/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg font-medium">
                          🔴 ABERTO
                        </span>
                        {ticket.priority === 'urgent' && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                            🔥 URGENTE
                          </span>
                        )}
                        {ticket.priority === 'high' && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                            🟠 ALTA
                          </span>
                        )}
                        {ticket.category && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg">
                            {ticket.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-1 group-hover:text-[#04F5A0] transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">{ticket.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {ticket.user_profiles?.full_name || ticket.user_profiles?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(ticket.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-[#04F5A0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl rounded-2xl border p-6 hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/80">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  )
}

function QuickActionCard({ title, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-left hover:bg-black/60 hover:border-[#04F5A0]/30 transition-all group"
    >
      <div className="text-[#04F5A0] mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  )
}