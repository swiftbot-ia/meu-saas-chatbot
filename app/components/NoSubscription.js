'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Zap, ArrowRight } from 'lucide-react';

/**
 * NoSubscription Component
 * Displayed to users without active subscription
 * Premium call-to-action to encourage subscription purchase
 */
export default function NoSubscription() {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                {/* Icon with glow effect */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-[#00FF99] blur-3xl opacity-20 rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-full border border-[#00FF99]/30">
                        <Lock className="w-16 h-16 text-[#00FF99]" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Conteúdo Premium
                </h1>

                {/* Subtitle with gradient */}
                <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[#00FF99] to-[#00E88C] bg-clip-text text-transparent mb-6">
                    Desbloqueie todo o potencial da SwiftBot
                </p>

                {/* Description */}
                <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                    Esta funcionalidade é exclusiva para assinantes. Tenha acesso completo a automação de WhatsApp,
                    agente IA inteligente, funil de vendas e muito mais.
                </p>

                {/* Features list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Zap className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium">Agente IA</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Zap className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium">CRM</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Zap className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium">Planejador empresarial</p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleUpgrade}
                    className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold text-lg px-10 py-5 rounded-full hover:shadow-[0_0_40px_rgba(0,255,153,0.4)] transition-all duration-300 transform hover:scale-105"
                >
                    <span>Comprar Assinatura</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Subtext */}
                <p className="text-gray-500 text-sm mt-6">
                    Escolha o plano ideal para o seu negócio
                </p>
            </div>
        </div>
    );
}
