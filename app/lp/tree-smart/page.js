'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Floating Header tailored for Tree Smart
const HeaderTS = () => {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
            <div className={`transition-all duration-300 backdrop-blur-md bg-[#2a2a2a]/90 rounded-full px-4 md:px-6 shadow-2xl border border-white/5 ${scrolled ? 'py-2 md:py-3' : 'py-3 md:py-4'}`}>
                <div className="flex items-center justify-between gap-3 md:gap-16">
                    {/* Logo Area */}
                    <Link href="/lp/tree-smart" className="flex items-center gap-2 md:gap-3 group">
                        <div className="relative w-8 h-8 md:w-12 md:h-12 overflow-hidden rounded-full bg-black/20">
                            <Image
                                src="/logo-tech-tree.webp"
                                alt="Tree Smart Logo"
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-sm md:text-xl leading-none">Tree Smart</span>
                            <span className="text-[#00FF99] text-[8px] md:text-xs font-medium tracking-wider uppercase">Parceiro Certificado</span>
                        </div>
                    </Link>

                    {/* Desktop/Mobile CTA */}
                    <nav className="flex items-center">
                        <Link
                            href="#contato"
                            className="inline-flex items-center px-4 py-2 md:px-6 md:py-2.5 bg-[#00FF99] hover:bg-[#00cc7a] text-black font-bold text-xs md:text-base rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(0,255,153,0.2)] whitespace-nowrap"
                        >
                            Falar com especialista
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}

