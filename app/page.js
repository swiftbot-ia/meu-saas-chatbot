// app/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Header from './components/Header'
import LazyVideo from './components/LazyVideo'

export default function Home() {
  const router = useRouter()
  const [expandedFeature, setExpandedFeature] = useState(null)
  const carouselRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Intersection Observer (Anima uma vez)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Adiciona a animação quando entra na viewport
            entry.target.classList.add('animate-in')
            // Para de observar após animar (sem looping)
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

  const testimonials = [
    {
      text: "Dobramos nossas vendas online em 3 meses. A SwiftBot captura leads qualificados 24/7, algo que nossa equipe humana simplesmente não conseguia fazer. A implementação com o QR Code foi ridiculamente fácil.",
      name: "Juliana Martins",
      role: "CEO, Bella Moda E-commerce",
      image: "/testimonials/juliana.webp",
      gradient: "from-purple-700/50 via-black to-black"
    },
    {
      text: "Eu era o gargalo do meu próprio negócio, respondendo mensagens até de madrugada. Com a SwiftBot, eu clonei meu atendimento. Ganhamos 15 horas por semana e a qualidade do serviço nunca esteve tão alta.",
      name: "Ricardo Alves",
      role: "Fundador, Clínica FisioHealth",
      image: "/testimonials/ricardo.webp",
      gradient: "from-blue-700/50 via-black to-black"
    },
    {
      text: "A consistência é tudo. Antes, cada vendedor respondia de um jeito. Agora, nosso 'clone' garante que todo cliente receba o mesmo nível de excelência. Nosso índice de satisfação subiu de 8.2 para 9.8.",
      name: "Beatriz Costa",
      role: "Diretora de Operações, Vestra Seguros",
      image: "/testimonials/beatriz.webp",
      gradient: "from-cyan-700/50 via-black to-black"
    },
    {
      text: "Estávamos prestes a contratar mais duas pessoas para o suporte. Em vez disso, ativamos a SwiftBot. O custo foi 70% menor e a capacidade de atendimento se tornou infinita. Foi a decisão financeira mais inteligente que fizemos.",
      name: "Fernando Lima",
      role: "Sócio, Agência Criativa Digital",
      image: "/testimonials/fernando.webp",
      gradient: "from-green-700/50 via-black to-black"
    },
    {
      text: "O que mais me impressionou foi a IA aprendendo nosso tom de voz. Nossos clientes não percebem que estão falando com um robô. Eles sentem que estão falando comigo. Isso não tem preço.",
      name: "Camila Oliveira",
      role: "Proprietária, Doce Sabor Confeitaria",
      image: "/testimonials/camila.webp",
      gradient: "from-pink-700/50 via-black to-black"
    },
    {
      text: "Agendamentos, confirmações, reagendamentos... tudo automatizado. A taxa de não comparecimento caiu 40%. A SwiftBot não é só um chatbot, é um sistema de gestão de clientes.",
      name: "Dr. Marcos Ferreira",
      role: "Dentista, Sorriso Perfeito Odontologia",
      image: "/testimonials/marcos.webp",
      gradient: "from-indigo-700/50 via-black to-black"
    },
    {
      text: "Recuperamos 25% dos carrinhos abandonados no primeiro mês. A IA aborda o cliente na hora certa, com a mensagem certa. É como ter o melhor vendedor do mundo trabalhando sem parar.",
      name: "Lucas Gomes",
      role: "Gerente de E-commerce, Tech Gadgets Brasil",
      image: "/testimonials/lucas.webp",
      gradient: "from-violet-700/50 via-black to-black"
    },
    {
      text: "Como agência, implementamos a SwiftBot para vários clientes. O tempo de ativação é imbatível e o ROI é visível em semanas. Virou nossa recomendação padrão para automação de WhatsApp.",
      name: "Sofia Ribeiro",
      role: "Especialista em Crescimento, ScaleUp Solutions",
      image: "/testimonials/sofia.webp",
      gradient: "from-teal-700/50 via-black to-black"
    }
  ]

  // Duplicar depoimentos para loop infinito
  const infiniteTestimonials = [...testimonials, ...testimonials, ...testimonials]

  return (
    <div className="min-h-screen bg-[#E1DFDB] relative overflow-x-hidden">
      {/* Header Novo */}
      <Header />

      <main className="relative z-10">

        {/* SEÇÃO 1: HERO COM VÍDEO DE FUNDO */}
        <section className="relative min-h-screen md:min-h-screen flex items-center justify-center overflow-visible bg-transparent pb-12 md:pb-20">
          <div className="absolute inset-0 bg-black rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
            {/* Video Background - Optimized with preload metadata */}
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
              <source src="/particles-background.webm" type="video/webm" />
            </video>

            {/* Overlay escuro */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 pt-24 md:pt-0">
            <h1
              className="text-6xl md:text-8xl font-black text-white mb-6 md:mb-8 leading-tight"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              E se você pudesse <br />
              <span className="text-[#00FF99]">se clonar?</span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 md:mb-12 leading-relaxed font-light">
              Tenha seu <span className="text-[#00FF99] font-semibold">melhor atendimento</span>, em todos os lugares, 24/7.
              Chega de perder vendas às 22h ou treinar funcionários que nunca atendem como você.
              A SwiftBot cria um <span className="text-[#00FF99] font-semibold">clone digital do seu atendimento</span> em 5 minutos.
              Apenas escaneie um QR Code.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 md:mb-6">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-[#00FF99] text-black rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 hover:bg-[#00E88C]"
              >
                Testar de graça
              </button>

              <button
                onClick={() => router.push('/pricing')}
                className="px-8 py-3 bg-white/10 text-white rounded-full font-medium text-base transition-all duration-300 hover:bg-white/15 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                Veja os nossos planos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <p className="text-xs md:text-sm text-gray-400 px-4">
              Junte-se a mais de 5.000 empresas que já escalaram sua expertise. <br />
              Teste grátis por 4 dias - cartão necessário apenas para confirmação.
            </p>
          </div>
        </section>

        {/* SEÇÃO 2: AGITAÇÃO DO PROBLEMA (VERSÃO ATUALIZADA) */}
        <section className="py-24 bg-[#E1DFDB] relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-4xl md:text-6xl font-light text-black mb-6 leading-tight">
                Você é o melhor vendedor da sua empresa. <br />
                <span className="font-normal text-black">E esse é o seu maior problema.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { number: "01", title: "Vendas Perdidas Fora do Expediente", text: "Seu cliente não tem horário comercial. Uma dúvida às 23h é uma compra que, sem resposta imediata, vai para o concorrente amanhã de manhã.", delay: "0ms" },
                { number: "02", title: "Atendimento Inconsistente", text: "Você treina sua equipe, cria manuais, mas ninguém tem o seu toque. Respostas erradas e tons inadequados diluem sua marca.", delay: "200ms" },
                { number: "03", title: "O Limite do Seu Tempo", text: "Contratar é caro e demorado. Seu crescimento está limitado pela sua capacidade de estar em todos os lugares ao mesmo tempo.", delay: "400ms" }
              ].map((item, idx) => (
                <div key={idx} className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10" style={{ transitionDelay: item.delay }}>
                  <div className="text-[#00FF99] text-sm font-medium mb-4 tracking-wider">{item.number}</div>
                  <h3 className="text-xl font-medium text-black mb-4 leading-snug">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-light text-[15px]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: DEPOIMENTOS (VERSÃO ATUALIZADA COM FOTOS) */}
        <section className="py-24 bg-[#E1DFDB] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden" id="depoimentos">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-4xl md:text-6xl font-light text-black mb-6 leading-tight">
                O que nossos <span className="font-normal text-black">usuários estão dizendo.</span>
              </h2>
            </div>

            {/* Desktop: Layout orgânico com últimos 2 centralizados */}
            <div className="hidden md:block max-w-6xl mx-auto">
              {/* Primeiros 6 depoimentos em layout oval */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Linha 1: 3 cards (levemente desalinhados) */}
                <div className="translate-y-4 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '0ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[0].image}
                          alt={testimonials[0].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[0].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[0].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[0].text}</p>
                  </div>
                </div>

                <div className="-translate-y-2 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '50ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[1].image}
                          alt={testimonials[1].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[1].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[1].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[1].text}</p>
                  </div>
                </div>

                <div className="translate-y-6 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '100ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[2].image}
                          alt={testimonials[2].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[2].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[2].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[2].text}</p>
                  </div>
                </div>
              </div>

              {/* Linha 2: 3 cards (desalinhados inversamente) */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="-translate-y-3 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '150ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[3].image}
                          alt={testimonials[3].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[3].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[3].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[3].text}</p>
                  </div>
                </div>

                <div className="translate-y-5 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '200ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[4].image}
                          alt={testimonials[4].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[4].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[4].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[4].text}</p>
                  </div>
                </div>

                <div className="translate-y-1 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '250ms' }}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[5].image}
                          alt={testimonials[5].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[5].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[5].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[5].text}</p>
                  </div>
                </div>
              </div>

              {/* Últimos 2: Centralizados com gradient */}
              <div className="flex justify-center gap-6 max-w-3xl mx-auto">
                <div className="flex-1 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '300ms' }}>
                  <div className="bg-gradient-to-b from-white/70 to-white/30 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[6].image}
                          alt={testimonials[6].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[6].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[6].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[6].text}</p>
                  </div>
                </div>

                <div className="flex-1 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000" style={{ transitionDelay: '350ms' }}>
                  <div className="bg-gradient-to-b from-white/70 to-white/30 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={testimonials[7].image}
                          alt={testimonials[7].name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-black text-sm">{testimonials[7].name}</p>
                        <p className="text-gray-600 text-xs">{testimonials[7].role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm font-light">{testimonials[7].text}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Apenas 4 depoimentos */}
            <div className="md:hidden grid grid-cols-1 gap-6 max-w-md mx-auto">
              {testimonials.slice(0, 4).map((testimonial, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-black text-sm">{testimonial.name}</p>
                      <p className="text-gray-600 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm font-light">
                    {testimonial.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 4: APRESENTAÇÃO DA SOLUÇÃO - NOVA VERSÃO EXPANDIDA */}

        {/* Bloco 1: SwiftBot IA (Fundo Preto) */}
        <section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden -mt-1" id="swiftbot-ia">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Vídeo - Lazy loaded */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-[40px] p-8">
                    <LazyVideo
                      src="/swiftbot-ia-demo.webm"
                      className="w-full h-auto rounded-3xl overflow-hidden"
                    />
                  </div>
                </div>

                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
                    Conheça a SwiftBot IA. <span className="font-normal bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">Sua consultora de negócios 24/7.</span>
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6 font-light">
                    Uma inteligência artificial que aprende com suas conversas reais do WhatsApp. Ela analisa padrões, identifica gaps no seu atendimento, cria scripts de vendas personalizados e sugere copys para anúncios — tudo baseado em dados reais da sua empresa.
                  </p>
                  <p className="text-xl text-gray-300 leading-relaxed mb-8 font-light">
                    É como ter um especialista em vendas dedicado exclusivamente ao seu negócio, disponível a qualquer hora.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Análise inteligente das suas conversas',
                      'Scripts de vendas personalizados',
                      'Copys para anúncios baseados em dados reais',
                      'Identificação de objeções e soluções'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 2: Chat ao Vivo (Fundo Bege) */}
        <section className="py-32 bg-[#E1DFDB] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden" id="chat-ao-vivo">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-black mb-8 leading-tight">
                    Chat ao Vivo. <span className="font-normal bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">WhatsApp na sua tela, do seu jeito.</span>
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed mb-6 font-light">
                    Atenda seus clientes diretamente da nossa plataforma, com uma interface tão familiar quanto o próprio WhatsApp. Sem curva de aprendizado, sem trocar de janela. Apenas você e seus clientes.
                  </p>
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 font-light">
                    Quando a IA precisar de você, você está a um clique de distância.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Interface idêntica ao WhatsApp',
                      'Histórico completo de conversas',
                      'Envio de áudios, imagens e arquivos',
                      'Transição suave entre IA e atendimento humano'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Imagem - Optimized with next/image */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-[40px] p-8">
                    <Image
                      src="/chat-live-demo.webp"
                      alt="Chat ao Vivo SwiftBot"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-3xl"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 3: Gestão de Contatos (Fundo Preto) */}
        <section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden -mt-1" id="gestao-contatos">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Imagem - Optimized with next/image */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 rounded-[40px] p-8">
                    <Image
                      src="/contacts-demo.webp"
                      alt="Gestão de Contatos"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-3xl"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
                    Todos seus contatos. <span className="font-normal bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-400 bg-clip-text text-transparent">Organizados por você.</span>
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6 font-light">
                    Visualize, filtre e organize todos os seus contatos do WhatsApp em um só lugar. Crie tags personalizadas para segmentar sua base, defina origens para saber de onde cada lead veio e tenha controle total sobre seu público.
                  </p>
                  <p className="text-xl text-gray-300 leading-relaxed mb-8 font-light">
                    Arraste e solte para organizar — simples assim.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Filtros por tags e origem',
                      'Visualização de histórico de conversas',
                      'Drag & drop para organização',
                      'Acesso rápido ao chat direto'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 4: CRM Visual (Fundo Bege) */}
        <section className="py-32 bg-[#E1DFDB] relative overflow-hidden" id="crm-visual">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-black mb-8 leading-tight">
                    CRM Visual. <span className="font-normal bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Veja suas vendas acontecendo.</span>
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed mb-6 font-light">
                    Um Kanban intuitivo que transforma a gestão do seu funil de vendas em algo visual e simples. Arraste leads entre etapas, acompanhe o progresso de cada negociação e tenha clareza total sobre onde está cada oportunidade.
                  </p>
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 font-light">
                    Novo → Apresentação → Negociação → Fechamento. <br />
                    O caminho do seu cliente, visível para você.
                  </p>
                  <div className="space-y-4">
                    {[
                      '4 etapas personalizáveis',
                      'Drag & drop para mover leads',
                      'Visualização de valor por etapa',
                      'Integração com conversas do WhatsApp'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vídeo - Lazy loaded */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 rounded-[40px] p-8">
                    <LazyVideo
                      src="/crm-kanban-demo.webm"
                      className="w-full h-auto rounded-3xl overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 5: Agente Personalizado (Fundo Preto) */}
        <section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-1" id="agente-personalizado">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Imagem - Optimized with next/image */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-[40px] p-8">
                    <Image
                      src="/agent-config-demo.webp"
                      alt="Configuração do Agente"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-3xl"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
                    Seu Clone Digital. <span className="font-normal bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Construído com os seus dados.</span>
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6 font-light">
                    Diferente de chatbots genéricos, o agente da SwiftBot é configurado a partir de uma análise detalhada das suas conversas reais. Ele aprende seu tom de voz, entende seus produtos e faz as perguntas certas — como se fosse você atendendo.
                  </p>
                  <p className="text-xl text-gray-300 leading-relaxed mb-8 font-light">
                    Não é um robô. É a versão escalável de você.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Análise de conversas reais para aprendizado',
                      'Personalização de tom e estilo',
                      'Respostas contextualmente inteligentes',
                      'Melhoria contínua com feedback'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 5: SETUP EM 3 PASSOS */}
        <section className="py-32 bg-black rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden" id="setup">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
                Do zero ao clone em <span className="font-normal bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">menos de 5 minutos.</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light">
                Sem integrações complexas. Sem códigos. Apenas três passos simples.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  num: "01",
                  title: "Escaneie o QR Code",
                  text: "Conecte seu WhatsApp Business à plataforma em segundos.",
                  gradient: "from-green-400 to-emerald-500",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                },
                {
                  num: "02",
                  title: "IA Analisa Suas Conversas",
                  text: "Nossa IA aprende seu estilo e tom de comunicação automaticamente.",
                  gradient: "from-purple-400 to-pink-500",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                },
                {
                  num: "03",
                  title: "Clone Ativo",
                  text: "Seu assistente de IA começa a atender clientes imediatamente.",
                  gradient: "from-cyan-400 to-blue-500",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000"
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  {/* Card */}
                  <div className={`relative bg-gradient-to-br ${step.gradient} p-[1px] rounded-[32px]`}>
                    <div className="bg-black rounded-[31px] p-8 h-full">
                      {/* Número */}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} mb-6`}>
                        <span className="text-2xl font-black text-black">{step.num}</span>
                      </div>

                      {/* Ícone */}
                      <div className="mb-6">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                          <defs>
                            <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{ stopColor: idx === 0 ? '#4ade80' : idx === 1 ? '#c084fc' : '#22d3ee' }} />
                              <stop offset="100%" style={{ stopColor: idx === 0 ? '#10b981' : idx === 1 ? '#ec4899' : '#3b82f6' }} />
                            </linearGradient>
                          </defs>
                          <g stroke={`url(#gradient-${idx})`} strokeWidth="1.5">
                            {step.icon}
                          </g>
                        </svg>
                      </div>

                      {/* Texto */}
                      <h3 className="text-2xl font-medium text-white mb-4">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed font-light">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 6: FUNCIONALIDADES */}
        <section className="py-24 bg-[#E1DFDB] relative overflow-hidden" id="funcionalidades">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-light text-black mb-6 leading-tight">
                Tudo que você precisa. <span className="font-normal text-black">Em uma única plataforma.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-swiftbot)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-swiftbot" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: "SwiftBot IA",
                  text: "Sua consultora de negócios pessoal. Analisa dados, cria scripts e identifica oportunidades.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-chat)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-chat" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  title: "Chat ao Vivo",
                  text: "Interface familiar do WhatsApp. Atenda quando a IA precisar de você.",
                  delay: "100ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-crm)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-crm" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  ),
                  title: "CRM Visual",
                  text: "Kanban intuitivo para visualizar e gerenciar seu funil de vendas.",
                  delay: "200ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-contacts)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-contacts" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: "Gestão de Contatos",
                  text: "Organize sua base com tags, origens e filtros inteligentes.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-agent)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-agent" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  title: "Agente Personalizado",
                  text: "IA treinada com suas conversas reais. Atende como você atenderia.",
                  delay: "100ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient-security)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient-security" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: "Segurança LGPD",
                  text: "Criptografia de ponta a ponta. Seus dados protegidos como em banco.",
                  delay: "200ms"
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: feature.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-normal text-black mb-4 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 7: SEGMENTOS DE CLIENTES */}
        <section className="py-24 bg-[#E1DFDB] relative overflow-hidden" id="segmentos">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-light text-black mb-6 leading-tight">
                Criado para quem <span className="font-normal text-black">não tem tempo a perder.</span>
              </h2>
            </div>

            {/* Primeira linha - 3 cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-8 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientEcommerce)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientEcommerce" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: "E-commerce",
                  text: "Responda dúvidas sobre produtos, rastreie pedidos e recupere carrinhos abandonados 24/7, transformando seu WhatsApp em sua melhor vitrine.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientClinica)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientClinica" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  title: "Clínicas e Consultórios",
                  text: "Automatize agendamentos, confirmações e lembretes de consultas. Reduza faltas em até 40% e mantenha sua agenda otimizada com atendimento 24/7 aos pacientes.",
                  delay: "100ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientSeguro)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientSeguro" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Corretoras e Seguros",
                  text: "Qualifique leads automaticamente, tire dúvidas sobre apólices e envie cotações personalizadas. Seu clone trabalha enquanto você fecha os melhores negócios.",
                  delay: "200ms"
                }
              ].map((segment, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: segment.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    {segment.icon}
                  </div>
                  <h3 className="text-2xl font-normal text-black mb-4">
                    {segment.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Segunda linha - 3 cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientAgencia)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientAgencia" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Agências e Consultorias",
                  text: "Qualifique leads automaticamente, direcione-os para o especialista certo e garanta que nenhuma oportunidade de negócio seja perdida por demora na resposta.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientServico)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientServico" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Prestadores de Serviço",
                  text: "Agende consultas, confirme horários e envie lembretes automáticos. Reduza o não comparecimento e mantenha sua agenda sempre cheia.",
                  delay: "100ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradientImobiliaria)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradientImobiliaria" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ),
                  title: "Imobiliárias",
                  text: "Responda sobre imóveis disponíveis, agende visitas automaticamente e envie materiais personalizados. Seu clone nunca perde um lead interessado.",
                  delay: "200ms"
                }
              ].map((segment, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-black/5 hover:border-black/10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: segment.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    {segment.icon}
                  </div>
                  <h3 className="text-2xl font-normal text-black mb-4">
                    {segment.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 8: CTA FINAL COM VÍDEO DE FUNDO */}
        <section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-1">
          {/* Video Background - Lazy loaded */}
          <LazyVideo
            src="/cta-background.webm"
            className="absolute inset-0 w-full h-full opacity-30"
          />

          {/* Overlay com gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-on-scroll opacity-0 scale-95 transition-all duration-1000">

              {/* Badge superior */}
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
                <div className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse" />
                <span className="text-sm text-gray-300 font-light">Hub completo de IA para sua empresa</span>
              </div>

              {/* Título principal */}
              <h2 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
                Uma plataforma. Cinco soluções. <br />
                <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">
                  Resultados que você vai ver.
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                WhatsApp inteligente • Chat ao vivo • CRM visual • Gestão de contatos • IA personalizada
                <br />
                <span className="text-base mt-2 block">
                  Tudo isso por um valor que cabe no seu bolso.
                </span>
              </p>

              {/* CTA Button */}
              <button
                onClick={() => router.push('/login')}
                className="group relative px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_60px_rgba(0,255,153,0.6)] hover:scale-105 mb-10"
              >
                <span className="relative z-10">Começar meu teste grátis</span>
                <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              {/* Features badges */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                {[
                  { icon: "M5 13l4 4L19 7", text: "4 dias de teste grátis" },
                  { icon: "M6 18L18 6M6 6l12 12", text: "Cancele quando quiser" },
                  { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Configuração em 5 minutos" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3">
                    <svg className="w-5 h-5 text-[#00FF99] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="text-gray-300 font-light">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Prova social */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-400 font-light">
                  Confiado por empresas de todos os portes • De startups a corporações
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">

            {/* Coluna 1: Logo e descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0" />
                    <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1" />
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
                <a href="https://www.facebook.com/SwiftBott" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/swiftbot.ia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
                <li><a href="/pricing" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Preços</a></li>
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
              <a href="/privacy" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Privacidade</a>
              <a href="/terms" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Termos de Uso</a>
              <a href="/cookies" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Política de Cookies/LGPD</a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Global */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .animate-on-scroll {
          transition-property: opacity, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) !important;
        }

        {/* NOVAS ANIMAÇÕES ADICIONADAS */}
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  )
}