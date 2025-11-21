// app/precos/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'

export default function Precos() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState('annual')
  const [connections, setConnections] = useState(1)

  // Intersection Observer (anima uma vez)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      }
    )

    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Pricing data - 7 PLANOS
  const pricingData = {
    monthly: {
      1: { price: 165, monthlyEquivalent: 165 },
      2: { price: 305, monthlyEquivalent: 305 },
      3: { price: 445, monthlyEquivalent: 445 },
      4: { price: 585, monthlyEquivalent: 585 },
      5: { price: 625, monthlyEquivalent: 625 },
      6: { price: 750, monthlyEquivalent: 750 },
      7: { price: 875, monthlyEquivalent: 875 }
    },
    annual: {
      1: { price: 1776, monthlyEquivalent: 148 },
      2: { price: 3294, monthlyEquivalent: 274 },
      3: { price: 4806, monthlyEquivalent: 400 },
      4: { price: 6318, monthlyEquivalent: 526 },
      5: { price: 6750, monthlyEquivalent: 562 },
      6: { price: 8100, monthlyEquivalent: 675 },
      7: { price: 9450, monthlyEquivalent: 787 }
    }
  }

  const getCurrentPricing = () => {
    return pricingData[billingPeriod][connections] || pricingData[billingPeriod][1]
  }

  const handleSliderChange = (value) => {
    setConnections(value)
  }

  const features = [
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature1)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      text: 'IA Conversacional Avançada' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature2)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      text: 'Dashboard Completo' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature3)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      text: 'Sincronização em Tempo Real' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature4)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      text: 'Relatórios e Analytics' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature5)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      text: 'Segurança de Nível Bancário' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature6)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      text: 'API e Webhooks' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature7)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature7" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      text: 'Multi-dispositivos' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature8)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature8" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      text: 'Personalização de Respostas' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature9)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature9" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      text: 'Respostas Instantâneas' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature10)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature10" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      text: 'Backup Automático' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature11)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature11" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      text: 'Suporte de Segunda a Sexta' 
    },
    { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="url(#gradientFeature12)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradientFeature12" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      text: 'Atualizações Contínuas' 
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Header Importado */}
      <Header />

      <main className="relative z-10">
        {/* SEÇÃO 1: HERO + BILLING + SLIDER + PREÇO (COMPACTA) */}
        {/* CORREÇÃO 1: 'bg-black' removido daqui */}
        <section className="py-20 relative overflow-hidden">
          {/* CORREÇÃO 1: 'bg-black' adicionado aqui para ser o fundo principal */}
          <div className="absolute inset-0 bg-black bg-gradient-to-b from-purple-900/20 via-black/50 to-black" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Hero Text (mais compacto) */}
            <div className="text-center mb-12 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h1 className="text-5xl md:text-7xl font-light text-white mb-4 leading-tight">
                Planos que <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">escalam</span> com você
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-2 font-light">
                Comece grátis por 4 dias. Sem compromisso, sem surpresas.
              </p>
              <p className="text-sm text-gray-500 font-light">
                Cancele quando quiser • Upgrade ou downgrade a qualquer momento
              </p>
            </div>

            {/* Billing Toggle (mais compacto) */}
            <div className="flex justify-center mb-10 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                    billingPeriod === 'monthly' 
                      ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-[0_0_20px_rgba(0,255,153,0.4)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 flex items-center ${
                    billingPeriod === 'annual' 
                      ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-[0_0_20px_rgba(0,255,153,0.4)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Anual
                  <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                    billingPeriod === 'annual' ? 'bg-black/30 text-[#00FF99]' : 'bg-white/10 text-gray-400'
                  }`}>
                    -10%
                  </span>
                </button>
              </div>
            </div>

            {/* Connections Slider + Price (CARD MENOR) */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                    Quantas conexões você precisa?
                  </h3>
                  <p className="text-gray-400 text-sm font-light">
                    Deslize para escolher o número ideal para seu negócio
                  </p>
                </div>

                {/* Número de Conexões Display (menor) */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-light text-[#00FF99] mb-2">
                    {connections}
                  </div>
                  <p className="text-gray-300 text-lg font-light">
                    {connections === 1 ? 'Conexão' : 'Conexões'} WhatsApp
                  </p>
                </div>

                {/* Slider (mais compacto) */}
                <div className="relative px-4 mb-10">
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={connections}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #00FF99 0%, #00FF99 ${(connections - 1) * 16.66}%, #1f2937 ${(connections - 1) * 16.66}%, #1f2937 100%)`
                    }}
                  />
                  
                </div>

                {/* Price Display (mais compacto) */}
                <div className="text-center border-t border-white/10 pt-6">
                  {billingPeriod === 'monthly' ? (
                    <>
                      <div className="text-5xl font-light text-white mb-2">
                        R$ {getCurrentPricing().price}
                        <span className="text-xl text-gray-400 font-light">/mês</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl font-light text-white mb-2">
                        <span className="text-lg text-gray-400 font-light">equivalente a </span>
                        R$ {getCurrentPricing().monthlyEquivalent}
                        <span className="text-xl text-gray-400 font-light">/mês</span>
                      </div>
                      <div className="text-lg text-gray-400 font-light mb-2">
                        R$ {getCurrentPricing().price}/ano
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-6 px-10 py-4 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-full font-semibold text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] hover:scale-105"
                  >
                    Começar Teste Grátis
                  </button>
                  <p className="text-xs text-gray-500 mt-4 font-light">
                    4 dias grátis • Cancele quando quiser • Sem taxas escondidas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: FEATURES (FUNDO BEGE COM ARREDONDAMENTO CORRETO) */}
        <section className="py-24 bg-[#E1DFDB] rounded-t-[40px] md:rounded-t-[80px] relative overflow-visible -mt-1">
          <div className="absolute -top-20 left-0 right-0 h-20 bg-black bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 -z-10" />
          {/* CORREÇÃO 2: Este 'div' (patch) agora é IDÊNTICO ao fundo da Seção 1 */}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-light text-black mb-6 leading-tight">
                Tudo que está <span className="font-normal text-black">incluído</span>
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Todos os recursos. Todos os planos. Sem surpresas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-normal text-black">{feature.text}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

