'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TicketsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  useEffect(() => {
    checkAuth()
    loadTickets()
  }, [filter])

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

  const loadTickets = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/portal-interno/tickets/list'
        : `/api/portal-interno/tickets/list?status=${filter}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'ABERTO' },
      in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'EM ANDAMENTO' },
      resolved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'RESOLVIDO' },
      closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'FECHADO' }
    }
    return badges[status] || badges.open
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
          <h1 className="text-3xl font-bold text-white mb-2">Tickets de Suporte</h1>
          <p className="text-gray-400">Gerencie todas as solicitações de suporte</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <FilterButton active={filter === 'open'} onClick={() => setFilter('open')}>
            🔴 Abertos
          </FilterButton>
          <FilterButton active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>
            🔵 Em Andamento
          </FilterButton>
          <FilterButton active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
            🟢 Resolvidos
          </FilterButton>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            📋 Todos
          </FilterButton>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
              <p className="text-gray-400">Nenhum ticket encontrado</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const badge = getStatusBadge(ticket.status)
              return (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/portal-interno/tickets/${ticket.id}`)}
                  className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-black/60 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs rounded-lg font-medium`}>
                          {badge.label}
                        </span>
                        {ticket.priority === 'urgent' && (
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                            🔥 URGENTE
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{ticket.subject}</h3>
                      <p className="text-gray-400 mb-4 line-clamp-2">{ticket.message}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div>
                          👤 {ticket.user_profiles?.full_name || ticket.user_profiles?.email}
                        </div>
                        <div>
                          📅 {new Date(ticket.created_at).toLocaleString('pt-BR')}
                        </div>
                        {ticket.support_users && (
                          <div>
                            👨‍💼 Atribuído: {ticket.support_users.full_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })
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
      className={`px-4 py-2 rounded-xl transition-all ${
        active
          ? 'bg-[#04F5A0] text-black font-bold'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
}