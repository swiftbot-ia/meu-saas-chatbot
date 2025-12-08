'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock, ArrowRight, Brain } from 'lucide-react';

/**
 * SwiftBotTrial Component
 * Displayed to trial users (not yet paid)
 * Shows that SwiftBot IA is building their knowledge base
 */
export default function SwiftBotTrial({ trialEndDate }) {
    const router = useRouter();

    // Calculate when the feature will be available (trial end date)
    const formatDate = (dateStr) => {
        if (!dateStr) return { date: 'em breve', time: '' };
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { date: day, time };
    };

    const { date, time } = formatDate(trialEndDate);

    const handleUpgrade = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                {/* Animated Icon */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-[#00FF99] blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-full border border-[#00FF99]/30">
                        <Brain className="w-16 h-16 text-[#00FF99] animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Estamos preparando o SwiftBot IA
                </h1>

                {/* Subtitle with gradient */}
                <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[#00FF99] to-[#00E88C] bg-clip-text text-transparent mb-6">
                    Sua inteligência de negócios está sendo construída
                </p>

                {/* Description */}
                <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                    O SwiftBot IA está analisando suas conversas do WhatsApp para criar uma base de conhecimento
                    personalizada para o seu negócio. Este recurso estará disponível após o período de testes.
                </p>

                {/* Availability date box */}
                <div className="bg-[#111111] rounded-2xl p-6 mb-8 max-w-md mx-auto border border-[#00FF99]/20">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-[#00FF99]" />
                        <span className="text-gray-400 text-sm">Disponível a partir de</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {date}
                        {time && <span className="text-[#00FF99]"> às {time}</span>}
                    </p>
                </div>

                {/* Features being prepared */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Sparkles className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Análise de Conversas</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Sparkles className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Scripts Personalizados</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <Sparkles className="w-8 h-8 text-[#00FF99] mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Insights de Vendas</p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleUpgrade}
                    className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold text-lg px-10 py-5 rounded-full hover:shadow-[0_0_40px_rgba(0,255,153,0.4)] transition-all duration-300 transform hover:scale-105"
                >
                    <span>Ativar Agora</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Subtext */}
                <p className="text-gray-500 text-sm mt-6">
                    Assine e tenha acesso imediato ao SwiftBot IA
                </p>
            </div>
        </div>
    );
}
