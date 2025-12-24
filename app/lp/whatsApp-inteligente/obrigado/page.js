'use client'

import Link from 'next/link'

export default function ObrigadoPage() {
    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
                <source src="/particles-background.webm" type="video/webm" />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

            {/* Content - Tudo em uma única seção */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
                {/* Success Icon */}
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-[#00FF99] flex items-center justify-center">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Title */}
                <h1
                    className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                    Obrigado por <span className="text-[#00FF99]">confiar na gente!</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                    Sua inscrição foi confirmada. Você receberá o link da live no seu <span className="text-[#00FF99] font-medium">e-mail</span> e <span className="text-[#00FF99] font-medium">WhatsApp</span>.
                </p>

                {/* Gift Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#00FF99] flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-white">
                            Presente: <span className="text-[#00FF99]">4 dias grátis</span> para testar
                        </h2>
                    </div>

                    <p className="text-gray-300 text-sm md:text-base mb-6 font-light">
                        Configure seu agente de vendas IA e comece a vender no automático ainda hoje.
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="https://swiftbot.com.br/login/register"
                        className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#00FF99] text-black rounded-full font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:bg-[#00E88C]"
                    >
                        Começar meu teste grátis
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>4 dias grátis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Setup em 5 minutos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Cancele quando quiser</span>
                    </div>
                </div>

                {/* Footer inline */}
                <p className="text-xs text-gray-500 mt-10">
                    <strong className="text-gray-400 font-medium">SwiftBot</strong> — Seu Clone Digital de Vendas
                </p>
            </div>
        </div>
    )
}
