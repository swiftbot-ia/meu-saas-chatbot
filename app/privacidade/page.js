'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
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
      {/* Background Effects - Same as cookies page */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#04F5A0]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(138, 43, 226, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(138, 43, 226, 0.1) 1px, transparent 1px)
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

          
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-block bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 mb-4">
              <span className="text-purple-400 font-semibold text-sm">🔒 LGPD / GDPR Compliant</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Política de Privacidade
            </h1>
            <p className="text-gray-400 text-lg">
              Atualizado em: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-gray-300">
            
            {/* Seção 1 - Introdução */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">1.</span>
                Introdução e Compromisso com Privacidade
              </h2>
              <div className="pl-8 space-y-3 leading-relaxed">
                <p>
                  A <strong className="text-white">SwiftBot</strong> ("nós", "nosso" ou "empresa") está comprometida em proteger 
                  a privacidade e os dados pessoais de nossos usuários ("você", "usuário" ou "titular de dados").
                </p>
                <p>
                  Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                  quando você utiliza nossa plataforma de chatbots com inteligência artificial para WhatsApp.
                </p>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-5 mt-4">
                  <strong className="text-purple-400">📋 Base Legal (LGPD):</strong>
                  <p className="text-sm mt-2">
                    Processamos seus dados com base no <strong>consentimento</strong>, <strong>execução de contrato</strong>, 
                    <strong>cumprimento de obrigação legal</strong> e <strong>legítimo interesse</strong>, conforme Lei nº 13.709/2018.
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 2 - Dados Coletados */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">2.</span>
                Quais Dados Coletamos
              </h2>
              <div className="pl-8 space-y-4">
                
                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-[#04F5A0] mb-3">👤 Dados de Cadastro</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                    <li>Nome completo</li>
                    <li>Endereço de e-mail</li>
                    <li>Número de telefone</li>
                    <li>Nome da empresa (opcional)</li>
                    <li>Senha (armazenada com criptografia bcrypt)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Base Legal:</strong> Execução de contrato e consentimento
                  </p>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">💳 Dados de Pagamento</h3>
                  <p className="text-sm mb-3">
                    Os dados de pagamento são processados exclusivamente pela <strong className="text-white">Stripe</strong>, 
                    certificada PCI DSS Level 1. Não armazenamos informações completas de cartão de crédito.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                    <li>Últimos 4 dígitos do cartão</li>
                    <li>Bandeira do cartão</li>
                    <li>Histórico de transações</li>
                    <li>Status de assinatura</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Base Legal:</strong> Execução de contrato e obrigação legal (registro fiscal)
                  </p>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-3">💬 Dados de Conversas do WhatsApp</h3>
                  <p className="text-sm mb-3">
                    Para treinar e melhorar o chatbot de IA personalizado:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                    <li>Histórico de mensagens (quando autorizado pelo usuário)</li>
                    <li>Metadados de conversas (data, hora, duração)</li>
                    <li>Números de telefone dos contatos</li>
                    <li>Status de mensagens (entregue, lida)</li>
                  </ul>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-3">
                    <p className="text-yellow-200 text-xs flex items-start">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        <strong>Importante:</strong> Você controla quais conversas são analisadas. 
                        As mensagens são processadas de forma criptografada e anônima para treinar a IA.
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Base Legal:</strong> Consentimento e execução de contrato
                  </p>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-orange-400 mb-3">📊 Dados Técnicos e de Uso</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                    <li>Endereço IP</li>
                    <li>Tipo de navegador e dispositivo</li>
                    <li>Sistema operacional</li>
                    <li>Páginas visitadas e tempo de permanência</li>
                    <li>Logs de acesso e atividades</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Base Legal:</strong> Legítimo interesse (segurança, melhoria do serviço)
                  </p>
                </div>

              </div>
            </section>

            {/* Seção 3 - Como Usamos os Dados */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">3.</span>
                Como Usamos Seus Dados
              </h2>
              <div className="pl-8 space-y-3">
                <p>Utilizamos seus dados pessoais para:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gradient-to-br from-blue-900/20 to-transparent border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-blue-400 mb-2">✅ Fornecer o Serviço</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Criar e gerenciar sua conta</li>
                      <li>Processar pagamentos e renovações</li>
                      <li>Conectar e gerenciar instâncias do WhatsApp</li>
                      <li>Treinar chatbots personalizados com IA</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/20 to-transparent border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-purple-400 mb-2">🛡️ Segurança e Prevenção de Fraudes</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Detectar e prevenir atividades fraudulentas</li>
                      <li>Proteger contra acessos não autorizados</li>
                      <li>Monitorar uso indevido da plataforma</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/20 to-transparent border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-green-400 mb-2">📧 Comunicação</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Enviar notificações transacionais</li>
                      <li>Fornecer suporte técnico</li>
                      <li>Informar sobre atualizações do serviço</li>
                      <li>Enviar avisos de cobrança</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-orange-900/20 to-transparent border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-orange-400 mb-2">📈 Melhorias e Análises</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Analisar padrões de uso</li>
                      <li>Melhorar algoritmos de IA</li>
                      <li>Desenvolver novos recursos</li>
                      <li>Otimizar desempenho</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 4 - Compartilhamento */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">4.</span>
                Compartilhamento de Dados
              </h2>
              <div className="pl-8 space-y-4">
                <p>
                  <strong className="text-white">NÃO vendemos seus dados pessoais a terceiros.</strong> 
                  Compartilhamos informações apenas nas seguintes situações:
                </p>
                
                <div className="space-y-3">
                  <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                    <h4 className="font-bold text-[#04F5A0] mb-2">🔹 Prestadores de Serviço Essenciais</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <strong>Supabase:</strong> Hospedagem de banco de dados e autenticação
                          <br/><span className="text-gray-500 text-xs">Localização: EUA (com garantias adequadas GDPR)</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <strong>Stripe:</strong> Processamento de pagamentos
                          <br/><span className="text-gray-500 text-xs">Certificação PCI DSS Level 1</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <strong>Evolution API:</strong> Integração com WhatsApp Business API
                          <br/><span className="text-gray-500 text-xs">Processamento local de mensagens</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <strong>Provedor SMTP:</strong> Envio de e-mails transacionais
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-400 mb-2">🔹 Obrigações Legais</h4>
                    <p className="text-sm">
                      Podemos divulgar seus dados se exigido por lei, ordem judicial, ou autoridades competentes 
                      (polícia, ANPD, órgãos reguladores).
                    </p>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-lg p-4">
                    <h4 className="font-bold text-red-400 mb-2">🔹 Transferência de Negócio</h4>
                    <p className="text-sm">
                      Em caso de fusão, aquisição ou venda de ativos, seus dados poderão ser transferidos, 
                      com notificação prévia e manutenção dos mesmos níveis de proteção.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 5 - Segurança */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">5.</span>
                Segurança dos Dados
              </h2>
              <div className="pl-8 space-y-3">
                <p>Implementamos medidas técnicas e organizacionais robustas para proteger seus dados:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-green-400 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Criptografia
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• SSL/TLS em todas as conexões</li>
                      <li>• Senhas com bcrypt (10 rounds)</li>
                      <li>• Dados em repouso criptografados</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-blue-400 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Controle de Acesso
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Autenticação multifator disponível</li>
                      <li>• Tokens de sessão com expiração</li>
                      <li>• Logs de auditoria detalhados</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-purple-400 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Infraestrutura
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Servidores seguros (cloud)</li>
                      <li>• Backups automáticos diários</li>
                      <li>• Monitoramento 24/7</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/20 to-transparent border border-orange-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-orange-400 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Equipe
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Acesso restrito por função</li>
                      <li>• Treinamento em privacidade</li>
                      <li>• NDA (acordo de confidencialidade)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 6 - Retenção */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">6.</span>
                Retenção de Dados
              </h2>
              <div className="pl-8 space-y-3">
                <p>Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política:</p>
                <div className="bg-black/30 border border-white/5 rounded-lg p-4 mt-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-[#04F5A0] mr-2">•</span>
                      <span><strong>Dados de conta ativa:</strong> Enquanto você mantiver a conta</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#04F5A0] mr-2">•</span>
                      <span><strong>Dados de conta cancelada:</strong> 90 dias após cancelamento (exceto obrigações legais)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#04F5A0] mr-2">•</span>
                      <span><strong>Dados fiscais:</strong> 5 anos (conforme legislação brasileira)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#04F5A0] mr-2">•</span>
                      <span><strong>Logs de segurança:</strong> 6 meses</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#04F5A0] mr-2">•</span>
                      <span><strong>Conversas do WhatsApp:</strong> Você controla a retenção (pode deletar a qualquer momento)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Seção 7 - Seus Direitos */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">7.</span>
                Seus Direitos (LGPD/GDPR)
              </h2>
              <div className="pl-8 space-y-4">
                <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/30 to-transparent border border-blue-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-blue-400 mb-2">📖 Acesso</h4>
                    <p className="text-sm">Confirmar quais dados pessoais processamos sobre você</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/30 to-transparent border border-green-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-green-400 mb-2">✏️ Correção</h4>
                    <p className="text-sm">Solicitar correção de dados incompletos ou incorretos</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-900/30 to-transparent border border-red-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-red-400 mb-2">🗑️ Exclusão</h4>
                    <p className="text-sm">Solicitar a eliminação de seus dados pessoais</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/30 to-transparent border border-purple-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-purple-400 mb-2">📦 Portabilidade</h4>
                    <p className="text-sm">Receber seus dados em formato estruturado e legível</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-900/30 to-transparent border border-yellow-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-yellow-400 mb-2">🚫 Oposição</h4>
                    <p className="text-sm">Opor-se ao processamento de dados em certas situações</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-900/30 to-transparent border border-pink-500/30 rounded-xl p-4">
                    <h4 className="font-bold text-pink-400 mb-2">🔙 Revogação</h4>
                    <p className="text-sm">Revogar consentimento a qualquer momento</p>
                  </div>
                </div>

                <div className="bg-[#04F5A0]/10 border border-[#04F5A0]/30 rounded-xl p-5 mt-6">
                  <h4 className="font-bold text-[#04F5A0] mb-2">📧 Como Exercer Seus Direitos:</h4>
                  <p className="text-sm mb-3">
                    Entre em contato conosco através de:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>• Email: <a href="mailto:privacidade@swiftbot.com.br" className="text-[#04F5A0] hover:underline">privacidade@swiftbot.com.br</a></p>
                    <p>• DPO (Encarregado de Dados): <span className="text-white">dpo@swiftbot.com.br</span></p>
                    <p>• Prazo de resposta: Até 15 dias úteis</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 8 - Cookies */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">8.</span>
                Cookies e Tecnologias Similares
              </h2>
              <div className="pl-8 space-y-3">
                <p>
                  Utilizamos cookies para melhorar sua experiência. Para informações detalhadas sobre quais cookies usamos 
                  e como você pode gerenciá-los, consulte nossa{' '}
                  <button
                    onClick={() => router.push('/cookies')}
                    className="text-[#04F5A0] hover:underline font-semibold"
                  >
                    Política de Cookies →
                  </button>
                </p>
              </div>
            </section>

            {/* Seção 9 - Menores de Idade */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">9.</span>
                Proteção de Menores de Idade
              </h2>
              <div className="pl-8 space-y-3">
                <p>
                  Nosso serviço <strong className="text-white">não é direcionado a menores de 18 anos</strong>.  
                  Não coletamos intencionalmente dados de crianças e adolescentes.
                </p>
                <p>
                  Se você acredita que coletamos inadvertidamente dados de um menor, entre em contato imediatamente 
                  para que possamos tomar as medidas adequadas.
                </p>
              </div>
            </section>

            {/* Seção 10 - Alterações */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">10.</span>
                Alterações nesta Política
              </h2>
              <div className="pl-8 space-y-3">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas 
                  ou por outros motivos operacionais, legais ou regulatórios.
                </p>
                <p>
                  <strong className="text-white">Notificaremos você sobre alterações significativas</strong> através de:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>E-mail para o endereço cadastrado</li>
                  <li>Aviso destacado no dashboard</li>
                  <li>Pop-up na próxima visita ao site</li>
                </ul>
                <p className="text-sm text-gray-400 mt-3">
                  Recomendamos revisar esta página regularmente para se manter informado sobre como protegemos seus dados.
                </p>
              </div>
            </section>

            {/* Seção 11 - Contato e DPO */}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                <span className="mr-3 text-purple-400">11.</span>
                Contato e Encarregado de Dados (DPO)
              </h2>
              <div className="pl-8 space-y-4">
                <p>
                  Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou 
                  ao tratamento de seus dados pessoais, entre em contato:
                </p>
                
                <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-transparent border-2 border-purple-500/30 rounded-2xl p-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-[#04F5A0] mb-2">📧 E-mail Geral de Privacidade:</h4>
                    <a href="mailto:privacidade@swiftbot.com.br" className="text-white hover:text-[#04F5A0] transition-colors text-lg">
                      privacidade@swiftbot.com.br
                    </a>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold text-[#04F5A0] mb-2">🛡️ DPO (Data Protection Officer):</h4>
                    <p className="text-white">Nome: <span className="font-bold">[Nome do Encarregado de Dados]</span></p>
                    <p className="text-white">E-mail: <a href="mailto:dpo@swiftbot.com.br" className="text-[#04F5A0] hover:underline">dpo@swiftbot.com.br</a></p>
                    <p className="text-sm text-gray-400 mt-2">
                      O DPO é responsável por garantir a conformidade com as leis de proteção de dados e 
                      atuar como ponto de contato com a ANPD (Autoridade Nacional de Proteção de Dados).
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold text-[#04F5A0] mb-2">🏢 Sede da Empresa:</h4>
                    <p className="text-sm text-gray-300">
                      SwiftBot Tecnologia Ltda.<br/>
                      [Endereço Completo]<br/>
                      CNPJ: [XX.XXX.XXX/XXXX-XX]
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mt-4">
                  <p className="text-yellow-200 text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>Importante:</strong> Você também pode registrar reclamações diretamente na 
                      <strong> ANPD (Autoridade Nacional de Proteção de Dados)</strong> através do site 
                      <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                        www.gov.br/anpd
                      </a>
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* Última Atualização */}
            <section className="border-t border-white/10 pt-8">
              <div className="bg-black/50 border border-purple-500/30 rounded-2xl p-6 text-center">
                <p className="text-gray-300">
                  <strong className="text-white text-lg">📅 Última Atualização:</strong>
                  <br/>
                  <span className="text-xl font-bold text-purple-400 mt-2 inline-block">
                    {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  Versão 1.0 | Política em conformidade com LGPD (Lei nº 13.709/2018) e GDPR (Regulamento UE 2016/679)
                </p>
              </div>
            </section>

          </div>

          {/* CTA Final */}
          <div className="mt-12 text-center flex flex-wrap justify-center gap-4 items-center">
            <button
              onClick={() => router.push('/cookies')}
              className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-8 py-3 rounded-xl transition-all duration-300 inline-flex items-center mx-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Ver Política de Cookies
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