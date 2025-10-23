// app/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const router = useRouter()
  const [expandedFeature, setExpandedFeature] = useState(null)
  const carouselRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Intersection Observer para animações suaves que reanimam ao entrar/sair
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Adiciona a animação quando entra na viewport
            entry.target.classList.add('animate-in')
          } else {
            // Remove a animação quando sai da viewport para permitir reanimação
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
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Header FIXO */}
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
              <a href="#solucao" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Solução
              </a>
              <a href="#funcionalidades" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Funcionalidades
              </a>
              <a href="#depoimentos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Depoimentos
              </a>
              <a href="#segmentos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Segmentos
              </a>
              <a href="/precos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
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
        
        {/* SEÇÃO 1: HERO COM VÍDEO DE FUNDO */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
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

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
            <h1 
              className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              E se você pudesse <br />
              <span className="text-[#00FF99]">se clonar?</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
              Tenha seu <span className="text-[#00FF99] font-semibold">melhor atendimento</span>, em todos os lugares, 24/7. 
              Chega de perder vendas às 22h ou treinar funcionários que nunca atendem como você. 
              A SwiftBot cria um <span className="text-[#00FF99] font-semibold">clone digital do seu atendimento</span> em 5 minutos. 
              Apenas escaneie um QR Code.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] hover:scale-105 mb-6"
            >
              Criar Meu Clone Digital Grátis
            </button>

            <p className="text-sm text-gray-400">
              Junte-se a mais de 5.000 empresas que já escalaram sua expertise. <br />
              Teste grátis por 4 dias - cartão necessário apenas para confirmação.
            </p>
          </div>
        </section>

        {/* SEÇÃO 2: AGITAÇÃO DO PROBLEMA */}
        <section className="py-24 bg-black relative overflow-hidden">
          {/* Gradiente roxo/rosa (diagonal da esquerda superior para direita inferior) */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/30 via-black to-pink-700/30" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Você é o melhor vendedor da sua empresa. <br />
                <span className="text-[#00FF99]">E esse é o seu maior problema.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ),
                  title: "Vendas Perdidas Fora do Expediente",
                  text: "Seu cliente não tem horário comercial. Uma dúvida às 23h é uma compra que, sem resposta imediata, vai para o concorrente amanhã de manhã. Cada notificação não respondida é receita que evapora.",
                  delay: "0ms"
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  ),
                  title: "Atendimento Inconsistente",
                  text: "Você treina sua equipe, cria manuais, mas ninguém tem o seu toque. Respostas erradas, tons inadequados e falta de conhecimento profundo sobre o produto diluem sua marca e frustram clientes fiéis.",
                  delay: "200ms"
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  ),
                  title: "O Limite do Seu Tempo",
                  text: "Contratar é caro e demorado. Treinar é um investimento de alto risco. Seu crescimento está limitado pela sua capacidade de estar em todos os lugares ao mesmo tempo. Você se tornou o gargalo do seu próprio sucesso.",
                  delay: "400ms"
                }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="group bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: item.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: CARROSSEL DE DEPOIMENTOS (INFINITO COM FOTOS) */}
        <section className="py-24 bg-black relative overflow-hidden" id="depoimentos">
          {/* Gradiente azul/cyan (diagonal da direita superior para esquerda inferior) */}
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-700/30 via-black to-cyan-700/30" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <div className="text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Construído para escalar. <span className="text-[#00FF99]">Aprovado por quem usa.</span>
              </h2>
            </div>
          </div>

          {/* Carrossel Infinito */}
          <div className="relative z-10">
            <div 
              className="flex gap-6 animate-carousel"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                animationPlayState: isHovered ? 'paused' : 'running'
              }}
            >
              {infiniteTestimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`flex-shrink-0 w-[500px] bg-gradient-to-br ${testimonial.gradient} backdrop-blur-sm rounded-2xl p-8 border border-white/5 select-none`}
                >
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden mr-4 flex-shrink-0 border-2 border-[#00FF99]/30">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl text-[#00FF99]">${testimonial.name.charAt(0)}</div>`
                        }}
                      />
                    </div>
                    <svg className="w-10 h-10 text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed mb-8 text-lg">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-white font-bold text-lg">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 4: APRESENTAÇÃO DA SOLUÇÃO COM IMAGEM */}
        <section className="py-24 bg-black relative overflow-hidden" id="solucao">
          {/* Gradiente verde/teal (radial do centro) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-700/30 via-black to-teal-700/30" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Imagem do MacBook à esquerda */}
              <div className="animate-on-scroll opacity-0 -translate-x-10 transition-all duration-1000">
                <div className="w-full">
                  <img 
                    src="/macbook.png" 
                    alt="SwiftBot Dashboard"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Texto à direita */}
              <div className="animate-on-scroll opacity-0 translate-x-10 transition-all duration-1000">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
                  Sua Expertise, Agora <span className="text-[#00FF99]">Escalada. Infinitamente.</span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed mb-6">
                  A SwiftBot não é um chatbot. É um <span className="text-[#00FF99] font-semibold">agente autônomo</span> que 
                  aprende diretamente com você. Ele não segue scripts, ele segue o seu exemplo.
                </p>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Responde com o seu tom, conhece seus produtos como você e fecha vendas com a sua eficiência. 
                  É o seu <span className="text-[#00FF99] font-semibold">clone digital</span>, trabalhando incansavelmente 
                  para o seu negócio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 5: FUNCIONALIDADE QR CODE */}
        <section className="py-24 bg-black relative overflow-hidden">
          {/* Gradiente roxo/indigo (diagonal da esquerda inferior para direita superior) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/30 via-black to-indigo-700/30" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                A configuração mais rápida do mercado <br />
                <span className="text-[#00FF99]">é não ter configuração.</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Esqueça formulários, uploads e tutoriais. Apenas aponte a câmera do seu celular.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 mb-16">
              {[
                {
                  num: "1",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
                  title: "ESCANEIE O QR CODE",
                  text: "Conecte seu WhatsApp Business à nossa plataforma segura.",
                  gradient: "from-[#00FF99] to-[#00E88C]",
                  delay: "0ms"
                },
                {
                  num: "2",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                  title: "AUTORIZE A ANÁLISE",
                  text: "Nossa IA lê seu histórico de conversas de forma criptografada e anônima.",
                  gradient: "from-purple-600 to-blue-600",
                  delay: "200ms"
                },
                {
                  num: "3",
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                  title: "ATIVE SEU CLONE",
                  text: "Em minutos, seu agente de IA está ativo, respondendo a clientes como você faria.",
                  gradient: "from-blue-600 to-cyan-600",
                  delay: "400ms"
                }
              ].map((step, idx) => (
                <div 
                  key={idx}
                  className="text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000"
                  style={{ transitionDelay: step.delay }}
                >
                  <div className="relative inline-block mb-8">
                    <div className={`w-24 h-24 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center text-black text-4xl font-black shadow-[0_0_40px_rgba(0,255,153,0.4)]`}>
                      {step.num}
                    </div>
                  </div>
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {step.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center max-w-4xl mx-auto animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <p className="text-xl text-gray-300 leading-relaxed mb-4">
                Nossa tecnologia exclusiva analisa anos de suas conversas no WhatsApp em minutos. 
                Ela aprende suas melhores respostas, seu jeito de negociar e até as gírias que você usa. 
                O resultado? Um agente de IA que não soa como um robô, <span className="text-[#00FF99] font-semibold">soa como você</span>.
              </p>
              <p className="text-sm text-gray-500 italic">
                (Esta é uma função premium. Disponível para todos os clientes nos planos pagos.)
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 6: FUNCIONALIDADES (ACORDEÃO) */}
        <section className="py-24 bg-black relative overflow-hidden" id="funcionalidades">
          {/* Gradiente rosa/vermelho (diagonal da direita inferior para esquerda superior) */}
          <div className="absolute inset-0 bg-gradient-to-tl from-pink-700/30 via-black to-red-700/30" />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Inteligência que vai <span className="text-[#00FF99]">além das palavras.</span>
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 1,
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
                  title: "IA Conversacional Avançada",
                  text: "Nunca mais deixe um cliente se repetir. Nossa IA mantém o contexto completo de cada conversa, entende gírias e regionalismos, e oferece respostas personalizadas que parecem ter sido escritas por um humano experiente."
                },
                {
                  id: 2,
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
                  title: "Aprendizado Contínuo e Adaptativo",
                  text: "Seu clone fica mais inteligente a cada dia. A IA aprende com cada nova interação e incorpora seu feedback, melhorando automaticamente para se adaptar a novos produtos, promoções e perguntas dos clientes."
                },
                {
                  id: 3,
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                  title: "Segurança de Nível Bancário",
                  text: "Proteja o que mais importa: seus dados e os de seus clientes. Com criptografia de ponta-a-ponta e conformidade total com a LGPD, suas conversas estão seguras em uma fortaleza digital."
                }
              ].map((feature, idx) => (
                <div 
                  key={feature.id}
                  className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300 animate-on-scroll opacity-0 translate-y-10"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                    className="w-full p-8 flex items-center justify-between bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 bg-[#00FF99]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {feature.icon}
                        </svg>
                      </div>
                      <h3 className={`text-2xl font-bold text-left transition-colors ${expandedFeature === feature.id ? 'text-[#00FF99]' : 'text-white'}`}>
                        {feature.title}
                      </h3>
                    </div>
                    <svg 
                      className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${expandedFeature === feature.id ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFeature === feature.id && (
                    <div className="px-8 pb-8 bg-black/50">
                      <p className="text-lg text-gray-300 leading-relaxed">
                        {feature.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 7: SEGMENTOS DE CLIENTES (6 CATEGORIAS) */}
        <section className="py-24 bg-black relative overflow-hidden" id="segmentos">
          {/* Gradiente cyan/azul (radial do canto superior direito) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-700/30 via-black to-blue-700/30" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Criado para quem <span className="text-[#00FF99]">não tem tempo a perder.</span>
              </h2>
            </div>

            {/* Primeira linha - 3 cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
                  title: "E-commerce",
                  text: "Responda dúvidas sobre produtos, rastreie pedidos e recupere carrinhos abandonados 24/7, transformando seu WhatsApp em sua melhor vitrine.",
                  gradient: "from-purple-700/50 via-black to-black",
                  delay: "0ms"
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
                  title: "Clínicas e Consultórios",
                  text: "Automatize agendamentos, confirmações e lembretes de consultas. Reduza faltas em até 40% e mantenha sua agenda otimizada com atendimento 24/7 aos pacientes.",
                  gradient: "from-blue-700/50 via-black to-black",
                  delay: "100ms"
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                  title: "Corretoras e Seguros",
                  text: "Qualifique leads automaticamente, tire dúvidas sobre apólices e envie cotações personalizadas. Seu clone trabalha enquanto você fecha os melhores negócios.",
                  gradient: "from-cyan-700/50 via-black to-black",
                  delay: "200ms"
                }
              ].map((segment, idx) => (
                <div 
                  key={idx}
                  className={`group bg-gradient-to-br ${segment.gradient} backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10`}
                  style={{ transitionDelay: segment.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {segment.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {segment.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Segunda linha - 3 cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                  title: "Agências e Consultorias",
                  text: "Qualifique leads automaticamente, direcione-os para o especialista certo e garanta que nenhuma oportunidade de negócio seja perdida por demora na resposta.",
                  gradient: "from-green-700/50 via-black to-black",
                  delay: "0ms"
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                  title: "Prestadores de Serviço",
                  text: "Agende consultas, confirme horários e envie lembretes automáticos. Reduza o não comparecimento e mantenha sua agenda sempre cheia.",
                  gradient: "from-pink-700/50 via-black to-black",
                  delay: "100ms"
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
                  title: "Imobiliárias",
                  text: "Responda sobre imóveis disponíveis, agende visitas automaticamente e envie materiais personalizados. Seu clone nunca perde um lead interessado.",
                  gradient: "from-indigo-700/50 via-black to-black",
                  delay: "200ms"
                }
              ].map((segment, idx) => (
                <div 
                  key={idx}
                  className={`group bg-gradient-to-br ${segment.gradient} backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10`}
                  style={{ transitionDelay: segment.delay }}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {segment.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {segment.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
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

        @keyframes carousel {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-516px * 8));
          }
        }

        .animate-carousel {
          animation: carousel 60s linear infinite;
          width: fit-content;
        }
      `}</style>
    </div>
  )
}