'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Copy, Check, Users, DollarSign, Clock, Wallet, ExternalLink, ArrowRight, Send, Sparkles, TrendingUp, Gift, ChevronDown, AlertCircle, Calendar, X, Star, ShieldCheck, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DayPicker } from 'react-day-picker'
import { format, addDays, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

// ============================================================================
// APPLICATION FORM COMPONENT (Conteúdo do Modal)
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                    <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors"
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
                        className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors"
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
                    className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors"
                    placeholder="(11) 99999-9999"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Por que você quer ser afiliado SwiftBot? *</label>
                <textarea
                    required
                    rows={3}
                    value={formData.why_affiliate}
                    onChange={(e) => setFormData({ ...formData, why_affiliate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors resize-none"
                    placeholder="Conte um pouco sobre sua motivação..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Qual funcionalidade da SwiftBot você acha mais interessante? *</label>
                <textarea
                    required
                    rows={2}
                    value={formData.favorite_feature}
                    onChange={(e) => setFormData({ ...formData, favorite_feature: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors resize-none"
                    placeholder="Ex: Agentes, CRM..."
                />
            </div>

            <div className="bg-[#1A1A1A] rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.has_experience}
                        onChange={(e) => setFormData({ ...formData, has_experience: e.target.checked })}
                        className="w-5 h-5 rounded bg-[#0A0A0A] border-none text-[#00FF99] focus:ring-[#00FF99] focus:ring-offset-0"
                    />
                    <span className="text-white text-sm">Já trabalho como afiliado de alguma empresa</span>
                </label>

                {formData.has_experience && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conte sobre sua experiência:</label>
                        <textarea
                            rows={2}
                            value={formData.experience_details}
                            onChange={(e) => setFormData({ ...formData, experience_details: e.target.value })}
                            className="w-full px-4 py-3 bg-[#0A0A0A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00FF99] transition-colors resize-none"
                            placeholder="Quais empresas, resultados..."
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
// APPLICATION MODAL
// ============================================================================
function ApplicationModal({ onClose, onSubmit, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0A0A0A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-[#1A1A1A] hover:bg-[#333] rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00E88C] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,153,0.3)]">
                            <Sparkles className="w-6 h-6 text-black" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Torne-se um Parceiro</h2>
                        <p className="text-gray-400">
                            Preencha o formulário para aplicarmos sua candidatura ao programa.
                        </p>
                    </div>

                    <ApplicationForm onSubmit={onSubmit} loading={loading} />
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// LANDING PAGE COMPONENT (Redesigned)
// ============================================================================
function LandingPage({ onOpenModal, hasSubscription }) {
    return (
        <div className="max-w-6xl mx-auto space-y-16">

            {/* 1. HERO SECTION COM DEGRADÊ CHAMATIVO */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-950 to-black opacity-90"></div>

                {/* Efeito de brilho de fundo */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FF99] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500 opacity-20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[#00FF99] text-xs font-bold mb-6 backdrop-blur-md uppercase tracking-wider">
                            <Star size={12} fill="#00FF99" />
                            Oferta Exclusiva para Membros
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-none">
                            Ganhe até mais de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF99] to-[#00E88C]">
                                R$ 1.000,00
                            </span> com <br />
                            CADA indicação.
                        </h1>

                        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl leading-relaxed">
                            Junte-se a mais de <b className="text-white">600 afiliados</b> que já estão vendendo SwiftBot todos os dias e construindo uma renda recorrente sólida.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch gap-4 justify-center md:justify-start">
                            {hasSubscription ? (
                                <button
                                    onClick={onOpenModal}
                                    className="px-8 py-4 bg-[#00FF99] text-black text-lg font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] hover:bg-[#00E88C] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Quero Me Tornar um Afiliado
                                    <ArrowRight size={20} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={onOpenModal}
                                        className="w-full sm:w-auto px-6 py-4 bg-white/10 border border-white/20 text-white text-base font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-center"
                                    >
                                        Começar com 20%
                                        <ArrowRight size={18} />
                                    </button>

                                    <a
                                        href="/dashboard?open_plans=true"
                                        className="w-full sm:w-auto px-6 py-4 bg-[#00FF99] text-black text-base font-bold rounded-xl hover:bg-[#00E88C] hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all flex items-center justify-center gap-2 text-center"
                                    >
                                        Assinar e Ganhar 30%
                                        <Sparkles size={18} />
                                    </a>
                                </>
                            )}
                            <div className="hidden sm:flex items-center text-sm text-gray-400 max-w-[120px] leading-tight">
                                * Vagas limitadas para este mês
                            </div>
                        </div>
                    </div>

                    {/* Elemento visual (Ilustração de Lucro) */}
                    <div className="hidden md:flex flex-1 justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#00FF99]/20 to-transparent blur-3xl pointer-events-none"></div>
                        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Seus Ganhos</p>
                                    <h3 className="text-3xl font-bold text-[#00FF99]">R$ 4.520,00</h3>
                                </div>
                                <div className="bg-[#00FF99]/20 p-3 rounded-xl">
                                    <TrendingUp className="text-[#00FF99]" size={24} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Users size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">2 Conexões Mensais</p>
                                        <p className="text-gray-500 text-xs">Há 2 minutos</p>
                                    </div>
                                    <span className="text-[#00FF99] font-bold">+R$ 89,70</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Users size={14} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">4 Conexões Mensais</p>
                                        <p className="text-gray-500 text-xs">Há 45 minutos</p>
                                    </div>
                                    <span className="text-[#00FF99] font-bold">+R$ 149,00</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <Users size={14} className="text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">1 Conexão Mensal</p>
                                        <p className="text-gray-500 text-xs">Há 2 horas</p>
                                    </div>
                                    <span className="text-[#00FF99] font-bold">+R$ 29,90</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS & SOCIAL PROOF */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-[#222] hover:border-[#333] transition-colors">
                    <p className="text-3xl md:text-4xl font-bold text-white mb-1">+600</p>
                    <p className="text-gray-500 text-sm">Afiliados Ativos</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-[#222] hover:border-[#333] transition-colors">
                    <p className="text-3xl md:text-4xl font-bold text-white mb-1">{hasSubscription ? '30%' : '20%'}</p>
                    <p className="text-gray-500 text-sm">Comissão Recorrente</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-[#222] hover:border-[#333] transition-colors">
                    <p className="text-3xl md:text-4xl font-bold text-white mb-1">24h</p>
                    <p className="text-gray-500 text-sm">Suporte Dedicado</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-[#222] hover:border-[#333] transition-colors">
                    <p className="text-3xl md:text-4xl font-bold text-white mb-1">R$ 4mi+</p>
                    <p className="text-gray-500 text-sm">Em Comissões Pagas</p>
                </div>
            </div>

            {/* 3. BENEFITS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A1A1A] rounded-2xl p-8 hover:bg-[#222] transition-colors cursor-default group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={80} className="text-[#00FF99]" />
                    </div>
                    <div className="w-14 h-14 mb-6 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:border-green-500/50 transition-colors">
                        <TrendingUp className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Comissão Recorrente</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Ganhe <b>{hasSubscription ? '30%' : '20%'} de comissão</b> sobre a <b>primeira mensalidade</b> do cliente indicado. Receba uma alta recompensa pelo seu esforço inicial de venda.
                    </p>
                </div>

                <div className="bg-[#1A1A1A] rounded-2xl p-8 hover:bg-[#222] transition-colors cursor-default group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-blue-400" />
                    </div>
                    <div className="w-14 h-14 mb-6 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                        <Wallet className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Pagamentos Automáticos</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Esqueça a burocracia. O sistema Stripe Connect repassa sua parte automaticamente direto para sua conta bancária a cada venda.
                    </p>
                </div>

                <div className="bg-[#1A1A1A] rounded-2xl p-8 hover:bg-[#222] transition-colors cursor-default group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck size={80} className="text-purple-400" />
                    </div>
                    <div className="w-14 h-14 mb-6 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/50 transition-colors">
                        <ShieldCheck className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Produto Validado</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Venda um produto que as empresas AMAM. O SwiftBot tem alta taxa de retenção e é essencial para negócios modernos.
                    </p>
                </div>
            </div>

            {/* 4. FOOTER NOTE */}
            <div className="text-center pb-8 border-t border-[#222] pt-8">
                <p className="text-gray-500 text-sm">
                    Dúvidas? Entre em contato com nosso time de parceiros em <span className="text-white hover:text-[#00FF99] cursor-pointer transition-colors">partners@swiftbot.com.br</span>
                </p>
            </div>
        </div>
    )
}

// ============================================================================
// CREATE CODE MODAL (Mantido igual, apenas referência)
// ============================================================================
function CreateCodeModal({ onClose, onSuccess }) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleCreate = async () => {
        if (code.length < 3) {
            setError('O código deve ter pelo menos 3 caracteres')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/affiliates/create-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            })
            const data = await response.json()

            if (data.success) {
                onSuccess()
                onClose()
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao criar código')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-[#333]">
                <h3 className="text-xl font-bold text-white mb-4">Crie seu Código de Indicação</h3>
                <p className="text-gray-400 text-sm mb-6">
                    MUITO IMPORTANTE: Escolha com sabedoria, este código <b>não poderá ser alterado</b> posteriormente.
                </p>

                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Seu Código</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        className="w-full px-4 py-3 bg-[#0A0A0A] rounded-xl text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00FF99] border-none uppercase text-center text-xl tracking-widest"
                        placeholder="EXEMPLO123"
                        maxLength={15}
                    />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCreate}
                    disabled={loading || code.length < 3}
                    className="w-full py-3 bg-[#00FF99] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Criando...' : 'Confirmar Código'}
                </button>
                <button
                    onClick={onClose}
                    className="w-full mt-3 py-2 text-gray-500 hover:text-white transition-colors text-sm"
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// SALES CHART COMPONENT (Mantido igual)
// ============================================================================
function SalesChart({ title, data, period, onPeriodChange, customRange, onCustomRangeChange }) {
    const [range, setRange] = useState({
        from: customRange.start ? new Date(customRange.start + 'T12:00:00') : undefined,
        to: customRange.end ? new Date(customRange.end + 'T12:00:00') : undefined
    })
    const [error, setError] = useState('')
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const pickerRef = useRef(null)

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsPickerOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Sincronizar estado local com props quando mudam externamente (reset)
    useEffect(() => {
        if (customRange.start && customRange.end) {
            const start = new Date(customRange.start + 'T12:00:00')
            const end = new Date(customRange.end + 'T12:00:00')
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                setRange({ from: start, to: end })
            }
        }
    }, [customRange])

    const handleRangeSelect = (selectedRange, selectedDay) => {
        setError('')

        if (range?.from && range?.to) {
            setRange({ from: selectedDay, to: undefined })
            return
        }

        let newRange = selectedRange ? { ...selectedRange } : { from: undefined, to: undefined }

        if (newRange.from && newRange.to) {
            const diff = differenceInDays(newRange.to, newRange.from)
            if (diff > 10) {
                newRange.to = addDays(newRange.from, 10)
                setError('O intervalo máximo é de 10 dias. Ajustado automaticamente.')
            }
        }

        setRange(newRange)

        if (newRange.from && newRange.to) {
            onCustomRangeChange({
                start: format(newRange.from, 'yyyy-MM-dd'),
                end: format(newRange.to, 'yyyy-MM-dd')
            })
        }
    }

    const css = `
        .custom-range-middle { background-color: transparent !important; color: white !important; position: relative; z-index: 1; }
        .custom-range-middle::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 40px; transform: translateY(-50%); background-color: rgba(0, 255, 153, 0.15); z-index: -1; }
        .custom-range-start, .custom-range-end { background-color: #00FF99 !important; color: black !important; font-weight: bold; border-radius: 50%; position: relative; z-index: 2; }
        .custom-selected:not(.custom-range-middle):not(.custom-range-start):not(.custom-range-end) { background-color: #00FF99 !important; color: black !important; font-weight: bold; border-radius: 50%; position: relative; z-index: 2; }
        .custom-range-start:not(.custom-range-end)::before { content: ''; position: absolute; top: 50%; right: 0; width: 50%; height: 40px; transform: translateY(-50%); background-color: rgba(0, 255, 153, 0.15); z-index: -1; }
        .custom-range-end:not(.custom-range-start)::before { content: ''; position: absolute; top: 50%; left: 0; width: 50%; height: 40px; transform: translateY(-50%); background-color: rgba(0, 255, 153, 0.15); z-index: -1; }
        .custom-today { color: #00FF99 !important; font-weight: bold; }
        .rdp-day { border: none !important; outline: none !important; box-shadow: none !important; background-color: transparent; }
        .custom-nav-button { color: #00FF99 !important; }
        .custom-nav-button:hover { background-color: #333 !important; }
        #custom-date-picker svg { fill: #00FF99 !important; color: #00FF99 !important; stroke: #00FF99 !important; }
        #custom-date-picker svg path { fill: #00FF99 !important; stroke: #00FF99 !important; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0A0A0A; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
    `

    return (
        <div className="bg-[#1A1A1A] rounded-2xl p-6 h-full flex flex-col relative z-0">
            <style>{css}</style>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 z-10 relative">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-[#00FF99]" size={20} />
                    {title}
                </h3>

                <div className="flex items-center gap-3">
                    {period === 'daily' && (
                        <div className="relative" ref={pickerRef}>
                            <button
                                onClick={() => setIsPickerOpen(!isPickerOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isPickerOpen
                                    ? 'bg-[#222] border-[#00FF99] text-white'
                                    : 'bg-[#0A0A0A] border-[#333] text-gray-300 hover:border-gray-500'
                                    }`}
                            >
                                <Calendar size={16} className={isPickerOpen ? 'text-[#00FF99]' : 'text-gray-400'} />
                                <span>
                                    {range.from ? format(range.from, 'dd/MM/yyyy') : 'Data Início'}
                                    {' - '}
                                    {range.to ? format(range.to, 'dd/MM/yyyy') : 'Data Fim'}
                                </span>
                                <ChevronDown size={14} className={`transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPickerOpen && (
                                <div id="custom-date-picker" className="absolute right-0 top-full mt-2 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 z-50 min-w-[320px] animate-in fade-in slide-in-from-top-2">
                                    <DayPicker
                                        mode="range"
                                        defaultMonth={range.from}
                                        selected={range}
                                        onSelect={handleRangeSelect}
                                        locale={ptBR}
                                        numberOfMonths={1}
                                        classNames={{
                                            selected: 'custom-selected',
                                            range_start: 'custom-range-start',
                                            range_end: 'custom-range-end',
                                            range_middle: 'custom-range-middle',
                                            today: 'custom-today',
                                            nav_button: 'rdp-nav_button custom-nav-button',
                                            nav_icon: 'rdp-nav_icon custom-nav-icon'
                                        }}
                                    />
                                    {error && (
                                        <div className="mt-3 text-red-400 text-xs font-medium text-center bg-red-500/10 py-2 rounded border border-red-500/20">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center bg-[#0A0A0A] rounded-lg p-1 border border-[#333]">
                        <button
                            onClick={() => onPeriodChange('daily')}
                            className={`px-3 py-1 rounded-md text-sm transition-all ${period === 'daily' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Dias
                        </button>
                        <button
                            onClick={() => onPeriodChange('monthly')}
                            className={`px-3 py-1 rounded-md text-sm transition-all ${period === 'monthly' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Meses
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[0] relative mt-2">
                <div className="w-full h-full overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
                    <div className="min-w-[700px] h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ left: -20, right: 10 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00FF99" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00FF99" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    tick={{ fill: '#666', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    tickFormatter={(value) => {
                                        if (period === 'monthly') {
                                            const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
                                            const [year, month] = value.split('-')
                                            const monthIndex = parseInt(month) - 1
                                            if (monthIndex >= 0 && monthIndex < 12) {
                                                return `${months[monthIndex]}/${year.slice(2)}`
                                            }
                                            return value
                                        }
                                        return value.split('-')[2] + '/' + value.split('-')[1]
                                    }}
                                />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fill: '#666', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#00FF99', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#00FF99' }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Comissão']}
                                    labelFormatter={(label) => {
                                        if (period === 'monthly' && label.length === 7) {
                                            const [year, month] = label.split('-')
                                            const d = new Date(parseInt(year), parseInt(month) - 1, 2)
                                            return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
                                        }
                                        const d = new Date(label + 'T12:00:00')
                                        return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#00FF99"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// AFFILIATE DASHBOARD COMPONENT (Mantido igual)
// ============================================================================
function AffiliateDashboard({ affiliate, stats, history, referralLink, onRefreshOnboarding, onRefreshData }) {
    const [copied, setCopied] = useState(false)
    const [showCodeModal, setShowCodeModal] = useState(false)
    const [chartPeriod, setChartPeriod] = useState('daily')

    const today = new Date().toISOString().split('T')[0]
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 9)
    const initialStart = tenDaysAgo.toISOString().split('T')[0]

    const [customRange, setCustomRange] = useState({
        start: initialStart,
        end: today
    })

    const copyLink = async () => {
        if (!referralLink) return
        await navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const [portalLoading, setPortalLoading] = useState(false)

    const handleOpenPortal = async () => {
        setPortalLoading(true)
        try {
            const response = await fetch('/api/affiliates/portal', {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success && data.url) {
                window.open(data.url, '_blank')
            } else {
                alert('Erro ao abrir portal: ' + (data.error || 'Tente novamente'))
            }
        } catch (error) {
            alert('Erro de conexão. Tente novamente.')
        } finally {
            setPortalLoading(false)
        }
    }

    const getChartData = () => {
        if (chartPeriod === 'monthly') {
            return history?.monthly?.slice(-12) || []
        }

        if (!history?.daily) return []

        let start = new Date(customRange.start)
        let end = new Date(customRange.end)
        start = new Date(customRange.start + 'T00:00:00')
        end = new Date(customRange.end + 'T00:00:00')

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return []
        if (end < start) return []

        const dataMap = new Map(history.daily.map(item => [item.date, item.value]))
        const result = []

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            result.push({
                date: dateStr,
                value: dataMap.get(dateStr) || 0
            })
        }

        return result
    }

    const chartData = getChartData()

    if (!affiliate.stripe_onboarding_complete) {
        return (
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl p-8 shadow-lg">
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
                    <div className="mt-8 pt-6 border-t border-[#333]">
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm text-gray-500 hover:text-white underline transition-colors"
                        >
                            Já completei o cadastro
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Invisible SVG definition for Gradient Icon */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="btnIconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8A2BE2" />
                        <stop offset="50%" stopColor="#00BFFF" />
                        <stop offset="100%" stopColor="#00FF99" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex justify-end">
                <div className="p-[2px] rounded-2xl bg-gradient-to-r from-[#8A2BE2] via-[#00BFFF] to-[#00FF99]">
                    <button
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                        className="px-8 py-4 bg-[#121212] hover:bg-[#1A1A1A] rounded-[14px] text-white transition-all flex items-center gap-3 text-base font-bold relative group"
                    >
                        {portalLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ExternalLink
                                size={20}
                                style={{ stroke: "url(#btnIconGradient)" }}
                                className="group-hover:scale-110 transition-transform duration-300"
                            />
                        )}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                            Acessar Painel Financeiro (Stripe)
                        </span>
                    </button>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Gift className="text-[#00FF99]" />
                        Seu Link de Indicação
                    </h3>
                    <p className="text-gray-400 text-sm">Compartilhe este link e ganhe 30% sobre a primeira venda.</p>
                </div>

                <div className="flex-1 w-full md:max-w-xl">
                    {referralLink ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-[#0A0A0A] rounded-xl px-4 py-3 text-gray-300 truncate font-mono text-sm">
                                {referralLink}
                            </div>
                            <button
                                onClick={copyLink}
                                className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-[#00FF99] text-black hover:shadow-[0_0_20px_rgba(0,255,153,0.3)]'
                                    }`}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCodeModal(true)}
                            className="w-full py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            Criar Link de Indicação
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#1A1A1A] rounded-2xl p-6 hover:bg-[#222] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Usuários Ativos</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.referrals?.active || 0}</p>
                </div>

                <div className="bg-[#1A1A1A] rounded-2xl p-6 hover:bg-[#222] transition-colors relative group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            Saldo Pendente (30 dias)
                            <div className="relative group/tooltip">
                                <Info size={16} className="text-gray-500 cursor-help hover:text-[#00FF99] transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-black/90 border border-[#333] rounded-xl text-xs text-gray-300 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                    <p>
                                        Os repasses são <b>automáticos</b>! O valor será transferido diretamente para sua conta bancária cadastrada na Stripe 30 dias após a confirmação de cada pagamento. <span className="text-[#00FF99]">Sem burocracia de saque manual.</span>
                                    </p>
                                    {/* Seta do tooltip */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                                </div>
                            </div>
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {(stats?.commissions?.total_pending || 0).toFixed(2)}</p>
                </div>

                <div className="bg-[#1A1A1A] rounded-2xl p-6 hover:bg-[#222] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Total Ganho</span>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {(stats?.total_earned || 0).toFixed(2)}</p>
                </div>
            </div>

            <div className="h-[500px] lg:h-[400px]">
                <SalesChart
                    title="Histórico de Comissões"
                    data={chartData}
                    period={chartPeriod}
                    onPeriodChange={setChartPeriod}
                    customRange={customRange}
                    onCustomRangeChange={setCustomRange}
                />
            </div>

            {showCodeModal && (
                <CreateCodeModal
                    onClose={() => setShowCodeModal(false)}
                    onSuccess={onRefreshData}
                />
            )}
        </div>
    )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AffiliatesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-[#00FF99] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AffiliatesContent />
        </Suspense>
    )
}

function AffiliatesContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState(null)
    const [dashboardData, setDashboardData] = useState(null)
    const [hasSubscription, setHasSubscription] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showApplicationModal, setShowApplicationModal] = useState(false)

    useEffect(() => {
        checkUser()
    }, [])

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
                setShowApplicationModal(false)
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
            const response = await fetch('/api/affiliates/onboarding', { method: 'POST' })
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

                    <div className="mb-12">
                        {status?.is_affiliate && (
                            <>
                                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                                    Portal do Afiliado
                                </h1>
                                <p className="text-gray-400 text-lg">
                                    Bem-vindo de volta! Acompanhe seus resultados e comissões.
                                </p>
                            </>
                        )}
                        {!status?.is_affiliate && !status?.has_application && (
                            // Header customizado já está no componente LandingPage
                            <></>
                        )}
                    </div>

                    {message.text && !status?.has_application && (
                        <div className={`mb-8 p-4 rounded-xl backdrop-blur-md ${message.type === 'success'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {status?.is_affiliate ? (
                        <AffiliateDashboard
                            affiliate={status.affiliate}
                            stats={dashboardData?.stats}
                            history={dashboardData?.history}
                            referralLink={dashboardData?.referral_link}
                            onRefreshOnboarding={handleStartOnboarding}
                            onRefreshData={loadDashboard}
                        />
                    ) : status?.has_application ? (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                {/* Fundo com Gradiente e Efeitos */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-950 to-black opacity-90"></div>
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#00FF99] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500 opacity-20 blur-[80px] rounded-full pointer-events-none"></div>

                                <div className="relative z-10 p-12 text-center">
                                    <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 ${status.application.status === 'pending'
                                        ? 'bg-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
                                        : status.application.status === 'approved'
                                            ? 'bg-[#00FF99]/20 shadow-[0_0_30px_rgba(0,255,153,0.3)]'
                                            : 'bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                                        }`}>
                                        <Clock className={`w-10 h-10 ${status.application.status === 'pending'
                                            ? 'text-yellow-400'
                                            : status.application.status === 'approved'
                                                ? 'text-[#00FF99]'
                                                : 'text-red-400'
                                            }`} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                        {status.application.status === 'pending' && 'Candidatura em Análise'}
                                        {status.application.status === 'approved' && 'Candidatura Aprovada!'}
                                        {status.application.status === 'rejected' && 'Candidatura Não Aprovada'}
                                    </h2>
                                    <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
                                        {status.application.status === 'pending' && 'Sua candidatura está sendo analisada pela nossa equipe. Entraremos em contato em breve.'}
                                        {status.application.status === 'approved' && 'Parabéns! Sua candidatura foi aprovada. Recarregue a página para acessar seu portal.'}
                                        {status.application.status === 'rejected' && (status.application.rejection_reason || 'Infelizmente sua candidatura não foi aprovada no momento.')}
                                    </p>
                                </div>
                            </div>
                            {message.text && (
                                <div className={`p-4 rounded-xl backdrop-blur-md text-center ${message.type === 'success'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    ) : (
                        <LandingPage
                            onOpenModal={() => setShowApplicationModal(true)}
                            hasSubscription={hasSubscription}
                        />
                    )}

                    {/* RENDERIZAR O MODAL SE NECESSÁRIO */}
                    {showApplicationModal && (
                        <ApplicationModal
                            onClose={() => setShowApplicationModal(false)}
                            onSubmit={handleApply}
                            loading={submitting}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}
