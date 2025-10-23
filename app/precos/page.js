// app/precos/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Precos() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [connections, setConnections] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef(null)

  // Intersection Observer para animações que reanimam
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          } else {
            entry.target.classList.remove('animate-in')
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
      1: { price: 1800, monthlyEquivalent: 150 },
      2: { price: 3300, monthlyEquivalent: 275 },
      3: { price: 4800, monthlyEquivalent: 400 },
      4: { price: 6336, monthlyEquivalent: 528 },
      5: { price: 7200, monthlyEquivalent: 600 },
      6: { price: 7560, monthlyEquivalent: 630 },
      7: { price: 8820, monthlyEquivalent: 735 }
    }
  }

  const getCurrentPricing = () => {
    return pricingData[billingPeriod][connections] || pricingData[billingPeriod][1]
  }

  const handleSliderChange = (value) => {
    setConnections(value)
  }

  const features = [
    { icon: '🤖', text: 'IA Conversacional Avançada' },
    { icon: '📊', text: 'Dashboard Completo' },
    { icon: '🔄', text: 'Sincronização em Tempo Real' },
    { icon: '📈', text: 'Relatórios e Analytics' },
    { icon: '🔐', text: 'Segurança de Nível Bancário' },
    { icon: '🌐', text: 'API e Webhooks' },
    { icon: '📱', text: 'Multi-dispositivos' },
    { icon: '🎯', text: 'Personalização de Respostas' },
    { icon: '⚡', text: 'Respostas Instantâneas' },
    { icon: '🛡️', text: 'Backup Automático' },
    { icon: '📞', text: 'Suporte de Segunda a Sexta' },
    { icon: '🔄', text: 'Atualizações Contínuas' }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Header FIXO - IGUAL À LANDING PAGE */}
      <header className="fixed top-0 left-0 right-0 z-[200] bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center group cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                <div 
                  className="w-6 h-6 bg-[#00FF99] rounded-sm opacity-90 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                  }}
                />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-[#00FF99] transition-colors duration-300">
                SwiftBot
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/#solucao" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Solução
              </a>
              <a href="/#funcionalidades" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Funcionalidades
              </a>
              <a href="/#depoimentos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Depoimentos
              </a>
              <a href="/#segmentos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Segmentos
              </a>
              <a href="/precos" className="text-[#00FF99] font-semibold hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Preços
              </a>
              <a href="/faq" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                FAQ
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-[#00FF99] transition-colors duration-300 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-lg font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,153,0.5)] hover:scale-105"
              >
                Testar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Espaço para compensar o header fixo */}
      <div className="h-16"></div>

      <main className="relative z-10">
        {/* SEÇÃO UNIFICADA: HERO + BILLING + SLIDER + PREÇO */}
        <section className="py-24 bg-black relative overflow-hidden">
          {/* Gradiente roxo/rosa único para toda a seção */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/30 via-black to-pink-700/30" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Text */}
            <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
                Planos que <span className="text-[#00FF99]">escalam</span> com você
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
                Comece grátis por 4 dias. Sem compromisso, sem surpresas.
              </p>
              <p className="text-sm text-gray-500">
                Cancele quando quiser. Upgrade ou downgrade a qualquer momento.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="bg-black/50 backdrop-blur-sm border border-white/5 rounded-2xl p-2 flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                    billingPeriod === 'monthly' 
                      ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-[0_0_20px_rgba(0,255,153,0.6)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center ${
                    billingPeriod === 'annual' 
                      ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-[0_0_20px_rgba(0,255,153,0.6)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Anual
                  <span className="ml-2 bg-black/30 text-[#00FF99] px-2 py-1 rounded-lg text-xs font-bold">
                    -10%
                  </span>
                </button>
              </div>
            </div>

            {/* Connections Slider + Price */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-black/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Quantas conexões você precisa?
                  </h3>
                  <p className="text-gray-400">
                    Deslize para escolher o número ideal para seu negócio
                  </p>
                </div>

                {/* Número de Conexões Display */}
                <div className="text-center mb-8">
                  <div className="text-7xl font-black text-[#00FF99] mb-2">
                    {connections}
                  </div>
                  <p className="text-gray-300 text-lg">
                    {connections === 1 ? 'Conexão' : 'Conexões'} WhatsApp
                  </p>
                </div>

                {/* Slider */}
                <div className="relative px-4 mb-12">
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={connections}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #00FF99 0%, #00FF99 ${(connections - 1) * 16.66}%, #1f2937 ${(connections - 1) * 16.66}%, #1f2937 100%)`
                    }}
                  />
                  
                  {/* Marcadores */}
                  <div className="flex justify-between mt-4 px-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <div
                        key={num}
                        onClick={() => handleSliderChange(num)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all duration-300 ${
                          connections === num
                            ? 'bg-[#00FF99] text-black scale-110 shadow-[0_0_20px_rgba(0,255,153,0.6)]'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-center border-t border-white/5 pt-8">
                  {billingPeriod === 'monthly' ? (
                    <>
                      <div className="text-6xl font-black text-white mb-2">
                        R$ {getCurrentPricing().price}
                        <span className="text-2xl text-gray-400 font-normal">/mês</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl font-black text-white mb-3">
                        <span className="text-2xl text-gray-400 font-normal">equivalente a </span>
                        R$ {getCurrentPricing().monthlyEquivalent}
                        <span className="text-2xl text-gray-400 font-normal">/mês</span>
                      </div>
                      <div className="text-2xl text-gray-400">
                        R$ {getCurrentPricing().price}/ano
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-8 px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,153,0.7)] hover:scale-105"
                  >
                    Começar Teste Grátis
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    4 dias grátis • Cancele quando quiser • Sem taxas escondidas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TUDO QUE ESTÁ INCLUÍDO */}
<section className="py-24 bg-black relative overflow-hidden">
          {/* A linha abaixo foi removida
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/30 via-black to-indigo-700/30" /> 
          */}
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Tudo que está <span className="text-[#00FF99]">incluído</span>
              </h2>
              <p className="text-xl text-gray-400">
                Todos os recursos. Todos os planos. Sem surpresas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white">{feature.text}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL COM VÍDEO DE FUNDO */}
        <section className="py-24 bg-black relative overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src="/cta-preco.mp4" type="video/mp4" />
          </video>

          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-12 md:p-16 text-center border border-white/5 animate-on-scroll opacity-0 scale-95 transition-all duration-1000">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Pronto para <span className="text-[#00FF99]">escalar</span> seu atendimento?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Teste grátis por 4 dias. Sem compromisso. Sem cartão de crédito (brincadeira, precisa sim, mas não cobramos nada nos primeiros 4 dias 😉)
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,255,153,0.7)] hover:scale-110"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER - IGUAL À LANDING PAGE */}
      <footer className="relative z-10 bg-black border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 mr-2 flex items-center justify-center">
                  <div 
                    className="w-5 h-5 bg-[#00FF99] rounded-sm"
                    style={{
                      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    }}
                  />
                </div>
                <span className="text-lg font-bold text-white">SwiftBot</span>
              </div>
              <p className="text-gray-400 text-sm">
                Clone seu atendimento e escale sua expertise infinitamente.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="/#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Funcionalidades</a></li>
                <li><a href="/#segmentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Segmentos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Segurança</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Sobre</a></li>
                <li><a href="/#depoimentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Depoimentos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Central de Ajuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Contato</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 SwiftBot. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Termos</a>
              <a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">LGPD</a>
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
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #00FF99;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 255, 153, 0.6);
          transition: all 0.3s;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(0, 255, 153, 0.8);
        }

        .slider-thumb::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #00FF99;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 20px rgba(0, 255, 153, 0.6);
          transition: all 0.3s;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(0, 255, 153, 0.8);
        }
      `}</style>
    </div>
  )
}