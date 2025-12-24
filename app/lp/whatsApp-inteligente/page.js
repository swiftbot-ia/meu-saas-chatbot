'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isValidPhoneNumber } from 'react-phone-number-input'
import PhoneInput from '../components/PhoneInput'
import { getUtmFromStorage } from '@/lib/utmUtils'

export default function WhatsAppInteligentePage() {
    const router = useRouter()

    // Form states
    const [step, setStep] = useState(1) // 1: WhatsApp, 2: Name+Email
    const [phone, setPhone] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [utmParams, setUtmParams] = useState(null)

    // Countdown
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    // Target date: 28 de Dezembro 2025, 10h Brasília (13h UTC)
    const targetDate = new Date('2025-12-28T13:00:00Z')

    useEffect(() => {
        // Captura UTMs
        const params = getUtmFromStorage()
        if (params) setUtmParams(params)

        // Countdown timer
        const updateCountdown = () => {
            const now = new Date()
            const diff = targetDate - now

            if (diff > 0) {
                setCountdown({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / (1000 * 60)) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                })
            }
        }

        updateCountdown()
        const timer = setInterval(updateCountdown, 1000)
        return () => clearInterval(timer)
    }, [])

    // Valida WhatsApp via UAZAPI
    const handleWhatsAppSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!phone || !isValidPhoneNumber(phone)) {
            setError('Número de WhatsApp inválido')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/lp/check-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })

            const data = await res.json()

            if (data.valid) {
                setStep(2)
            } else {
                setError('Este número não possui WhatsApp ativo. Verifique e tente novamente.')
            }
        } catch (err) {
            console.error(err)
            setStep(2)
        } finally {
            setIsLoading(false)
        }
    }

    // Registra o lead
    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!name || name.trim().length < 2) {
            setError('Nome inválido')
            return
        }

        if (!email || !email.includes('@')) {
            setError('Email inválido')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/lp/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp: phone,
                    name,
                    email,
                    utmParams,
                    source: 'lp-whatsapp-inteligente'
                })
            })

            const data = await res.json()

            if (data.success) {
                router.push('/lp/whatsApp-inteligente/obrigado')
            } else {
                setError('Erro ao registrar. Tente novamente.')
            }
        } catch (err) {
            console.error(err)
            setError('Erro ao registrar. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatNumber = (num) => String(num).padStart(2, '0')

    return (
        <div className="min-h-screen bg-[#E1DFDB] relative overflow-x-hidden">
            <main className="relative z-10">
                {/* Hero Section - Black with background image */}
                <section className="relative min-h-screen flex items-center justify-center overflow-visible bg-transparent pb-12 md:pb-20">
                    <div className="absolute inset-0 bg-black rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
                        {/* Background image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
                            style={{ backgroundImage: "url('/backgrout-lp.webp')" }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 md:pt-0">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8">
                            <span className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse" />
                            <span className="text-sm text-white/80">AO VIVO • Sábado, 28 de Dezembro às 10h</span>
                        </div>

                        <h1
                            className="text-5xl md:text-7xl font-black text-white mb-6 md:mb-8 leading-tight"
                            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                            Configure seu <br />
                            <span className="text-[#00FF99]">Agente de Vendas IA</span><br />
                            em 15 minutos
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
                            Ao vivo, vamos mostrar como transformar seu WhatsApp em uma{' '}
                            <span className="text-[#00FF99] font-medium">máquina de vendas automática</span>{' '}
                            usando seus próprios dados.
                        </p>

                        {/* Countdown */}
                        <div className="flex justify-center gap-3 md:gap-4 mb-10">
                            {[
                                { value: countdown.days, label: 'Dias' },
                                { value: countdown.hours, label: 'Horas' },
                                { value: countdown.minutes, label: 'Min' },
                                { value: countdown.seconds, label: 'Seg' }
                            ].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2">
                                        <span className="text-2xl md:text-3xl font-bold text-white">{formatNumber(item.value)}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Form */}
                        {!success ? (
                            <div className="max-w-md mx-auto">
                                {step === 1 ? (
                                    <form onSubmit={handleWhatsAppSubmit}>
                                        <div className="flex gap-3 flex-col sm:flex-row">
                                            <div className="flex-1">
                                                <PhoneInput
                                                    value={phone}
                                                    onChange={setPhone}
                                                    placeholder="Seu WhatsApp"
                                                    disabled={isLoading}
                                                    error={!!error}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-8 py-4 bg-[#00FF99] text-black rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 hover:bg-[#00E88C] disabled:opacity-50"
                                            >
                                                {isLoading ? 'Verificando...' : 'Continuar'}
                                            </button>
                                        </div>
                                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                    </form>
                                ) : (
                                    <form onSubmit={handleEmailSubmit}>
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Seu nome"
                                                disabled={isLoading}
                                                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-full text-white text-base outline-none focus:ring-2 focus:ring-[#00FF99] transition-all placeholder-gray-400"
                                            />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Seu melhor e-mail"
                                                disabled={isLoading}
                                                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-full text-white text-base outline-none focus:ring-2 focus:ring-[#00FF99] transition-all placeholder-gray-400"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full px-8 py-4 bg-[#00FF99] text-black rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 hover:bg-[#00E88C] disabled:opacity-50"
                                            >
                                                {isLoading ? 'Inscrevendo...' : 'Quero participar'}
                                            </button>
                                        </div>
                                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                        <p className="text-sm text-gray-400 mt-4">WhatsApp: {phone}</p>
                                    </form>
                                )}
                                <p className="text-xs md:text-sm text-gray-400 mt-6">
                                    Live 100% gratuita no YouTube • Sem replay disponível
                                </p>
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* Problem Section - Beige */}
                <section className="py-24 bg-[#E1DFDB] relative overflow-hidden">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-6xl font-light text-black mb-6 leading-tight">
                                Você já perdeu vendas por <br />
                                <span className="font-normal text-black">não responder a tempo?</span>
                            </h2>
                            <p className="text-lg text-gray-600 font-light">
                                Se você vende pelo WhatsApp, provavelmente já passou por isso:
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                { number: "01", title: "Leads Perdidos", text: "Lead chega às 23h, você responde às 9h e ele já comprou do concorrente." },
                                { number: "02", title: "Gargalo de Crescimento", text: "Não consegue escalar porque depende de você para vender." },
                                { number: "03", title: "Investimento Desperdiçado", text: "Gasta com anúncios mas desperdiça leads por demora no atendimento." }
                            ].map((item, idx) => (
                                <div key={idx} className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/80 transition-all duration-500">
                                    <div className="text-[#00FF99] text-sm font-medium mb-4 tracking-wider">{item.number}</div>
                                    <h3 className="text-xl font-medium text-black mb-4 leading-snug">{item.title}</h3>
                                    <p className="text-gray-600 leading-relaxed font-light text-[15px]">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-center mt-16 text-xl text-gray-600 font-light">
                            E se você pudesse <strong className="text-black font-medium">clonar seu conhecimento</strong><br />
                            e colocar para trabalhar 24h por dia?
                        </p>
                    </div>
                </section>

                {/* Learn Section - Black */}
                <section className="py-24 bg-black rounded-t-[40px] md:rounded-t-[80px] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden -mt-1">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <p className="text-sm font-medium text-[#00FF99] uppercase tracking-widest mb-4">O que você vai aprender</p>
                            <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
                                Em 40 minutos, você vai <span className="font-normal">sair sabendo:</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {[
                                { num: '01', title: 'Criar seu Agente de Vendas IA', desc: 'Passo a passo para configurar um bot que conhece seu produto e lida com objeções reais.', gradient: 'from-green-400 to-emerald-500' },
                                { num: '02', title: 'Descobrir insights do WhatsApp', desc: 'Como usar IA para analisar conversas e descobrir o que clientes realmente querem.', gradient: 'from-purple-400 to-pink-500' },
                                { num: '03', title: 'Automatizar sem parecer robô', desc: 'Sequências de follow-up que funcionam e não deixam leads abandonados.', gradient: 'from-cyan-400 to-blue-500' },
                                { num: '04', title: 'Criar copy que converte', desc: 'Estratégias de mensagens baseadas em dados reais, não em achismo.', gradient: 'from-orange-400 to-pink-500' }
                            ].map((item, i) => (
                                <div key={i} className={`relative bg-gradient-to-br ${item.gradient} p-[1px] rounded-3xl`}>
                                    <div className="bg-black rounded-3xl p-8 h-full">
                                        <span className={`text-sm font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                                            {item.num}
                                        </span>
                                        <h3 className="text-xl font-medium text-white mt-3 mb-3">{item.title}</h3>
                                        <p className="text-gray-400 leading-relaxed font-light">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bonus */}
                        <div className="mt-10 max-w-4xl mx-auto">
                            <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-[1px] rounded-3xl">
                                <div className="bg-black rounded-3xl p-8 flex gap-6 items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white text-lg mb-2">
                                            Bônus: Case real ao vivo
                                        </p>
                                        <p className="text-gray-400 leading-relaxed font-light">
                                            Vamos mostrar o painel de uma clínica de depilação que usa o SwiftBot.
                                            Dados reais: pacote mais vendido, melhor horário para follow-up, e insights que nem o dono sabia.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* For Who Section - Beige */}
                <section className="py-24 bg-[#E1DFDB] relative overflow-hidden">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {/* Positive */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/80 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-[#00FF99] flex items-center justify-center">
                                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-black text-lg">Essa live é para você se:</span>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Vende pelo WhatsApp (qualquer nicho)',
                                        'Tem pelo menos 100 conversas',
                                        'Quer automatizar sem perder personalização',
                                        'Está cansado de perder leads por demora',
                                        'Quer decisões baseadas em dados'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-700 font-light">
                                            <svg className="w-5 h-5 text-[#00FF99] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Negative */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-500 text-lg">Não é para você se:</span>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        'Ainda não vende pelo WhatsApp',
                                        'Tem menos de 100 conversas',
                                        'Quer fórmula mágica sem aplicar',
                                        'Não tem 40 minutos para investir',
                                        'Acha que IA não funciona para vendas'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-500 font-light">
                                            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Presenters Section - Black */}
                <section className="py-24 bg-black rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-1">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <p className="text-sm font-medium text-[#00FF99] uppercase tracking-widest mb-4">Quem vai apresentar</p>
                            <h2 className="text-4xl md:text-6xl font-light text-white mb-4 leading-tight">
                                Direto de Dubai <span className="font-normal">para sua tela.</span>
                            </h2>
                            <p className="text-lg text-gray-400 font-light">
                                2 apresentadores principais + convidados especiais
                            </p>
                        </div>

                        <div className="flex justify-center gap-6 flex-wrap">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-[1px] rounded-3xl">
                                <div className="bg-black rounded-3xl p-8 text-center w-[220px]">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                    </div>
                                    <p className="font-medium text-white mb-1">Apresentador Principal</p>
                                    <p className="text-sm text-gray-400">Criador do SwiftBot</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#00FF99] to-cyan-500 p-[1px] rounded-3xl">
                                <div className="bg-black rounded-3xl p-8 text-center w-[220px]">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00FF99] to-cyan-500 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                                            <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
                                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <p className="font-medium text-white mb-1">Co-apresentador</p>
                                    <p className="text-sm text-gray-400">Especialista em Copy</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center mt-8 text-sm text-gray-500">
                            + Convidados especiais que usam SwiftBot no dia a dia
                        </p>
                    </div>
                </section>

                {/* Final CTA Section - Black */}
                <section className="py-24 bg-black relative overflow-hidden">
                    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2.5 bg-red-500/20 rounded-full px-5 py-2.5 mb-8">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-red-400">Essa live não terá replay disponível</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-light text-white mb-4 leading-tight">
                            Sábado, 28 de Dezembro
                        </h2>
                        <p className="text-3xl md:text-5xl font-medium text-[#00FF99] mb-4">
                            10h da manhã
                        </p>
                        <p className="text-lg text-gray-400 mb-10 font-light">
                            Horário de Brasília • 40 minutos • YouTube Live
                        </p>

                        {!success ? (
                            <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-3xl p-8">
                                {step === 1 ? (
                                    <form onSubmit={handleWhatsAppSubmit}>
                                        <PhoneInput
                                            value={phone}
                                            onChange={setPhone}
                                            placeholder="Seu WhatsApp"
                                            disabled={isLoading}
                                            error={!!error}
                                            className="mb-4"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full px-8 py-4 bg-[#00FF99] text-black text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:bg-[#00E88C] disabled:opacity-50"
                                        >
                                            {isLoading ? 'Verificando...' : 'Garantir minha vaga gratuita'}
                                        </button>
                                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                    </form>
                                ) : (
                                    <form onSubmit={handleEmailSubmit}>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Seu nome"
                                            disabled={isLoading}
                                            className="w-full px-6 py-4 bg-white/10 rounded-full text-white text-center text-base outline-none focus:ring-2 focus:ring-[#00FF99] transition-all mb-3 placeholder-gray-400"
                                        />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Seu melhor e-mail"
                                            disabled={isLoading}
                                            className="w-full px-6 py-4 bg-white/10 rounded-full text-white text-center text-base outline-none focus:ring-2 focus:ring-[#00FF99] transition-all mb-4 placeholder-gray-400"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full px-8 py-4 bg-[#00FF99] text-black text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:bg-[#00E88C] disabled:opacity-50"
                                        >
                                            {isLoading ? 'Inscrevendo...' : 'Garantir minha vaga gratuita'}
                                        </button>
                                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                    </form>
                                )}
                                <p className="text-sm text-gray-400 mt-5 font-light">
                                    É grátis. Não vamos vender nada na live. Só conteúdo.
                                </p>
                            </div>
                        ) : null}

                        <div className="flex items-center justify-center flex-wrap gap-6 mt-10 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>+500 empresas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Cases reais</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>YouTube Live</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-10 px-5 bg-black text-center border-t border-white/10">
                <p className="text-sm text-gray-400">
                    <strong className="text-white font-semibold">SwiftBot</strong> — Seu Clone Digital de Vendas
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    © {new Date().getFullYear()} SwiftBot. Todos os direitos reservados.
                </p>
            </footer>
        </div>
    )
}
