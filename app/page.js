// app/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'

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
      image: "/testimonials/juliana.jpg",
      gradient: "from-purple-700/50 via-black to-black"
    },
    {
      text: "Eu era o gargalo do meu próprio negócio, respondendo mensagens até de madrugada. Com a SwiftBot, eu clonei meu atendimento. Ganhamos 15 horas por semana e a qualidade do serviço nunca esteve tão alta.",
      name: "Ricardo Alves",
      role: "Fundador, Clínica FisioHealth",
      image: "/testimonials/ricardo.jpg",
      gradient: "from-blue-700/50 via-black to-black"
    },
    {
      text: "A consistência é tudo. Antes, cada vendedor respondia de um jeito. Agora, nosso 'clone' garante que todo cliente receba o mesmo nível de excelência. Nosso índice de satisfação subiu de 8.2 para 9.8.",
      name: "Beatriz Costa",
      role: "Diretora de Operações, Vestra Seguros",
      image: "/testimonials/beatriz.jpg",
      gradient: "from-cyan-700/50 via-black to-black"
    },
    {
      text: "Estávamos prestes a contratar mais duas pessoas para o suporte. Em vez disso, ativamos a SwiftBot. O custo foi 70% menor e a capacidade de atendimento se tornou infinita. Foi a decisão financeira mais inteligente que fizemos.",
      name: "Fernando Lima",
      role: "Sócio, Agência Criativa Digital",
      image: "/testimonials/fernando.jpg",
      gradient: "from-green-700/50 via-black to-black"
    },
    {
      text: "O que mais me impressionou foi a IA aprendendo nosso tom de voz. Nossos clientes não percebem que estão falando com um robô. Eles sentem que estão falando comigo. Isso não tem preço.",
      name: "Camila Oliveira",
      role: "Proprietária, Doce Sabor Confeitaria",
      image: "/testimonials/camila.jpg",
      gradient: "from-pink-700/50 via-black to-black"
    },
    {
      text: "Agendamentos, confirmações, reagendamentos... tudo automatizado. A taxa de não comparecimento caiu 40%. A SwiftBot não é só um chatbot, é um sistema de gestão de clientes.",
      name: "Dr. Marcos Ferreira",
      role: "Dentista, Sorriso Perfeito Odontologia",
      image: "/testimonials/marcos.jpg",
      gradient: "from-indigo-700/50 via-black to-black"
    },
    {
      text: "Recuperamos 25% dos carrinhos abandonados no primeiro mês. A IA aborda o cliente na hora certa, com a mensagem certa. É como ter o melhor vendedor do mundo trabalhando sem parar.",
      name: "Lucas Gomes",
      role: "Gerente de E-commerce, Tech Gadgets Brasil",
      image: "/testimonials/lucas.jpg",
      gradient: "from-violet-700/50 via-black to-black"
    },
    {
      text: "Como agência, implementamos a SwiftBot para vários clientes. O tempo de ativação é imbatível e o ROI é visível em semanas. Virou nossa recomendação padrão para automação de WhatsApp.",
      name: "Sofia Ribeiro",
      role: "Especialista em Crescimento, ScaleUp Solutions",
      image: "/testimonials/sofia.jpg",
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
            {/* Video Background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
              <source src="/particles-background.mp4" type="video/mp4" />
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
                onClick={() => router.push('/precos')}
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
        <section className="py-24 bg-[#E1DFDB] relative overflow-hidden" id="depoimentos">
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
                        <img 
                          src={testimonials[0].image} 
                          alt={testimonials[0].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[0].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[1].image} 
                          alt={testimonials[1].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[1].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[2].image} 
                          alt={testimonials[2].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[2].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[3].image} 
                          alt={testimonials[3].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[3].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[4].image} 
                          alt={testimonials[4].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[4].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[5].image} 
                          alt={testimonials[5].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[5].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[6].image} 
                          alt={testimonials[6].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[6].name.charAt(0)}</span>`
                          }}
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
                        <img 
                          src={testimonials[7].image} 
                          alt={testimonials[7].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonials[7].name.charAt(0)}</span>`
                          }}
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
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<span class="text-lg font-semibold text-black">${testimonial.name.charAt(0)}</span>`
                        }}
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

       {/* SEÇÃO 4: APRESENTAÇÃO DA SOLUÇÃO - REDESIGN */}
        <section className="py-32 bg-black relative overflow-hidden" id="solucao">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Bloco 1: Integração WhatsApp + IA */}
            <div className="mb-32 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Card com gradiente vibrante */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-[40px] p-12">
                    {/* Ícones flutuantes com animação */}
                    <div className="relative h-96 flex items-center justify-center">
                      {/* WhatsApp Icon Central */}
                      <div className="absolute w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl">
                        <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      
                      {/* Ícones orbitando */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                        </svg>
                      </div>

                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-xl animate-float-delayed">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
                    Sua Expertise, Agora <span className="font-normal bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">Escalada. Infinitamente.</span>
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6 font-light">
                    A SwiftBot não é um chatbot. É um <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-normal">agente autônomo</span> que aprende diretamente com você. Ele não segue scripts, ele segue o seu exemplo.
                  </p>
                  <p className="text-xl text-gray-300 leading-relaxed font-light">
                    Responde com o seu tom, conhece seus produtos como você e fecha vendas com a sua eficiência. É o seu <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-normal">clone digital</span>, trabalhando incansavelmente para o seu negócio.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 2: Dashboard Visual */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Texto (invertido) */}
                <div className="md:order-2">
                  <h2 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
                    Controle Total. <span className="font-normal bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Visibilidade Completa.</span>
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6 font-light">
                    Monitore cada conversa, analise performance e otimize resultados em tempo real. Dashboard intuitivo com métricas que importam.
                  </p>
                  <div className="space-y-4">
                    {['Conversas ativas 24/7', 'Taxa de conversão em tempo real', 'Insights acionáveis de IA'].map((item, idx) => (
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

                {/* Card com imagem do dashboard */}
                <div className="relative md:order-1">
                  <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-[40px] p-8">
                    <img 
                      src="/macbook.png" 
                      alt="SwiftBot Dashboard"
                      className="w-full h-auto rounded-2xl"
                    />
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
                              <stop offset="0%" style={{stopColor: idx === 0 ? '#4ade80' : idx === 1 ? '#c084fc' : '#22d3ee'}} />
                              <stop offset="100%" style={{stopColor: idx === 0 ? '#10b981' : idx === 1 ? '#ec4899' : '#3b82f6'}} />
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
                Inteligência que vai <span className="font-normal bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">além das palavras.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient1)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  title: "IA Conversacional Avançada",
                  text: "Nunca mais deixe um cliente se repetir. Nossa IA mantém o contexto completo de cada conversa, entende gírias e regionalismos, e oferece respostas personalizadas que parecem ter sido escritas por um humano experiente.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient2)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ),
                  title: "Aprendizado Contínuo",
                  text: "Seu clone fica mais inteligente a cada dia. A IA aprende com cada nova interação e incorpora seu feedback, melhorando automaticamente para se adaptar a novos produtos, promoções e perguntas dos clientes.",
                  delay: "100ms"
                },
                {
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="url(#gradient3)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: "Segurança de Nível Bancário",
                  text: "Proteja o que mais importa: seus dados e os de seus clientes. Com criptografia de ponta-a-ponta e conformidade total com a LGPD, suas conversas estão seguras em uma fortaleza digital.",
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
        <section className="py-24 bg-black relative overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src="/cta-background.mp4" type="video/mp4" />
          </video>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-black/50 backdrop-blur-sm rounded-3xl p-12 md:p-16 text-center border border-white/5 animate-on-scroll opacity-0 scale-95 transition-all duration-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FF99]/5 to-transparent rounded-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Você pode contratar mais um funcionário. <br />
                  Ou pode <span className="text-[#00FF99]">clonar o melhor que você já tem.</span>
                </h2>

                <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                  Junte-se a mais de 5.000 empresas que transformaram seu WhatsApp em uma máquina de crescimento autônoma. 
                  Cancele quando quiser. Suporte completo incluído. O risco é zero. A oportunidade é toda sua.
                </p>

                <button
                  onClick={() => router.push('/login')}
                  className="px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,255,153,0.7)] hover:scale-110 mb-8"
                >
                  Criar Meu Clone Digital Grátis
                </button>

                <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                  {[
                    "4 dias de teste grátis",
                    "Cancele quando quiser",
                    "Configuração em 5 minutos"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center">
                      <svg className="w-5 h-5 text-[#00FF99] mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
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
                <li><a href="#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Funcionalidades</a></li>
                <li><a href="#segmentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Segmentos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Segurança</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Sobre</a></li>
                <li><a href="#depoimentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm">Depoimentos</a></li>
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