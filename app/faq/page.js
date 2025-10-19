// app/faq/page.js
'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function FAQ() {
  const router = useRouter()
  const [visibleElements, setVisibleElements] = useState(new Set())
  const [openFaq, setOpenFaq] = useState(null)
  
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

  // Toggle FAQ
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // Dados das FAQs organizadas por categoria
  const faqData = {
    payment: [
      {
        question: "Como funciona exatamente o teste grátis de 4 dias?",
        answer: "É simples e transparente. Você escolhe seu plano, cadastra seu cartão de crédito e tem acesso a 100% das funcionalidades por 4 dias, sem nenhuma cobrança inicial. Se gostar (e achamos que vai!), não precisa fazer nada: ao final do período, seu plano se torna ativo e a primeira mensalidade é cobrada. Se por qualquer motivo decidir não continuar, basta cancelar dentro dos 4 dias com um clique, sem burocracia ou perguntas."
      },
      {
        question: "Existe algum contrato de fidelidade ou taxa de instalação?",
        answer: "Não. Acreditamos na liberdade. Não há taxa de instalação e você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento. Nosso objetivo é que você permaneça pela qualidade do serviço, não por obrigação contratual."
      },
      {
        question: "O que acontece se eu ultrapassar o limite de mensagens do meu plano?",
        answer: "Nós te avisaremos quando estiver se aproximando do limite. Caso ultrapasse, você pode facilmente fazer um upgrade para o próximo plano diretamente no seu dashboard para garantir que seu atendimento não pare, ou pode adquirir pacotes de mensagens adicionais."
      }
    ],
    technology: [
      {
        question: "Meu atendimento vai soar robotizado?",
        answer: "Pelo contrário. A diferença do SwiftBot está na tecnologia GPT-4. Ela permite que a IA entenda o contexto da conversa e responda de forma fluida e natural. Além disso, com a função de \"Personalidade\", você define o tom de voz. O resultado é uma experiência tão boa que seus clientes se sentirão acolhidos e bem atendidos, não \"robotizados\"."
      },
      {
        question: "Preciso saber programar ou ser um expert em tecnologia?",
        answer: "Absolutamente não. A plataforma foi desenhada para ser usada por donos de negócio, gerentes e equipes de marketing, não por programadores. Se você consegue configurar um perfil em uma rede social, consegue configurar o SwiftBot em minutos."
      },
      {
        question: "É seguro usar o SwiftBot com o WhatsApp da minha empresa?",
        answer: "Sim, 100% seguro. Nossa plataforma utiliza uma tecnologia de conexão robusta e criptografada para garantir a total segurança e estabilidade das suas comunicações. Levamos a proteção dos seus dados e dos dados dos seus clientes muito a sério."
      }
    ]
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
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
  href="/" 
  className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"
>
  Início
</Link>
<Link 
  href="/#tecnologia" 
  className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"
>
  Tecnologia
</Link>
<Link 
  href="/#solucoes" 
  className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"
>
  Soluções
</Link>
              <Link 
                href="/precos" 
                className="text-gray-300 hover:text-[#04F5A0] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]"
              >
                Preços
              </Link>
              <Link 
                href="/faq" 
                className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)] font-medium"
              >
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
                Testar 4 Dias Grátis
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="bg-black rounded-b-[3rem] relative">
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
                  <div className="w-20 h-20 bg-[#04F5A0] rounded-2xl flex items-center justify-center animate-pulse">
                    <div className="w-10 h-10 bg-black rounded-sm" 
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent animate-gradient leading-tight">
                Perguntas Frequentes
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Tem alguma dúvida? <span className="text-[#04F5A0] font-semibold drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Provavelmente ela já foi respondida aqui.</span>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="bg-gray-900/40 backdrop-blur-sm rounded-t-[3rem] rounded-b-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Categoria: Teste e Pagamento */}
            <div 
              className={`mb-16 transition-all duration-1000 transform ${
                visibleElements.has('payment-category') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[1] = el}
              data-animate="payment-category"
            >
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#04F5A0]/20 rounded-2xl mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Sobre o Teste e <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Pagamento</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.payment.map((faq, index) => (
                  <div 
                    key={index}
                    className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:bg-[#1A1A1A]/80"
                  >
                    <button
                      onClick={() => toggleFaq(`payment-${index}`)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#04F5A0]/50 rounded-2xl"
                    >
                      <span className="text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </span>
                      <div className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === `payment-${index}` ? 'rotate-45' : 'rotate-0'
                      }`}>
                        <div className="w-6 h-6 relative">
                          <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-[#04F5A0] transform -translate-x-1/2 -translate-y-1/2" />
                          <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-[#04F5A0] transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </button>
                    
                    {openFaq === `payment-${index}` && (
                      <div className="px-6 pb-6 transition-all duration-300">
                        <div className="pt-4 border-t border-[#04F5A0]/10">
                          <p className="text-gray-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Categoria: Tecnologia e Uso */}
            <div 
              className={`mb-16 transition-all duration-1000 transform ${
                visibleElements.has('tech-category') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[2] = el}
              data-animate="tech-category"
            >
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#04F5A0]/20 rounded-2xl mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Sobre a Tecnologia e <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">Uso</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.technology.map((faq, index) => (
                  <div 
                    key={index}
                    className="bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:bg-[#1A1A1A]/80"
                  >
                    <button
                      onClick={() => toggleFaq(`tech-${index}`)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#04F5A0]/50 rounded-2xl"
                    >
                      <span className="text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </span>
                      <div className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === `tech-${index}` ? 'rotate-45' : 'rotate-0'
                      }`}>
                        <div className="w-6 h-6 relative">
                          <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-[#04F5A0] transform -translate-x-1/2 -translate-y-1/2" />
                          <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-[#04F5A0] transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </button>
                    
                    {openFaq === `tech-${index}` && (
                      <div className="px-6 pb-6 transition-all duration-300">
                        <div className="pt-4 border-t border-[#04F5A0]/10">
                          <p className="text-gray-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seção "Ainda com dúvidas?" */}
            <div 
              className={`text-center transition-all duration-1000 transform ${
                visibleElements.has('contact-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[3] = el}
              data-animate="contact-section"
            >
              <div className="bg-gradient-to-r from-[#04F5A0]/10 via-transparent to-[#04F5A0]/10 rounded-3xl p-12 backdrop-blur-sm">
                <div className="text-5xl mb-6 animate-bounce">❓</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Não encontrou o que <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">procurava</span>?
                </h2>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Nossa equipe está pronta para ajudar. Entre em contato conosco e teremos o prazer em esclarecer qualquer dúvida.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href="https://wa.me/5511915311105"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 bg-[#04F5A0] text-black rounded-xl text-lg font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_30px_rgba(4,245,160,0.8)] hover:scale-105 transform"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      Fale com o Suporte
                    </span>
                    <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>
                  
                  <a
                    href="mailto:suporte@swiftbot.com.br"
                    className="group relative px-8 py-4 border-2 border-[#04F5A0] text-[#04F5A0] rounded-xl text-lg font-bold transition-all duration-300 hover:bg-[#04F5A0] hover:text-black hover:scale-105 transform"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 8.773l6.545-4.68v-.273h3.819c.904 0 1.636.732 1.636 1.636z"/>
                      </svg>
                      Enviar Email
                    </span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-black rounded-t-[3rem] relative -mt-12 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div 
              className={`transition-all duration-1000 transform ${
                visibleElements.has('final-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              ref={el => elementsRef.current[4] = el}
              data-animate="final-cta"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Pronto para <span className="text-[#04F5A0] drop-shadow-[0_0_8px_rgba(4,245,160,0.8)]">revolucionar</span> seu atendimento?
              </h2>
              <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
                Não perca mais tempo. Ative seu agente de IA agora e veja a diferença em minutos.
              </p>
              
              <button
                onClick={() => router.push('/login')}
                className="group relative px-12 py-5 bg-[#04F5A0] text-black rounded-2xl text-xl font-bold transition-all duration-300 hover:bg-[#03E691] hover:shadow-[0_0_40px_rgba(4,245,160,0.8)] hover:scale-105 transform animate-pulse"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-3">🚀</span>
                  Começar Teste Grátis Agora
                  <span className="ml-3">→</span>
                </span>
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}