export default function PartnerLandingPage() {
    const router = useRouter()

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in')
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: 0.1 })

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    return (
        <div className="min-h-screen bg-[#E1DFDB] selection:bg-[#00FF99] selection:text-black font-sans">
            <HeaderTS />

            {/* HERO SECTION - With Video Particles */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20">
                {/* Background Video */}
                <div className="absolute inset-0 bg-black rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        poster="/particles-poster.jpg"
                    >
                        <source src="/particles-background.webm" type="video/webm" />
                    </video>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/90"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8 animate-fade-in-up backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-[#00FF99] animate-pulse" />
                        <span className="text-gray-200 text-sm font-medium tracking-wide">Tecnologia Certificada SwiftBot</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] animate-fade-in-up delay-100 font-[Inter]">
                        Escale seu negócio <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF99] to-[#00cc7a]">com Inteligência.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light animate-fade-in-up delay-200">
                        Você sabe que precisa de IA, mas não tem tempo para configurar.
                        A <strong>Tree Smart</strong> implementa, treina e otimiza seu agente SwiftBot para você não se preocupar com nada.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
                        <button
                            onClick={() => router.push('/lp/tree-smart/consultoria')}
                            className="px-8 py-4 bg-[#00FF99] text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(0,255,153,0.4)]"
                        >
                            Solicitar Diagnóstico Gratuito
                        </button>
                        <a
                            href="#diferenciais"
                            className="text-white hover:text-[#00FF99] transition-colors font-medium flex items-center gap-2 group"
                        >
                            Entenda como funciona
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* PAIN SECTION */}
            <section className="py-24 bg-[#E1DFDB] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                        <h2 className="text-4xl md:text-6xl font-light text-black mb-6 leading-tight">
                            Você é especialista no seu business. <br />
                            <span className="font-semibold">Nós somos especialistas em IA.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                            <div className="space-y-8">
                                {[
                                    { title: "Tempo é Dinheiro", text: "Passar horas configurando prompts e fluxos é tempo que você perde de vender e gerir sua equipe." },
                                    { title: "Complexidade Técnica", text: "Webhooks, API keys, Context Window... Deixe esses termos técnicos com a gente." },
                                    { title: "Risco de Imagem", text: "Um agente mal configurado pode falar besteira para seu cliente. Nós garantimos a segurança e o tom de voz correto." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold group-hover:bg-[#00FF99] group-hover:text-black transition-colors duration-300">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-black mb-2">{item.title}</h3>
                                            <p className="text-gray-600 leading-relaxed font-light">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TECHNICAL SECTION - Refined Content */}
                        <div className="relative animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
                            <div className="bg-white rounded-[40px] p-10 md:p-12 shadow-xl border border-black/5 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF99]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
                                        <svg className="w-8 h-8 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold text-black mb-4">Deixe a "Tecniquês" com a Tree Smart</h3>
                                    <p className="text-gray-600 mb-6 text-lg font-light leading-relaxed">
                                        Para um agente de IA performar como um humano, ele precisa de <strong>Engenharia de Prompt</strong>, <strong>Base de Conhecimento Estruturada</strong> e <strong>Testes de Estresse</strong>.
                                    </p>
                                    <p className="text-gray-600 text-lg font-light leading-relaxed">
                                        Nós traduzimos seu manual de vendas para a linguagem que a IA entende perfeitamente. Você entrega o "O Quê" (conhecimento do produto), nós entregamos o "Como" (a tecnologia).
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {[
                                            "/testimonials/fernando.webp",
                                            "/testimonials/lucas.webp",
                                            "/testimonials/juliana.webp"
                                        ].map((src, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white relative overflow-hidden">
                                                <Image
                                                    src={src}
                                                    alt="Cliente Tree Smart"
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-500 font-medium">+150 Agentes Implementados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS / DIFFERENTIALS */}
            <section id="diferenciais" className="py-24 bg-black rounded-t-[40px] md:rounded-t-[80px] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden -mt-10 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                        <h2 className="text-4xl md:text-6xl font-light text-white mb-6">
                            O padrão <span className="text-[#00FF99] font-bold">Tree Smart</span> de qualidade.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Immersion & Setup",
                                desc: "Mergulhamos no seu negócio. Estudamos seus melhores vendedores e replicamos a técnica deles no agente.",
                                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            },
                            {
                                title: "Humanização Extrema",
                                desc: " Configuramos delays de digitação, gírias locais (se necessário) e empatia para que o cliente não perceba que é um robô.",
                                icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            },
                            {
                                title: "Acompanhamento ROI",
                                desc: "Não entregamos e sumimos. Monitoramos os primeiros atendimentos para garantir que a conversão está acontecendo.",
                                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group p-8 bg-[#111] border border-white/10 rounded-[40px] hover:border-[#00FF99]/50 transition-all duration-300 animate-on-scroll opacity-0 translate-y-10 hover:bg-[#1a1a1a]"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-[#00FF99] to-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:scale-110 transition-transform shadow-lg shadow-[#00FF99]/20">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed font-light text-lg">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section id="contato" className="py-32 bg-[#E1DFDB] md:rounded-t-none relative overflow-hidden -mt-10 z-10">
                <div className="absolute inset-0 bg-[#00FF99] opacity-[0.03]" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                    <h2 className="text-4xl md:text-7xl font-bold text-black mb-8 tracking-tight">
                        Seu próximo passo <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00cc7a] to-[#00995c]">começa aqui.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light">
                        Preencha o formulário de diagnóstico. Eu (Cleiton) vou analisar pessoalmente seu negócio.
                    </p>
                    <button
                        onClick={() => router.push('/lp/tree-smart/consultoria')}
                        className="px-12 py-6 bg-gradient-to-r from-[#00cc7a] to-[#00995c] text-white rounded-full font-bold text-xl hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl border border-transparent"
                    >
                        AGENDAR CONSULTORIA
                    </button>
                    <p className="mt-8 text-sm text-gray-500 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Disponibilidade limitada para novos parceiros esta semana.
                    </p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 bg-[#050505] border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative w-12 h-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <Image
                                src="/logo-tech-tree.webp"
                                alt="Tree Smart Logo"
                                width={48}
                                height={48}
                                className="object-cover w-full h-full rounded-full"
                            />
                        </div>
                        <p className="text-gray-600 text-sm">
                            &copy; {new Date().getFullYear()} Tree Smart Solutions - Parceiro Certificado SwiftBot.<br />
                            Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>

            {/* STYLES FOR ANIMATIONS */}
            <style jsx global>{`
                .animate-in {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    opacity: 0;
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
            `}</style>
        </div>
    )
}
