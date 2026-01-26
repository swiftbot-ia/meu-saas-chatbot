'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import UpdatePaymentModal from '../../components/UpdatePaymentModal'

export default function AccountSubscription() {
  const [user, setUser] = useState(null)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [paymentLogs, setPaymentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // ============================================
  // 1. ESTADOS ADICIONADOS
  // ============================================
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false)
  const [selectedNewPlan, setSelectedNewPlan] = useState({ connections: 1, billing_period: 'monthly' })
  const [changeType, setChangeType] = useState(null) // 'upgrade' ou 'downgrade'
  const [changingPlan, setChangingPlan] = useState(false)
  const [showConfirmDowngradeModal, setShowConfirmDowngradeModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false) // 🆕 Modal para atualizar cartão

  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Detecta hash #autoOpen e abre modal automaticamente
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#autoOpen' && subscription && !loading) {
      handleOpenPlanChange()
      // Limpar hash da URL
      window.history.replaceState(null, '', '/account/subscription')
    }
  }, [subscription, loading])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Verificar permissões robustas via API
    try {
      const res = await fetch('/api/account/member-permissions');
      const permData = await res.json();
      const role = permData.permissions?.role || permData.role;

      if (permData.success && role && !['owner', 'manager'].includes(role)) {
        console.log('❌ Usuário não autorizado. Redirecionando...');
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.error('Erro verificação permissão', err);
    }

    /* 
    Legacy check (kept for fallback but API check above is primary):
    // Verificar se é owner da conta
    try {
      const { data: member, error } = await supabase
        .from('account_members')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      // ...
    } catch (err) { ... }
    */

    setUser(user)
    await loadUserProfile(user.id)
    await loadSubscriptionData(user.id)
    setLoading(false)
  }

  const [userProfile, setUserProfile] = useState(null)
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const loadSubscriptionData = async (userId) => {
    try {
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

  const calculateRemainingDays = () => {
    // ❌ NÃO MOSTRAR DIAS RESTANTES SE CANCELADO/EXPIRADO
    if (subscriptionStatus === 'canceled' ||
      subscriptionStatus === 'cancelled' ||
      subscriptionStatus === 'expired') {
      return 0
    }

    // ✅ Para TRIAL ATIVO: usar trial_end_date
    if (subscriptionStatus === 'trial' && subscription.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date)
      const now = new Date()
      const diffTime = trialEndDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return Math.max(0, diffDays)
    }

    // ✅ Para PLANO ATIVO: usar next_billing_date
    if (subscriptionStatus === 'active' && subscription.next_billing_date) {
      const nextBilling = new Date(subscription.next_billing_date)
      const now = new Date()
      const diffTime = nextBilling - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return Math.max(0, diffDays)
    }

    // ✅ Caso contrário, não há dias restantes
    return 0
  }

  const calculatePrice = (connections, billingPeriod) => {
    const pricing = {
      monthly: { 1: 288.75, 2: 533.75, 3: 778.75, 4: 1023.75, 5: 1093.75, 6: 1312.50, 7: 1531.25 },
      annual: { 1: 2575.20, 2: 4776.30, 3: 6968.70, 4: 9161.10, 5: 9787.50, 6: 11745.00, 7: 13702.50 }
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getDaysSinceCreation = () => {
    if (!subscription?.created_at) return 0
    const createdAt = new Date(subscription.created_at)
    const now = new Date()
    return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
  }

  const isWithin7Days = () => {
    return getDaysSinceCreation() <= 7
  }

  const formatEventType = (eventType) => {
    const types = {
      // Eventos de Trial e Assinatura
      'trial_started': 'Teste Iniciado',
      'subscription_created': 'Assinatura Criada',
      'subscription_renewed': 'Assinatura Renovada',

      // Eventos de Pagamento
      'payment_success': 'Pagamento Realizado',
      'payment_failed': 'Falha no Pagamento',
      'invoice_paid_webhook': 'Fatura Paga',
      'invoice_payment_failed_webhook': 'Falha no Pagamento da Fatura',

      // Eventos de Cancelamento
      'subscription_canceled': 'Assinatura Cancelada',
      'subscription_canceled_manual': 'Assinatura Cancelada (Manual)',
      'subscription_canceled_webhook': 'Assinatura Cancelada (Automático)',
      'subscription_canceled_with_refund': 'Assinatura Cancelada com Reembolso',
      'subscription_canceled_at_period_end': 'Cancelamento Agendado',
      'subscription_canceled_failed_payment': 'Assinatura Cancelada (Falha no Pagamento)',

      // Eventos de Upgrade/Downgrade
      'plan_upgrade_requested': 'Upgrade de Plano Solicitado',
      'plan_upgrade_confirmed': 'Upgrade de Plano Confirmado',
      'plan_downgrade_applied': 'Downgrade de Plano Aplicado',
      'upgrade_proration_paid': 'Prorata de Upgrade Pago',

      // Eventos de Mudança de Plano
      'plan_change_canceled': 'Mudança de Plano Cancelada',
      'plan_change_canceled_confirmed': 'Cancelamento de Mudança Confirmado',

      // Eventos de WhatsApp
      'whatsapp_disconnected_failed_payment': 'WhatsApp Desconectado (Falha no Pagamento)'
    }

    // Se o tipo não estiver mapeado, formatar automaticamente
    // Exemplo: "some_event_type" -> "Some Event Type"
    if (!types[eventType]) {
      return eventType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    return types[eventType]
  }

  // MODIFICADO: Estilo das badges de status (removida borda)
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-[#00FF99]'
      case 'trial': return 'bg-blue-500/10 text-blue-400'
      case 'canceled': return 'bg-red-500/10 text-red-400'
      case 'expired': return 'bg-gray-500/10 text-gray-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  // ============================================
  // 2. FUNÇÕES ADICIONADAS
  // ============================================

  // Determinar se é upgrade ou downgrade
  const determineChangeType = (current, newPlan) => {
    // Nota: Usei os preços anuais do ARQUIVO DE PATCH (fonte 2)
    const prices = {
      monthly: { 1: 288.75, 2: 533.75, 3: 778.75, 4: 1023.75, 5: 1093.75, 6: 1312.50, 7: 1531.25 },
      annual: { 1: 2575.20, 2: 4776.30, 3: 6968.70, 4: 9161.10, 5: 9787.50, 6: 11745.00, 7: 13702.50 }
    }

    const currentValue = prices[current.billing_period][current.connections]
    const newValue = prices[newPlan.billing_period][newPlan.connections]

    return newValue > currentValue ? 'upgrade' : 'downgrade'
  }

  // Abrir modal de mudança de plano
  const handleOpenPlanChange = () => {
    if (!subscription) return

    // Inicializar com plano atual
    setSelectedNewPlan({
      connections: subscription.connections_purchased,
      billing_period: subscription.billing_period
    })
    setChangeType(null)
    setShowUpgradeModal(false) // Fecha o modal antigo
    setShowPlanChangeModal(true)
  }

  // Selecionar novo plano
  const handleSelectNewPlan = (connections, period) => {
    const newPlan = { connections, billing_period: period }
    setSelectedNewPlan(newPlan)

    const currentPlan = {
      connections: subscription.connections_purchased,
      billing_period: subscription.billing_period
    }

    const type = determineChangeType(currentPlan, newPlan)
    setChangeType(type)
  }

  // Confirmar mudança
  const handleConfirmPlanChange = async () => {
    if (!changeType) {
      alert('Por favor, selecione um plano diferente do atual')
      return
    }

    if (changeType === 'downgrade') {
      setShowConfirmDowngradeModal(true)
      return
    }

    // Se for upgrade, processar direto
    await processPlanChange()
  }

  // Processar upgrade ou downgrade
  const processPlanChange = async () => {
    setChangingPlan(true)

    try {
      // Rota unificada para upgrades, downgrades e correções
      const endpoint = '/api/subscription/upgrade'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPlan: selectedNewPlan
        })
      })

      const data = await response.json()

      if (!data.success) {
        alert(`❌ Erro: ${data.error}`)
        return
      }

      // ✅ CORREÇÃO: Acessar dados corretos da resposta
      if (changeType === 'upgrade') {
        const chargedAmount = data.data?.estimated_charge || 0
        alert(`✅ Upgrade realizado! Você foi cobrado aproximadamente R$ ${chargedAmount.toFixed(2)}`)
      } else {
        // ✅ CORREÇÃO: Validar se effective_date existe antes de usar
        if (data.data?.effective_date) {
          const effectiveDate = new Date(data.data.effective_date)
          if (!isNaN(effectiveDate.getTime())) {
            alert(`✅ Downgrade agendado para ${effectiveDate.toLocaleDateString('pt-BR')}`)
          } else {
            alert(`✅ Downgrade agendado com sucesso!`)
          }
        } else {
          alert(`✅ Downgrade agendado com sucesso!`)
        }
      }

      // Recarregar dados
      await loadSubscriptionData(user.id)

      // Fechar modais
      setShowPlanChangeModal(false)
      setShowConfirmDowngradeModal(false)

    } catch (error) {
      console.error('Erro ao mudar plano:', error)

      // 🚨 NOVO TRATAMENTO DE ERRO DE PAGAMENTO
      const errorMsg = error.message.toLowerCase()
      const isPaymentError = errorMsg.includes('card') || errorMsg.includes('declined') || errorMsg.includes('insufficient') || errorMsg.includes('payment') || errorMsg.includes('pagamento') || errorMsg.includes('funds')

      if (isPaymentError) {
        if (confirm('❌ Falha no pagamento: O cartão foi recusado.\n\nDeseja atualizar seu cartão de crédito agora?')) {
          setShowUpdatePaymentModal(true)
        }
      } else {
        alert('❌ Erro ao processar mudança de plano: ' + error.message)
      }

    } finally {
      setChangingPlan(false)
    }
  }

  // Cancelar mudança agendada
  const handleCancelScheduledChange = async () => {
    if (!confirm('Tem certeza que deseja cancelar a mudança agendada?')) return

    try {
      const response = await fetch('/api/subscription/cancel-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!data.success) {
        alert(`❌ Erro: ${data.error}`)
        return
      }

      alert('✅ Mudança cancelada com sucesso!')
      await loadSubscriptionData(user.id)

    } catch (error) {
      console.error('Erro ao cancelar mudança:', error)
      alert('❌ Erro ao cancelar mudança')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  const subscriptionStatus = getSubscriptionStatus()
  const remainingDays = calculateRemainingDays()

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">

      <main className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna Principal - Detalhes da Assinatura */}
          <div className="lg:col-span-2 space-y-8">

            {/* Status da Assinatura */}
            {/* MODIFICADO: Card principal com borda gradiente e fundo #111111 */}
            <div
              className="rounded-2xl p-8"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111111, #111111), linear-gradient(to right, #8A2BE2, #00BFFF)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}
            >
              <div className="relative z-10">
                {/* MODIFICADO: Título branco e com SVG */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                  Status da Assinatura
                </h2>

                {subscription ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {/* MODIFICADO: Badge sem emoji */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(subscriptionStatus)}`}>
                          {subscriptionStatus === 'active' && 'Plano Ativo'}
                          {subscriptionStatus === 'trial' && 'Trial Ativo'}
                          {subscriptionStatus === 'canceled' && 'Cancelado'}
                          {subscriptionStatus === 'expired' && 'Expirado'}
                        </div>
                      </div>

                      {remainingDays > 0 &&
                        subscriptionStatus !== 'canceled' &&
                        subscriptionStatus !== 'cancelled' &&
                        subscriptionStatus !== 'expired' && (
                          <div className="text-right relative">
                            <div className="relative bg-[#0A0A0A] rounded-xl p-4">
                              <div className="text-3xl font-bold text-[#00FF99]">{remainingDays}</div>
                              <div className="text-sm text-gray-400">
                                {subscriptionStatus === 'trial' ? 'dias de trial' : 'dias restantes'}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>

                    {subscriptionStatus === 'canceled' && (
                      // MODIFICADO: Aviso sem borda
                      <div className="bg-red-500/10 rounded-xl p-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* MODIFICADO: Sub-card sem borda, com SVG, com hover de bg */}
                      <div className="bg-[#0A0A0A] rounded-xl p-4 hover:bg-[#1C1C1C] transition-colors duration-300 group">
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Conexões
                          </div>
                          <div className="text-3xl font-bold text-white group-hover:text-[#00FF99] transition-colors duration-300">
                            {subscription.connections_purchased}
                          </div>
                        </div>
                      </div>

                      {/* MODIFICADO: Sub-card sem borda, com SVG, com hover de bg */}
                      <div className="bg-[#0A0A0A] rounded-xl p-4 hover:bg-[#1C1C1C] transition-colors duration-300 group">
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Período
                          </div>
                          <div className="text-lg font-semibold text-white group-hover:text-[#00FF99] transition-colors duration-300 capitalize">
                            {subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}
                          </div>
                        </div>
                      </div>

                      {/* MODIFICADO: Sub-card sem borda, com SVG, com hover de bg */}
                      <div className="bg-[#0A0A0A] rounded-xl p-4 hover:bg-[#1C1C1C] transition-colors duration-300 group">
                        <div className="relative z-10">
                          <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Valor
                          </div>
                          <div className="text-lg font-semibold text-white group-hover:text-[#00FF99] transition-colors duration-300">
                            R$ {calculatePrice(subscription.connections_purchased, subscription.billing_period)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {subscription.trial_start_date && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {/* MODIFICADO: Empty state sem borda */}
                    <div className="w-16 h-16 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="text-gray-400 mb-4">Você não possui nenhuma assinatura ativa.</div>
                    <button
                      onClick={() => router.push('/dashboard?open_plans=true')}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Iniciar Trial Gratuito
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Pagamentos */}
            {/* MODIFICADO: Card principal sem borda */}
            <div className="bg-[#111111] rounded-2xl p-8">
              <div className="relative z-10">
                {/* MODIFICADO: Título com SVG */}
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Histórico de Transações
                </h3>

                {paymentLogs.length > 0 ? (
                  <div className="space-y-3">
                    {paymentLogs.map((log) => (
                      // MODIFICADO: Item do log sem borda e com hover de bg
                      <div key={log.id} className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-xl hover:bg-[#1C1C1C] transition-colors duration-300 group">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-400' :
                            log.status === 'failed' ? 'bg-red-400' :
                              log.status === 'canceled' ? 'bg-red-400' :
                                'bg-yellow-400'
                            }`}></div>
                          <div>
                            <div className="text-white font-medium group-hover:text-[#00FF99] transition-colors duration-300">
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
                    {/* MODIFICADO: Empty state sem borda */}
                    <div className="w-16 h-16 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-4">
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

            {subscription && subscriptionStatus !== 'canceled' && (
              // MODIFICADO: Card sem borda
              <div className="bg-[#111111] rounded-2xl p-6">
                <div className="relative z-10">
                  {/* MODIFICADO: Título com SVG */}
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Ações Rápidas
                  </h3>

                  <div className="space-y-3">
                    {/* ✅ BOTÃO CONDICIONAL: Alterar ou Reativar */}
                    {subscriptionStatus === 'expired' || subscriptionStatus === 'canceled' ? (
                      // ASSINATURA EXPIRADA/CANCELADA → REATIVAR
                      <button
                        onClick={() => router.push('/dashboard?open_plans=true')}
                        className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reativar Assinatura
                      </button>
                    ) : (
                      // ASSINATURA ATIVA/TRIAL → ALTERAR
                      <button
                        onClick={handleOpenPlanChange}
                        className="w-full bg-gradient-to-r from-[#3B82F6] to-[#6f00ff] text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02]"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Alterar Plano
                      </button>
                    )}

                    {/* BOTÃO DE CANCELAR - Só aparece se ativo/trial */}
                    {(subscriptionStatus === 'active' || subscriptionStatus === 'trial') && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={canceling}
                        className="w-full bg-gradient-to-r from-[#EF4444] to-[#F59E0B] disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                      </button>
                    )}

                    {/* ✅ BOTÃO NOVO: TROCAR CARTÃO */}
                    {subscriptionStatus !== 'canceled' && subscriptionStatus !== 'expired' && (
                      <button
                        onClick={() => setShowUpdatePaymentModal(true)}
                        className="w-full bg-[#1A1A1A] hover:bg-[#252525] text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center border border-white/10"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Trocar Cartão
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {subscription && subscriptionStatus === 'canceled' && (
              // MODIFICADO: Card sem borda
              <div className="bg-[#111111] rounded-2xl p-6">
                <div className="relative z-10">
                  {/* MODIFICADO: Título com SVG */}
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reativar Serviço
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/dashboard?open_plans=true')}
                      className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] flex items-center justify-center"
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

            {/* MODIFICADO: Card sem borda */}
            <div className="bg-[#111111] rounded-2xl p-6">
              <div className="relative z-10">
                {/* MODIFICADO: Título com SVG */}
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Precisa de Ajuda?
                </h3>

                <div className="space-y-4 text-sm text-gray-400">
                  <p>Entre em contato conosco se tiver dúvidas sobre sua assinatura.</p>

                  <div className="space-y-3">
                    {/* MODIFICADO: Item de suporte sem borda e com hover de bg */}
                    <div className="flex items-center p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors duration-300">
                      <svg className="w-5 h-5 mr-3 text-[#00FF99] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-300">suporte@swiftbot.com.br</span>
                    </div>

                    {/* MODIFICADO: Item de suporte sem borda e com hover de bg */}
                    <div className="flex items-center p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors duration-300">
                      <svg className="w-5 h-5 mr-3 text-[#00FF99] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </main >

      {/* Modal de Atualizar Cartão */}
      <UpdatePaymentModal
        isOpen={showUpdatePaymentModal}
        onClose={() => setShowUpdatePaymentModal(false)}
        userId={user?.id}
        onSuccess={async () => {
          await loadSubscriptionData(user.id)
          alert('✅ Cartão atualizado com sucesso! Tente o upgrade novamente.')
        }}
      />

      {/* Modal de Cancelamento */}
      {
        showCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            {/* MODIFICADO: Modal sem borda */}
            <div className="relative bg-[#111111] rounded-2xl p-8 max-w-md w-full shadow-2xl z-[70]">
              <div className="relative z-10">
                <div className="text-center mb-6">
                  {/* MODIFICADO: Ícone do modal sem borda */}
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Cancelar Assinatura</h3>
                  <p className="text-gray-400">
                    {isWithin7Days()
                      ? 'Você está nos primeiros 7 dias - Lei do Arrependimento'
                      : 'Seu plano será cancelado mas você mantém acesso'
                    }
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {isWithin7Days() ? (
                    <>
                      {/* MODIFICADO: Aviso sem borda */}
                      <div className="bg-yellow-500/10 rounded-xl p-4">
                        <p className="text-yellow-400 text-sm flex items-start">
                          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>
                            <strong>Lei do Arrependimento (7 dias)</strong><br />
                            Você está nos primeiros {getDaysSinceCreation()} dias da sua primeira assinatura.
                          </span>
                        </p>
                      </div>
                      {/* MODIFICADO: Aviso sem borda */}
                      <div className="bg-red-500/10 rounded-xl p-4">
                        <p className="text-red-400 text-sm">
                          <strong>⚠️ Cancelamento IMEDIATO:</strong>
                        </p>
                        <ul className="text-sm text-red-300 mt-2 space-y-1 ml-4">
                          <li>• Reembolso total será processado</li>
                          <li>• WhatsApp desconectado agora</li>
                          <li>• Perda de acesso imediata</li>
                          <li>• Valor estornado em até 7 dias úteis</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* MODIFICADO: Aviso sem borda */}
                      <div className="bg-blue-500/10 rounded-xl p-4">
                        <p className="text-blue-400 text-sm flex items-start">
                          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>
                            <strong>Cancelamento no fim do período</strong><br />
                            Você pode usar até {subscription?.next_billing_date
                              ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')
                              : 'o fim do período'
                            }
                          </span>
                        </p>
                      </div>
                      {/* MODIFICADO: Aviso sem borda */}
                      <div className="bg-[#0A0A0A] rounded-xl p-4">
                        <p className="text-gray-300 text-sm">
                          <strong>ℹ️ O que acontece:</strong>
                        </p>
                        <ul className="text-sm text-gray-400 mt-2 space-y-1 ml-4">
                          <li>• Renovação cancelada</li>
                          <li>• Acesso mantido até o fim</li>
                          <li>• WhatsApp continua conectado</li>
                          <li>• Sem reembolso do período atual</li>
                        </ul>
                      </div>
                    </>
                  )}

                  <div className="flex items-start space-x-3 pt-4">
                    <input
                      type="checkbox"
                      id="confirmCancel"
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500 bg-gray-800"
                    />
                    <label htmlFor="confirmCancel" className="text-sm text-gray-300">
                      Eu entendo as consequências e quero cancelar minha assinatura
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {/* MODIFICADO: Botão "Manter" com novo estilo */}
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={canceling}
                    className="flex-1 bg-[#272727] hover:bg-[#333333] disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Manter Assinatura
                  </button>
                  <button
                    onClick={() => {
                      const checkbox = document.getElementById('confirmCancel')
                      if (!checkbox.checked) {
                        alert('Por favor, confirme que você entende as consequências')
                        return
                      }
                      handleCancelSubscription()
                    }}
                    disabled={canceling}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center"
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
                        Confirmar Cancelamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* ============================================
      // 4. MODAIS ADICIONADOS
      // ============================================ */}

      {/* Modal de Seleção de Plano */}
      {
        showPlanChangeModal && subscription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative bg-[#111111] rounded-2xl p-8 max-w-4xl w-full shadow-2xl z-[70] my-8">
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Alterar Plano</h3>
                    <p className="text-gray-400">
                      Plano atual: {subscription.connections_purchased} {subscription.connections_purchased === 1 ? 'conexão' : 'conexões'} - {subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPlanChangeModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs Mensal/Anual */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5 flex">
                    <button
                      onClick={() => handleSelectNewPlan(selectedNewPlan.connections, 'monthly')}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${selectedNewPlan.billing_period === 'monthly'
                        ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => handleSelectNewPlan(selectedNewPlan.connections, 'annual')}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${selectedNewPlan.billing_period === 'annual'
                        ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Anual
                    </button>
                  </div>
                </div>

                {/* Grid de Planos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7].map(connections => {
                    const prices = {
                      monthly: { 1: 288.75, 2: 533.75, 3: 778.75, 4: 1023.75, 5: 1093.75, 6: 1312.50, 7: 1531.25 },
                      annual: { 1: 2575.20, 2: 4776.30, 3: 6968.70, 4: 9161.10, 5: 9787.50, 6: 11745.00, 7: 13702.50 }
                    }
                    const basePrice = prices[selectedNewPlan.billing_period][connections]
                    const hasAffiliateCoupon = subscription.affiliate_code || subscription.promotion_code // Verifica se tem cupom
                    const discount = hasAffiliateCoupon ? 0.40 : 0 // 40% de desconto
                    const finalPrice = hasAffiliateCoupon ? basePrice * (1 - discount) : basePrice

                    const isCurrentPlan = subscription.connections_purchased === connections && subscription.billing_period === selectedNewPlan.billing_period
                    const isSelected = selectedNewPlan.connections === connections

                    return (
                      <button
                        key={connections}
                        onClick={() => handleSelectNewPlan(connections, selectedNewPlan.billing_period)}
                        disabled={isCurrentPlan}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${isCurrentPlan
                          ? 'border-gray-600 bg-gray-900/50 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'border-[#00FF99] bg-[#00FF99]/10'
                            : 'border-white/10 hover:border-white/30 bg-[#0A0A0A]'
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white mb-1">{connections}</div>
                          <div className="text-xs text-gray-400 mb-2">{connections === 1 ? 'conexão' : 'conexões'}</div>

                          {hasAffiliateCoupon ? (
                            <>
                              <div className="text-xs text-gray-500 line-through">
                                R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-lg font-semibold text-[#00FF99]">
                                R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-semibold text-[#00FF99]">
                              R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            /{selectedNewPlan.billing_period === 'monthly' ? 'mês' : 'ano'}
                          </div>
                          {hasAffiliateCoupon && (
                            <div className="mt-1 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                              Cupom Ativo
                            </div>
                          )}
                          {isCurrentPlan && (
                            <div className="mt-2 text-xs text-gray-500">Plano Atual</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Info sobre tipo de mudança */}
                {changeType && (
                  <div className={`p-4 rounded-xl mb-6 ${changeType === 'upgrade'
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'bg-orange-500/10 border border-orange-500/30'
                    }`}>
                    <div className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 ${changeType === 'upgrade' ? 'text-blue-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <div className={`font-semibold mb-1 ${changeType === 'upgrade' ? 'text-blue-400' : 'text-orange-400'}`}>
                          {changeType === 'upgrade' ? '⬆️ Upgrade' : '⬇️ Downgrade'}
                        </div>
                        <div className="text-sm text-gray-300">
                          {changeType === 'upgrade'
                            ? 'Será cobrado o valor proporcional imediatamente. Seu período de renovação continua o mesmo.'
                            : `A mudança será aplicada na próxima renovação (${new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}). Você continuará usando o plano atual até lá.`
                          }
                        </div>
                        {changeType === 'downgrade' && selectedNewPlan.connections < subscription.connections_purchased && (
                          <div className="text-sm text-orange-400 mt-2">
                            ⚠️ As {subscription.connections_purchased - selectedNewPlan.connections} conexões excedentes serão desconectadas automaticamente na renovação.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso de limite 1x/mês */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 text-sm text-gray-300">
                      Você só pode alterar o plano <strong>1 vez por mês</strong>. Após confirmar esta alteração, precisará aguardar 30 dias para fazer outra mudança.
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPlanChangeModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPlanChange}
                    disabled={!changeType || changingPlan}
                    className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 px-4 rounded-xl font-bold transition-all duration-300"
                  >
                    {changingPlan ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      `Confirmar ${changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Confirmação de Downgrade */}
      {
        showConfirmDowngradeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative bg-[#111111] rounded-2xl p-8 max-w-md w-full shadow-2xl z-[80]">
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Confirmar Downgrade</h3>
                  <p className="text-gray-400 mb-4">
                    O downgrade será aplicado em {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}.
                  </p>
                  <p className="text-sm text-gray-500">
                    Você continuará usando o plano atual até a data de renovação. Após isso, o plano será alterado automaticamente.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDowngradeModal(false)}
                    disabled={changingPlan}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processPlanChange}
                    disabled={changingPlan}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center"
                  >
                    {changingPlan ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      'Confirmar Downgrade'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  )
}
