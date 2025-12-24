'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Copy, Check, Users, DollarSign, Clock, Wallet, ExternalLink, ArrowRight, Send, Sparkles, TrendingUp, Gift, ChevronDown, AlertCircle } from 'lucide-react'

// ============================================================================
// APLICAÇÃO FORM COMPONENT
// ============================================================================
function ApplicationForm({ onSubmit, loading }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        why_affiliate: '',
        favorite_feature: '',
        has_experience: false,
        experience_details: ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                    <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors"
                        placeholder="Seu nome completo"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors"
                        placeholder="seu@email.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefone/WhatsApp *</label>
                <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors"
                    placeholder="(11) 99999-9999"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Por que você quer ser afiliado SwiftBot? *</label>
                <textarea
                    required
                    rows={4}
                    value={formData.why_affiliate}
                    onChange={(e) => setFormData({ ...formData, why_affiliate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors resize-none"
                    placeholder="Conte um pouco sobre sua motivação e como pretende divulgar a SwiftBot..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Qual funcionalidade da SwiftBot você acha mais interessante? *</label>
                <textarea
                    required
                    rows={3}
                    value={formData.favorite_feature}
                    onChange={(e) => setFormData({ ...formData, favorite_feature: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors resize-none"
                    placeholder="Ex: O agente de IA personalizado, o CRM integrado, a análise de conversas..."
                />
            </div>

            <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.has_experience}
                        onChange={(e) => setFormData({ ...formData, has_experience: e.target.checked })}
                        className="w-5 h-5 rounded bg-[#0A0A0A] border-[#333] text-[#00FF99] focus:ring-[#00FF99] focus:ring-offset-0"
                    />
                    <span className="text-white">Já trabalho como afiliado de alguma empresa</span>
                </label>

                {formData.has_experience && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conte sobre sua experiência:</label>
                        <textarea
                            rows={3}
                            value={formData.experience_details}
                            onChange={(e) => setFormData({ ...formData, experience_details: e.target.value })}
                            className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99] transition-colors resize-none"
                            placeholder="Quais empresas, há quanto tempo, resultados alcançados..."
                        />
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Enviando...
                    </>
                ) : (
                    <>
                        <Send size={20} />
                        Enviar Candidatura
                    </>
                )}
            </button>
        </form>
    )
}

// ============================================================================
// AFFILIATE DASHBOARD COMPONENT
// ============================================================================
function AffiliateDashboard({ affiliate, stats, referralLink, onWithdraw, onRefreshOnboarding }) {
    const [copied, setCopied] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)

    const copyLink = async () => {
        await navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!affiliate.stripe_onboarding_complete) {
        return (
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#333] rounded-2xl p-8">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Complete seu Cadastro</h2>
                    <p className="text-gray-400 mb-6">
                        Para começar a receber suas comissões, você precisa configurar sua conta de recebimento no Stripe.
                    </p>
                    <button
                        onClick={onRefreshOnboarding}
                        className="px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                        <ExternalLink size={18} />
                        Configurar Conta Stripe
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Link de Indicação */}
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#333] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Gift className="text-[#00FF99]" />
                    Seu Link de Indicação
                </h3>
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-3 text-gray-300 truncate">
                        {referralLink}
                    </div>
                    <button
                        onClick={copyLink}
                        className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${copied
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-[#00FF99] text-black hover:shadow-[0_0_20px_rgba(0,255,153,0.3)]'
                            }`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                    Código: <span className="text-[#00FF99] font-mono font-bold">{affiliate.code}</span>
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Usuários Ativos</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.referrals?.active || 0}</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Pendente (7 dias)</span>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {(stats?.commissions?.total_pending || 0).toFixed(2)}</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Disponível</span>
                    </div>
                    <p className="text-3xl font-bold text-[#00FF99]">R$ {(stats?.available_balance || 0).toFixed(2)}</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Total Ganho</span>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {(stats?.total_earned || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Withdraw Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={(stats?.available_balance || 0) < 100}
                    className="px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <DollarSign size={18} />
                    Solicitar Saque
                </button>
            </div>
            {(stats?.available_balance || 0) < 100 && (
                <p className="text-right text-sm text-gray-500">Mínimo para saque: R$ 100,00</p>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <WithdrawModal
                    availableBalance={stats?.available_balance || 0}
                    onClose={() => setShowWithdrawModal(false)}
                    onWithdraw={onWithdraw}
                />
            )}
        </div>
    )
}

// ============================================================================
// WITHDRAW MODAL
// ============================================================================
function WithdrawModal({ availableBalance, onClose, onWithdraw }) {
    const [amount, setAmount] = useState(availableBalance)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleWithdraw = async () => {
        if (amount < 100) {
            setError('Valor mínimo para saque é R$ 100,00')
            return
        }
        if (amount > availableBalance) {
            setError('Valor maior que o saldo disponível')
            return
        }

        setLoading(true)
        setError('')

        try {
            await onWithdraw(amount)
            onClose()
        } catch (err) {
            setError(err.message || 'Erro ao processar saque')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-6">Solicitar Saque</h3>

                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Saldo Disponível</label>
                    <p className="text-2xl font-bold text-[#00FF99]">R$ {availableBalance.toFixed(2)}</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Valor do Saque</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            min={100}
                            max={availableBalance}
                            step={0.01}
                            className="w-full pl-12 pr-4 py-3 bg-[#0A0A0A] border border-[#333] rounded-xl text-white focus:outline-none focus:border-[#00FF99] transition-colors"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#333] text-white font-bold rounded-xl hover:bg-[#444] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleWithdraw}
                        disabled={loading}
                        className="flex-1 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : 'Confirmar Saque'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// LANDING PAGE COMPONENT
// ============================================================================
function LandingPage({ onApply, loading, hasSubscription }) {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF99]/10 border border-[#00FF99]/30 rounded-full text-[#00FF99] text-sm font-medium mb-6">
                    <Sparkles size={16} />
                    Programa de Afiliados
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Ganhe <span className="text-[#00FF99]">30%</span> de comissão
                    <br />por 6 meses
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Indique a SwiftBot e receba 30% de cada pagamento dos seus indicados durante os primeiros 6 meses.
                    Pagamentos automáticos via Stripe.
                </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">30% de Comissão</h3>
                    <p className="text-gray-400 text-sm">Receba 30% de cada pagamento durante 6 meses</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Recorrente</h3>
                    <p className="text-gray-400 text-sm">Ganhe em todas as renovações do seu indicado</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <DollarSign className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Saque Fácil</h3>
                    <p className="text-gray-400 text-sm">Saque a partir de R$100 diretamente no Stripe</p>
                </div>
            </div>

            {/* Application Form */}
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#333] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-2">Candidate-se ao Programa</h2>
                <p className="text-gray-400 mb-8">
                    Preencha o formulário abaixo e nossa equipe entrará em contato.
                </p>

                {!hasSubscription ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <p className="text-gray-400 mb-4">
                            Você precisa ter uma assinatura ativa da SwiftBot para se candidatar ao programa de afiliados.
                        </p>
                        <a
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
                        >
                            Ver Planos
                            <ArrowRight size={18} />
                        </a>
                    </div>
                ) : (
                    <ApplicationForm onSubmit={onApply} loading={loading} />
                )}
            </div>
        </div>
    )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AffiliatesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState(null) // { is_affiliate, has_application, application, affiliate }
    const [dashboardData, setDashboardData] = useState(null)
    const [hasSubscription, setHasSubscription] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Load user and status
    useEffect(() => {
        checkUser()
    }, [])

    // Handle onboarding callback
    useEffect(() => {
        if (searchParams.get('onboarding') === 'complete') {
            checkOnboardingStatus()
        }
    }, [searchParams])

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login?redirect=/affiliates')
                return
            }

            setUser(user)

            // Check subscription status
            const { data: subscription } = await supabase
                .from('user_subscriptions')
                .select('status, stripe_subscription_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const isActive = subscription && (
                ['active', 'trial', 'trialing'].includes(subscription.status) ||
                subscription.stripe_subscription_id === 'super_account_bypass'
            )
            setHasSubscription(isActive)

            // Check affiliate status
            await loadAffiliateStatus()

        } catch (error) {
            console.error('Erro ao verificar usuário:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadAffiliateStatus = async () => {
        try {
            const response = await fetch('/api/affiliates/status')
            const data = await response.json()

            if (data.success) {
                setStatus(data)

                if (data.is_affiliate) {
                    loadDashboard()
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error)
        }
    }

    const loadDashboard = async () => {
        try {
            const response = await fetch('/api/affiliates/dashboard')
            const data = await response.json()

            if (data.success) {
                setDashboardData(data)
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error)
        }
    }

    const handleApply = async (formData) => {
        setSubmitting(true)
        setMessage({ type: '', text: '' })

        try {
            const response = await fetch('/api/affiliates/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Candidatura enviada com sucesso! Entraremos em contato em breve.' })
                await loadAffiliateStatus()
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao enviar candidatura' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao enviar candidatura. Tente novamente.' })
        } finally {
            setSubmitting(false)
        }
    }

    const checkOnboardingStatus = async () => {
        try {
            const response = await fetch('/api/affiliates/onboarding')
            const data = await response.json()

            if (data.success && data.onboarding_complete) {
                setMessage({ type: 'success', text: 'Conta Stripe configurada com sucesso!' })
                await loadAffiliateStatus()
                await loadDashboard()
            }
        } catch (error) {
            console.error('Erro ao verificar onboarding:', error)
        }
    }

    const handleStartOnboarding = async () => {
        try {
            const response = await fetch('/api/affiliates/onboarding', {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success && data.onboarding_url) {
                window.location.href = data.onboarding_url
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao gerar link de configuração' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao iniciar configuração do Stripe' })
        }
    }

    const handleWithdraw = async (amount) => {
        const response = await fetch('/api/affiliates/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        })

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.error || 'Erro ao processar saque')
        }

        setMessage({ type: 'success', text: `Saque de R$ ${amount.toFixed(2)} processado com sucesso!` })
        await loadDashboard()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-[#00FF99] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            <main className="px-4 sm:px-6 lg:px-8 pt-16 pb-16">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                            {status?.is_affiliate ? 'Portal do Afiliado' : 'Programa de Afiliados'}
                        </h1>
                        {status?.is_affiliate && (
                            <p className="text-gray-400 text-lg">
                                Bem-vindo de volta! Acompanhe seus resultados e comissões.
                            </p>
                        )}
                    </div>

                    {/* Messages */}
                    {message.text && (
                        <div className={`mb-8 p-4 rounded-xl border ${message.type === 'success'
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : 'bg-red-500/20 border-red-500/30 text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Content based on status */}
                    {status?.is_affiliate ? (
                        <AffiliateDashboard
                            affiliate={status.affiliate}
                            stats={dashboardData?.stats}
                            referralLink={dashboardData?.referral_link}
                            onWithdraw={handleWithdraw}
                            onRefreshOnboarding={handleStartOnboarding}
                        />
                    ) : status?.has_application ? (
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#333] rounded-2xl p-8 text-center">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${status.application.status === 'pending'
                                    ? 'bg-yellow-500/20'
                                    : status.application.status === 'approved'
                                        ? 'bg-green-500/20'
                                        : 'bg-red-500/20'
                                }`}>
                                <Clock className={`w-8 h-8 ${status.application.status === 'pending'
                                        ? 'text-yellow-500'
                                        : status.application.status === 'approved'
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    }`} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {status.application.status === 'pending' && 'Candidatura em Análise'}
                                {status.application.status === 'approved' && 'Candidatura Aprovada!'}
                                {status.application.status === 'rejected' && 'Candidatura Não Aprovada'}
                            </h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                {status.application.status === 'pending' && 'Sua candidatura está sendo analisada pela nossa equipe. Entraremos em contato em breve.'}
                                {status.application.status === 'approved' && 'Parabéns! Sua candidatura foi aprovada. Recarregue a página para acessar seu portal.'}
                                {status.application.status === 'rejected' && (status.application.rejection_reason || 'Infelizmente sua candidatura não foi aprovada no momento.')}
                            </p>
                        </div>
                    ) : (
                        <LandingPage
                            onApply={handleApply}
                            loading={submitting}
                            hasSubscription={hasSubscription}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}
