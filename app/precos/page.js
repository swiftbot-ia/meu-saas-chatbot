// app/precos/page.js
'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Pricing() {
  const router = useRouter()
  const [visibleElements, setVisibleElements] = useState(new Set())
  const [billingPeriod, setBillingPeriod] = useState('annual') // default anual
  const [selectedConnections, setSelectedConnections] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  
  // Refs para elementos que serão animados
  const elementsRef = useRef([])

  // Intersection Observer para animações no scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.dataset.animate]))
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    )

    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Função corrigida para lidar com o slider arrastável
  const handleSliderChange = (e) => {
    const slider = e.currentTarget
    const rect = slider.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const connection = Math.round(percentage * 6) + 1
    setSelectedConnections(Math.max(1, Math.min(7, connection)))
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    handleSliderChange(e)
  }

  // Wrap handleMouseMove in useCallback to prevent dependency warnings
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const sliderElement = document.querySelector('[data-slider="true"]')
      if (sliderElement) {
        const syntheticEvent = {
          clientX: e.clientX,
          currentTarget: sliderElement
        }
        handleSliderChange(syntheticEvent)
      }
    }
  }, [isDragging])

  // Wrap handleMouseUp in useCallback to prevent dependency warnings
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = (e) => {
    setIsDragging(true)
    const touch = e.touches[0]
    const syntheticEvent = {
      clientX: touch.clientX,
      currentTarget: e.currentTarget,
      preventDefault: e.preventDefault
    }
    handleSliderChange(syntheticEvent)
  }

  const handleTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0]
      const syntheticEvent = {
        clientX: touch.clientX,
        currentTarget: e.currentTarget,
        preventDefault: e.preventDefault
      }
      handleSliderChange(syntheticEvent)
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Event listeners para mouse global
  useEffect(() => {
    if (isDragging) {
      // Adicionando os listeners ao 'document' para capturar o movimento do mouse em qualquer lugar da página
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Lógica de preços
  const pricingData = {
    monthly: {
      1: { price: 165, savings: null },
      2: { price: 305, savings: 8 },
      3: { price: 445, savings: 10 },
      4: { price: 585, savings: 11 },
      5: { price: 625, savings: 24, isSuper: true },
      6: { price: 750, savings: 24, isSuper: true },
      7: { price: 875, savings: 24, isSuper: true }
    },
    annual: {
      1: { price: 150, savings: null },
      2: { price: 275, savings: 8 },
      3: { price: 400, savings: 11 },
      4: { price: 525, savings: 12 },
      5: { price: 525, savings: 30, isSuper: true },
      6: { price: 630, savings: 30, isSuper: true },
      7: { price: 735, savings: 30, isSuper: true }
    }
  }

  const getCurrentPricing = () => {
    return pricingData[billingPeriod][selectedConnections]
  }

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced Background Pattern Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `
                 radial-gradient(circle at 25% 25%, rgba(4, 245, 160, 0.15) 1px, transparent 1px),
                 radial-gradient(circle at 75% 75%, rgba(4, 245, 160, 0.1) 1px, transparent 1px)
               `,
               backgroundSize: '60px 60px, 40px 40px'
             }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-black/60 backdrop-blur-xl border-b border-[#04F5A0]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center group cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                <div className="w-6 h-6 bg-[#04F5A0] rounded-sm opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(4,245,160,0.8)]" 
                     style={{
                       clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                     }}
                />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                SwiftBot
              </span>
            </div>
            
            {/* Navigation Menu - Fixed with Link components */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Início
              </Link>
              <Link href="/" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Tecnologia
              </Link>
              <Link href="/" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Soluções
              </Link>
              <Link href="/precos" className="text-[#04F5A0] font-bold">
                Preços
              </Link>
              <Link href="/faq" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                FAQ
              </Link>
            </nav>

            {/* Header Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 font-medium hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/login')}
                className="group relative px-6 py-2 bg-[#04F5A0] text-black rounded-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_25px_rgba(4,245,160,0.6)] hover:scale-105 transform"
              >
                Começar Grátis
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <section className="bg-black py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[0] = el}
              data-animate="pricing-header"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Preços <span className="text-[#04F5A0]">Transparentes</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Escolha o plano ideal para seu negócio. Sem surpresas, sem taxas escondidas.
              </p>
            </div>

            {/* Billing Period Toggle */}
            <div 
              className={`flex justify-center mb-12 transition-all duration-1000 transform ${
                visibleElements.has('billing-toggle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[1] = el}
              data-animate="billing-toggle"
            >
              <div className="bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-2xl p-2 flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                    billingPeriod === 'monthly' 
                      ? 'bg-[#04F5A0] text-black shadow-[0_0_20px_rgba(4,245,160,0.6)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center ${
                    billingPeriod === 'annual' 
                      ? 'bg-[#04F5A0] text-black shadow-[0_0_20px_rgba(4,245,160,0.6)]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Anual
                  {billingPeriod === 'annual' && (
                    <span className="ml-2 bg-black/30 text-[#04F5A0] px-2 py-1 rounded-lg text-xs font-bold">
                      -10%
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Connections Slider */}
            <div 
              className={`bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-3xl p-8 mb-12 transition-all duration-1000 transform ${
                visibleElements.has('slider') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[2] = el}
              data-animate="slider"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Quantas conexões você precisa?
                </h3>
                <p className="text-gray-400">
                  Cada conexão permite atender múltiplos clientes simultaneamente
                </p>
              </div>

              {/* Connection Number Display */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center">
                  <div className="text-6xl font-bold text-[#04F5A0] animate-pulse">
                    {selectedConnections}
                  </div>
                  <div className="ml-4 text-left">
                    <div className="text-xl text-white">
                      {selectedConnections === 1 ? 'Conexão' : 'Conexões'}
                    </div>
                    <div className="text-sm text-gray-400">
                      WhatsApp Business
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="relative mb-8">
                <div 
                  className="relative h-16 bg-[#1A1A1A] rounded-2xl cursor-pointer select-none"
                  data-slider="true"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Track */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#04F5A0]/20 to-[#04F5A0]/40 rounded-2xl" />
                  
                  {/* Fill */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#04F5A0] to-[#03E691] rounded-2xl transition-all duration-300"
                    style={{ width: `${((selectedConnections - 1) / 6) * 100}%` }}
                  />
                  
                  {/* Thumb */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-[0_0_20px_rgba(4,245,160,0.8)] transition-all duration-300 hover:scale-110"
                    style={{ left: `calc(${((selectedConnections - 1) / 6) * 100}% - 16px)` }}
                  >
                    <div className="absolute inset-0 bg-[#04F5A0] rounded-full opacity-30 animate-ping" />
                  </div>

                  {/* Numbers */}
                  <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <div 
                        key={num}
                        className={`text-sm font-bold transition-all duration-300 ${
                          num <= selectedConnections 
                            ? 'text-black drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]' 
                            : 'text-gray-500'
                        }`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features for selected connections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
                  <div className="text-[#04F5A0] text-2xl font-bold mb-2">
                    ~{selectedConnections * 50}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Clientes simultâneos
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
                  <div className="text-[#04F5A0] text-2xl font-bold mb-2">
                    {selectedConnections * 100}k+
                  </div>
                  <div className="text-gray-400 text-sm">
                    Mensagens/mês
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
                  <div className="text-[#04F5A0] text-2xl font-bold mb-2">
                    24/7
                  </div>
                  <div className="text-gray-400 text-sm">
                    Suporte prioritário
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="text-center">
                <div className="mb-4">
                  {getCurrentPricing().savings && (
                    <div className="inline-block bg-gradient-to-r from-[#04F5A0]/20 to-[#04F5A0]/10 px-4 py-2 rounded-full mb-4">
                      <span className="text-[#04F5A0] font-bold">
                        🎉 Economia de {getCurrentPricing().savings}%
                        {getCurrentPricing().isSuper && ' - Super Oferta!'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center mb-8">
                  <span className="text-gray-400 text-2xl mr-2">R$</span>
                  <span className="text-6xl font-bold text-white">
                    {formatPrice(getCurrentPricing().price)}
                  </span>
                  <span className="text-gray-400 text-2xl ml-2">/{billingPeriod === 'monthly' ? 'mês' : 'ano'}</span>
                </div>

                {billingPeriod === 'annual' && (
                  <p className="text-sm text-gray-400 mb-6">
                    Equivalente a R$ {formatPrice(Math.round(getCurrentPricing().price / 12))}/mês
                  </p>
                )}
              </div>
            </div>

            {/* Features List */}
            <div 
              className={`bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-3xl p-8 mb-12 transition-all duration-1000 transform ${
                visibleElements.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[3] = el}
              data-animate="features"
            >
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                Tudo que está <span className="text-[#04F5A0]">Incluído</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'IA Conversacional Avançada',
                  'Integração WhatsApp Business',
                  'Dashboard Completo',
                  'Análise de Sentimento',
                  'Respostas Personalizadas',
                  'Histórico de Conversas',
                  'Exportação de Dados',
                  'API Completa',
                  'Suporte 24/7',
                  'Treinamento Personalizado',
                  'Backup Automático',
                  'Conformidade LGPD'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center group">
                    <div className="w-8 h-8 bg-[#04F5A0]/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-[#04F5A0]/20 transition-colors duration-300">
                      <svg className="w-5 h-5 text-[#04F5A0]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-400 mb-6">
                🎯 <span className="text-white font-bold">4 dias grátis</span> para testar • Cancele quando quiser
              </p>
              
              <button
                onClick={() => router.push('/login')}
                className="group relative px-12 py-5 bg-[#04F5A0] text-black rounded-2xl text-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_50px_rgba(4,245,160,1)] hover:scale-110 transform animate-pulse"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-3">⚡</span>
                  Ativar Meus 4 Dias Grátis Agora
                  <span className="ml-3">→</span>
                </span>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Completo */}
      <footer className="bg-black/95 backdrop-blur-xl border-t border-[#04F5A0]/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Logo e Descrição */}
            <div className="text-center md:text-left">
              <div 
                className="flex items-center justify-center md:justify-start mb-6 group cursor-pointer"
                onClick={() => router.push('/')}
              >
                <div className="w-10 h-10 mr-3 flex items-center justify-center">
                  <div className="w-8 h-8 bg-[#04F5A0] rounded-sm group-hover:shadow-[0_0_20px_rgba(4,245,160,0.8)] transition-all duration-300" 
                       style={{
                         clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                       }}
                  />
                </div>
                <span className="text-2xl font-bold text-white group-hover:text-[#04F5A0] transition-colors duration-300 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">SwiftBot</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                A revolução da inteligência artificial no atendimento ao cliente. 
                Feito no Brasil, para empresas brasileiras que querem se destacar.
              </p>
            </div>

            {/* Redes Sociais */}
            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-6 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Redes Sociais</h3>
              <div className="flex justify-center space-x-6">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative w-12 h-12 bg-[#1A1A1A]/60 rounded-xl flex items-center justify-center hover:bg-[#04F5A0]/20 transition-all duration-300 hover:scale-110 transform hover:shadow-[0_0_20px_rgba(4,245,160,0.6)]"
                >
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-[#04F5A0] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative w-12 h-12 bg-[#1A1A1A]/60 rounded-xl flex items-center justify-center hover:bg-[#04F5A0]/20 transition-all duration-300 hover:scale-110 transform hover:shadow-[0_0_20px_rgba(4,245,160,0.6)]"
                >
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-[#04F5A0] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Fale Conosco */}
            <div className="text-center md:text-right">
              <h3 className="text-white font-bold text-lg mb-6 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Fale Conosco</h3>
              <div className="space-y-4">
                <div className="group">
                  <a 
                    href="mailto:contato@swiftbot.com.br" 
                    className="text-gray-400 hover:text-[#04F5A0] transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] flex items-center justify-center md:justify-end"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 8.773l6.545-4.68v-.273h3.819c.904 0 1.636.732 1.636 1.636z"/>
                    </svg>
                    contato@swiftbot.com.br
                  </a>
                </div>
                
                <div className="group">
                  <a 
                    href="https://wa.me/5511999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#04F5A0] transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] flex items-center justify-center md:justify-end"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    (11) 99999-9999
                  </a>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Atendimento humanizado<br />
                  Segunda a Sexta, 9h às 18h
                </p>
              </div>
            </div>
          </div>

          {/* Linha divisória e direitos autorais */}
          <div className="border-t border-[#04F5A0]/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © 2025 SwiftBot | Todos os Direitos Reservados
              </p>
              
              <div className="flex space-x-6">
                <a href="#" className="text-gray-500 hover:text-[#04F5A0] transition-colors duration-300 text-sm hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                  Termos de Uso
                </a>
                <a href="#" className="text-gray-500 hover:text-[#04F5A0] transition-colors duration-300 text-sm hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                  Política de Privacidade
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles para animações aprimoradas */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Disable text selection on slider */
        .select-none {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}