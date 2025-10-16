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
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-5xl mx-auto leading-relaxed">
                Ofereça um atendimento <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">instantâneo, humano e inteligente</span> 24/7. 
                Com o poder do <span className="text-white font-semibold">GPT-4</span>, nosso agente de IA 
                <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> encanta clientes</span> e automatiza suas vendas de forma brilhante.
              </p>
              
              {/* CTA Principal */}
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={() => router.push('/login')}
                  className="group relative px-12 py-5 bg-[#04F5A0] text-black rounded-2xl text-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_40px_rgba(4,245,160,0.8)] hover:scale-105 transform mb-4"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-3">🚀</span>
                    Iniciar Meu Teste Grátis de 4 Dias
                  </span>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                
                {/* Nota de Confiança */}
                <p className="text-sm text-gray-400">
                  <span className="text-[#04F5A0]">✓</span> Teste todos os recursos por 4 dias • Cancele a qualquer momento
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Prova Social */}
        <section className="bg-gray-900/40 backdrop-blur-sm rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`transition-all duration-1000 transform ${
                visibleElements.has('testimonials') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[1] = el}
              data-animate="testimonials"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-white">
                Junte-se às empresas brasileiras que estão 
                <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> inovando no atendimento</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-[#1A1A1A]/80 transition-all duration-500 hover:scale-105 transform group"
                    style={{
                      animationDelay: `${index * 200}ms`
                    }}
                  >
                    <div className="text-[#04F5A0] mb-4 text-2xl group-hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] transition-all duration-300">⭐⭐⭐⭐⭐</div>
                    <p className="text-gray-300 text-sm italic group-hover:text-white transition-colors duration-300">"{testimonial}"</p>
                    <div className="mt-4 text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">Cliente SwiftBot</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção 3: O Problema > A Solução */}
        <section className="bg-black rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center max-w-4xl mx-auto transition-all duration-1000 transform ${
                visibleElements.has('problem-solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[2] = el}
              data-animate="problem-solution"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
                Seu cliente <span className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">não espera</span>. 
                <br />Por que seu atendimento deveria?
              </h2>
              
              <p className="text-xl text-gray-300 leading-relaxed mb-12">
                No mundo digital, a paciência é curta. Cada minuto de espera é uma porta aberta para o seu concorrente. 
                Chegou a <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">solução definitiva</span> de atendimento com inteligência artificial: 
                o <span className="text-white font-bold">SwiftBot</span>. Respostas instantâneas e personalizadas que transformam 
                cada conversa em uma <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">experiência positiva</span>.
              </p>

              <div className="bg-gradient-to-r from-red-500/10 via-transparent to-[#04F5A0]/10 rounded-3xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="text-left">
                    <h3 className="text-red-400 font-bold text-lg mb-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">❌ Sem SwiftBot:</h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li>• Clientes esperando horas por resposta</li>
                      <li>• Equipe sobrecarregada com perguntas repetitivas</li>
                      <li>• Vendas perdidas fora do horário comercial</li>
                      <li>• Atendimento inconsistente e impessoal</li>
                    </ul>
                  </div>
                  <div className="text-left">
                    <h3 className="text-[#04F5A0] font-bold text-lg mb-4 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">✅ Com SwiftBot:</h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li>• Respostas instantâneas 24/7</li>
                      <li>• Equipe focada no que realmente importa</li>
                      <li>• Vendas acontecendo a qualquer hora</li>
                      <li>• Atendimento personalizado e inteligente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 4: Como Funciona */}
        <section className="bg-gray-900/40 backdrop-blur-sm rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[3] = el}
              data-animate="how-it-works"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                A Tecnologia Mais Avançada, <br />
                <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">da Forma Mais Simples</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Conecte seu WhatsApp",
                  description: "Escaneie o QR Code. Simples, rápido e seguro.",
                  icon: "📱",
                  color: "from-blue-500/20 to-transparent"
                },
                {
                  step: "2", 
                  title: "Dê Vida à sua IA",
                  description: "Molde a personalidade e ensine sobre seu negócio.",
                  icon: "🧠",
                  color: "from-purple-500/20 to-transparent"
                },
                {
                  step: "3",
                  title: "Encante e Automatize",
                  description: "Ative e veja a mágica acontecer.",
                  icon: "✨",
                  color: "from-[#04F5A0]/20 to-transparent"
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className={`group relative transition-all duration-1000 transform ${
                    visibleElements.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-3xl p-8 text-center transition-all duration-500 hover:bg-[#1A1A1A]/80 hover:scale-105 transform">
                    {/* Step Number */}
                    <div className="w-12 h-12 bg-[#04F5A0] text-black font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_20px_rgba(4,245,160,0.8)]">
                      {item.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-4 text-white group-hover:text-[#04F5A0] transition-colors duration-300 group-hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {item.description}
                    </p>

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 5: Tecnologia - Mergulho Profundo */}
        <section id="tecnologia" className="bg-black rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('technology') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[4] = el}
              data-animate="technology"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                A Tecnologia por Trás da <br />
                <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Revolução no Atendimento</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                No SwiftBot, combinamos o poder da mais avançada inteligência artificial com uma plataforma 
                intuitiva e segura, garantindo uma experiência superior para você e seus clientes.
              </p>
            </div>

            <div className="space-y-16">
              {/* Sub-seção 5.1: GPT-4 */}
              <div 
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${
                  visibleElements.has('gpt4') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[5] = el}
                data-animate="gpt4"
              >
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                    Conversas que Encantam, <br />
                    <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">com o Poder do GPT-4</span>
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Esquecemos os robôs de antigamente que só respondiam "não entendi". Nossa IA é alimentada pelo 
                    <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> GPT-4</span>, o que permite a ela entender o contexto, 
                    manter diálogos fluidos e responder com uma naturalidade impressionante.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    O resultado é um atendimento que não só resolve, mas também 
                    <span className="text-white font-semibold"> cria uma conexão</span> com seu cliente.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#04F5A0]/10 to-transparent rounded-3xl p-8 backdrop-blur-sm hover:from-[#04F5A0]/15 transition-all duration-500">
                  <div className="text-6xl mb-4 text-center animate-pulse">🧠</div>
                  <div className="text-center text-gray-300">
                    <div className="font-bold text-[#04F5A0] text-lg mb-2 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">GPT-4 Powered</div>
                    <div className="text-sm">Conversas naturais e inteligentes</div>
                  </div>
                </div>
              </div>

              {/* Sub-seção 5.2: Dashboard */}
              <div 
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${
                  visibleElements.has('dashboard') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[6] = el}
                data-animate="dashboard"
              >
                <div className="order-2 lg:order-1">
                  <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-3xl p-8 hover:bg-[#1A1A1A]/80 transition-all duration-500">
                    <div className="text-6xl mb-4 text-center animate-bounce">📊</div>
                    <div className="text-center text-gray-300">
                      <div className="font-bold text-[#04F5A0] text-lg mb-2 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Dashboard Intuitivo</div>
                      <div className="text-sm">Controle total em tempo real</div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                    <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Controle Total</span>, <br />
                    Sem Complexidade
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Criamos um dashboard onde você tem o controle total da sua operação de IA. Acompanhe em tempo real 
                    o número de mensagens, conversas ativas e clientes atendidos.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Configure a personalidade do seu agente, suas perguntas de qualificação e suas respostas a objeções 
                    em uma interface <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">limpa, visual e 100% em português</span>.
                  </p>
                </div>
              </div>

              {/* Sub-seção 5.3: Segurança */}
              <div 
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${
                  visibleElements.has('security') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                ref={el => elementsRef.current[7] = el}
                data-animate="security"
              >
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                    <span className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">Segurança</span> em Primeiro Lugar
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    A confiança do seu negócio é nossa prioridade. Por isso, a integração com seu WhatsApp é feita 
                    através de uma <span className="text-white font-semibold">tecnologia de ponta</span>, garantindo a 
                    máxima segurança e estabilidade para suas conversas.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-green-400 font-semibold drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">Seus dados e os dados dos seus clientes estão protegidos.</span>
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl p-8 backdrop-blur-sm hover:from-green-500/15 transition-all duration-500">
                  <div className="text-6xl mb-4 text-center animate-pulse">🔒</div>
                  <div className="text-center text-gray-300">
                    <div className="font-bold text-green-400 text-lg mb-2 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">100% Seguro</div>
                    <div className="text-sm">Conexão criptografada e estável</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 6: Soluções - Mergulho Profundo */}
        <section id="solucoes" className="bg-gray-900/40 backdrop-blur-sm rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center mb-16 transition-all duration-1000 transform ${
                visibleElements.has('solutions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[8] = el}
              data-animate="solutions"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Uma Solução de IA <br />
                <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Sob Medida para o Seu Negócio</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                Não importa o seu mercado, a automação inteligente pode transformar seus resultados. 
                Veja como o SwiftBot se adapta à sua realidade:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "E-commerce e Varejo",
                  icon: "🛍️",
                  challenge: "Carrinhos abandonados, dúvidas sobre produtos e a necessidade de um suporte que acompanhe o ritmo das promoções.",
                  solution: "Programe sua IA para tirar dúvidas, oferecer cupons de desconto e até mesmo iniciar a recuperação de carrinhos abandonados. Transforme seu WhatsApp em uma vitrine interativa.",
                  color: "from-blue-500/20 to-transparent"
                },
                {
                  title: "Clínicas e Consultórios",
                  icon: "🏥",
                  challenge: "A secretária passa o dia ao telefone agendando e confirmando consultas, deixando pacientes em espera.",
                  solution: "Deixe seu agente de IA cuidar do pré-agendamento e responder perguntas sobre convênios e horários, liberando sua equipe para focar no cuidado presencial.",
                  color: "from-green-500/20 to-transparent"
                },
                {
                  title: "Imobiliárias e Corretores",
                  icon: "🏠",
                  challenge: "Leads chegam a todo momento, mas responder a todos instantaneamente é impossível, e muitos contatos frios tomam tempo.",
                  solution: "Use a IA como seu filtro inicial. Ela qualifica o lead perguntando sobre tipo de imóvel, orçamento e região de interesse, entregando apenas os contatos mais quentes para você.",
                  color: "from-purple-500/20 to-transparent"
                }
              ].map((solution, index) => (
                <div 
                  key={index} 
                  className={`group relative transition-all duration-1000 transform ${
                    visibleElements.has('solutions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-3xl p-8 h-full transition-all duration-500 hover:bg-[#1A1A1A]/80 hover:scale-105 transform">
                    {/* Icon */}
                    <div className="text-5xl mb-6 text-center group-hover:scale-110 transition-transform duration-300">
                      {solution.icon}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-6 text-white text-center group-hover:text-[#04F5A0] transition-colors duration-300 group-hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">
                      Para {solution.title}
                    </h3>
                    
                    {/* Challenge */}
                    <div className="mb-6">
                      <h4 className="text-red-400 font-semibold mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">❌ O Desafio:</h4>
                      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                        {solution.challenge}
                      </p>
                    </div>
                    
                    {/* Solution */}
                    <div>
                      <h4 className="text-[#04F5A0] font-semibold mb-2 drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">✅ A Solução SwiftBot:</h4>
                      <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                        {solution.solution}
                      </p>
                    </div>

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 7: "Feito no Brasil, para o Brasil" */}
        <section className="bg-black rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`text-center transition-all duration-1000 transform ${
                visibleElements.has('brazil') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[9] = el}
              data-animate="brazil"
            >
              <div className="bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-blue-500/10 rounded-[3rem] p-12 backdrop-blur-sm hover:from-green-500/15 hover:via-yellow-500/15 hover:to-blue-500/15 transition-all duration-500">
                <div className="text-6xl mb-8 animate-bounce">🇧🇷</div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                  Tecnologia Global, <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Coração Brasileiro</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Democratizamos o acesso à inteligência artificial de ponta, com 
                  <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> suporte local</span>, uma plataforma 
                  <span className="text-white font-semibold"> em português</span> e um entendimento profundo dos 
                  <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> desafios do nosso país</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 8: CTA Final */}
        <section className="bg-gradient-to-r from-[#04F5A0]/15 via-[#04F5A0]/10 to-[#04F5A0]/15 backdrop-blur-sm rounded-t-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div 
              className={`transition-all duration-1000 transform ${
                visibleElements.has('final-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[10] = el}
              data-animate="final-cta"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Pronto para o <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">futuro do atendimento</span>?
              </h2>
              <p className="text-xl mb-12 text-gray-300 max-w-3xl mx-auto">
                Ative seu agente de IA em minutos e coloque sua empresa na 
                <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"> liderança do mercado</span>.
              </p>
              
              <div className="flex flex-col items-center">
                <button
                  onClick={() => router.push('/login')}
                  className="group relative px-12 py-5 bg-[#04F5A0] text-black rounded-2xl text-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_50px_rgba(4,245,160,1)] hover:scale-110 transform mb-8 animate-pulse"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-3">⚡</span>
                    Ativar Meus 4 Dias Grátis Agora
                    <span className="ml-3">→</span>
                  </span>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                
                {/* Stats Final */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                  <div className="text-center group cursor-pointer">
                    <div className="text-2xl font-bold text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] group-hover:scale-110 transition-transform duration-300">4 dias</div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Teste grátis completo</div>
                  </div>
                  <div className="text-center group cursor-pointer">
                    <div className="text-2xl font-bold text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] group-hover:scale-110 transition-transform duration-300">0</div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Taxa de cancelamento</div>
                  </div>
                  <div className="text-center group cursor-pointer">
                    <div className="text-2xl font-bold text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] group-hover:scale-110 transition-transform duration-300">Português</div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Suporte brasileiro</div>
                  </div>
                </div>
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