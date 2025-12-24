'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Check, X, Clock, ChevronDown, ChevronUp, ArrowLeft, RefreshCw } from 'lucide-react'

export default function AffiliatesAdminPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applications, setApplications] = useState([])
    const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
    const [filter, setFilter] = useState('pending')
    const [expandedId, setExpandedId] = useState(null)
    const [processing, setProcessing] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(null)

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        if (user) {
            loadApplications()
        }
    }, [user, filter])

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

    const loadApplications = async () => {
        try {
            const url = filter === 'all'
                ? '/api/portal-interno/affiliates'
                : `/api/portal-interno/affiliates?status=${filter}`

            const response = await fetch(url)
            const data = await response.json()

            if (data.success) {
                setApplications(data.applications)
                setCounts(data.counts)
            }
        } catch (error) {
            console.error('Erro ao carregar aplicações:', error)
        }
    }

    const handleApprove = async (applicationId) => {
        setProcessing(applicationId)
        try {
            const response = await fetch('/api/portal-interno/affiliates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_id: applicationId, action: 'approve' })
            })

            const data = await response.json()

            if (data.success) {
                loadApplications()
            } else {
                alert('Erro ao aprovar: ' + data.error)
            }
        } catch (error) {
            alert('Erro ao aprovar aplicação')
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (applicationId) => {
        setProcessing(applicationId)
        try {
            const response = await fetch('/api/portal-interno/affiliates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: applicationId,
                    action: 'reject',
                    rejection_reason: rejectionReason || 'Candidatura não aprovada'
                })
            })

            const data = await response.json()

            if (data.success) {
                setShowRejectModal(null)
                setRejectionReason('')
                loadApplications()
            } else {
                alert('Erro ao rejeitar: ' + data.error)
            }
        } catch (error) {
            alert('Erro ao rejeitar aplicação')
        } finally {
            setProcessing(null)
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            approved: 'bg-green-500/20 text-green-400',
            rejected: 'bg-red-500/20 text-red-400'
        }
        const labels = {
            pending: '⏳ Pendente',
            approved: '✅ Aprovado',
            rejected: '❌ Rejeitado'
        }
        return (
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        )
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
                            <button
                                onClick={() => router.push('/portal-interno/dashboard')}
                                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div className="w-10 h-10 bg-[#04F5A0] rounded-lg flex items-center justify-center mr-3">
                                <Users className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Afiliados</h1>
                                <p className="text-xs text-gray-400">Gerenciar candidaturas</p>
                            </div>
                        </div>

                        <button
                            onClick={loadApplications}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                        <div className="text-2xl font-bold text-white">{counts.total}</div>
                        <div className="text-sm text-gray-400">Total</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4">
                        <div className="text-2xl font-bold text-yellow-400">{counts.pending}</div>
                        <div className="text-sm text-gray-400">Pendentes</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-green-500/30 p-4">
                        <div className="text-2xl font-bold text-green-400">{counts.approved}</div>
                        <div className="text-sm text-gray-400">Aprovados</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
                        <div className="text-2xl font-bold text-red-400">{counts.rejected}</div>
                        <div className="text-sm text-gray-400">Rejeitados</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { value: 'pending', label: 'Pendentes' },
                        { value: 'approved', label: 'Aprovados' },
                        { value: 'rejected', label: 'Rejeitados' },
                        { value: 'all', label: 'Todos' }
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f.value
                                    ? 'bg-[#04F5A0] text-black'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                    {applications.length === 0 ? (
                        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">Nenhuma candidatura encontrada</p>
                            <p className="text-gray-500 text-sm mt-2">
                                {filter === 'pending' ? 'Todas as candidaturas foram avaliadas!' : 'Nenhum resultado para este filtro.'}
                            </p>
                        </div>
                    ) : (
                        applications.map((app) => (
                            <div
                                key={app.id}
                                className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
                            >
                                {/* Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#04F5A0]/20 flex items-center justify-center">
                                                <span className="text-lg font-bold text-[#04F5A0]">
                                                    {app.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{app.full_name}</h3>
                                                <p className="text-sm text-gray-400">{app.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(app.status)}
                                            {expandedId === app.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedId === app.id && (
                                    <div className="border-t border-white/10 p-4 space-y-4">
                                        {/* Contact */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase">Telefone</label>
                                                <p className="text-white">{app.phone}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase">Data da Candidatura</label>
                                                <p className="text-white">{new Date(app.created_at).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>

                                        {/* Why Affiliate */}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Por que quer ser afiliado?</label>
                                            <p className="text-gray-300 mt-1">{app.why_affiliate}</p>
                                        </div>

                                        {/* Favorite Feature */}
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Funcionalidade Favorita</label>
                                            <p className="text-gray-300 mt-1">{app.favorite_feature}</p>
                                        </div>

                                        {/* Experience */}
                                        {app.has_experience && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase">Experiência como Afiliado</label>
                                                <p className="text-gray-300 mt-1">{app.experience_details || 'Sim, possui experiência'}</p>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {app.status === 'rejected' && app.rejection_reason && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                                <label className="text-xs text-red-400 uppercase">Motivo da Recusa</label>
                                                <p className="text-red-300 mt-1">{app.rejection_reason}</p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {app.status === 'pending' && (
                                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                                <button
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processing === app.id ? (
                                                        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Check className="w-5 h-5" />
                                                            Aprovar
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setShowRejectModal(app.id)}
                                                    disabled={processing === app.id}
                                                    className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <X className="w-5 h-5" />
                                                    Recusar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Recusar Candidatura</h3>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Motivo da recusa (opcional)</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#04F5A0] resize-none"
                                placeholder="Ex: Perfil não compatível com o programa no momento..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null)
                                    setRejectionReason('')
                                }}
                                className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleReject(showRejectModal)}
                                disabled={processing}
                                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Processando...' : 'Confirmar Recusa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
