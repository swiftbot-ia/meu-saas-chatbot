'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// ADICIONADO: Importação do Header padrão
import Header from '../components/Header'

export default function PrivacyPolicyPage() {
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
                <span className="text-purple-400 font-semibold text-sm">🔒 LGPD / GDPR Compliant</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-light text-white mb-4 leading-tight">
                Política de <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">Privacidade</span>
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
            
            {/* MODIFICADO: Card Branco Sólido (sem blur/borda) */}
            <div className="bg-white rounded-3xl p-8 md:p-12">
              
              {/* MODIFICADO: Estilo do conteúdo de texto */}
              <div className="space-y-8 text-gray-700 font-light leading-relaxed">
                
                {/* Seção 1 */}
                <section>
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                    1. Introdução e Compromisso com Privacidade
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>
                      A <strong className="text-black font-medium">SwiftBot</strong> ("nós", "nosso" ou "empresa") está comprometida em proteger 
                      a privacidade e os dados pessoais de nossos usuários ("você", "usuário" ou "titular de dados").
                    </p>
                    <p>
                      Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                      quando você utiliza nossa plataforma de chatbots com inteligência artificial para WhatsApp.
                    </p>
                    {/* MODIFICADO: Estilo do Info Box */}
                    <div className="bg-gray-100 rounded-xl p-5 mt-4">
                      <strong className="text-black">📋 Base Legal (LGPD):</strong>
                      <p className="text-sm mt-2 text-gray-600">
                        Processamos seus dados com base no <strong>consentimento</strong>, <strong>execução de contrato</strong>, 
                        <strong>cumprimento de obrigação legal</strong> e <strong>legítimo interesse</strong>, conforme Lei nº 13.709/2018.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Seção 2 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    2. Quais Dados Coletamos
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-4">
                    
                    {/* MODIFICADO: Estilo dos Sub-cards */}
                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        Dados de Cadastro
                      </h3>
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

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3.75 3.75m3.75-3.75L18 16.5m-3.75-3.75v3.75m2.25-4.125c.621 0 1.125.504 1.125 1.125V18a1.125 1.125 0 01-1.125 1.125h-5.25A1.125 1.125 0 019 18v-2.625c0-.621.504-1.125 1.125-1.125H15" /></svg>
                        Dados de Pagamento
                      </h3>
                      <p className="text-sm mb-3">
                        Os dados de pagamento são processados exclusivamente pela <strong className="text-black font-medium">Stripe</strong>, 
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

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12c0-4.556 3.86-8.25 8.625-8.25S21 7.444 21 12z" /></svg>
                        Dados de Conversas do WhatsApp
                      </h3>
                      <p className="text-sm mb-3">
                        Para treinar e melhorar o chatbot de IA personalizado:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                        <li>Histórico de mensagens (quando autorizado pelo usuário)</li>
                        <li>Metadados de conversas (data, hora, duração)</li>
                        <li>Números de telefone dos contatos</li>
                        <li>Status de mensagens (entregue, lida)</li>
                      </ul>
                      {/* MODIFICADO: Estilo do Info Box */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                        <p className="text-yellow-800 text-xs flex items-start">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v12.75A2.25 2.25 0 006 20.25z" /></svg>
                        Dados Técnicos e de Uso
                      </h3>
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

                {/* Seção 3 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a3.375 3.375 0 00-3.375-3.375h-1.5a3.375 3.375 0 00-3.375 3.375v1.5m17.25 4.5a3.375 3.375 0 01-3.375 3.375h-1.5a3.375 3.375 0 01-3.375-3.375v-1.5m0 0V9m0 3.75h.008v.008H12v-.008z" /></svg>
                    3. Como Usamos Seus Dados
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>Utilizamos seus dados pessoais para:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* MODIFICADO: Estilo dos callout boxes */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">✅ Fornecer o Serviço</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Criar e gerenciar sua conta</li>
                          <li>Processar pagamentos e renovações</li>
                          <li>Conectar e gerenciar instâncias do WhatsApp</li>
                          <li>Treinar chatbots personalizados com IA</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">🛡️ Segurança e Prevenção de Fraudes</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Detectar e prevenir atividades fraudulentas</li>
                          <li>Proteger contra acessos não autorizados</li>
                          <li>Monitorar uso indevido da plataforma</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">📧 Comunicação</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Enviar notificações transacionais</li>
                          <li>Fornecer suporte técnico</li>
                          <li>Informar sobre atualizações do serviço</li>
                          <li>Enviar avisos de cobrança</li>
                        </ul>
                      </div>
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-black mb-2">📈 Melhorias e Análises</h4>
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

                {/* Seção 4 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                    4. Compartilhamento de Dados
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-4">
                    <p>
                      <strong className="text-black font-medium">NÃO vendemos seus dados pessoais a terceiros.</strong> 
                      Compartilhamos informações apenas nas seguintes situações:
                    </p>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-2">🔹 Prestadores de Serviço Essenciais</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex items-start">
                            <span className="text-gray-500 mr-2">•</span>
                            <div>
                              <strong>Supabase:</strong> Hospedagem de banco de dados e autenticação
                              <br/><span className="text-gray-500 text-xs">Localização: EUA (com garantias adequadas GDPR)</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 mr-2">•</span>
                            <div>
                              <strong>Stripe:</strong> Processamento de pagamentos
                              <br/><span className="text-gray-500 text-xs">Certificação PCI DSS Level 1</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 mr-2">•</span>
                            <div>
                              <strong>Evolution API:</strong> Integração com WhatsApp Business API
                              <br/><span className="text-gray-500 text-xs">Processamento local de mensagens</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 mr-2">•</span>
                            <div>
                              <strong>Provedor SMTP:</strong> Envio de e-mails transacionais
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-2">🔹 Obrigações Legais</h4>
                        <p className="text-sm">
                          Podemos divulgar seus dados se exigido por lei, ordem judicial, ou autoridades competentes 
                          (polícia, ANPD, órgãos reguladores).
                        </p>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-2">🔹 Transferência de Negócio</h4>
                        <p className="text-sm">
                          Em caso de fusão, aquisição ou venda de ativos, seus dados poderão ser transferidos, 
                          com notificação prévia e manutenção dos mesmos níveis de proteção.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seção 5 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    5. Segurança dos Dados
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>Implementamos medidas técnicas e organizacionais robustas para proteger seus dados:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Criptografia
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• SSL/TLS em todas as conexões</li>
                          <li>• Senhas com bcrypt</li>
                          <li>• Dados em repouso criptografados</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Controle de Acesso
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• Tokens de sessão com expiração</li>
                          <li>• Logs de auditoria detalhados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seção 6 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    6. Retenção de Dados
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>Mantemos seus dados apenas pelo tempo necessário:</p>
                    <div className="bg-gray-100 rounded-lg p-4 mt-3">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span><strong>Dados de conta ativa:</strong> Enquanto você mantiver a conta</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span><strong>Dados fiscais:</strong> 5 anos (conforme legislação)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span><strong>Conversas do WhatsApp:</strong> Você controla a retenção</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Seção 7 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.5 21h-5.25A12.318 12.318 0 014 19.235z" /></svg>
                    7. Seus Direitos (LGPD/GDPR)
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-4">
                    <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">📖 Acesso:</strong> Confirmar quais dados processamos.</div>
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">✏️ Correção:</strong> Corrigir dados incorretos.</div>
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">🗑️ Exclusão:</strong> Solicitar a eliminação de seus dados.</div>
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">📦 Portabilidade:</strong> Receber seus dados.</div>
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">🚫 Oposição:</strong> Opor-se ao processamento.</div>
                      <div className="bg-gray-100 rounded-lg p-4"><strong className="text-black">🔙 Revogação:</strong> Revogar consentimento.</div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-6">
                      <h4 className="font-semibold text-black mb-2">📧 Como Exercer Seus Direitos:</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Email: <a href="mailto:privacidade@swiftbot.com.br" className="text-green-600 hover:underline">privacidade@swiftbot.com.br</a></p>
                        <p>• DPO (Encarregado): <a href="mailto:dpo@swiftbot.com.br" className="text-green-600 hover:underline">dpo@swiftbot.com.br</a></p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seção 8 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v12.75A2.25 2.25 0 006 20.25z" /></svg>
                    8. Cookies e Tecnologias Similares
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>
                      Utilizamos cookies para melhorar sua experiência. Para informações detalhadas, consulte nossa{' '}
                      <button
                        onClick={() => router.push('/cookies')}
                        className="text-green-600 hover:underline font-semibold"
                      >
                        Política de Cookies →
                      </button>
                    </p>
                  </div>
                </section>

                {/* Seção 9 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    9. Proteção de Menores de Idade
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>
                      Nosso serviço <strong className="text-black font-medium">não é direcionado a menores de 18 anos</strong>. 
                      Não coletamos intencionalmente dados de crianças e adolescentes.
                    </p>
                  </div>
                </section>

                {/* Seção 10 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    10. Alterações nesta Política
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-3">
                    <p>
                      Podemos atualizar esta Política de Privacidade periodicamente. 
                      <strong className="text-black font-medium">Notificaremos você sobre alterações significativas</strong> 
                      por e-mail ou aviso no dashboard.
                    </p>
                  </div>
                </section>

                {/* Seção 11 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    11. Contato e Encarregado de Dados (DPO)
                  </h2>
                  <div className="pl-0 md:pl-10 space-y-4">
                    <p>
                      Se você tiver dúvidas, preocupações ou solicitações, entre em contato:
                    </p>
                    
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-6 space-y-3">
                      <div>
                        <h4 className="font-semibold text-black mb-1">E-mail Geral de Privacidade:</h4>
                        <a href="mailto:privacidade@swiftbot.com.br" className="text-green-600 hover:underline">privacidade@swiftbot.com.br</a>
                      </div>
                      
                      <div className="border-t border-black/10 pt-3">
                        <h4 className="font-semibold text-black mb-1">DPO (Data Protection Officer):</h4>
                        <a href="mailto:dpo@swiftbot.com.br" className="text-green-600 hover:underline">dpo@swiftbot.com.br</a>
                      </div>

                      <div className="border-t border-black/10 pt-3">
                        <h4 className="font-semibold text-black mb-1">Autoridade Nacional (ANPD):</h4>
                        <p className="text-sm">
                          Você também pode registrar reclamações na ANPD (Autoridade Nacional de Proteção de Dados) 
                          através do site <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">www.gov.br/anpd</a>.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Última Atualização */}
                <section className="border-t border-black/10 pt-8">
                  <div className="bg-gray-100 rounded-xl p-6 text-center">
                    <p className="text-gray-700 text-sm">
                      <strong className="text-black">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </section>

              </div>

              {/* CTA Final */}
              <div className="mt-12 text-center flex flex-wrap justify-center gap-4 items-center">
                <button
                  onClick={() => router.push('/termos')}
                  className="bg-black/80 hover:bg-black text-white px-8 py-3 rounded-full font-medium transition-all duration-300 inline-flex items-center mx-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v12.75A2.25 2.25 0 006 20.25z" /></svg>
                  Ver Termos de Uso
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