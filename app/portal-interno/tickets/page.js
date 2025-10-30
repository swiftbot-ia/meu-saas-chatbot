'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, ArrowLeft, Loader2, Ticket, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function TicketsListPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [user, setUser] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  })

  useEffect(() => {
    checkAuth()
    loadTeamMembers()
  }, [])

  useEffect(() => {
    loadTickets()
  }, [statusFilter, priorityFilter, assignedFilter, pagination.page])

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

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/portal-interno/tickets/team-members')
      const data = await response.json()
      if (data.success) {
        setTeamMembers(data.teamMembers || [])
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        assignedTo: assignedFilter,
        search: searchTerm,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/portal-interno/tickets/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
        setPagination(data.pagination)
      } else {
        console.error('Erro ao carregar tickets:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    loadTickets()
  }

  const getStatusBadge = (status) => {
    const badges = {
      'open': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle, label: '🔴 Aberto' },
      'in_progress': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock, label: '🟡 Em Andamento' },
      'resolved': { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: '🟢 Resolvido' },
      'closed': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle, label: '⚪ Fechado' }
    }
    return badges[status] || badges.open
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      'urgent': { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔥 Urgente' },
      'high': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '🟠 Alta' },
      'normal': { bg: 'bg-green-500/20', text: 'text-green-400', label: '🟢 Normal' },
      'low': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '🔵 Baixa' }
    }
    return badges[priority] || badges.normal
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0"
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/portal-interno/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#04F5A0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar ao Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-[#04F5A0]" />
              Todos os Tickets
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#04F5A0]" />
            <h2 className="text-lg font-bold text-white">Filtros</h2>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por assunto ou mensagem..."
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white focus:border-[#04F5A0] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors"
              >
                <option value="all">Todos</option>
                <option value="open">🔴 Abertos</option>
                <option value="in_progress">🟡 Em Andamento</option>
                <option value="resolved">🟢 Resolvidos</option>
                <option value="closed">⚪ Fechados</option>
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors"
              >
                <option value="all">Todas</option>
                <option value="urgent">🔥 Urgente</option>
                <option value="high">🟠 Alta</option>
                <option value="normal">🟢 Normal</option>
                <option value="low">🔵 Baixa</option>
              </select>
            </div>

            {/* Atribuído */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Atribuído para</label>
              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors"
              >
                <option value="all">Todos</option>
                <option value="unassigned">Não atribuídos</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Buscar */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black rounded-lg font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4" /> Buscar</>}
              </button>
            </div>
          </form>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
            <div className="text-red-400 text-sm font-medium mb-1">Abertos</div>
            <div className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'open').length}
            </div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-4">
            <div className="text-yellow-400 text-sm font-medium mb-1">Em Andamento</div>
            <div className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-xl p-4">
            <div className="text-green-400 text-sm font-medium mb-1">Resolvidos</div>
            <div className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
          </div>
          <div className="bg-gray-500/10 backdrop-blur-xl border border-gray-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-sm font-medium mb-1">Total</div>
            <div className="text-2xl font-bold text-white">
              {pagination.total}
            </div>
          </div>
        </div>

        {/* Lista de Tickets */}
        {loading ? (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <Loader2 className="w-12 h-12 text-[#04F5A0] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum ticket encontrado</h3>
            <p className="text-gray-400">Tente ajustar os filtros ou buscar por outros termos</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status)
                const priorityBadge = getPriorityBadge(ticket.priority)
                const StatusIcon = statusBadge.icon

                return (
                  <div
                    key={ticket.id}
                    onClick={() => router.push(`/portal-interno/tickets/${ticket.id}`)}
                    className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-5 hover:bg-black/60 hover:border-[#04F5A0]/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 ${statusBadge.bg} ${statusBadge.text} rounded-full text-xs font-medium flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.label}
                          </span>
                          <span className={`px-3 py-1 ${priorityBadge.bg} ${priorityBadge.text} rounded-full text-xs font-medium`}>
                            {priorityBadge.label}
                          </span>
                          {ticket.category && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                              {ticket.category}
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#04F5A0] transition-colors">
                          {ticket.subject}
                        </h3>

                        {/* Mensagem (preview) */}
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                          {ticket.message}
                        </p>

                        {/* Informações */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleString('pt-BR')}
                          </span>
                          <span>•</span>
                          <span>
                            {ticket.user_profiles?.full_name || ticket.user_profiles?.email}
                          </span>
                          {ticket.assigned_to_user && (
                            <>
                              <span>•</span>
                              <span className="text-[#04F5A0]">
                                Atribuído: {ticket.assigned_to_user.full_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Seta */}
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-[#04F5A0] transition-colors ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} tickets)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1 || loading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={!pagination.hasMore || loading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}