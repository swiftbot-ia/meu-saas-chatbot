'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import Image from 'next/image'

export default function ConfirmacaoTreeSmart() {
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

                <div className="w-24 h-24 bg-[#00FF99]/20 rounded-full flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
                    <Image
                        src="/logo-tech-tree.webp"
                        alt="Tree Smart Logo"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full rounded-full opacity-80"
                    />
                </div>

                <h1 className="text-4xl font-bold">Solicitação Recebida!</h1>

                <p className="text-gray-400 text-lg leading-relaxed">
                    Obrigado por confiar na <strong className="text-white">Tree Smart</strong>. <br />
                    Eu, <strong>Cleiton Calixto</strong>, já recebi seus dados e estou analisando seu perfil.
                </p>

                <div className="bg-[#111] p-6 rounded-3xl border border-white/10">
                    <p className="text-sm text-gray-300 mb-2">O que acontece agora?</p>
                    <p className="text-[#00FF99] font-medium">Entrarei em contato pelo WhatsApp fornecido em breve para agendarmos nossa conversa.</p>
                </div>

                <div className="pt-8">
                    <button
                        onClick={() => router.push('/lp/tree-smart')}
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
