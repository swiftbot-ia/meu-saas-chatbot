// app/faq/page.js
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FAQ() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState(null)

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
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* HEADER FIXO - IGUAL À LANDING PAGE */}
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
              <a href="/precos" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
                Preços
              </a>
              <a href="/faq" className="text-[#00FF99] font-semibold drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
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
        
        {/* BLOCO 1: TODO O CONTEÚDO DE FAQ - COM DEGRADÊ ROXO */}
        <section className="py-32 bg-black relative overflow-hidden">
          {/* Gradiente roxo/rosa (diagonal da esquerda superior para direita inferior) */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/30 via-black to-pink-700/30" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Título Principal */}
            <div className="text-center mb-20">
              <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
                Perguntas <span className="text-[#00FF99]">Frequentes</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Tem alguma dúvida? <span className="text-[#00FF99] font-semibold">Provavelmente ela já foi respondida aqui.</span>
              </p>
            </div>

            {/* Categoria: Teste e Pagamento */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#00FF99]/10 rounded-2xl mb-6">
                  <span className="text-4xl">💳</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Sobre o Teste e <span className="text-[#00FF99]">Pagamento</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.payment.map((faq, index) => (
                  <div 
                    key={index}
                    className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(`payment-${index}`)}
                      className="w-full p-8 flex items-center justify-between bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <span className="text-xl font-bold text-white text-left pr-6">
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 bg-[#00FF99]/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                        openFaq === `payment-${index}` ? 'rotate-45' : 'rotate-0'
                      }`}>
                        <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                    
                    {openFaq === `payment-${index}` && (
                      <div className="px-8 pb-8 bg-black/30">
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-lg text-gray-300 leading-relaxed">
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
            <div>
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#00FF99]/10 rounded-2xl mb-6">
                  <span className="text-4xl">🤖</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Sobre a Tecnologia e <span className="text-[#00FF99]">Uso</span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqData.technology.map((faq, index) => (
                  <div 
                    key={index}
                    className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(`tech-${index}`)}
                      className="w-full p-8 flex items-center justify-between bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <span className="text-xl font-bold text-white text-left pr-6">
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 bg-[#00FF99]/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                        openFaq === `tech-${index}` ? 'rotate-45' : 'rotate-0'
                      }`}>
                        <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                    
                    {openFaq === `tech-${index}` && (
                      <div className="px-8 pb-8 bg-black/30">
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-lg text-gray-300 leading-relaxed">
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

        {/* BLOCO 2: CTA COM BACKGROUND PRETO */}
        <section className="relative bg-black py-20">
          {/* CTA Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#00FF99]/10 backdrop-blur-sm rounded-2xl mb-8">
              <span className="text-5xl">💬</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Ainda com <span className="text-[#00FF99]">dúvidas?</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Nossa equipe está pronta para responder qualquer pergunta que você tenha sobre o SwiftBot.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-12 py-5 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] hover:scale-105"
            >
              Fale com a Gente
            </button>
          </div>
        </section>

      </main>

      {/* FOOTER - IGUAL À LANDING PAGE */}
      <footer className="bg-black border-t border-white/5 py-12">
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
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/#solucao" className="text-gray-400 hover:text-[#00FF99] transition-colors">Solução</a></li>
                <li><a href="/#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors">Funcionalidades</a></li>
                <li><a href="/precos" className="text-gray-400 hover:text-[#00FF99] transition-colors">Preços</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Sobre Nós</button></li>
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Blog</button></li>
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Carreiras</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Central de Ajuda</button></li>
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Documentação</button></li>
                <li><button className="text-gray-400 hover:text-[#00FF99] transition-colors">Status</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 SwiftBot. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <button className="text-gray-400 hover:text-[#00FF99] transition-colors">
                Termos de Uso
              </button>
              <button className="text-gray-400 hover:text-[#00FF99] transition-colors">
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}