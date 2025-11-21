'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// ADICIONADO: Importação do Header padrão
import Header from '../components/Header'

export default function CookiePolicyPage() {
  const router = useRouter()
  // REMOVIDO: mousePosition
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // REMOVIDO: useEffect do mouseMove
  // useEffect(() => { ... }, [])

  return (
    // MODIFICADO: Fundo preto, removidos efeitos
    <div className="min-h-screen bg-black text-gray-700 relative overflow-x-hidden">
      
      {/* ADICIONADO: Header Padrão */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10">
        
        {/* SEÇÃO 1: HERO (FUNDO PRETO) */}
        <section className="py-20 relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black/50 to-black" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-12">
              <div className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-4">
                <span className="text-[#00FF99] font-semibold text-sm">LGPD / GDPR Compliant</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-light text-white mb-4 leading-tight">
                Política de <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">Cookies</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-light">
                Atualizado em: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: CONTEÚDO (FUNDO BEGE) */}
        <section className="py-24 bg-[#E1DFDB] rounded-t-[40px] md:rounded-t-[80px] relative overflow-visible -mt-16 md:-mt-20">
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Card Branco com o conteúdo */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-black/5">
              
              {/* MODIFICADO: Estilo do conteúdo de texto */}
              <div className="space-y-8 text-gray-700 font-light leading-relaxed">
                
                {/* Seção 1 */}
                <section>
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    1. O que são Cookies?
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando você visita nosso site. 
                      Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, bem como para fornecer 
                      informações aos proprietários do site.
                    </p>
                    <p>
                      Na <strong className="text-black font-medium">SwiftBot</strong>, utilizamos cookies para:
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
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    2. Tipos de Cookies que Utilizamos
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-6">
                    
                    {/* Cookie 1 */}
                    <div className="bg-white/50 border border-black/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Cookies Essenciais (Necessários)
                      </h3>
                      <p className="mb-3">
                        Estes cookies são estritamente necessários para o funcionamento do site e não podem ser desativados em nossos sistemas.
                      </p>
                      <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className="text-black">Nome:</strong>
                            <p className="text-gray-600 font-mono">support_session</p>
                          </div>
                          <div>
                            <strong className="text-black">Duração:</strong>
                            <p className="text-gray-600">24 horas</p>
                          </div>
                          <div>
                            <strong className="text-black">Propósito:</strong>
                            <p className="text-gray-600">Autenticação do portal interno de suporte</p>
                          </div>
                          <div>
                            <strong className="text-black">Provedor:</strong>
                            <p className="text-gray-600">SwiftBot (1st party)</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-4 mt-3 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className="text-black">Nome:</strong>
                            <p className="text-gray-600 font-mono">sb-*-auth-token</p>
                          </div>
                          <div>
                            <strong className="text-black">Duração:</strong>
                            <p className="text-gray-600">Sessão / Persistent</p>
                          </div>
                          <div>
                            <strong className="text-black">Propósito:</strong>
                            <p className="text-gray-600">Autenticação de usuários (Supabase Auth)</p>
                          </div>
                          <div>
                            <strong className="text-black">Provedor:</strong>
                            <p className="text-gray-600">Supabase (3rd party)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cookie 2 */}
                    <div className="bg-white/50 border border-black/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        Cookies de Pagamento
                      </h3>
                      <p className="mb-3">
                        Utilizados para processar transações de pagamento de forma segura através da plataforma Stripe.
                      </p>
                      <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className="text-black">Nome:</strong>
                            <p className="text-gray-600 font-mono">stripe_*</p>
                          </div>
                          <div>
                            <strong className="text-black">Duração:</strong>
                            <p className="text-gray-600">Sessão</p>
                          </div>
                          <div>
                            <strong className="text-black">Propósito:</strong>
                            <p className="text-gray-600">Processamento seguro de pagamentos e prevenção de fraudes</p>
                          </div>
                          <div>
                            <strong className="text-black">Provedor:</strong>
                            <p className="text-gray-600">Stripe Inc. (3rd party)</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                          <p className="text-blue-800 text-xs">
                            ℹ️ A Stripe é certificada PCI DSS Level 1, o mais alto padrão de segurança da indústria de pagamentos.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cookie 3 */}
                    <div className="bg-white/50 border border-black/10 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688 0-1.25-.561-1.25-1.25 0-.688.562-1.25 1.25-1.25s1.25.562 1.25 1.25c0 .689-.562 1.25-1.25 1.25zm0-10c-.688 0-1.25-.561-1.25-1.25 0-.688.562-1.25 1.25-1.25s1.25.562 1.25 1.25c0 .689-.562 1.25-1.25 1.25zm-5 5c-.688 0-1.25-.561-1.25-1.25 0-.688.562-1.25 1.25-1.25s1.25.562 1.25 1.25c0 .689-.562 1.25-1.25 1.25zm10 0c-.688 0-1.25-.561-1.25-1.25 0-.688.562-1.25 1.25-1.25s1.25.562 1.25 1.25c0 .689-.562 1.25-1.25 1.25z" /></svg>
                        Cookies Funcionais
                      </h3>
                      <p className="mb-3">
                        Permitem que o site lembre suas escolhas e forneça recursos aprimorados e personalizados.
                      </p>
                      <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className="text-black">Nome:</strong>
                            <p className="text-gray-600 font-mono">swiftbot_cookie_consent</p>
                          </div>
                          <div>
                            <strong className="text-black">Duração:</strong>
                            <p className="text-gray-600">1 ano</p>
                          </div>
                          <div>
                            <strong className="text-black">Propósito:</strong>
                            <p className="text-gray-600">Armazena suas preferências de cookies</p>
                          </div>
                          <div>
                            <strong className="text-black">Provedor:</strong>
                            <p className="text-gray-600">SwiftBot (1st party)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* Seção 3 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    3. Cookies de Terceiros
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-4">
                    <p>
                      Em alguns casos, também utilizamos cookies fornecidos por terceiros confiáveis. Os principais são:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">Supabase</h4>
                        <p className="text-sm">
                          Plataforma de backend que gerencia autenticação, banco de dados e armazenamento. 
                          Cookies usados para manter sessões seguras.
                        </p>
                        <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" 
                           className="text-green-600 hover:underline text-sm inline-flex items-center mt-2">
                          Ver Política de Privacidade
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>

                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">Stripe</h4>
                        <p className="text-sm">
                          Processador de pagamentos que utiliza cookies para detectar e prevenir fraudes, 
                          além de processar transações de forma segura.
                        </p>
                        <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" 
                           className="text-green-600 hover:underline text-sm inline-flex items-center mt-2">
                          Ver Política de Privacidade
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>

                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">Google Fonts</h4>
                        <p className="text-sm">
                          Utilizamos fontes do Google para melhorar a tipografia do site. 
                          O Google pode usar cookies para análise de uso de fontes.
                        </p>
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" 
                           className="text-green-600 hover:underline text-sm inline-flex items-center mt-2">
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
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    4. Como Gerenciar Cookies
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-4">
                    <p>
                      Você tem total controle sobre quais cookies aceitar. Você pode:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Configurar suas preferências através do nosso banner de cookies</li>
                      <li>Alterar as configurações do seu navegador para bloquear cookies</li>
                      <li>Excluir cookies já armazenados no seu dispositivo</li>
                    </ul>
                    
                    <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mt-4">
                      <div className="flex items-start">
                        <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <strong className="text-yellow-800">Atenção:</strong>
                          <p className="text-yellow-700 text-sm mt-1">
                            Bloquear alguns tipos de cookies pode afetar sua experiência no site e os serviços que podemos oferecer. 
                            Cookies essenciais não podem ser desativados pois são necessários para o funcionamento básico do site.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold text-black mb-3">Como Bloquear Cookies no Navegador:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/50 border border-black/10 rounded-lg p-3">
                          <strong className="text-green-600">Chrome</strong>
                          <p className="text-sm text-gray-600 mt-1">Configurações → Privacidade e segurança → Cookies</p>
                        </div>
                        <div className="bg-white/50 border border-black/10 rounded-lg p-3">
                          <strong className="text-green-600">Firefox</strong>
                          <p className="text-sm text-gray-600 mt-1">Opções → Privacidade e Segurança → Cookies</p>
                        </div>
                        <div className="bg-white/50 border border-black/10 rounded-lg p-3">
                          <strong className="text-green-600">Safari</strong>
                          <p className="text-sm text-gray-600 mt-1">Preferências → Privacidade → Gerenciar Cookies</p>
                        </div>
                        <div className="bg-white/50 border border-black/10 rounded-lg p-3">
                          <strong className="text-green-600">Edge</strong>
                          <p className="text-sm text-gray-600 mt-1">Configurações → Cookies e permissões do site</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seção 5 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    5. Conformidade com LGPD e GDPR
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      A SwiftBot está comprometida com a proteção de dados e em conformidade com:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      <div className="bg-blue-100 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-800 mb-2">🇧🇷 LGPD</h4>
                        <p className="text-sm text-gray-700">
                          Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
                        </p>
                      </div>
                      <div className="bg-purple-100 border border-purple-200 rounded-xl p-4">
                        <h4 className="font-bold text-purple-800 mb-2">🇪🇺 GDPR</h4>
                        <p className="text-sm text-gray-700">
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
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    6. Contato e Dúvidas
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Se você tiver dúvidas sobre nossa Política de Cookies ou sobre como gerenciamos seus dados, 
                      entre em contato:
                    </p>
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-6 space-y-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">Email: <a href="mailto:privacidade@swiftbot.com.br" className="text-green-600 hover:underline">privacidade@swiftbot.com.br</a></span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">DPO (Encarregado de Dados): <span className="text-black font-medium">dpo@swiftbot.com.br</span></span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Última Atualização */}
                <section className="border-t border-black/10 pt-8">
                  <div className="bg-white/50 border border-black/10 rounded-xl p-6 text-center">
                    <p className="text-gray-700 text-sm">
                      <strong className="text-black">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                  className="bg-black/80 hover:bg-black text-white px-8 py-3 rounded-full font-medium transition-all duration-300 inline-flex items-center mx-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Ver Política de Privacidade
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,153,0.5)] inline-flex items-center mx-2"
                >
                  Voltar ao Início
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

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
                    <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0"/>
                     <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1"/>
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
                <a href="https://www.facebook.com/SwiftBott" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/swiftbot.ia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                  <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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
                <li><a href="/precos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Preços</a></li>
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
              <a href="/privacidade" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Privacidade</a>
              <a href="/termos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Termos de Uso</a>
              <a href="/cookies" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Política de Cookies/LGPD</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}