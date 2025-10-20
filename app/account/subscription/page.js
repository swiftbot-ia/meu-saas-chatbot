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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const router = useRouter()

  // Mouse tracking para efeitos visuais
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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

  const handleCancelSubscription = async () => {
    setCanceling(true)
    
    try {
      console.log('🚨 Iniciando cancelamento da assinatura...')
      
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
        await loadSubscriptionData(user.id)
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
          <div className="relative">
            <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto animate-pulse mb-4">
              <div className="w-8 h-8 bg-black rounded-sm"
                   style={{
                     clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                   }}
              />
            </div>
            <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-2xl blur-xl animate-pulse mx-auto w-16 h-16" />
          </div>
          <p className="text-gray-300">Carregando assinatura...</p>
        </div>
      </div>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()
  const remainingDays = getRemainingDays()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}
        />
      </div>

      {/* Dynamic Gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.08), transparent 40%)`
        }}
      />

      {/* Header */}
      <header className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-400 hover:text-[#04F5A0] transition-colors duration-300"
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
      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Detalhes da Assinatura */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Status da Assinatura */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-40 h-40 bg-[#04F5A0]/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              
              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-6">
                  💎 Status da Assinatura
                </h2>
                
                {subscription ? (
                  <div className="space-y-6">
                    {/* Badge de Status com contador */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border backdrop-blur-sm ${getStatusColor(subscriptionStatus)}`}>
                          {subscriptionStatus === 'active' && '💎 Plano Ativo'}
                          {subscriptionStatus === 'trial' && '🔥 Trial Ativo'}
                          {subscriptionStatus === 'canceled' && '❌ Cancelado'}
                          {subscriptionStatus === 'expired' && '⚠️ Expirado'}
                        </div>
                      </div>
                      
                      {remainingDays > 0 && subscriptionStatus !== 'canceled' && (
                        <div className="text-right relative">
                          <div className="absolute inset-0 bg-[#04F5A0]/20 rounded-xl blur-xl animate-pulse"></div>
                          <div className="relative bg-black/30 backdrop-blur-sm border border-[#04F5A0]/30 rounded-xl p-4">
                            <div className="text-3xl font-bold text-[#04F5A0]">{remainingDays}</div>
                            <div className="text-sm text-gray-400">dias restantes</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Aviso para cancelados */}
                    {subscriptionStatus === 'canceled' && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-start text-red-400 text-sm">
                          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-[#04F5A0]/30 transition-all duration-300 group relative overflow-hidden">
                        {/* Mini Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/30 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1">📱 Conexões</div>
                          <div className="text-3xl font-bold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                            {subscription.connections_purchased}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-[#04F5A0]/30 transition-all duration-300 group relative overflow-hidden">
                        {/* Mini Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/30 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1">📅 Período</div>
                          <div className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300 capitalize">
                            {subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-[#04F5A0]/30 transition-all duration-300 group relative overflow-hidden">
                        {/* Mini Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-green-500/30 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1">💰 Valor</div>
                          <div className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                            R$ {calculatePrice(subscription.connections_purchased, subscription.billing_period)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Datas Importantes */}
                    <div className="border-t border-white/10 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {subscription.trial_start_date && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-[#04F5A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-400">Trial iniciado:</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.trial_start_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        
                        {subscription.trial_end_date && subscriptionStatus === 'trial' && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-400">Trial expira:</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.trial_end_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        
                        {subscription.next_billing_date && subscriptionStatus === 'active' && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="text-gray-400">Próxima cobrança:</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}

                        {subscription.canceled_at && subscriptionStatus === 'canceled' && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-gray-400">Cancelado em:</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.canceled_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="text-gray-400 mb-4">Você não possui nenhuma assinatura ativa.</div>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="bg-[#04F5A0] hover:bg-[#03E691] text-black px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)]"
                    >
                      🚀 Iniciar Trial Gratuito
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Pagamentos */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-pink-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
              </div>
              
              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-purple-400 mb-6 flex items-center">
                  📊 Histórico de Transações
                </h3>
                
                {paymentLogs.length > 0 ? (
                  <div className="space-y-3">
                    {paymentLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#04F5A0]/30 transition-all duration-300 group">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            log.status === 'success' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                            log.status === 'failed' ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' :
                            log.status === 'canceled' ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' :
                            'bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                          } animate-pulse`}></div>
                          <div>
                            <div className="text-white font-medium group-hover:text-[#04F5A0] transition-colors duration-300">
                              {formatEventType(log.event_type)}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        {log.amount > 0 && (
                          <div className="text-white font-semibold text-lg">
                            R$ {log.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Nenhuma transação encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Ações */}
          <div className="space-y-6">
            
            {/* Ações da Assinatura */}
            {subscription && subscriptionStatus !== 'canceled' && (
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    ⚡ Ações Rápidas
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full bg-blue-600/60 backdrop-blur-sm hover:bg-blue-600/80 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Alterar Plano
                    </button>
                    
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={canceling}
                      className="w-full bg-red-600/60 backdrop-blur-sm hover:bg-red-600/80 disabled:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reativar Serviço */}
            {subscription && subscriptionStatus === 'canceled' && (
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#04F5A0]/30 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    🔄 Reativar Serviço
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-[#04F5A0] hover:bg-[#03E691] text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Criar Nova Assinatura
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Informações de Suporte */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-28 h-28 bg-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
              </div>
              
              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  💬 Precisa de Ajuda?
                </h3>
                
                <div className="space-y-4 text-sm text-gray-400">
                  <p>Entre em contato conosco se tiver dúvidas sobre sua assinatura.</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg hover:border-[#04F5A0]/30 transition-all duration-300">
                      <svg className="w-5 h-5 mr-3 text-[#04F5A0] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-300">suporte@swiftbot.com.br</span>
                    </div>
                    
                    <div className="flex items-center p-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg hover:border-[#04F5A0]/30 transition-all duration-300">
                      <svg className="w-5 h-5 mr-3 text-[#04F5A0] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-gray-300">Chat ao vivo (9h às 18h)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0"
                 style={{
                   backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
                   backgroundSize: '50px 50px'
                 }}
            />
          </div>
          
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.1), transparent 40%)`
            }}
          />
          
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(4,245,160,0.15)] z-[70]">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/35 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cancelar Assinatura</h3>
                <p className="text-gray-400">
                  Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os recursos do SwiftBot.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-yellow-400 text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <strong>Atenção:</strong> O cancelamento será processado e o WhatsApp será desconectado automaticamente.
                    </span>
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-400 text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <strong>Importante:</strong> O cancelamento será efetivo imediatamente e você não receberá mais cobranças.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={canceling}
                  className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:bg-gray-800 border border-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                >
                  Manter Assinatura
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-center justify-center"
                >
                  {canceling ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelando...
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0"
                 style={{
                   backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
                   backgroundSize: '50px 50px'
                 }}
            />
          </div>
          
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.1), transparent 40%)`
            }}
          />
          
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(4,245,160,0.15)] z-[70]">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/35 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
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
                  className="bg-[#04F5A0] hover:bg-[#03E691] text-black py-3 px-8 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)]"
                >
                  OK, Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}