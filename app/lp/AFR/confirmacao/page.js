'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function ConfirmacaoAFR() {
    const router = useRouter()

    useEffect(() => {
        // Fire confetti on load
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min, max) => Math.random() * (max - min) + min

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#00FF99', '#ffffff']
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#00FF99', '#ffffff']
            })
        }, 250)
    }, [])

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">

                <div className="w-24 h-24 bg-[#00FF99]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold">Solicitação Recebida!</h1>

                <p className="text-gray-400 text-lg leading-relaxed">
                    Obrigado por confiar no nosso trabalho. <br />
                    Eu, <strong>Cleiton Calixto</strong>, já recebi seus dados e estou analisando seu perfil.
                </p>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <p className="text-sm text-gray-300 mb-2">O que acontece agora?</p>
                    <p className="text-[#00FF99] font-medium">Entrarei em contato pelo WhatsApp fornecido em breve para agendarmos nossa conversa.</p>
                </div>

                <div className="pt-8">
                    <button
                        onClick={() => router.push('/lp/AFR')}
                        className="text-gray-500 hover:text-white transition-colors text-sm underline underline-offset-4"
                    >
                        Voltar para a página inicial
                    </button>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    )
}