{/* SEÇÃO 3: CTA FINAL COM VÍDEO (COM ARREDONDAMENTO CORRETO) */}
<div className="h-20 md:h-32 bg-[#E1DFDB]" />
<section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-20 md:-mt-32">

  {/* Video Background com arredondamento */}
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover opacity-30 rounded-t-[40px] md:rounded-t-[80px]"
  >
    <source src="/cta-background.mp4" type="video/mp4" />
  </video>

  {/* Overlay com arredondamento */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 rounded-t-[40px] md:rounded-t-[80px]" />
  
  <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center animate-on-scroll opacity-0 scale-95 transition-all duration-1000">
      
      {/* Badge superior */}
      <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-8">
        <div className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse" />
        <span className="text-sm text-gray-300 font-light">Mais de 5.000 empresas já escalaram sua expertise</span>
      </div>

      <h2 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
        Pronto para <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">escalar</span> seu atendimento?
      </h2>
      
      <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
        Teste grátis por 4 dias. Sem compromisso. Cancele quando quiser.
      </p>

      <button
        onClick={() => router.push('/login')}
        className="group relative px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_60px_rgba(0,255,153,0.6)] hover:scale-105 mb-10"
      >
        <span className="relative z-10">Começar Agora</span>
        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Features badges */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
        {[
          { icon: "M5 13l4 4L19 7", text: "4 dias de teste grátis" },
          { icon: "M6 18L18 6M6 6l12 12", text: "Cancele quando quiser" },
          { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Configuração em 5 minutos" }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
            <svg className="w-5 h-5 text-[#00FF99] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-gray-300 font-light">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
      </main>

{/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            
            {/* Coluna 1: Logo e descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0"/>
                     <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1"/>
                  </svg>
                </div>
                <span className="text-xl font-semibold text-white">SwiftBot</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 font-light max-w-sm">
                Clone seu atendimento e escale sua expertise infinitamente. 
                Transforme seu WhatsApp em uma máquina de crescimento autônoma.
              </p>
              <div className="flex space-x-4">
                {/* Social Icons */}
                <a href="https://www.facebook.com/SwiftBott" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/swiftbot.ia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Coluna 2: Produto */}
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-3">
                <li><a href="#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Funcionalidades</a></li>
                <li><a href="#segmentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Segmentos</a></li>
                <li><a href="/precos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Preços</a></li>
              </ul>
            </div>

            {/* Coluna 3: Empresa */}
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Sobre Nós</a></li>
                <li><a href="#depoimentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Depoimentos</a></li>
              </ul>
            </div>

            {/* Coluna 4: Suporte */}
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Central de Ajuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Documentação</a></li>
                <li><a href="mailto:suporte@swiftbot.com.br" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">suporte@swiftbot.com.br</a></li>
                <li><a href="https://wa.me/5511915311105" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">(11) 91531-1105</a></li>

              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm font-light">
              © 2025 SwiftBot. Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="/privacidade" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Privacidade</a>
              <a href="/termos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Termos de Uso</a>
              <a href="/cookies" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Política de Cookies/LGPD</a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Global */}
      <style jsx global>{`
        .animate-on-scroll {
          transition-property: opacity, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) !important;
        }

        /* Custom slider styles */
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00FF99;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 255, 153, 0.5);
          transition: all 0.3s;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(0, 255, 153, 0.7);
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00FF99;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 20px rgba(0, 255, 153, 0.5);
          transition: all 0.3s;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(0, 255, 153, 0.7);
        }
      `}</style>
    </div>
  )
}