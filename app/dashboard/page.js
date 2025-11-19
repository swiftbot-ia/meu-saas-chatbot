'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  
  // Estados
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [hasUsedTrialBefore, setHasUsedTrialBefore] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading')
  const [connections, setConnections] = useState([])
  const [activeConnection, setActiveConnection] = useState(null)
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [agentConfigured, setAgentConfigured] = useState(false)
  const [stats, setStats] = useState({
    mensagensHoje: 0,
    conversasAtivas: 0,
    taxaResposta: 0,
    clientesAtendidos: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [connectionsDropdownOpen, setConnectionsDropdownOpen] = useState(false)
  
  // Estados do Checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('plan')
  
  // <-- [MERGE] Estado 'selectedPlan' atualizado para o formato do objeto do código 2
  const [selectedPlan, setSelectedPlan] = useState({
    connections: 1,
    billingPeriod: 'annual' 
  })
  // -->
  
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentElement, setPaymentElement] = useState(null)
  const [stripeElements, setStripeElements] = useState(null)
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)

  // ============================================================================
  // CARREGAMENTO INICIAL
  // ============================================================================
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      await Promise.all([
        loadUserProfile(user.id),
        loadSubscription(user.id),
        loadConnections(user.id)
      ])
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    }
  }

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

const loadSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.log('Nenhuma assinatura encontrada')
      setSubscriptionStatus('none')
      setSubscription(null)
      // ⚠️ VERIFICAR SE JÁ EXISTE HISTÓRICO DE TRIAL (mesmo sem assinatura ativa)
      const { data: historyData } = await supabase
        .from('user_subscriptions')
        .select('trial_start_date')
        .eq('user_id', userId)
        .not('trial_start_date', 'is', null)
        .limit(1)
        .single()
      
      if (historyData) {
        console.log('🔒 Usuário já usou trial no passado')
        setHasUsedTrialBefore(true)
      }
      
      return
    }
    if (data && data.trial_start_date) {
      console.log('🔒 Usuário já usou trial anteriormente')
      setHasUsedTrialBefore(true)
    }

    console.log('📊 Assinatura carregada:', data)
    setSubscription(data)
    
    // ✅ LÓGICA CORRETA DE STATUS
    if (data.stripe_subscription_id === 'super_account_bypass') {
      setSubscriptionStatus('super_account')
} else if (data.status === 'trial' || data.status === 'trialing') {
      // ✅ VERIFICAR SE TRIAL EXPIROU
      if (data.trial_end_date) {
        const trialEndDate = new Date(data.trial_end_date)
        const now = new Date()
        
        if (now > trialEndDate) {
          console.log('⚠️ Trial expirado detectado')
          setSubscriptionStatus('expired')
          
          // Atualizar no banco
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', data.id)
          
          return
        }
      }
      setSubscriptionStatus('trial')
    } else if (data.status === 'active') {
      setSubscriptionStatus('active')
    } else if (data.status === 'past_due') {
      setSubscriptionStatus('past_due')
    } else if (data.status === 'canceled' || data.status === 'cancelled') {
      setSubscriptionStatus('canceled')
    } else {
      setSubscriptionStatus('expired')
    }

    console.log('✅ Status definido como:', data.status)
  } catch (error) {
    console.error('Erro ao carregar assinatura:', error)
    setSubscriptionStatus('none')
    setSubscription(null)
  }
}

  const loadConnections = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      
      setConnections(data || [])
      
      if (data && data.length > 0) {
        const firstConnected = data.find(c => c.status === 'connected') || data[0]
        setActiveConnection(firstConnected)
        
        if (firstConnected.status === 'connected') {
          setWhatsappStatus('connected')
          checkAgentConfig(firstConnected.id)
          loadDashboardStats(firstConnected)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error)
    }
  }

  const checkAgentConfig = async (connectionId) => {
    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('id')
        .eq('connection_id', connectionId)
        .maybeSingle()

      setAgentConfigured(!!data)
    } catch (error) {
      console.error('Erro ao verificar config do agente:', error)
    }
  }

  const loadDashboardStats = async (connection) => {
    if (!connection || connection.status !== 'connected') return
    
    setStatsLoading(true)
    try {
      const response = await fetch('/api/whatsapp/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connection.id })
      })

      const data = await response.json()
      
      if (data.success) {
        setStats({
          mensagensHoje: data.stats.messages_today || 0,
          conversasAtivas: data.stats.active_conversations || 0,
          taxaResposta: data.stats.response_rate || 0,
          clientesAtendidos: data.stats.total_contacts || 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // ============================================================================
  // FUNÇÕES DE WHATSAPP
  // ============================================================================
  const connectWhatsApp = async (connection) => {
    if (!connection) {
      alert('Selecione uma conexão primeiro')
      return
    }

    // ============================================================================
    // 🔒 VALIDAÇÃO RIGOROSA DE ASSINATURA NO FRONTEND
    // ============================================================================
    const blockedStatuses = [
      'none',
      'expired', 
      'canceled',
      'cancelled',
      'incomplete',
      'incomplete_expired',
      'unpaid',
      'paused',
      'past_due'
    ]

    if (blockedStatuses.includes(subscriptionStatus)) {
      console.log(`❌ Status bloqueado no frontend: ${subscriptionStatus}`)
      setShowCheckoutModal(true)
      return
    }

    // Verificar se trial expirou
    if (subscriptionStatus === 'trial' && subscription?.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date)
      const now = new Date()
      
      if (now > trialEndDate) {
        console.log('❌ Trial expirado detectado no frontend')
        alert('Seu período de teste expirou. Por favor, assine um plano para continuar.')
        setShowCheckoutModal(true)
        return
      }
    }

    setConnecting(true)
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connection.id })
      })

      const data = await response.json()

      if (data.success) {
        if (data.qrCode) {
          setQrCode(data.qrCode)
          setShowQRModal(true)
          setWhatsappStatus('pending_qr')
          
          await supabase
            .from('whatsapp_connections')
            .update({ status: 'pending_qr' })
            .eq('id', connection.id)
        } else if (data.status === 'connected') {
          setWhatsappStatus('connected')
          await loadConnections(user.id)
        }
      } else {
        // Tratamento de erros específicos
        if (data.subscription_status) {
          console.log(`❌ Erro de assinatura: ${data.subscription_status}`)
          alert(data.error || 'Problema com sua assinatura. Verifique seu plano.')
          setShowCheckoutModal(true)
        } else {
          alert(data.error || 'Erro ao conectar WhatsApp')
        }
        return
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error)
      alert('Erro ao conectar WhatsApp')
    } finally {
      setConnecting(false)
    }
  }

  const checkWhatsAppStatus = async (connection) => {
    if (!connection) return

    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connection.id })
      })

      const data = await response.json()

      if (data.success) {
        setWhatsappStatus(data.status)
        
        await supabase
          .from('whatsapp_connections')
          .update({ 
            status: data.status,
            phone_number: data.phoneNumber || connection.phone_number
          })
          .eq('id', connection.id)

        if (data.status === 'connected') {
          setShowQRModal(false)
          setQrCode(null)
          await loadConnections(user.id)
          await loadDashboardStats(connection)
        } else if (data.qrCode) {
          setQrCode(data.qrCode)
          setShowQRModal(true)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const handleConnectionSelect = (connection) => {
    setActiveConnection(connection)
    setWhatsappStatus(connection.status)
    setConnectionsDropdownOpen(false)
    
    if (connection.status === 'connected') {
      checkAgentConfig(connection.id)
      loadDashboardStats(connection)
    } else {
      setStats({
        mensagensHoje: 0,
        conversasAtivas: 0,
        taxaResposta: 0,
        clientesAtendidos: 0
      })
      setAgentConfigured(false)
    }
  }

  const handleAddConnection = async () => {
    try {
      // ✅ NÃO enviar instanceName - será gerado baseado no connectionId
      const response = await fetch('/api/whatsapp/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conexão')
      }

      await loadConnections(user.id)

      // Buscar a conexão recém-criada para definir como ativa
      const { data: newConnection } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('id', result.connectionId)
        .single()

      if (newConnection) {
        setActiveConnection(newConnection)
      }

      alert('Nova conexão criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar conexão:', error)
      alert('Erro ao criar nova conexão: ' + error.message)
    }
  }

  const syncSubscriptionStatus = async () => {
    if (!subscription?.stripe_subscription_id || subscription.stripe_subscription_id === 'super_account_bypass') {
      alert('Não há assinatura para sincronizar')
      return
    }

    try {
      const response = await fetch('/api/subscription/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          subscriptionId: subscription.stripe_subscription_id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Status sincronizado com sucesso!')
        await loadSubscription(user.id)
      } else {
        alert(data.error || 'Erro ao sincronizar')
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      alert('Erro ao sincronizar status')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================
  useEffect(() => {
    if (activeConnection && whatsappStatus === 'pending_qr') {
      const interval = setInterval(() => {
        if (connecting) {
          checkWhatsAppStatus(activeConnection)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [activeConnection, connecting])
  
  useEffect(() => {
    if (activeConnection && whatsappStatus === 'connected') {
      const statsInterval = setInterval(() => {
        loadDashboardStats(activeConnection)
      }, 30000)
      
      return () => clearInterval(statsInterval)
    }
  }, [activeConnection, whatsappStatus])

  // <-- [MERGE] Bloco de setup do Stripe (3 useEffects) substituído pelo do código 2
  // ============================================================================
  // 1. ADICIONAR SCRIPT DO STRIPE.JS NO HEAD
  // ============================================================================
  useEffect(() => {
    // Carregar Stripe.js dinamicamente
    if (!window.Stripe) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.onload = () => {
        console.log('✅ Stripe.js carregado')
        // Inicializar Stripe
        // Certifique-se de que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY está no seu .env.local
        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
           window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        } else {
           console.error("❌ Chave publicável do Stripe não encontrada. Defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY em .env.local")
        }
      }
      script.onerror = () => {
         console.error("❌ Erro ao carregar script do Stripe.js")
      }
      document.head.appendChild(script)
    } else if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    }
  }, [])

  // ============================================================================
  // 🆕 INICIALIZAR PAYMENT ELEMENT QUANDO TIVER CLIENT_SECRET
  // ============================================================================
  useEffect(() => {
    // ✅ Criar Payment Element apenas quando:
    // 1. Temos clientSecret
    // 2. Stripe está carregado  
    // 3. Modal está aberto
    // 4. Ainda não criamos o Payment Element
    if (!clientSecret || !window.stripeInstance || paymentElement || !showCheckoutModal) {
      return
    }

    console.log('🎨 Inicializando Stripe Payment Element...')
    console.log('🔍 Client Secret:', clientSecret.substring(0, 20) + '...')

    const appearance = {
      theme: 'night',
      variables: {
        colorPrimary: '#04F5A0', // <-- Cor atualizada
        colorBackground: '#1a1a1a',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        colorTextSecondary: '#9ca3af',
        fontFamily: 'system-ui, -apple-system, sans-serif', // <-- Fonte atualizada
        borderRadius: '12px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        '.Input:focus': {
          borderColor: '#04F5A0', // <-- Cor atualizada
          outline: 'none',
          boxShadow: '0 0 0 1px #04F5A0', // <-- Cor atualizada
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500', // <-- Peso da fonte atualizado
          marginBottom: '8px',
        }
      }
    }

    const elements = window.stripeInstance.elements({
      clientSecret,
      appearance
    })

    setStripeElements(elements)

    // Delay para garantir que o DOM está pronto
    setTimeout(() => {
      const container = document.getElementById('payment-element')
      if (container) {
        const payment = elements.create('payment', {
          layout: 'accordion'
        })

        payment.mount('#payment-element')
        setPaymentElement(payment)

        console.log('✅ Payment Element montado com sucesso')

        // Event listeners
        payment.on('ready', () => {
          console.log('✅ Payment Element completamente carregado')
          setIsPaymentElementReady(true)
        })

        payment.on('change', (event) => {
          const messageContainer = document.getElementById('payment-message')
          if (messageContainer) {
            if (event.error) {
              messageContainer.textContent = event.error.message
            } else {
              messageContainer.textContent = ''
            }
          }
          
          if (event.complete) {
            setIsPaymentElementReady(true)
          }
        })
      } else {
        console.error('❌ Container #payment-element não encontrado!')
      }
    }, 100)

  }, [clientSecret, showCheckoutModal, paymentElement])

  // ✅ Cleanup do Payment Element quando modal fechar
  useEffect(() => {
    // Quando o modal fecha, limpar tudo
    if (!showCheckoutModal && paymentElement) {
      console.log('🧹 Limpando Payment Element (modal fechou)')
      paymentElement.unmount()
      setPaymentElement(null)
      setStripeElements(null)
      setIsPaymentElementReady(false)
      setClientSecret(null)
    }
  }, [showCheckoutModal])
  // -->

  // <-- [MERGE] Funções de checkout substituídas pelas do código 2
  // ============================================================================
  // FUNÇÕES DE CHECKOUT
  // ============================================================================
  
// ============================================================================
// 🆕 ETAPA 1: CRIAR SETUP INTENT E OBTER CLIENT_SECRET
// ============================================================================
const handleCreateSubscription = async () => {
  setCheckoutLoading(true)

  try {
    console.log('📤 [STEP 1] Criando Setup Intent...')

    const response = await fetch('/api/checkout/create-setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email
      })
    })

    const data = await response.json()

    if (data.success && data.clientSecret) {
      console.log('✅ Setup Intent criado')
      setClientSecret(data.clientSecret)
      setCheckoutStep('payment')
    } else {
      throw new Error(data.error || 'Erro ao iniciar checkout')
    }

  } catch (error) {
    console.error('❌ Erro:', error)
    alert('❌ Erro: ' + error.message)
  }

  setCheckoutLoading(false)
}
// ============================================================================
// 🆕 ETAPA 2: CONFIRMAR PAGAMENTO E CRIAR SUBSCRIPTION
// ============================================================================
const handleConfirmPayment = async (e) => {
  e.preventDefault()

  if (!window.stripeInstance || !stripeElements || !paymentElement || !isPaymentElementReady) {
    alert('Aguarde o formulário carregar')
    return
  }

  setCheckoutLoading(true)

  try {
    console.log('💳 [STEP 2A] Validando cartão...')

    // ✅ CONFIRMAR SETUP INTENT (VALIDAR CARTÃO)
    const { error: confirmError, setupIntent } = await window.stripeInstance.confirmSetup({
      elements: stripeElements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: 'if_required'
    })

    if (confirmError) {
      throw new Error(confirmError.message)
    }

    console.log('✅ Cartão validado!')
    console.log('📋 Payment Method:', setupIntent.payment_method)

    await new Promise(resolve => setTimeout(resolve, 500))

    // ✅ CRIAR SUBSCRIPTION COM CARTÃO VALIDADO
    console.log('💳 [STEP 2B] Criando subscription...')

    const subscriptionResponse = await fetch('/api/checkout/confirm-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        paymentMethodId: setupIntent.payment_method,
        plan: selectedPlan,
        userEmail: user.email,
        userName: userProfile?.full_name || user.email.split('@')[0]
      })
    })

    const subscriptionData = await subscriptionResponse.json()

    if (!subscriptionData.success) {
      throw new Error(subscriptionData.error || 'Erro ao criar assinatura')
    }

    console.log('✅ Subscription criada!')

    // ✅ LIMPAR E FECHAR
    setShowCheckoutModal(false)
    setCheckoutStep('plan')
    setClientSecret(null)

    await loadSubscription(user.id)
    await loadConnections(user.id)

    const message = subscriptionData.is_trial 
      ? `🎉 Teste Grátis de ${subscriptionData.trial_days} dias ativado!`
      : '💳 Plano ativado!'

    alert(message)

  } catch (error) {
    console.error('❌ Erro:', error)
    alert('❌ Erro: ' + error.message)
  }

  setCheckoutLoading(false)
}
  // -->
  
  // <-- [MERGE] Funções helper de checkout substituídas/adicionadas
  const calculatePrice = () => {
    const pricing = {
      monthly: { 1: 165, 2: 305, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875 },
      annual: { 1: 150, 2: 275, 3: 400, 4: 525, 5: 525, 6: 630, 7: 735 }
    }
    return pricing[selectedPlan.billingPeriod][selectedPlan.connections] || 0;
  }
  
  const hasDiscount = () => {
    const savings = {
      monthly: { 2: 8, 3: 10, 4: 11, 5: 24, 6: 24, 7: 24 },
      annual: { 2: 8, 3: 11, 4: 12, 5: 30, 6: 30, 7: 30 }
    }
    return savings[selectedPlan.billingPeriod][selectedPlan.connections] || 0
  }
  
  // Precisamos da 'getSubscriptionStatus' do código 2, pois 'shouldShowTrial' depende dela
  const getSubscriptionStatus = () => {
    // Usamos o 'subscriptionStatus' do estado do código 1
    return subscriptionStatus; 
  }

  const calculateAnnualDiscount = () => {
    const pricing = {
      monthly: { 1: 165, 2: 305, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875 },
      annual: { 1: 150, 2: 275, 3: 400, 4: 525, 5: 525, 6: 630, 7: 735 }
    }
    const monthlyPrice = pricing.monthly[selectedPlan.connections]
    const annualPrice = pricing.annual[selectedPlan.connections]
    if (!monthlyPrice || !annualPrice) return 0;
    const monthlyTotal = monthlyPrice * 12
    const annualTotal = annualPrice * 12
    const discount = Math.round(((monthlyTotal - annualTotal) / monthlyTotal) * 100)
    return discount
  }

  const calculateAnnualTotal = () => {
    const pricing = {
      annual: { 1: 150, 2: 275, 3: 400, 4: 525, 5: 525, 6: 630, 7: 735 }
    }
    const annualMonthlyPrice = pricing.annual[selectedPlan.connections]
    return (annualMonthlyPrice || 0) * 12
  }
  
  // 'hasUsedTrial' é necessária para 'shouldShowTrial'
  const hasUsedTrial = () => {
    if (!subscription) return false
    
    // Usamos o 'subscriptionStatus' do estado do código 1
    return subscriptionStatus === 'expired' || subscriptionStatus === 'past_due'
  }
  
  const shouldShowTrial = () => {
    if (subscription && selectedPlan.connections > (subscription.connections_purchased || 1)) {
        return false;
    }
    return !hasUsedTrial()
  }
  // -->

  const getStatusIcon = (status) => {
    switch(status) {
      case 'connected':
        return <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
      case 'pending_qr':
        return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'connected': return 'Conectado'
      case 'pending_qr': return 'Aguardando QR'
      case 'error': return 'Erro'
      default: return 'Desconectado'
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  const displayName = (userProfile?.full_name || user?.email?.split('@')[0] || 'Usuário').split(' ')[0]
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const connectedCount = connections.filter(c => c.status === 'connected').length
  const totalSlots = subscription?.connections_purchased || 1

  return (
    <div className="min-h-screen bg-[#0A0A0A]">

      {/* Main Content */}
      {/* Padding top mantido em pt-16 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          
        {/* Welcome e Header agora estão na mesma linha */}
        <div className="mb-12 flex justify-between items-start gap-4">
          
          {/* Coluna da Esquerda: Welcome + Logo */}
          <div>
            {/* MODIFICADO: Adicionado flex e items-center, gap-4 */}
            <div className="flex items-center lg:gap-4">
              <h1 className="text-5xl font-bold text-white">
                Olá, <span className="capitalize bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">{displayName}</span>
              </h1>
              {/* LOGO MOVIDA PARA CÁ */}
              <div className="hidden lg:flex w-10 h-10 items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99"/>
                  <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1"/>
                </svg>
              </div>
            </div>
            
            <p className="text-[#B0B0B0] text-lg mt-3"> {/* Adicionado mt-3 para separar o texto do h1 */}
              Acompanhe suas conexões e estatísticas em tempo real
            </p>
          </div>

          {/* Coluna da Direita: Novo Header (Menu da Conta) */}
          <div className="relative">
{/* MODIFICADO: Botão com conteúdo responsivo */}
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center justify-center p-2 rounded-xl hover:opacity-80 transition-opacity duration-200"
              style={{ backgroundColor: '#272727' }}
            >
              
              {/* --- Conteúdo Desktop (Avatar + Seta) --- */}
              {/* 'hidden lg:flex' = Escondido no mobile, Flex no desktop */}
              <div className="hidden lg:flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00FF99 0%, #00E88C 100%)',
                    boxShadow: '0 0 0 2px rgba(0, 255, 153, 0.2)'
                  }}
                >
                  {initials}
                </div>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* --- Conteúdo Mobile (Ícone "=") --- */}
              {/* 'lg:hidden' = Mostrado no mobile, Escondido no desktop */}
              <div className="lg:hidden w-9 h-9 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>

            </button>

            {accountDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountDropdownOpen(false)} />
                
                {/* MODIFICADO: Fundo #272727, borda REMOVIDA */}
                <div 
                  className="absolute right-0 mt-3 w-64 shadow-2xl rounded-2xl overflow-hidden z-50"
                  style={{ backgroundColor: '#272727' }}
                >
                  {/* O header do dropdown (com nome e email) já tinha sido removido */}
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false)
                        router.push('/account/profile')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Configurar Conta
                    </button>

                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false)
                        router.push('/account/subscription')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Gerenciar Assinatura
                    </button>

                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false)
                        router.push('/sugestao')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      Central de Sugestões
                    </button>

                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false)
                        router.push('/suporte')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Central de Ajuda
                    </button>
                    
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Fim da Coluna da Direita */}

        </div>
        {/* Fim da Linha Welcome+Header */}

        {/* Subscription Alert - FUNDO PRETO COM BORDA GRADIENTE */}
        {(subscriptionStatus === 'none' || subscriptionStatus === 'expired' || subscriptionStatus === 'past_due') && !hasUsedTrialBefore && (
          <div 
            className="mb-12 bg-black rounded-2xl p-8 relative"
            style={{
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(black, black), linear-gradient(to right, #8A2BE2, #00BFFF)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* Ícone Presente com Gradiente */}
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #00BFFF 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {subscriptionStatus === 'past_due' ? 'Pagamento Pendente' : 'Teste Gratuito Disponível'}
                  </h3>
                </div>
                <p className="text-[#B0B0B0] mb-5 text-lg">
                  {subscriptionStatus === 'past_due' 
                    ? 'Atualize seu pagamento para continuar usando a plataforma'
                    : 'Ative 4 dias grátis e comece a automatizar seu atendimento agora'}
                </p>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300"
                >
                  {subscriptionStatus === 'past_due' ? 'Atualizar Pagamento' : 'Ativar Teste Gratuito'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
              
              {subscription?.stripe_subscription_id && subscription.stripe_subscription_id !== 'super_account_bypass' && (
                <button 
                  onClick={syncSubscriptionStatus}
                  className="ml-4 p-3 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded-xl transition-all duration-300"
                  title="Sincronizar status"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
{/* Card para usuários que JÁ USARAM trial */}
{(subscriptionStatus === 'none' || subscriptionStatus === 'expired' || subscriptionStatus === 'past_due') && hasUsedTrialBefore && (
  <div 
    className="mb-12 bg-black rounded-2xl p-8 relative"
    style={{
      border: '2px solid transparent',
      backgroundImage: 'linear-gradient(black, black), linear-gradient(to right, #FF6B6B, #FF8E53)',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box'
    }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">
            Assinatura Necessária
          </h3>
        </div>
        <p className="text-[#B0B0B0] mb-5 text-lg">
          Assine um plano para continuar automatizando seu atendimento
        </p>
        <button
          onClick={() => setShowCheckoutModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300"
        >
          Ver Planos
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)}
        {/* ================================================================= */}
        {/* INÍCIO DO BANNER ADICIONADO (DE banner-mudanca-agendada.txt)       */}
        {/* ================================================================= */}
        
        {/* Banner de Mudança Agendada (Downgrade ou Cancelamento) - FUNDO PRETO COM BORDA VERMELHA */}
        {subscription && (subscription.pending_change_type || subscription.canceled_at) && subscription.status !== 'canceled' && (
          <div 
            className="mb-12 bg-black rounded-2xl p-8 relative"
            style={{
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(black, black), linear-gradient(to right, #EF4444, #DC2626)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* Ícone de Alerta com Vermelho */}
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    ⚠️ Mudança de Plano Agendada
                  </h3>
                </div>
                
                {/* Conteúdo do Banner */}
                <div className="space-y-2 mb-5">
                  <p className="text-[#B0B0B0] text-lg">
                    <strong className="text-white">Plano atual:</strong> {subscription.connections_purchased} {subscription.connections_purchased === 1 ? 'conexão' : 'conexões'} - R$ {
                      subscription.billing_period === 'monthly' 
                        ? {1: 165, 2: 305, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875}[subscription.connections_purchased]
                        : {1: 1776, 2: 3294, 3: 4806, 4: 6318, 5: 6750, 6: 8100, 7: 9450}[subscription.connections_purchased]
                    }/{subscription.billing_period === 'monthly' ? 'mês' : 'ano'}
                  </p>
                  
                  {subscription.pending_change_type === 'downgrade' && (
                    <>
                      <p className="text-[#B0B0B0] text-lg">
                        <strong className="text-orange-400">A partir de {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}:</strong> {subscription.pending_connections} {subscription.pending_connections === 1 ? 'conexão' : 'conexões'} - R$ {
                          subscription.pending_billing_period === 'monthly' 
                            ? {1: 165, 2: 305, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875}[subscription.pending_connections]
                            : {1: 1776, 2: 3294, 3: 4806, 4: 6318, 5: 6750, 6: 8100, 7: 9450}[subscription.pending_connections]
                        }/{subscription.pending_billing_period === 'monthly' ? 'mês' : 'ano'}
                      </p>
                      {subscription.pending_connections < subscription.connections_purchased && (
                        <p className="text-orange-400 text-sm">
                          ℹ️ {subscription.connections_purchased - subscription.pending_connections} {subscription.connections_purchased - subscription.pending_connections === 1 ? 'conexão será desconectada' : 'conexões serão desconectadas'} automaticamente na renovação
                        </p>
                      )}
                    </>
                  )}
                  
                  {subscription.canceled_at && !subscription.pending_change_type && (
                    <p className="text-[#B0B0B0] text-lg">
                      <strong className="text-red-400">Cancelamento agendado para:</strong> {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Botão para cancelar mudança */}
                <button
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja cancelar a mudança agendada?')) return
                    
                    try {
                      const response = await fetch('/api/subscription/cancel-change', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id })
                      })
                      
                      const data = await response.json()
                      
                      if (data.success) {
                        alert('✅ Mudança cancelada com sucesso!')
                        await loadSubscription(user.id)
                      } else {
                        alert(`❌ Erro: ${data.error}`)
                      }
                    } catch (error) {
                      console.error('Erro:', error)
                      alert('❌ Erro ao cancelar mudança')
                    }
                  }}
                  className="bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] text-black py-3 px-8 rounded-xl font-bold transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar Mudança Agendada
                </button>
              </div>

              {/* Ícone grande no lado direito (opcional) */}
              <div className="hidden md:block ml-8">
                <svg className="w-24 h-24 text-red-500/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* FIM DO BANNER ADICIONADO                                          */}
        {/* ================================================================= */}

        {/* Main Grid - CARDS COM BORDAS GRADIENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Conexão Ativa - Estilo Unificado Neutro */}
          <div className="bg-[#111111] rounded-2xl p-8 hover:bg-[#1A1A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Ícone com Fundo Gradiente Verde→Azul */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10E57C 0%, #00BFFF 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Conexão Ativa</h3>
              </div>
            </div>

            {/* Dropdown de Conexões */}
            <div className="relative mb-6">
              <button
                onClick={() => setConnectionsDropdownOpen(!connectionsDropdownOpen)}
                className="w-full bg-[#0A0A0A] hover:bg-black rounded-xl p-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#10E57C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        {activeConnection ? `Conexão ${activeConnection.connection_number}` : 'Selecionar Conexão'}
                      </p>
                      <p className="text-xs text-[#B0B0B0]">
                        {connectedCount} de {totalSlots} ativas
                      </p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${connectionsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {connectionsDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setConnectionsDropdownOpen(false)} />
                  
                  <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-md bg-[#111111]/95 border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                    {connections.length === 0 ? (
                      <div className="p-8 text-center text-[#B0B0B0] text-sm">
                        Nenhuma conexão encontrada
                      </div>
                    ) : (
                      connections.map((conn) => (
                        <button
                          key={conn.id}
                          onClick={() => handleConnectionSelect(conn)}
                          className={`w-full p-4 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0 ${
                            activeConnection?.id === conn.id ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold text-sm">
                              Conexão {conn.connection_number}
                            </span>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(conn.status)}
                              <span className="text-xs text-[#B0B0B0]">
                                {getStatusText(conn.status)}
                              </span>
                            </div>
                          </div>
                          {conn.phone_number && (
                            <p className="text-xs text-[#B0B0B0]">{conn.phone_number}</p>
                          )}
                        </button>
                      ))
                    )}
                    
                    <div className="border-t border-white/10 p-2">
                      {connections.length < totalSlots && (
                        <button
                          onClick={() => {
                            handleAddConnection()
                            setConnectionsDropdownOpen(false)
                          }}
                          className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-lg font-bold hover:shadow-lg transition-all duration-300 mb-2"
                        >
                          + Adicionar Nova Conexão
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowCheckoutModal(true)
                          setConnectionsDropdownOpen(false)
                        }}
                        className="w-full bg-[#222222] hover:bg-[#333333] text-[#B0B0B0] py-3 px-4 rounded-lg transition-all duration-300"
                      >
                        Aumentar Limite
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status Badge */}
            {activeConnection && (
              <div className="flex items-center gap-2 mb-6">
                {getStatusIcon(whatsappStatus)}
                <span className="text-sm text-[#B0B0B0]">
                  {getStatusText(whatsappStatus)}
                </span>
              </div>
            )}

            {/* Action Button - BOTÃO FANTASMA (Ghost) */}
            {whatsappStatus === 'connected' ? (
              <button
                onClick={() => checkWhatsAppStatus(activeConnection)}
                className="w-full bg-[#222222] hover:bg-[#333333] text-[#B0B0B0] hover:text-white font-medium py-3 px-4 rounded-xl transition-all duration-300"
              >
                Verificar Status
              </button>
            ) : (
              <button
                onClick={() => connectWhatsApp(activeConnection)}
                disabled={connecting || !activeConnection}
                className="w-full bg-[#222222] text-[#B0B0B0] hover:bg-gradient-to-r hover:from-[#00FF99] hover:to-[#00E88C] hover:text-black font-medium py-3 px-4 rounded-xl transition-all duration-1000 flex items-center justify-center disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#B0B0B0] mr-2" />
                    Conectando...
                  </>
                ) : (
                  'Conectar WhatsApp'
                )}
              </button>
            )}
          </div>

          {/* Agente IA - Estilo Unificado Neutro */}
          <div className="bg-[#111111] rounded-2xl p-8 hover:bg-[#1A1A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Ícone com Fundo Gradiente Roxo→Rosa */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #FF1493 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Agente IA</h3>
              </div>
            </div>

            <p className="text-[#B0B0B0] mb-6">
              Configure a personalidade e comportamento do seu assistente
            </p>

            <div className="flex items-center gap-2 mb-6">
              {agentConfigured ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-[#B0B0B0]">Configurado</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                  <span className="text-sm text-[#B0B0B0]">Não configurado</span>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (activeConnection) {
                  router.push(`/agent-config?connectionId=${activeConnection.id}`)
                } else {
                  alert('Selecione uma conexão primeiro')
                }
              }}
              disabled={!activeConnection}
              className="w-full bg-[#222222] hover:bg-[#333333] disabled:opacity-50 text-[#B0B0B0] hover:text-white font-medium py-3 px-4 rounded-xl transition-all duration-300"
            >
              {agentConfigured ? 'Editar Configuração' : 'Configurar Agente'}
            </button>
          </div>

          {/* Bate-Papo - Estilo Unificado Neutro */}
          <div className="bg-[#111111] rounded-2xl p-8 hover:bg-[#1A1A1A] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Ícone com Fundo Gradiente Cinza */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #AAAAAA 0%, #444444 100%)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Bate-Papo</h3>
              </div>
            </div>

            <p className="text-[#B0B0B0] mb-6">
              Visualize e gerencie conversas em tempo real
            </p>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-sm text-[#B0B0B0]">
                {activeConnection ? `${stats.conversasAtivas} conversas hoje` : 'N/A'}
              </span>
            </div>

            <div className="w-full bg-[#222222] text-[#B0B0B0] font-medium py-3 px-4 rounded-xl text-center">
              Em breve
            </div>
          </div>

        </div>

        {/* Estatísticas - Estilo Unificado Neutro */}
        <div className="bg-[#111111] rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              Estatísticas da Conexão {activeConnection?.connection_number || ''}
              {statsLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00FF99]" />
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: stats.mensagensHoje, label: 'Mensagens Hoje' },
              { value: stats.conversasAtivas, label: 'Conversas Ativas' },
              { value: `${stats.taxaResposta}%`, label: 'Taxa de Resposta' },
              { value: stats.clientesAtendidos, label: 'Clientes Atendidos' }
            ].map((stat, index) => (
              <div key={index} className="bg-[#111111] rounded-xl p-6 text-center border border-[#333333] hover:border-[#555555] transition-all duration-300">
                <div className="text-5xl font-bold text-white mb-2">
                  {(statsLoading || !activeConnection) ? '...' : stat.value}
                </div>
                <div className="text-sm text-[#B0B0B0]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* QR Code Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
          
          <div className="relative backdrop-blur-md bg-[#111111]/95 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl z-10">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                Conectar WhatsApp
              </h3>
              <p className="text-[#B0B0B0] mb-6">
                Escaneie o QR Code com seu WhatsApp
              </p>
              
              <div className="bg-white rounded-2xl p-4 mb-6 inline-block">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              </div>
              
              <div className="bg-[#00FF99]/10 border border-[#00FF99]/20 rounded-xl p-4">
                <p className="text-sm text-white mb-2 font-semibold">Como conectar:</p>
                <ol className="text-xs text-[#B0B0B0] space-y-1 text-left">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em Menu ou Configurações</li>
                  <li>3. Toque em "Aparelhos conectados"</li>
                  <li>4. Toque em "Conectar um aparelho"</li>
                  <li>5. Aponte a câmera para este QR Code</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <-- [MERGE] Bloco JSX do Checkout Modal substituído pelo do código 2 --> */}
{showCheckoutModal && (
  <>
    {/* OVERLAY COM BLUR - Camada separada */}
    <div 
      className="fixed inset-0 z-[60]"
      style={{
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
      onClick={() => setShowCheckoutModal(false)}
    />
    
    {/* CONTAINER DO MODAL - Camada acima do blur */}
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
      <div className="pointer-events-auto max-w-lg lg:max-w-xl w-full mx-4">
          
          {/* Efeitos de fundo (copiados do código 2) */}
{/* Background Pattern */}

{/* Animated Gradient Blobs */}
<div 
  className="relative rounded-3xl p-8 w-full max-h-[90vh] overflow-y-auto"
  style={{
    backgroundColor: '#1A1A1A',
    border: '2px solid transparent',
    backgroundImage: 'linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(135deg, #FF6B00 0%, #FF0080 50%, #8B00FF 100%)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box'
  }}
>    
          
            {/* Step 1: Seleção de Plano */}
            {checkoutStep === 'plan' && (
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-6">
  <svg width="48" height="48" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
    <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99"/>
    <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1"/>
  </svg>
</div>
<div className="text-center mb-6">
                    {/* Ícone (simulando o do código 2) */}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {shouldShowTrial() ? 'Teste Grátis' : '💳 Ativar ou Fazer Upgrade'}
                  </h2>
                  <p className="text-gray-400">
                    {shouldShowTrial() 
                      ? 'Teste todos os recursos sem compromisso' 
                      : 'Ative ou adicione mais conexões ao seu plano'
                    }
                  </p>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="bg-[#222222] rounded-xl p-1 flex border border-[#333333]">
                    <button
                      onClick={() => setSelectedPlan({...selectedPlan, billingPeriod: 'monthly'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedPlan.billingPeriod === 'monthly'
                          ? 'bg-[#04F5A0] text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      MENSAL
                    </button>
                    <button
                      onClick={() => setSelectedPlan({...selectedPlan, billingPeriod: 'annual'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center ${
                        selectedPlan.billingPeriod === 'annual'
                          ? 'bg-[#04F5A0] text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ANUAL
                      <span className="ml-1 px-1 py-0.5 bg-orange-500 text-white text-xs rounded">
                        -{calculateAnnualDiscount()}%
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Quantas conexões WhatsApp você precisa?
                  </label>
                  
                  <div className="relative mb-4">
                    <div className="h-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <div
                        className="h-full bg-gradient-to-r from-[#04F5A0] to-orange-500 rounded-lg transition-all duration-300"
                        style={{ width: `${((selectedPlan.connections - 1) / 6) * 100}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={subscription?.connections_purchased || 1}
                      max="7"
                      value={selectedPlan.connections}
                      onChange={(e) => setSelectedPlan({...selectedPlan, connections: parseInt(e.target.value)})}
                      className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-4">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#04F5A0] mb-1">
                      {selectedPlan.connections} {selectedPlan.connections === 1 ? 'conexão' : 'conexões'}
                    </div>
                    {hasDiscount() > 0 && (
                      <div className="text-orange-400 text-sm font-medium">
                        ✨ {hasDiscount()}% de desconto por conexão!
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#222222] rounded-xl p-6 mb-6 border border-[#333333]">
                  <div className="text-center mb-4">
                    {shouldShowTrial() ? (
                      <>
                        <div className="text-5xl font-bold text-[#04F5A0] mb-2">
                          R$ 0,00
                        </div>
                        <div className="text-sm text-gray-400 mb-3">
                          por 4 dias {/* Mantendo os 4 dias do texto do código 1 */}
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-3"></div>
                        <div className="text-gray-400 text-sm mb-1">
                          Depois cobraremos:
                        </div>
                      </>
                    ) : null}
                    
                    {selectedPlan.billingPeriod === 'monthly' ? (
                      <>
                        <div className="text-4xl font-bold text-white mb-2">
                          R$ {calculatePrice().toLocaleString('pt-BR')}
                          <span className="text-lg text-gray-400 ml-1">/mês</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-white mb-2">
                          R$ {calculatePrice().toLocaleString('pt-BR')}
                          <span className="text-lg text-gray-400 ml-1">/mês</span>
                        </div>
                        <div className="text-lg text-gray-500 mb-1">
                          R$ {calculateAnnualTotal().toLocaleString('pt-BR')}/ano
                        </div>
                        <div className="text-orange-400 text-sm font-medium">
                           Economize {calculateAnnualDiscount()}% no plano anual!
                        </div>
                      </>
                    )}
                    
                    {!shouldShowTrial() && (
                      <div className="text-red-400 text-sm font-medium mt-2">
                        ⚠️ Teste Grátis já utilizado ou modo de upgrade - Cobrança imediata
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-yellow-400 text-sm font-medium mb-2">
                      {shouldShowTrial() 
                        ? ' Teste Grátis completo e sem compromisso' 
                        : '💎 Acesso completo aos recursos'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {shouldShowTrial() 
                        ? 'Cancele a qualquer momento durante o teste grátis'
                        : 'Cancele a qualquer momento'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button" // Garante que não submete formulário
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button" // Garante que não submete formulário
                    onClick={handleCreateSubscription}
                    disabled={checkoutLoading}
                    className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)]"
                  >
                    {checkoutLoading ? 'Criando...' : 'Continuar'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Dados do Cartão (SEM CPF E ENDEREÇO) */}
            {checkoutStep === 'payment' && (
              <div className="relative z-10">
              
                {/* Overlay de Loading (copiado do código 2) */}
                {checkoutLoading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-3xl -m-8">
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-[#00FF99] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Processando Pagamento</h2>
                      <p className="text-gray-400">Por favor, aguarde. Não feche esta janela.</p>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-6">
</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Dados do Cartão</h2>
                  <p className="text-gray-400">Checkout seguro e criptografado via Stripe</p>
                </div>
                
                <div 
  className="rounded-xl p-4 mb-6"
  style={{
    backgroundColor: '#222222',
    border: '1px solid transparent',
    backgroundImage: 'linear-gradient(#222222, #222222), linear-gradient(135deg, #FF6B00 0%, #FF0080 50%, #8B00FF 100%)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box'
  }}
>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">
                        {selectedPlan.connections} {selectedPlan.connections === 1 ? 'conexão' : 'conexões'}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">
                        Plano {selectedPlan.billingPeriod === 'monthly' ? 'mensal' : 'anual'}
                      </div>
                    </div>
                    <div className="text-right">
                      {shouldShowTrial() ? (
                        <div>
                          <div className="text-lg font-bold text-[#04F5A0]">R$ 0,00</div>
                          <div className="text-xs text-gray-400">por 4 dias</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Depois: {selectedPlan.billingPeriod === 'annual' 
                              ? `R$ ${calculateAnnualTotal().toLocaleString('pt-BR')}/ano`
                              : `R$ ${calculatePrice().toLocaleString('pt-BR')}/mês`
                            }
                          </div>
                        </div>
                      ) : (
                        <div>
                          {selectedPlan.billingPeriod === 'annual' ? (
                            <>
                              <div className="text-lg font-bold text-[#04F5A0]">
                                R$ {calculateAnnualTotal().toLocaleString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-400">/ano</div>
                              <div className="text-xs text-orange-400 font-medium mt-1">
                                 Economize {calculateAnnualDiscount()}% vs mensal
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-bold text-[#04F5A0]">
                                R$ {calculatePrice().toLocaleString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-400">/mês</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleConfirmPayment}>
                  <div className="space-y-4 mb-6">
                    {/* Stripe Payment Element */}
                    <div>
                      <div 
                        id="payment-element"
                        className="min-h-[200px]"
                      />
                      {/* Mensagens de erro aparecem aqui */}
                      <div 
                        id="payment-message" 
                        className="text-red-400 text-sm mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutStep('plan')
                        setClientSecret(null)
                        if (paymentElement) {
                          paymentElement.unmount()
                          setPaymentElement(null)
                        }
                      }}
                      disabled={checkoutLoading}
                      className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-white/20"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutLoading || !isPaymentElementReady}
                      className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)]"
                    >
                      {checkoutLoading 
                        ? 'Processando...' 
                        : !isPaymentElementReady 
                          ? 'Carregando formulário...'
                          : (shouldShowTrial() ? 'Ativar Teste Grátis' : 'Pagar e Ativar')
                      }
                    </button>
                  </div>
                </form>
              </div>
            )}
            
</div>
        </div>
      </div>
    </>
  )}
      {/* --> [FIM DO MERGE] */}

    </div>
  )
}