'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, MessageSquare, Phone, User, Clock, AlertCircle, CheckCircle, XCircle, Loader2, StickyNote } from 'lucide-react'

export default function TicketDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState(null)
  const [history, setHistory] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [user, setUser] = useState(null)

  // Estados para ações
  const [newStatus, setNewStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  // emailMessage e emailLoading removidos
  const [internalNote, setInternalNote] = useState('')
  
  // Loading states
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  // emailLoading removido
  const [noteLoading, setNoteLoading] = useState(false)

  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showConfirmResolve, setShowConfirmResolve] = useState(false)

  useEffect(() => {
    checkAuth()
    loadTicketDetails()
  }, [ticketId])

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

  const loadTicketDetails = async () => {
    try {
      const response = await fetch(`/api/portal-interno/tickets/${ticketId}`)
      const data = await response.json()

      if (!data.success) {
        alert('Erro ao carregar ticket')
        router.push('/portal-interno/tickets')
        return
      }

      setTicket(data.ticket)
      setHistory(data.history || [])
      setTeamMembers(data.teamMembers || [])
      setNewStatus(data.ticket.status)
      setAssignedTo(data.ticket.assigned_to || '')
    } catch (error) {
      console.error('Erro ao carregar ticket:', error)
      alert('Erro ao carregar ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status) => {
    // Se for resolver, pedir confirmação
    if (status === 'resolved' || status === 'closed') {
      setNewStatus(status)
      setShowConfirmResolve(true)
      return
    }

    await updateStatus(status)
  }

  const updateStatus = async (status) => {
    setStatusLoading(true)
    try {
      const response = await fetch(`/api/portal-interno/tickets/${ticketId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setNewStatus(status)
        loadTicketDetails() // Recarregar para atualizar histórico
        alert('Status atualizado com sucesso!')
      } else {
        alert(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar status')
    } finally {
      setStatusLoading(false)
      setShowConfirmResolve(false)
    }
  }

  const handleAssign = async () => {
    if (!assignedTo) {
      alert('Selecione um membro da equipe')
      return
    }

    setAssignLoading(true)
    try {
      const response = await fetch(`/api/portal-interno/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo })
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        loadTicketDetails()
        alert('Ticket atribuído com sucesso!')
      } else {
        alert(data.error || 'Erro ao atribuir ticket')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atribuir ticket')
    } finally {
      setAssignLoading(false)
    }
  }

  // Função handleSendEmail removida

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!internalNote.trim()) {
      alert('Digite uma nota')
      return
    }

    setNoteLoading(true)
    try {
      const response = await fetch(`/api/portal-interno/tickets/${ticketId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: internalNote })
      })

      const data = await response.json()

      if (data.success) {
        setInternalNote('')
        setShowNoteModal(false)
        loadTicketDetails()
        alert('Nota adicionada com sucesso!')
      } else {
        alert(data.error || 'Erro ao adicionar nota')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao adicionar nota')
    } finally {
      setNoteLoading(false)
    }
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
    }
    return phone
  }

  const openWhatsApp = () => {
    if (!ticket?.user_profiles?.phone) {
      alert('Telefone não disponível')
      return
    }
    const phone = ticket.user_profiles.phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${phone}`, '_blank')
  }

  const getStatusBadge = (status) => {
    const badges = {
      'open': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle, label: 'Aberto' },
      'in_progress': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock, label: 'Em Andamento' },
      'resolved': { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Resolvido' },
      'closed': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle, label: 'Fechado' }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#04F5A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket não encontrado</h2>
          <button
            onClick={() => router.push('/portal-interno/tickets')}
            className="mt-4 px-6 py-2 bg-[#04F5A0] hover:bg-[#03E691] text-black rounded-lg font-medium transition-colors"
          >
            Voltar para Tickets
          </button>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(ticket.status)
  const priorityBadge = getPriorityBadge(ticket.priority)
  const StatusIcon = statusBadge.icon

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
              onClick={() => router.push('/portal-interno/tickets')}
              className="flex items-center gap-2 text-gray-400 hover:text-[#04F5A0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar para Tickets</span>
            </button>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 ${statusBadge.bg} ${statusBadge.text} rounded-full text-sm font-medium flex items-center gap-2`}>
                <StatusIcon className="w-4 h-4" />
                {statusBadge.label}
              </span>
              <span className={`px-3 py-1 ${priorityBadge.bg} ${priorityBadge.text} rounded-full text-sm font-medium`}>
                {priorityBadge.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Cliente */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#04F5A0]" />
                Informações do Cliente
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nome</label>
                  <div className="text-white font-medium">{ticket.user_profiles?.full_name || 'N/A'}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Email</label>
                  <div className="text-white font-medium break-all">{ticket.user_profiles?.email || 'N/A'}</div>
                </div>

                {ticket.user_profiles?.phone && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Telefone</label>
                    <div className="text-white font-medium">{formatPhone(ticket.user_profiles.phone)}</div>
                  </div>
                )}

                {ticket.user_profiles?.company_name && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Empresa</label>
                    <div className="text-white font-medium">{ticket.user_profiles.company_name}</div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                {ticket.user_profiles?.phone && (
                  <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl transition-colors font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Abrir no WhatsApp
                  </button>
                )}

                <button
                  onClick={() => router.push(`/portal-interno/clientes/${ticket.user_id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  Ver Perfil Completo
                </button>
              </div>
            </div>
          </div>

          {/* Main Area - Ticket */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{ticket.subject}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Criado em {new Date(ticket.created_at).toLocaleString('pt-BR')}
                    </span>
                    {ticket.category && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Mensagem:</h3>
                <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Mudar Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status do Ticket</label>
                  <select
                    value={newStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusLoading}
                    className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="open">🔴 Aberto</option>
                    <option value="in_progress">🟡 Em Andamento</option>
                    <option value="resolved">🟢 Resolvido</option>
                    <option value="closed">⚪ Fechado</option>
                  </select>
                </div>

                {/* Atribuir */}
                {(user?.role === 'admin' || user?.role === 'gerente') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Atribuído para</label>
                    <div className="flex gap-2">
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        disabled={assignLoading}
                        className="flex-1 bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors disabled:opacity-50"
                      >
                        <option value="">Não atribuído</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name} ({member.role})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={assignLoading || !assignedTo}
                        className="px-4 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-colors"
                      >
                        {assignLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atribuir'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#04F5A0] hover:bg-[#03E691] text-black rounded-xl transition-colors font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Responder via Email
                </button>

                <button
                  onClick={() => setShowNoteModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors font-medium"
                >
                  <StickyNote className="w-4 h-4" />
                  Adicionar Nota Interna
                </button>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#04F5A0]" />
                Histórico de Ações
              </h3>

              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma ação registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={`relative pl-8 pb-4 ${index !== history.length - 1 ? 'border-l-2 border-white/10' : ''}`}
                    >
                      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        item.is_internal_note 
                          ? 'bg-orange-500/20 border-2 border-orange-500' 
                          : 'bg-[#04F5A0]/20 border-2 border-[#04F5A0]'
                      }`}>
                        {item.is_internal_note ? (
                          <StickyNote className="w-3 h-3 text-orange-400" />
                        ) : (
                          <Mail className="w-3 h-3 text-[#04F5A0]" />
                        )}
                      </div>

                      <div className={`ml-6 p-4 rounded-xl ${
                        item.is_internal_note 
                          ? 'bg-orange-500/10 border border-orange-500/20' 
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${item.is_internal_note ? 'text-orange-400' : 'text-white'}`}>
                              {item.support_users?.full_name || 'Sistema'}
                            </span>
                            {item.is_internal_note && (
                              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                                NOTA INTERNA
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className={`text-sm ${item.is_internal_note ? 'text-gray-300' : 'text-gray-400'} whitespace-pre-wrap`}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal - Responder Email (Novo) */}
      {showEmailModal && (
        <EmailResponseModal
          ticket={ticket}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            loadTicketDetails() // Recarrega os detalhes para atualizar o histórico
          }}
        />
      )}

      {/* Modal - Nota Interna */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-orange-400" />
              Adicionar Nota Interna
            </h3>

            <p className="text-sm text-gray-400 mb-4">
              Esta nota será visível apenas para a equipe de suporte
            </p>

            <form onSubmit={handleAddNote}>
              <div className="mb-4">
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={6}
                  placeholder="Digite sua nota..."
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  disabled={noteLoading}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={noteLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-gray-600 text-orange-400 rounded-xl transition-colors font-medium"
                >
                  {noteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><StickyNote className="w-4 h-4" /> Adicionar Nota</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Resolução */}
      {showConfirmResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Confirmar Ação
            </h3>

            <p className="text-gray-300 mb-6">
              Tem certeza que deseja marcar este ticket como <strong className="text-[#04F5A0]">{newStatus === 'resolved' ? 'Resolvido' : 'Fechado'}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmResolve(false)}
                disabled={statusLoading}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateStatus(newStatus)}
                disabled={statusLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-600 text-green-400 rounded-xl transition-colors font-medium"
              >
                {statusLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Novo Componente EmailResponseModal adicionado abaixo

function EmailResponseModal({ ticket, onClose, onSuccess }) {
  const [subject, setSubject] = useState(`Re: ${ticket.subject}`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Assunto é obrigatório');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError('Mensagem deve ter pelo menos 10 caracteres');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch(`/api/portal-interno/tickets/${ticket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Email enviado com sucesso!');
        onSuccess?.(); // Chama a função de sucesso (ex: loadTicketDetails)
        onClose(); // Fecha o modal
      } else {
        setError(data.error || 'Erro ao enviar email');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-[#04F5A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Responder via Email
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Para: <span className="text-[#04F5A0]">{ticket.user_profiles?.email}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center text-red-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assunto */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Assunto *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Ex: Re: Problema com WhatsApp"
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#04F5A0] focus:outline-none"
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Mensagem *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              placeholder="Digite sua resposta..."
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#04F5A0] focus:outline-none resize-none"
            />
            <div className="mt-2 text-sm text-gray-500">
              {message.length} caracteres • mínimo 10
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-blue-300 text-sm">
                O cliente receberá este email em <strong>{ticket.user_profiles?.email}</strong> e poderá responder diretamente.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending || !subject.trim() || message.trim().length < 10}
              className="flex-1 px-6 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}