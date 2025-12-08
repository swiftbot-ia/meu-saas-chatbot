// app/faq/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '../components/Header'

export default function FAQ() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState(null)

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
        question: "Existe limite de mensagens no plano?",
        answer: "Não! Na SwiftBot você paga apenas por WhatsApp conectado, sem qualquer limite de mensagens. Suas conversas são ilimitadas. Você pode enviar e receber quantas mensagens precisar, sem se preocupar com cobranças extras ou bloqueios. Nosso objetivo é que você use a plataforma sem restrições para crescer seu negócio."
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
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Header Importado */}
      <Header />

      <main className="relative z-10">

        {/* SEÇÃO 1: HERO PRETO */}
        <section className="py-32 bg-black relative overflow-hidden">
          {/* Gradiente sutil de fundo */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-black to-black" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
                Perguntas <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">Frequentes</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                Tem alguma dúvida? <span className="text-[#00FF99] font-normal">Provavelmente ela já foi respondida aqui.</span>
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: FAQs FUNDO BEGE COM ARREDONDAMENTO */}
        <section className="py-24 bg-[#E1DFDB] rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-1">
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Categoria: Teste e Pagamento */}
            <div className="mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  {/* SVG Pagamento */}
                  <svg className="w-12 h-12" fill="none" stroke="url(#gradientPayment)" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradientPayment" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-black mb-4 leading-tight">
                  Sobre o Teste e <span className="font-normal text-black">Pagamento</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.payment.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden border border-black/5 hover:border-black/10 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(`payment-${index}`)}
                      className="w-full p-8 flex items-center justify-between hover:bg-white/80 transition-colors"
                    >
                      <span className="text-xl font-normal text-black text-left pr-6">
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 bg-[#00FF99]/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openFaq === `payment-${index}` ? 'rotate-45' : 'rotate-0'
                        }`}>
                        <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>

                    {openFaq === `payment-${index}` && (
                      <div className="px-8 pb-8 bg-white/30">
                        <div className="pt-6 border-t border-black/5">
                          <p className="text-lg text-gray-700 leading-relaxed font-light">
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
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  {/* SVG Tecnologia */}
                  <svg className="w-12 h-12" fill="none" stroke="url(#gradientTech)" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradientTech" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-black mb-4 leading-tight">
                  Sobre a Tecnologia e <span className="font-normal text-black">Uso</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.technology.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden border border-black/5 hover:border-black/10 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(`tech-${index}`)}
                      className="w-full p-8 flex items-center justify-between hover:bg-white/80 transition-colors"
                    >
                      <span className="text-xl font-normal text-black text-left pr-6">
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 bg-[#00FF99]/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openFaq === `tech-${index}` ? 'rotate-45' : 'rotate-0'
                        }`}>
                        <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>

                    {openFaq === `tech-${index}` && (
                      <div className="px-8 pb-8 bg-white/30">
                        <div className="pt-6 border-t border-black/5">
                          <p className="text-lg text-gray-700 leading-relaxed font-light">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* SEÇÃO 3: CTA COM FUNDO PRETO E ARREDONDAMENTO */}
        <div className="h-20 md:h-32 bg-[#E1DFDB]" />
        <section className="py-32 bg-black rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden -mt-20 md:-mt-32">
          {/* Gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black to-black/90" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-on-scroll opacity-0 scale-95 transition-all duration-1000">
              {/* Ícone */}
              <div className="flex justify-center mb-8">
                <svg className="w-16 h-16" fill="none" stroke="url(#gradientChat)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradientChat" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <h2 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
                Ainda com <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">dúvidas?</span>
              </h2>

              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                Nossa equipe está pronta para responder qualquer pergunta que você tenha sobre o SwiftBot.
              </p>

              <button
                onClick={() => router.push('/login')}
                className="px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-full font-semibold text-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] hover:scale-105"
              >
                Fale com a Gente
              </button>
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
                <li><a href="/#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Funcionalidades</a></li>
                <li><a href="/#segmentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Segmentos</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Preços</a></li>
              </ul>
            </div>

            {/* Coluna 3: Empresa */}
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Sobre Nós</a></li>
                <li><a href="/#depoimentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Depoimentos</a></li>
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
        .animate-on-scroll {
          transition-property: opacity, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) !important;
        }
      `}</style>
    </div>
  )
}