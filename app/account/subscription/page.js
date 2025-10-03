'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountSubscription() {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [paymentLogs, setPaymentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      await loadSubscriptionData(user.id)
    }
    setLoading(false)
  }

  const loadSubscriptionData = async (userId) => {
    try {
      // Carregar assinatura atual
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionData) {
        setSubscription(subscriptionData)
      }

      // Carregar histórico de pagamentos
      const { data: logsData } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsData) {
        setPaymentLogs(logsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error)
    }
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return 'none'
    
    if (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)) {
      return 'expired'
    }
    return subscription.status
  }

  const getRemainingDays = () => {
    if (!subscription) return 0
    
    const endDate = subscription.status === 'trial' 
      ? new Date(subscription.trial_end_date)
      : new Date(subscription.next_billing_date)
    
    const now = new Date()
    const diffTime = endDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  const calculatePrice = (connections, billingPeriod) => {
    const pricing = {
      monthly: { 1: 165, 2: 305, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875 },
      annual: { 1: 150, 2: 275, 3: 400, 4: 525, 5: 525, 6: 630, 7: 735 }
    }
    return pricing[billingPeriod][connections] || 0
  }

  // ✅ FUNÇÃO CORRIGIDA - CANCELA NO PAGAR.ME + DESCONECTA WHATSAPP
  const handleCancelSubscription = async () => {
    setCanceling(true)
    
    try {
      console.log('🚨 Iniciando cancelamento da assinatura...')
      
      // ✅ CHAMAR API QUE CANCELA NO PAGAR.ME + DESCONECTA WHATSAPP
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ ' + data.message)
        await loadSubscriptionData(user.id) // Recarregar dados
        setShowCancelModal(false)
      } else {
        throw new Error(data.error || 'Erro ao cancelar assinatura')
      }
      
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error)
      alert('❌ Erro ao cancelar assinatura: ' + error.message)
    }
    
    setCanceling(false)
  }

  const formatEventType = (eventType) => {
    const types = {
      'trial_started': 'Trial Iniciado',
      'payment_success': 'Pagamento Realizado',
      'payment_failed': 'Falha no Pagamento',
      'subscription_canceled': 'Assinatura Cancelada',
      'subscription_canceled_manual': 'Assinatura Cancelada',
      'subscription_canceled_webhook': 'Assinatura Cancelada (Auto)',
      'subscription_renewed': 'Assinatura Renovada'
    }
    return types[eventType] || eventType
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[#04F5A0]/20 text-[#04F5A0] border-[#04F5A0]/30'
      case 'trial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'canceled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto animate-pulse mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
          <p className="text-gray-300">Carregando assinatura...</p>
        </div>
      </div>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()
  const remainingDays = getRemainingDays()

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-300 hover:text-[#04F5A0] transition-colors duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </button>
            <h1 className="text-xl font-bold text-white">Gerenciar Assinatura</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Detalhes da Assinatura */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Status da Assinatura */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Status da Assinatura</h2>
              
              {subscription ? (
                <div className="space-y-6">
                  {/* Badge de Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(subscriptionStatus)}`}>
                        {subscriptionStatus === 'active' && '💎 Plano Ativo'}
                        {subscriptionStatus === 'trial' && '🔥 Trial Ativo'}
                        {subscriptionStatus === 'canceled' && '❌ Cancelado'}
                        {subscriptionStatus === 'expired' && '⚠️ Expirado'}
                      </div>
                    </div>
                    
                    {remainingDays > 0 && subscriptionStatus !== 'canceled' && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#04F5A0]">{remainingDays}</div>
                        <div className="text-sm text-gray-400">dias restantes</div>
                      </div>
                    )}
                  </div>

                  {/* ✅ AVISO IMPORTANTE PARA CANCELADOS */}
                  {subscriptionStatus === 'canceled' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-center text-red-400 text-sm">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <div className="font-medium">Assinatura Cancelada</div>
                          <div className="text-xs text-red-300 mt-1">
                            Sua assinatura foi cancelada e o WhatsApp foi desconectado automaticamente.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Plano */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <div className="text-gray-400 text-sm">Conexões</div>
                      <div className="text-2xl font-bold text-white">{subscription.connections_purchased}</div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <div className="text-gray-400 text-sm">Período</div>
                      <div className="text-lg font-semibold text-white capitalize">
                        {subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-xl p-4">
                      <div className="text-gray-400 text-sm">Valor</div>
                      <div className="text-lg font-semibold text-white">
                        R$ {calculatePrice(subscription.connections_purchased, subscription.billing_period)}
                      </div>
                    </div>
                  </div>

                  {/* Datas Importantes */}
                  <div className="border-t border-gray-800/50 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {subscription.trial_start_date && (
                        <div>
                          <span className="text-gray-400">Trial iniciado:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.trial_start_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      
                      {subscription.trial_end_date && subscriptionStatus === 'trial' && (
                        <div>
                          <span className="text-gray-400">Trial expira:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      
                      {subscription.next_billing_date && subscriptionStatus === 'active' && (
                        <div>
                          <span className="text-gray-400">Próxima cobrança:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}

                      {subscription.canceled_at && subscriptionStatus === 'canceled' && (
                        <div>
                          <span className="text-gray-400">Cancelado em:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.canceled_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">Você não possui nenhuma assinatura ativa.</div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-[#04F5A0] hover:bg-[#03E691] text-black px-6 py-3 rounded-xl font-bold transition-all duration-300"
                  >
                    Iniciar Trial Gratuito
                  </button>
                </div>
              )}
            </div>

            {/* Histórico de Pagamentos */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Histórico de Transações</h3>
              
              {paymentLogs.length > 0 ? (
                <div className="space-y-4">
                  {paymentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          log.status === 'success' ? 'bg-green-400' :
                          log.status === 'failed' ? 'bg-red-400' :
                          log.status === 'canceled' ? 'bg-red-400' :
                          'bg-yellow-400'
                        }`}></div>
                        <div>
                          <div className="text-white font-medium">{formatEventType(log.event_type)}</div>
                          <div className="text-gray-400 text-sm">
                            {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      
                      {log.amount > 0 && (
                        <div className="text-white font-semibold">
                          R$ {log.amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Nenhuma transação encontrada.
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral - Ações */}
          <div className="space-y-6">
            
            {/* Ações da Assinatura */}
            {subscription && subscriptionStatus !== 'canceled' && (
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Ações</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    ⬆️ Alterar Plano
                  </button>
                  
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={canceling}
                    className="w-full bg-red-600/80 hover:bg-red-600 disabled:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    {canceling ? 'Cancelando...' : '❌ Cancelar Assinatura'}
                  </button>
                </div>
              </div>
            )}

            {/* ✅ NOVA AÇÃO PARA REATIVAR */}
            {subscription && subscriptionStatus === 'canceled' && (
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Reativar Serviço</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-[#04F5A0] hover:bg-[#03E691] text-black py-3 px-4 rounded-xl font-bold transition-all duration-300"
                  >
                    🚀 Criar Nova Assinatura
                  </button>
                </div>
              </div>
            )}

            {/* Informações de Suporte */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Precisa de Ajuda?</h3>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p>Entre em contato conosco se tiver dúvidas sobre sua assinatura.</p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    suporte@swiftbot.com.br
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat ao vivo (9h às 18h)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Cancelamento ATUALIZADO */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cancelar Assinatura</h3>
              <p className="text-gray-400">
                Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os recursos do SwiftBot.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Atenção:</strong> O cancelamento será processado e o WhatsApp será desconectado automaticamente.
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">
                  <strong>Importante:</strong> O cancelamento será efetivo imediatamente e você não receberá mais cobranças.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
              >
                Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center"
              >
                {canceling ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelando...
                  </div>
                ) : (
                  'Confirmar Cancelamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upgrade (placeholder) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Alterar Plano</h3>
              <p className="text-gray-400">
                Funcionalidade em desenvolvimento. Em breve você poderá alterar seu plano diretamente aqui.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="bg-[#04F5A0] hover:bg-[#03E691] text-black py-3 px-6 rounded-xl font-bold transition-all duration-300"
              >
                OK, Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}