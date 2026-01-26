'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
// Sidebar not used for LP
import { useEffect } from 'react'

// Simple Header for the LP
const HeaderLP = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Using SwiftBot Logo if available, or text */}
                <div className="w-8 h-8 bg-[#00FF99] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">SwiftBot <span className="text-[#00FF99]">Parceiros</span></span>
            </div>
            <a
                href="#contato"
                className="px-6 py-2 bg-[#00FF99] text-black rounded-full font-bold text-sm hover:bg-[#00e087] transition-all"
            >
                Falar com Especialista
            </a>
        </div>
    </header>
)

export default function PartnerLandingPage() {
    const router = useRouter()

    useEffect(() => {
        // Simple animation trigger
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
        <div className="min-h-screen bg-black text-white selection:bg-[#00FF99] selection:text-black">
            <HeaderLP />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#00FF99]/20 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-[#00FF99] animate-pulse" />
                        <span className="text-gray-400 text-sm font-medium">Parceiro Certificado SwiftBot</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight animate-fade-in-up delay-100">
                        Sua empresa no <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF99] to-[#00cc7a]">piloto automático.</span><br />
                        Sem dor de cabeça.
                    </h1>

                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up delay-200">
                        Você sabe que precisa de IA para escalar seu atendimento, mas não tem tempo para configurar fluxos complexos.
                        Deixe um especialista certificado cuidar de tudo para você.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <button
                            onClick={() => router.push('/lp/AFR/consultoria')}
                            className="px-8 py-4 bg-[#00FF99] text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(0,255,153,0.3)]"
                        >
                            Solicitar Consultoria Gratuita
                        </button>
                        <a
                            href="#como-funciona"
                            className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-medium text-lg hover:bg-white/10 transition-colors"
                        >
                            Ver como funciona
                        </a>
                    </div>
                </div>
            </section>

            {/* PAIN SECTION */}
            <section className="py-24 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                                Você é o especialista do seu negócio.<br />
                                <span className="text-gray-500">Não gaste seu tempo configurando robôs.</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                                Configurar uma IA poderosa exige tempo: prompts, lógica de conversa, integração, testes...
                                Um erro pode custar um cliente.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Perdendo horas aprendendo a ferramenta?",
                                    "Dúvida se o prompt está vendendo ou apenas respondendo?",
                                    "Medo da IA falar o que não deve?",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00FF99]/20 to-purple-500/20 blur-3xl opacity-30 -z-10" />
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
                                            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="text-center">
                                        <p className="text-gray-400 mb-4">Deixe a parte técnica com quem entende.</p>
                                        <div className="inline-block px-4 py-2 bg-[#00FF99]/10 text-[#00FF99] rounded-lg text-sm font-medium">
                                            Solução Certificada SwiftBot
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOLUTION / BENEFITS */}
            <section id="como-funciona" className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Por que contratar uma consultoria?</h2>
                        <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                            Acelere seus resultados com uma implementação profissional e estratégica.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Estratégia Personalizada",
                                desc: "Não é apenas configurar. É desenhar o fluxo de conversa ideal para vender o SEU produto.",
                                icon: (
                                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )
                            },
                            {
                                title: "Setup Completo",
                                desc: "Integração, treinamento da IA, base de conhecimento e testes exaustivos antes de ir para o ar.",
                                icon: (
                                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                )
                            },
                            {
                                title: "Suporte Dedicado",
                                desc: "Acompanhamento nos primeiros dias para garantir que a IA está performando como esperado.",
                                icon: (
                                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group p-8 bg-[#111] border border-white/5 rounded-3xl hover:border-[#00FF99]/30 transition-all duration-300 animate-on-scroll opacity-0 translate-y-10"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="w-12 h-12 bg-[#00FF99] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed font-light">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section id="contato" className="py-24 relative">
                <div className="absolute inset-0 bg-[#00FF99] opacity-[0.03]" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                        Pronto para ter um atendimento <br />
                        <span className="text-[#00FF99]">de classe mundial?</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Preencha o formulário de diagnóstico. Eu vou analisar seu negócio e te mostrar exatamente como a IA pode te ajudar.
                    </p>
                    <button
                        onClick={() => router.push('/lp/AFR/consultoria')}
                        className="px-10 py-5 bg-[#00FF99] text-black rounded-full font-bold text-xl hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(0,255,153,0.4)]"
                    >
                        QUERO MINHA CONSULTORIA
                    </button>
                    <p className="mt-6 text-sm text-gray-500">
                        Parceiro Certificado SwiftBot • Atendimento Humanizado
                    </p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 bg-black border-t border-white/10 text-center">
                <p className="text-gray-600 text-sm">
                    &copy; {new Date().getFullYear()} Cleiton Calixto - Parceiro Certificado SwiftBot.
                </p>
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
