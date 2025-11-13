'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CookiePolicyPage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-[#04F5A0]/20 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(4, 245, 160, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(4, 245, 160, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

{/* Header FIXO - Igual à Landing Page */}
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
        <a href="/faq" className="text-gray-300 hover:text-[#00FF99] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,153,0.8)]">
          FAQ
        </a>
      </nav>

      <div className="flex items-center space-x-4">
        <button 
          onClick={() => router.push('/login')}
          className="text-gray-300 hover:text-[#00FF99] font-medium transition-all duration-300"
        >
          Login
        </button>
        <button 
          onClick={() => router.push('/login')}
          className="bg-[#00FF99] hover:bg-[#00E68C] text-black px-6 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,153,0.5)]"
        >
          Testar Grátis
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
</header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-24 max-w-5xl">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-block bg-[#04F5A0]/10 border border-[#04F5A0]/30 rounded-full px-6 py-2 mb-4">
              <span className="text-[#04F5A0] font-semibold text-sm">🍪 LGPD / GDPR Compliant</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Política de Cookies
            </h1>
            <p className="text-gray-400 text-lg">
              Atualizado em: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-gray-300">
            
            {/* Seção 1 */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">1.</span>
                O que são Cookies?
              </h2>
              <div className="pl-8 space-y-3 leading-relaxed">
                <p>
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando você visita nosso site. 
                  Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, bem como para fornecer 
                  informações aos proprietários do site.
                </p>
                <p>
                  Na <strong className="text-white">SwiftBot</strong>, utilizamos cookies para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Manter você conectado durante a navegação</li>
                  <li>Lembrar suas preferências e configurações</li>
                  <li>Processar pagamentos de forma segura</li>
                  <li>Garantir a segurança da sua conta</li>
                  <li>Melhorar o desempenho e funcionalidade do site</li>
                </ul>
              </div>
            </section>

            {/* Seção 2 */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">2.</span>
                Tipos de Cookies que Utilizamos
              </h2>
              <div className="pl-8 space-y-6">
                
                {/* Cookie 1 */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-[#04F5A0] mb-3 flex items-center">
                    <span className="mr-2">🔐</span>
                    Cookies Essenciais (Necessários)
                  </h3>
                  <p className="mb-3">
                    Estes cookies são estritamente necessários para o funcionamento do site e não podem ser desativados em nossos sistemas.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="text-white">Nome:</strong>
                        <p className="text-gray-400 font-mono">support_session</p>
                      </div>
                      <div>
                        <strong className="text-white">Duração:</strong>
                        <p className="text-gray-400">24 horas</p>
                      </div>
                      <div>
                        <strong className="text-white">Propósito:</strong>
                        <p className="text-gray-400">Autenticação do portal interno de suporte</p>
                      </div>
                      <div>
                        <strong className="text-white">Provedor:</strong>
                        <p className="text-gray-400">SwiftBot (1st party)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/50 rounded-lg p-4 mt-3 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="text-white">Nome:</strong>
                        <p className="text-gray-400 font-mono">sb-*-auth-token</p>
                      </div>
                      <div>
                        <strong className="text-white">Duração:</strong>
                        <p className="text-gray-400">Sessão / Persistent</p>
                      </div>
                      <div>
                        <strong className="text-white">Propósito:</strong>
                        <p className="text-gray-400">Autenticação de usuários (Supabase Auth)</p>
                      </div>
                      <div>
                        <strong className="text-white">Provedor:</strong>
                        <p className="text-gray-400">Supabase (3rd party)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookie 2 */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
                    <span className="mr-2">💳</span>
                    Cookies de Pagamento
                  </h3>
                  <p className="mb-3">
                    Utilizados para processar transações de pagamento de forma segura através da plataforma Stripe.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="text-white">Nome:</strong>
                        <p className="text-gray-400 font-mono">stripe_*</p>
                      </div>
                      <div>
                        <strong className="text-white">Duração:</strong>
                        <p className="text-gray-400">Sessão</p>
                      </div>
                      <div>
                        <strong className="text-white">Propósito:</strong>
                        <p className="text-gray-400">Processamento seguro de pagamentos e prevenção de fraudes</p>
                      </div>
                      <div>
                        <strong className="text-white">Provedor:</strong>
                        <p className="text-gray-400">Stripe Inc. (3rd party)</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-xs">
                        ℹ️ A Stripe é certificada PCI DSS Level 1, o mais alto padrão de segurança da indústria de pagamentos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cookie 3 */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center">
                    <span className="mr-2">⚙️</span>
                    Cookies Funcionais
                  </h3>
                  <p className="mb-3">
                    Permitem que o site lembre suas escolhas e forneça recursos aprimorados e personalizados.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong className="text-white">Nome:</strong>
                        <p className="text-gray-400 font-mono">swiftbot_cookie_consent</p>
                      </div>
                      <div>
                        <strong className="text-white">Duração:</strong>
                        <p className="text-gray-400">1 ano</p>
                      </div>
                      <div>
                        <strong className="text-white">Propósito:</strong>
                        <p className="text-gray-400">Armazena suas preferências de cookies</p>
                      </div>
                      <div>
                        <strong className="text-white">Provedor:</strong>
                        <p className="text-gray-400">SwiftBot (1st party)</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Seção 3 */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">3.</span>
                Cookies de Terceiros
              </h2>
              <div className="pl-8 space-y-4">
                <p>
                  Em alguns casos, também utilizamos cookies fornecidos por terceiros confiáveis. Os principais são:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-900/20 to-transparent border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-white mb-2">🔹 Supabase</h4>
                    <p className="text-sm">
                      Plataforma de backend que gerencia autenticação, banco de dados e armazenamento. 
                      Cookies usados para manter sessões seguras.
                    </p>
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" 
                       className="text-[#04F5A0] hover:underline text-sm inline-flex items-center mt-2">
                      Ver Política de Privacidade
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-white mb-2">🔹 Stripe</h4>
                    <p className="text-sm">
                      Processador de pagamentos que utiliza cookies para detectar e prevenir fraudes, 
                      além de processar transações de forma segura.
                    </p>
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" 
                       className="text-[#04F5A0] hover:underline text-sm inline-flex items-center mt-2">
                      Ver Política de Privacidade
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-white mb-2">🔹 Google Fonts</h4>
                    <p className="text-sm">
                      Utilizamos fontes do Google para melhorar a tipografia do site. 
                      O Google pode usar cookies para análise de uso de fontes.
                    </p>
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" 
                       className="text-[#04F5A0] hover:underline text-sm inline-flex items-center mt-2">
                      Ver Política de Privacidade
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 4 */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">4.</span>
                Como Gerenciar Cookies
              </h2>
              <div className="pl-8 space-y-4">
                <p>
                  Você tem total controle sobre quais cookies aceitar. Você pode:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Configurar suas preferências através do nosso banner de cookies</li>
                  <li>Alterar as configurações do seu navegador para bloquear cookies</li>
                  <li>Excluir cookies já armazenados no seu dispositivo</li>
                </ul>
                
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mt-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong className="text-yellow-500">⚠️ Atenção:</strong>
                      <p className="text-yellow-200 text-sm mt-1">
                        Bloquear alguns tipos de cookies pode afetar sua experiência no site e os serviços que podemos oferecer. 
                        Cookies essenciais não podem ser desativados pois são necessários para o funcionamento básico do site.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold text-white mb-3">Como Bloquear Cookies no Navegador:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <strong className="text-[#04F5A0]">Chrome</strong>
                      <p className="text-sm text-gray-400 mt-1">Configurações → Privacidade e segurança → Cookies</p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <strong className="text-[#04F5A0]">Firefox</strong>
                      <p className="text-sm text-gray-400 mt-1">Opções → Privacidade e Segurança → Cookies</p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <strong className="text-[#04F5A0]">Safari</strong>
                      <p className="text-sm text-gray-400 mt-1">Preferências → Privacidade → Gerenciar Cookies</p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <strong className="text-[#04F5A0]">Edge</strong>
                      <p className="text-sm text-gray-400 mt-1">Configurações → Cookies e permissões do site</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 5 */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">5.</span>
                Conformidade com LGPD e GDPR
              </h2>
              <div className="pl-8 space-y-3">
                <p>
                  A SwiftBot está comprometida com a proteção de dados e em conformidade com:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-gradient-to-br from-blue-900/30 to-transparent border border-blue-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-blue-400 mb-2">🇧🇷 LGPD</h4>
                    <p className="text-sm text-gray-400">
                      Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/30 to-transparent border border-purple-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-purple-400 mb-2">🇪🇺 GDPR</h4>
                    <p className="text-sm text-gray-400">
                      General Data Protection Regulation (Regulamento UE 2016/679)
                    </p>
                  </div>
                </div>
                <p>
                  Respeitamos seus direitos de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos ou incorretos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Revogar consentimento a qualquer momento</li>
                  <li>Exportar seus dados (portabilidade)</li>
                </ul>
              </div>
            </section>

            {/* Seção 6 */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-[#04F5A0]">6.</span>
                Contato e Dúvidas
              </h2>
              <div className="pl-8 space-y-3">
                <p>
                  Se você tiver dúvidas sobre nossa Política de Cookies ou sobre como gerenciamos seus dados, 
                  entre em contato:
                </p>
                <div className="bg-gradient-to-r from-[#04F5A0]/10 to-transparent border-l-4 border-[#04F5A0] rounded-r-xl p-6 space-y-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email: <a href="mailto:privacidade@swiftbot.com.br" className="text-[#04F5A0] hover:underline">privacidade@swiftbot.com.br</a></span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#04F5A0] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>DPO (Encarregado de Dados): <span className="text-white">dpo@swiftbot.com.br</span></span>
                  </div>
                </div>
              </div>
            </section>

            {/* Última Atualização */}
            <section className="border-t border-white/10 pt-8">
              <div className="bg-black/30 border border-white/5 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Reservamos o direito de atualizar esta política periodicamente. 
                  Recomendamos revisar esta página regularmente.
                </p>
              </div>
            </section>

          </div>

          {/* CTA Final */}
          <div className="mt-12 text-center flex flex-wrap justify-center gap-4 items-center">
            <button
              onClick={() => router.push('/privacidade')}
              className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-8 py-3 rounded-xl transition-all duration-300 inline-flex items-center mx-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Ver Política de Privacidade
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-[#04F5A0] hover:bg-[#03E691] text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] inline-flex items-center mx-2"
            >
              Voltar ao Início
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-xl py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} SwiftBot. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}