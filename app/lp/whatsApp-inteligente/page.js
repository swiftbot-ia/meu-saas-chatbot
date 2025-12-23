'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { isValidPhoneNumber } from 'react-phone-number-input'
import PhoneInput from '../components/PhoneInput'
import { getUtmFromStorage } from '@/lib/utmUtils'

export default function WhatsAppInteligentePage() {
    const router = useRouter()

    // Form states
    const [step, setStep] = useState(1) // 1: WhatsApp, 2: Email
    const [phone, setPhone] = useState('')
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
                setStep(2) // Avança para email
            } else {
                setError('Este número não possui WhatsApp ativo. Verifique e tente novamente.')
            }
        } catch (err) {
            console.error(err)
            // Fail-safe: avança mesmo com erro
            setStep(2)
        } finally {
            setIsLoading(false)
        }
    }

    // Registra o lead
    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError('')

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
                    email,
                    utmParams,
                    source: 'lp-whatsapp-inteligente'
                })
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
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
        <div className="min-h-screen bg-[#020202] text-white font-sans">
            {/* Top Bar */}
            <div className="bg-[#00E08F] py-3.5 px-5">
                <div className="flex items-center justify-center gap-4 flex-wrap text-sm font-semibold text-black">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                        <span>AO VIVO</span>
                    </div>
                    <span className="opacity-50">•</span>
                    <span>Sábado, 28 de Dezembro às 10h (Brasília)</span>
                    <span className="opacity-50">•</span>
                    <span className="bg-black/15 px-3.5 py-1 rounded-full">Sem replay</span>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative py-20 px-5 text-center overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

                <div className="relative z-10 max-w-[900px] mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 bg-[#141414] border border-[#27272A] rounded-full px-5 py-2.5 mb-10">
                        <span className="w-1.5 h-1.5 bg-[#00E08F] rounded-full" />
                        <span className="text-sm text-[#A1A1AA]">Live 100% gratuita no YouTube</span>
                    </div>

                    <h1 className="text-[clamp(40px,8vw,72px)] font-extrabold leading-[1.05] tracking-tight mb-8">
                        Configure seu<br />
                        <span className="bg-gradient-to-r from-[#FF9966] to-[#FF5E62] bg-clip-text text-transparent">
                            Agente de Vendas IA
                        </span><br />
                        em 15 minutos
                    </h1>

                    <p className="text-[clamp(16px,3vw,20px)] text-[#A1A1AA] max-w-[600px] mx-auto mb-12">
                        Ao vivo, vamos mostrar como transformar seu WhatsApp em uma{' '}
                        <strong className="text-white font-medium">máquina de vendas automática</strong>{' '}
                        usando seus próprios dados.
                    </p>

                    {/* Countdown */}
                    <div className="flex justify-center gap-4 mb-12">
                        {[
                            { value: countdown.days, label: 'Dias' },
                            { value: countdown.hours, label: 'Horas' },
                            { value: countdown.minutes, label: 'Min' },
                            { value: countdown.seconds, label: 'Seg' }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-20 h-20 bg-[#141414] border border-[#27272A] rounded-2xl flex items-center justify-center mb-2">
                                    <span className="text-3xl font-bold">{formatNumber(item.value)}</span>
                                </div>
                                <span className="text-xs text-[#71717A] uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    {!success ? (
                        <div className="max-w-[500px] mx-auto">
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
                                            className="px-8 py-4 bg-[#00E08F] text-black text-base font-semibold rounded-full whitespace-nowrap transition-all hover:bg-[#00C27A] hover:scale-[1.02] disabled:opacity-50"
                                        >
                                            {isLoading ? 'Verificando...' : 'Continuar'}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                    <p className="text-sm text-[#71717A] mt-4">🔒 Seus dados estão seguros. Enviaremos apenas o link da live.</p>
                                </form>
                            ) : (
                                <form onSubmit={handleEmailSubmit}>
                                    <div className="flex gap-3 flex-col sm:flex-row">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Seu melhor e-mail"
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-4 bg-[#0D0D0D] border border-[#27272A] rounded-full text-white text-base outline-none focus:border-[#00E08F] transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-4 bg-[#00E08F] text-black text-base font-semibold rounded-full whitespace-nowrap transition-all hover:bg-[#00C27A] hover:scale-[1.02] disabled:opacity-50"
                                        >
                                            {isLoading ? 'Inscrevendo...' : 'Quero participar'}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                    <p className="text-sm text-[#71717A] mt-4">WhatsApp: {phone}</p>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-[500px] mx-auto bg-[#141414] border border-[#00E08F]/30 rounded-2xl p-8">
                            <div className="w-14 h-14 bg-[#00E08F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-[#00E08F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold mb-1">Inscrição confirmada!</p>
                            <p className="text-[#A1A1AA] text-base">Verifique seu e-mail para receber o link do YouTube.</p>
                        </div>
                    )}

                    {/* Trust badges */}
                    <div className="flex justify-center gap-8 mt-12 text-sm text-[#71717A] flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-[#00E08F]">✓</span>
                            <span>+500 empresas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#00E08F]">✓</span>
                            <span>Cases reais</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#00E08F]">✓</span>
                            <span>YouTube Live</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-24 px-5 bg-[#0D0D0D]">
                <div className="max-w-[900px] mx-auto">
                    <h2 className="text-[clamp(28px,5vw,40px)] font-bold text-center mb-4">
                        Você já perdeu vendas por{' '}
                        <span className="bg-gradient-to-r from-[#FF9966] to-[#FF5E62] bg-clip-text text-transparent">
                            não responder a tempo
                        </span>?
                    </h2>
                    <p className="text-lg text-[#A1A1AA] text-center mb-14">
                        Se você vende pelo WhatsApp, provavelmente já passou por isso:
                    </p>

                    <div className="flex flex-col gap-4 max-w-[700px] mx-auto">
                        {[
                            'Lead chega às 23h, você responde às 9h e ele já comprou do concorrente',
                            'Não consegue escalar porque depende de você para vender',
                            'Gasta com anúncios mas desperdiça leads por demora no atendimento',
                            'Contrata gente que não conhece o produto como você conhece',
                            'Toma decisões baseadas em achismo, não em dados reais'
                        ].map((problem, i) => (
                            <div key={i} className="flex items-center gap-4 bg-[#141414] border border-[#27272A] rounded-2xl p-6">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-red-400">
                                    ✕
                                </div>
                                <span className="text-[#E4E4E7] text-base">{problem}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-center mt-16 text-xl text-[#A1A1AA]">
                        E se você pudesse <strong className="text-white">clonar seu conhecimento</strong><br />
                        e colocar para trabalhar 24h por dia?
                    </p>
                </div>
            </section>

            {/* Learn Section */}
            <section className="py-24 px-5 relative overflow-hidden">
                <div className="absolute top-1/2 right-[-200px] -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(14,165,233,0.08)_0%,transparent_60%)] pointer-events-none" />

                <div className="max-w-[900px] mx-auto relative z-10">
                    <p className="text-sm font-semibold text-[#00E08F] uppercase tracking-widest text-center mb-4">
                        O que você vai aprender
                    </p>
                    <h2 className="text-[clamp(28px,5vw,40px)] font-bold text-center mb-12">
                        Em 40 minutos, você vai sair sabendo:
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[700px] mx-auto">
                        {[
                            { num: '01', title: 'Criar seu Agente de Vendas IA', desc: 'Passo a passo para configurar um bot que conhece seu produto e lida com objeções reais.' },
                            { num: '02', title: 'Descobrir insights do WhatsApp', desc: 'Como usar IA para analisar conversas e descobrir o que clientes realmente querem.' },
                            { num: '03', title: 'Automatizar sem parecer robô', desc: 'Sequências de follow-up que funcionam e não deixam leads abandonados.' },
                            { num: '04', title: 'Criar copy que converte', desc: 'Estratégias de mensagens baseadas em dados reais, não em achismo.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#141414] border border-[#27272A] rounded-2xl p-6 hover:border-[#3F3F46] transition-colors">
                                <span className="text-sm font-bold bg-gradient-to-br from-[#D946EF] to-[#8B5CF6] bg-clip-text text-transparent">
                                    {item.num}
                                </span>
                                <h3 className="text-lg font-semibold mt-2.5 mb-2">{item.title}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bonus */}
                    <div className="mt-8 max-w-[700px] mx-auto bg-gradient-to-br from-[rgba(255,153,102,0.08)] to-[rgba(255,94,98,0.08)] border border-[rgba(255,153,102,0.2)] rounded-2xl p-6">
                        <div className="flex gap-4 items-start">
                            <div className="w-11 h-11 bg-[rgba(255,153,102,0.15)] rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                                🎁
                            </div>
                            <div>
                                <p className="font-semibold mb-2 bg-gradient-to-r from-[#FF9966] to-[#FF5E62] bg-clip-text text-transparent">
                                    Bônus: Case real ao vivo
                                </p>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                                    Vamos mostrar o painel de uma clínica de depilação que usa o SwiftBot.
                                    Dados reais: pacote mais vendido, melhor horário para follow-up, e insights que nem o dono sabia.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Who Section */}
            <section className="py-24 px-5 bg-[#0D0D0D]">
                <div className="max-w-[900px] mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[700px] mx-auto">
                        {/* Positive */}
                        <div className="bg-[#141414] border border-[rgba(0,224,143,0.2)] rounded-2xl p-7">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-lg bg-[rgba(0,224,143,0.1)] flex items-center justify-center text-[#00E08F] text-sm">
                                    ✓
                                </div>
                                <span className="font-semibold text-base">Essa live é para você se:</span>
                            </div>
                            <ul className="space-y-3.5">
                                {[
                                    'Vende pelo WhatsApp (qualquer nicho)',
                                    'Tem pelo menos 100 conversas',
                                    'Quer automatizar sem perder personalização',
                                    'Está cansado de perder leads por demora',
                                    'Quer decisões baseadas em dados'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-[#E4E4E7]">
                                        <span className="text-[#00E08F] mt-0.5">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Negative */}
                        <div className="bg-[#141414] border border-[#27272A] rounded-2xl p-7">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-lg bg-[#27272A] flex items-center justify-center text-[#71717A] text-sm">
                                    ✕
                                </div>
                                <span className="font-semibold text-base text-[#A1A1AA]">Não é para você se:</span>
                            </div>
                            <ul className="space-y-3.5">
                                {[
                                    'Ainda não vende pelo WhatsApp',
                                    'Tem menos de 100 conversas',
                                    'Quer fórmula mágica sem aplicar',
                                    'Não tem 40 minutos para investir',
                                    'Acha que IA não funciona para vendas'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-[#71717A]">
                                        <span className="text-[#52525B] mt-0.5">✕</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Presenters Section */}
            <section className="py-24 px-5 relative overflow-hidden">
                <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_60%)] pointer-events-none" />

                <div className="max-w-[900px] mx-auto relative z-10">
                    <p className="text-sm font-semibold text-[#00E08F] uppercase tracking-widest text-center mb-4">
                        Quem vai apresentar
                    </p>
                    <h2 className="text-[clamp(28px,5vw,40px)] font-bold text-center mb-4">
                        Direto de Dubai para sua tela
                    </h2>
                    <p className="text-lg text-[#A1A1AA] text-center mb-14">
                        2 apresentadores principais + convidados especiais
                    </p>

                    <div className="flex justify-center gap-6 flex-wrap">
                        <div className="bg-[#141414] border border-[#27272A] rounded-2xl p-9 text-center w-[220px]">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D946EF] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 text-4xl">
                                👨‍💻
                            </div>
                            <p className="font-semibold mb-1">Apresentador Principal</p>
                            <p className="text-sm text-[#71717A]">Criador do SwiftBot</p>
                        </div>

                        <div className="bg-[#141414] border border-[#27272A] rounded-2xl p-9 text-center w-[220px]">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00E08F] to-[#0EA5E9] flex items-center justify-center mx-auto mb-4 text-4xl">
                                🎯
                            </div>
                            <p className="font-semibold mb-1">Co-apresentador</p>
                            <p className="text-sm text-[#71717A]">Especialista em Copy</p>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-sm text-[#52525B]">
                        + Convidados especiais que usam SwiftBot no dia a dia
                    </p>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 px-5 bg-[#0D0D0D] text-center">
                <div className="max-w-[900px] mx-auto">
                    <div className="inline-flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-full px-5 py-2.5 mb-10">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-400">Essa live não terá replay disponível</span>
                    </div>

                    <h2 className="text-[clamp(32px,6vw,48px)] font-bold mb-2">Sábado, 28 de Dezembro</h2>
                    <p className="text-[clamp(28px,5vw,40px)] font-bold bg-gradient-to-r from-[#FF9966] to-[#FF5E62] bg-clip-text text-transparent mb-4">
                        10h da manhã
                    </p>
                    <p className="text-base text-[#A1A1AA] mb-10">
                        Horário de Brasília • 40 minutos • YouTube Live
                    </p>

                    {!success ? (
                        <div className="max-w-[400px] mx-auto">
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
                                        className="w-full px-8 py-4.5 bg-[#00E08F] text-black text-lg font-semibold rounded-full transition-all hover:bg-[#00C27A] hover:scale-[1.02] disabled:opacity-50"
                                    >
                                        {isLoading ? 'Verificando...' : 'Garantir minha vaga gratuita'}
                                    </button>
                                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                </form>
                            ) : (
                                <form onSubmit={handleEmailSubmit}>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Seu melhor e-mail"
                                        disabled={isLoading}
                                        className="w-full px-6 py-4 bg-[#0D0D0D] border border-[#27272A] rounded-full text-white text-center text-base outline-none focus:border-[#00E08F] transition-colors mb-4"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full px-8 py-4.5 bg-[#00E08F] text-black text-lg font-semibold rounded-full transition-all hover:bg-[#00C27A] hover:scale-[1.02] disabled:opacity-50"
                                    >
                                        {isLoading ? 'Inscrevendo...' : 'Garantir minha vaga gratuita'}
                                    </button>
                                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                                </form>
                            )}
                            <p className="text-sm text-[#71717A] mt-5">
                                É grátis. Não vamos vender nada na live. Só conteúdo.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-[400px] mx-auto bg-[#141414] border border-[#00E08F]/30 rounded-2xl p-8">
                            <div className="w-14 h-14 bg-[#00E08F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-[#00E08F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold mb-1">Você está dentro!</p>
                            <p className="text-[#A1A1AA] text-base">Confira seu e-mail e anote: 28/12 às 10h</p>
                        </div>
                    )}

                    <div className="flex justify-center gap-6 mt-12 text-sm text-[#52525B] flex-wrap">
                        <span>🔒 100% Gratuito</span>
                        <span>📺 YouTube Live</span>
                        <span>⏰ 40 minutos</span>
                        <span>🎁 Case real</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-5 border-t border-[#27272A] text-center">
                <p className="text-sm text-[#71717A]">
                    <strong className="text-white font-semibold">SwiftBot</strong> — Seu Clone Digital de Vendas
                </p>
                <p className="text-xs text-[#52525B] mt-2">
                    © {new Date().getFullYear()} SwiftBot. Todos os direitos reservados.
                </p>
            </footer>
        </div>
    )
}
