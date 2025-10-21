// app/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const router = useRouter()
  const [visibleElements, setVisibleElements] = useState(new Set())
  
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

  // Dados dos depoimentos
  const testimonials = [
    "Revolucionou nosso atendimento completamente. Clientes mais satisfeitos!",
    "Economizamos 70% do tempo da equipe com essa automação inteligente.",
    "A IA é tão natural que nossos clientes nem percebem a diferença.",
    "ROI incrível! Pagou por si só no primeiro mês de uso."
  ]

  return (
    <div className="min-h-screen bg-black relative">
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
      <header className="sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-[#04F5A0]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center group cursor-pointer">
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
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Início
              </a>
              <a href="#tecnologia" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Tecnologia
              </a>
              <a href="#solucoes" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Soluções
              </a>
              <a href="/precos" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                Preços
              </a>
              <a href="/faq" className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                FAQ
              </a>
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
                Testar 4 Dias Grátis
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Seção 1: Hero */}
        <section id="home" className="bg-black rounded-b-[3rem] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div 
              className={`text-center transition-all duration-1000 transform ${
                visibleElements.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[0] = el}
              data-animate="hero"
            >
              {/* Animated Logo */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-[#04F5A0] rounded-2xl flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 bg-black rounded-sm" 
                         style={{
                           clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                         }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-[#04F5A0] rounded-2xl animate-ping opacity-20" />
                  <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-2xl blur-xl animate-pulse" />
                </div>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent animate-gradient leading-tight">
                A Inteligência Artificial Brasileira que Revoluciona seu WhatsApp
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Atenda <span className="text-[#04F5A0] font-bold">10x mais rápido</span>. 
                <span className="text-white"> Economize 70% em custos</span>. 
                <span className="text-[#04F5A0]"> Cliente satisfeito 24/7</span>.
              </p>

              {/* Hero CTA */}
              <button
                onClick={() => router.push('/login')}
                className="group relative px-8 py-4 bg-[#04F5A0] text-black rounded-2xl text-lg font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_40px_rgba(4,245,160,0.8)] hover:scale-105 transform"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-3">🚀</span>
                  Começar 4 Dias Grátis
                  <span className="ml-3">→</span>
                </span>
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              
              <p className="mt-6 text-sm text-gray-500">
                Não precisa de cartão • Configuração em 5 minutos • Suporte completo
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
                <div className="group cursor-pointer">
                  <div className="text-3xl md:text-4xl font-bold text-[#04F5A0] group-hover:scale-110 transition-transform duration-300">97%</div>
                  <div className="text-gray-400 text-sm mt-2">Taxa de Satisfação</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl md:text-4xl font-bold text-[#04F5A0] group-hover:scale-110 transition-transform duration-300">2.5M+</div>
                  <div className="text-gray-400 text-sm mt-2">Mensagens/Mês</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl md:text-4xl font-bold text-[#04F5A0] group-hover:scale-110 transition-transform duration-300">24/7</div>
                  <div className="text-gray-400 text-sm mt-2">Sempre Online</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl md:text-4xl font-bold text-[#04F5A0] group-hover:scale-110 transition-transform duration-300">5min</div>
                  <div className="text-gray-400 text-sm mt-2">Setup Rápido</div>
                </div>
              </div>

              {/* Testimonials Slider - Fixed quotes */}
              <div className="mt-20 max-w-3xl mx-auto">
                <div className="bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-2xl p-8">
                  <div className="flex items-center justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-6 h-6 text-[#04F5A0]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-lg italic text-center mb-4">
                    {testimonials[0]}
                  </p>
                  <p className="text-[#04F5A0] font-bold text-center">- CEO, TechCorp Brasil</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Tecnologia - Fixed quotes on line 203 */}
        <section id="tecnologia" className="bg-[#050505] rounded-t-[3rem] rounded-b-[3rem] relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('tech-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[1] = el}
              data-animate="tech-header"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                IA que <span className="text-[#04F5A0]">Entende</span> seu Negócio
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Nossa tecnologia exclusiva aprende com cada interação, criando um atendimento verdadeiramente &ldquo;humanizado&rdquo;.
              </p>
            </div>

            {/* Technology Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div 
                className={`group bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(4,245,160,0.3)] transform hover:-translate-y-2 ${
                  visibleElements.has('tech-1') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[2] = el}
                data-animate="tech-1"
              >
                <div className="w-16 h-16 bg-[#04F5A0]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#04F5A0]/20 transition-colors duration-300">
                  <span className="text-3xl">🧠</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">IA Conversacional</h3>
                <p className="text-gray-400 leading-relaxed">
                  Diálogos naturais e contextualizados. Nossa IA mantém o histórico completo da conversa e responde como um atendente humano experiente.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Memória de contexto completa
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Entende gírias e regionalismos
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Respostas personalizadas
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div 
                className={`group bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(4,245,160,0.3)] transform hover:-translate-y-2 ${
                  visibleElements.has('tech-2') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[3] = el}
                data-animate="tech-2"
              >
                <div className="w-16 h-16 bg-[#04F5A0]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#04F5A0]/20 transition-colors duration-300">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Aprendizado Contínuo</h3>
                <p className="text-gray-400 leading-relaxed">
                  Quanto mais usa, melhor fica. Nossa IA aprende padrões específicos do seu negócio e melhora automaticamente.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Adaptação em tempo real
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Melhoria automática
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Feedback incorporado
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div 
                className={`group bg-[#0A0A0A] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(4,245,160,0.3)] transform hover:-translate-y-2 ${
                  visibleElements.has('tech-3') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[4] = el}
                data-animate="tech-3"
              >
                <div className="w-16 h-16 bg-[#04F5A0]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#04F5A0]/20 transition-colors duration-300">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Segurança Total</h3>
                <p className="text-gray-400 leading-relaxed">
                  Proteção de nível bancário para seus dados. Conformidade total com LGPD e certificações internacionais.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Criptografia end-to-end
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Conformidade LGPD
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Backup automático
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 3: Soluções - Fixed quotes on line 372 */}
        <section id="solucoes" className="bg-black rounded-t-[3rem] rounded-b-[3rem] relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('solutions-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[5] = el}
              data-animate="solutions-header"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Soluções para <span className="text-[#04F5A0]">Cada Negócio</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Do pequeno empreendedor à grande empresa. Temos a solução perfeita para &ldquo;escalar&rdquo; seu atendimento.
              </p>
            </div>

            {/* Solutions Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* E-commerce */}
              <div 
                className={`group bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(4,245,160,0.4)] transform hover:-translate-y-2 ${
                  visibleElements.has('solution-1') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[6] = el}
                data-animate="solution-1"
              >
                <div className="text-5xl mb-6">🛍️</div>
                <h3 className="text-2xl font-bold text-white mb-4">E-commerce</h3>
                <p className="text-gray-400 mb-6">
                  Atenda múltiplos clientes simultaneamente. Tire dúvidas sobre produtos, rastreie pedidos, processe devoluções.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Catálogo integrado
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Rastreamento automático
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Checkout no WhatsApp
                  </li>
                </ul>
                <button className="w-full py-3 bg-[#04F5A0]/10 hover:bg-[#04F5A0]/20 text-[#04F5A0] rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(4,245,160,0.5)]">
                  Ver Casos de Sucesso
                </button>
              </div>

              {/* Serviços */}
              <div 
                className={`group bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(4,245,160,0.4)] transform hover:-translate-y-2 ${
                  visibleElements.has('solution-2') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[7] = el}
                data-animate="solution-2"
              >
                <div className="text-5xl mb-6">📅</div>
                <h3 className="text-2xl font-bold text-white mb-4">Serviços</h3>
                <p className="text-gray-400 mb-6">
                  Agende consultas, confirme horários, envie lembretes. Reduza no-shows em até 60% com confirmações automáticas.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Agenda integrada
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Lembretes automáticos
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Reagendamento fácil
                  </li>
                </ul>
                <button className="w-full py-3 bg-[#04F5A0]/10 hover:bg-[#04F5A0]/20 text-[#04F5A0] rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(4,245,160,0.5)]">
                  Ver Casos de Sucesso
                </button>
              </div>

              {/* Suporte */}
              <div 
                className={`group bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-[#04F5A0]/20 rounded-2xl p-8 hover:border-[#04F5A0]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(4,245,160,0.4)] transform hover:-translate-y-2 ${
                  visibleElements.has('solution-3') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[8] = el}
                data-animate="solution-3"
              >
                <div className="text-5xl mb-6">💬</div>
                <h3 className="text-2xl font-bold text-white mb-4">Suporte 24/7</h3>
                <p className="text-gray-400 mb-6">
                  Resolva 80% dos tickets automaticamente. Escale para humanos apenas casos complexos que realmente precisam.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Base de conhecimento
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Triagem inteligente
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-[#04F5A0] mr-3">✓</span>
                    Handoff suave
                  </li>
                </ul>
                <button className="w-full py-3 bg-[#04F5A0]/10 hover:bg-[#04F5A0]/20 text-[#04F5A0] rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(4,245,160,0.5)]">
                  Ver Casos de Sucesso
                </button>
              </div>
            </div>

            {/* CTA Final */}
            <div 
              className={`text-center mt-20 transition-all duration-1000 transform ${
                visibleElements.has('final-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[9] = el}
              data-animate="final-cta"
            >
              <div className="bg-gradient-to-r from-[#04F5A0]/10 via-[#04F5A0]/5 to-[#04F5A0]/10 rounded-3xl p-12 backdrop-blur-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Pronto para <span className="text-[#04F5A0]">Revolucionar</span> seu Atendimento?
                </h2>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Junte-se a mais de 5.000 empresas que já transformaram seu WhatsApp em uma máquina de vendas.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="group relative px-10 py-5 bg-[#04F5A0] text-black rounded-2xl text-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_50px_rgba(4,245,160,0.9)] hover:scale-110 transform"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-3">🎯</span>
                    Testar Gratuitamente por 4 Dias
                    <span className="ml-3">→</span>
                  </span>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                <p className="mt-6 text-sm text-gray-500">
                  Cancele quando quiser • Sem compromisso • Suporte incluído
                </p>
              </div>
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
              <div className="flex items-center justify-center md:justify-start mb-6 group cursor-pointer">
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
                  href="https://www.instagram.com/swiftbot.ia/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative w-12 h-12 bg-[#1A1A1A]/60 rounded-xl flex items-center justify-center hover:bg-[#04F5A0]/20 transition-all duration-300 hover:scale-110 transform hover:shadow-[0_0_20px_rgba(4,245,160,0.6)]"
                >
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-[#04F5A0] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                
                <a 
                  href="https://www.facebook.com/SwiftBott" 
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
                    href="mailto:suporte@swiftbot.com.br" 
                    className="text-gray-400 hover:text-[#04F5A0] transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] flex items-center justify-center md:justify-end"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 8.773l6.545-4.68v-.273h3.819c.904 0 1.636.732 1.636 1.636z"/>
                    </svg>
                    suporte@swiftbot.com.br
                  </a>
                </div>
                
                <div className="group">
                  <a 
                    href="https://wa.me/5511915311105" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#04F5A0] transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] flex items-center justify-center md:justify-end"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    (11) 91531-1105
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

      {/* Custom Styles for Enhanced Animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(4, 245, 160, 0.5);
            filter: drop-shadow(0 0 10px rgba(4, 245, 160, 0.3));
          }
          50% { 
            text-shadow: 0 0 30px rgba(4, 245, 160, 0.8);
            filter: drop-shadow(0 0 15px rgba(4, 245, 160, 0.6));
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        /* Improved scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Enhanced hover effects for all interactive elements */
        .hover-glow:hover {
          filter: drop-shadow(0 0 15px rgba(4, 245, 160, 0.8));
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}