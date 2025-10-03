'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

// ====================================================================
// COMPONENTE DROPDOWN DE CONTA
// ====================================================================
const AccountDropdown = ({ user, userProfile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const avatarUrl = userProfile?.avatar_url
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="relative">
      {/* Avatar/Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-black/30 backdrop-blur-xl hover:bg-black/40 rounded-xl px-3 py-2 transition-all duration-300 border border-white/10 hover:border-[#04F5A0]/30 relative overflow-hidden z-50"
      >
        {/* Animated Background Effect */}
        <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/30 rounded-full blur-md animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 bg-[#04F5A0]/20 rounded-full blur-sm animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-[#04F5A0]/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          
          {/* Nome */}
          <span className="text-sm text-gray-300 font-medium">
            {displayName}
          </span>
          
          {/* Seta */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-[70]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-black/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 z-[80] overflow-hidden">
            {/* Header do Menu */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-[#04F5A0]/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold text-lg">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{displayName}</div>
                  <div className="text-gray-400 text-sm">{user?.email}</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account/profile')
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-[#04F5A0] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Configurar Conta
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account/subscription')
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-[#04F5A0] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Gerenciar Assinatura
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account/security')
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-[#04F5A0] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Segurança
              </button>
              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const ConnectionCard = ({ connectionIndex, connection, isActive, onSelect, onConnect, onConfigure }) => {
    
    const getStatusText = () => {
        if (!connection) return '🔴 Inativa';
        switch (connection.status) {
            case 'connected': return '🟢 Conectado';
            case 'pending_qr': return '🟡 Aguardando QR';
            case 'error': return '🔴 Erro';
            default: return '🔴 Desconectado';
        }
    };

    return (
        <div 
            onClick={() => onSelect(connectionIndex)}
            className={`rounded-2xl p-4 cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                isActive 
                    ? 'bg-black/30 backdrop-blur-xl border border-[#04F5A0]/30' 
                    : 'bg-black/20 backdrop-blur-xl border border-white/10 hover:border-[#04F5A0]/20'
            }`}
        >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-20 h-20 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-pink-500/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
                {isActive && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#04F5A0]/20 rounded-full blur-md animate-pulse" style={{animationDelay: '0.5s'}}></div>
                )}
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20">
                <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-bold ${isActive ? 'text-[#04F5A0]' : 'text-white'}`}>
                        Conexão {connectionIndex + 1}
                    </h4>
                    {isActive && <div className="w-2.5 h-2.5 bg-[#04F5A0] rounded-full shadow-[0_0_8px_rgba(4,245,160,0.8)] animate-pulse"></div>}
                </div>
                
                <div className="text-sm text-gray-400 mb-4">{getStatusText()}</div>

                {connection ? (
                     <div className="flex space-x-2 relative z-30">
                         <button 
                             onClick={(e) => { e.stopPropagation(); onConfigure(connection); }} 
                             className="text-xs bg-blue-600/60 backdrop-blur-sm hover:bg-blue-600/80 text-white font-medium py-1 px-2 rounded-md transition-all w-full border border-blue-500/30 relative z-40"
                         >
                             Agente
                         </button>
                         <button 
                             onClick={(e) => { e.stopPropagation(); onConnect(connection); }} 
                             className="text-xs bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium py-1 px-2 rounded-md transition-all w-full border border-white/20 relative z-40"
                         >
                             {connection.status === 'connected' ? 'Status' : 'Conectar'}
                         </button>
                     </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onConnect(null, connectionIndex); }} 
                        className="w-full text-center text-sm text-orange-400 font-semibold group-hover:text-orange-300 relative z-40"
                    >
                        Ativar
                    </button>
                )}
            </div>
        </div>
    );
};

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para múltiplas conexões
  const [connections, setConnections] = useState([])
  const [activeConnection, setActiveConnection] = useState(null)
  const [connectionStats, setConnectionStats] = useState({})

  // Estados vinculados à conexão ativa
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [agentConfigured, setAgentConfigured] = useState(false)
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // 💳 Novos estados para checkout
  const [subscription, setSubscription] = useState(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({
    connections: 1,
    billingPeriod: 'annual'
  })
  const [checkoutStep, setCheckoutStep] = useState('plan') // plan, payment, processing
  
  // 📊 Estados para as estatísticas
  const [stats, setStats] = useState({
    mensagensHoje: 0,
    conversasAtivas: 0,
    taxaResposta: 0,
    clientesAtendidos: 0
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [lastStatsUpdate, setLastStatsUpdate] = useState(null)
  
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
  
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus()
      loadUserConnections()
    }
  }, [user])

  useEffect(() => {
      if (activeConnection) {
          checkWhatsAppStatus(activeConnection)
          checkAgentConfig(activeConnection)
          loadDashboardStats(activeConnection)
          
          const interval = setInterval(() => {
              if (connecting) {
                  checkWhatsAppStatus(activeConnection)
              }
          }, 5000)
          return () => clearInterval(interval)
      }
  }, [activeConnection, connecting])
  
  // Auto-refresh das estatísticas
  useEffect(() => {
    if (activeConnection && whatsappStatus === 'connected') {
      const statsInterval = setInterval(() => {
        loadDashboardStats(activeConnection)
      }, 30000)
      
      return () => clearInterval(statsInterval)
    }
  }, [activeConnection, whatsappStatus])

  // ====================================================================
  // ✅ Lógica do Pagar.me (mantida igual)
  // ====================================================================
  
  // Carregar script do Pagar.me apenas quando necessário
  useEffect(() => {
    if (checkoutStep === 'payment' && showCheckoutModal) {
      loadPagarmeScript()
    }
  }, [checkoutStep, showCheckoutModal])

  const loadPagarmeScript = () => {
    // Remove script anterior se existir
    const existingScript = document.querySelector('script[src*="checkout.js"]')
    if (existingScript) {
      document.head.removeChild(existingScript)
    }

    const script = document.createElement('script')
    script.src = 'https://assets.pagar.me/checkout/checkout.js'
    script.async = true
    script.onload = () => {
      console.log('✅ Script Pagar.me carregado')
    }
    script.onerror = () => {
      console.error('❌ Erro ao carregar script Pagar.me')
      alert('Erro ao carregar sistema de pagamento. Tente novamente.')
    }
    document.head.appendChild(script)
  }

  // ✅ Validação de CPF
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '')
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf[9])) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf[10])) return false
    
    return true
  }

  // ✅ FUNÇÃO PARA BUSCAR ENDEREÇO POR CEP
  const fetchAddressByCEP = async (cep) => {
    try {
      const cleanCEP = cep.replace(/\D/g, '')
      if (cleanCEP.length !== 8) return null
      
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()
      
      if (data.erro) return null
      
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      return null
    }
  }

  // ✅ Processar formulário com validações CRÍTICAS + ENDEREÇO
  const handleTokenizedSubmit = async (e) => {
    e.preventDefault()
    setCheckoutLoading(true)
    setCheckoutStep('processing')

    let subscriptionCreated = null

    try {
      // Capturar dados do formulário
      const formData = new FormData(e.target)
      const cardData = {
        card_number: formData.get('card_number').replace(/\s/g, ''),
        card_holder_name: formData.get('card_holder_name'),
        card_expiration_month: formData.get('card_expiration_month'),
        card_expiration_year: formData.get('card_expiration_year'),
        card_cvv: formData.get('card_cvv'),
        cpf: formData.get('cpf').replace(/[^\d]/g, '') // ✅ CPF
      }

      // ✅ NOVO: CAPTURAR DADOS DE ENDEREÇO
      const addressData = {
        zipcode: formData.get('zipcode').replace(/[^\d]/g, ''),
        state: formData.get('state'),
        city: formData.get('city'),
        neighborhood: formData.get('neighborhood'),
        street: formData.get('street'),
        street_number: formData.get('street_number'),
        complementary: formData.get('complementary') || ''
      }

      // ✅ VALIDAR CPF
      if (!validateCPF(cardData.cpf)) {
        throw new Error('CPF inválido. Por favor, verifique e tente novamente.')
      }

      // ✅ VALIDAR ENDEREÇO
      if (!addressData.zipcode || !addressData.state || !addressData.city || 
          !addressData.neighborhood || !addressData.street || !addressData.street_number) {
        throw new Error('Todos os campos de endereço são obrigatórios.')
      }

      console.log('🔍 Dados capturados:', {
        cardData: {
          card_number: cardData.card_number.substring(0, 4) + '****',
          card_holder_name: cardData.card_holder_name,
          cpf: cardData.cpf.substring(0, 3) + '***' + cardData.cpf.substring(9)
        },
        addressData: {
          zipcode: addressData.zipcode.substring(0, 5) + '-***',
          city: addressData.city,
          state: addressData.state,
          street: addressData.street.substring(0, 10) + '...',
          street_number: addressData.street_number
        }
      })

      // Lógica de upgrade ou nova assinatura
      const isUpgrade = subscription && selectedPlan.connections > subscription.connections_purchased;

      const apiEndpoint = isUpgrade ? '/api/checkout/upgrade-subscription' : '/api/checkout/create-subscription';

      const payload = {
          userId: user.id,
          plan: selectedPlan,
          cardData: cardData,
          addressData: addressData,
          userEmail: user.email,
          userName: userProfile?.full_name || user.email.split('@')[0],
          ...(isUpgrade && { subscriptionId: subscription.pagarme_subscription_id })
      };


      // ✅ ENVIAR PARA API COM ENDEREÇO
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('📤 Resposta da API:', data)

      // ✅ CRÍTICO: SÓ ATIVAR TRIAL/PLANO SE PAGAMENTO OK
      if (data.success) {
        subscriptionCreated = data.subscription
        setSubscription(data.subscription)
        setShowCheckoutModal(false)
        setCheckoutStep('plan')
        
        // Mensagem baseada se foi trial ou pagamento
        const message = data.is_trial 
          ? `🎉 Trial de ${data.trial_days} dia${data.trial_days > 1 ? 's' : ''} ativado com sucesso!`
          : isUpgrade
          ? `🚀 Upgrade realizado com sucesso! Total de conexões: ${selectedPlan.connections}`
          : `💳 Plano ativado! Cobrado R$ ${data.amount_charged.toFixed(2)}`
          
        alert(message)
        
        // Recarrega conexões para refletir o upgrade
        await loadUserConnections();

      } else {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }
    } catch (error) {
      console.error('❌ Erro completo:', error)
      
      alert('❌ Erro ao processar pagamento: ' + error.message)
      setCheckoutStep('payment')
    }

    setCheckoutLoading(false)
  }
  
  // ====================================================================
  // Funções de Gerenciamento de Conexão
  // ====================================================================

  const loadUserConnections = async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('user_connections')
            .select('*')
            .eq('user_id', user.id)
            .order('connection_number', { ascending: true });

        if (error) throw error;
        
        setConnections(data || []);
        if (data && data.length > 0) {
            // Se já existe uma conexão ativa, a mantém. Senão, define a primeira.
            const currentActive = data.find(c => c.id === activeConnection?.id);
            if (!currentActive) {
                setActiveConnection(data[0]);
            }
        } else {
            setActiveConnection(null);
        }
    } catch (error) {
        console.error("Erro ao carregar conexões do usuário:", error.message);
        setConnections([]);
        setActiveConnection(null);
    }
  };

  const handleConnectionSelect = (connectionIndex) => {
    const selected = connections.find(c => c.connection_number === connectionIndex + 1);
    if (selected && selected.id !== activeConnection?.id) {
        setActiveConnection(selected);
    }
  };

  const handleAddConnection = () => {
    // Lógica para upgrade ou adicionar nova conexão
    if (connections.length < subscription?.connections_purchased) {
        // Futuramente, criar uma nova conexão no banco de dados aqui.
        alert('Funcionalidade para adicionar nova conexão em breve. Por enquanto, configure as existentes.');
    } else {
        handleUpgradeConnections();
    }
  };

  const handleUpgradeConnections = () => {
    if (!subscription) {
        alert("Você precisa de um plano ativo para fazer upgrade.");
        return;
    }
    // Prepara o modal para o upgrade
    setSelectedPlan({
        ...selectedPlan,
        connections: subscription.connections_purchased + 1
    });
    setCheckoutStep('plan'); // Começa da seleção para confirmar o upgrade
    setShowCheckoutModal(true);
  };
  
  // ====================================================================
  // Funções do Componente (Modificadas)
  // ====================================================================
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
  
    // 🔍 DEBUG CRÍTICO
    console.log('🔍 USER ID REAL:', user?.id)
    console.log('🔍 USER COMPLETO:', user)
  
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      await loadUserProfile(user.id)
    }
    setLoading(false)
  }
  
  const loadUserProfile = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      setUserProfile(profile)
    } catch (error) {
      console.log('Erro ao carregar perfil:', error)
    }
  }
  
  const checkSubscriptionStatus = async () => {
    if (!user) return
    try {
      // 1. Buscar status local
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data && !error) {
        setSubscription(data)
        
        // 2. Sincronizar com Pagar.me se necessário
        // Sincroniza se: está em trial expirado OU não foi atualizado nas últimas 24h
        const lastUpdate = new Date(data.updated_at)
        const now = new Date()
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)
        
        const shouldSync = (
          (data.status === 'trial' && new Date() > new Date(data.trial_end_date)) ||
          hoursSinceUpdate > 24
        )
        
        if (shouldSync && data.pagarme_subscription_id) {
          console.log('🔄 Sincronizando status com Pagar.me...')
          try {
            const syncResponse = await fetch('/api/subscription/sync-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            })
            
            const syncResult = await syncResponse.json()
            
            if (syncResult.success && syncResult.updated) {
              console.log('✅ Status sincronizado! Novo status:', syncResult.new_status)
              // Recarregar dados atualizados
              setTimeout(() => checkSubscriptionStatus(), 1000)
            }
          } catch (syncError) {
            console.error('⚠️ Erro na sincronização:', syncError)
            // Continua com dados locais se sincronização falhar
          }
        }
      } else {
        setSubscription(null)
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assinatura:', error)
      setSubscription(null)
    }
  }

  const syncSubscriptionStatus = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/subscription/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ Status sincronizado com sucesso!')
        checkSubscriptionStatus() // Recarregar dados
      } else {
        alert('❌ Erro na sincronização: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Erro na sincronização manual:', error)
      alert('❌ Erro na sincronização: ' + error.message)
    }
  }
  
  const checkAgentConfig = async (connection) => {
    if (!user || !connection) {
        setAgentConfigured(false);
        return;
    }
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('user_id', user.id)
        .eq('connection_id', connection.id)
        .single()
      
      const isConfigured = !!data && !error;
      setAgentConfigured(isConfigured);
      
      // Atualiza o estado da conexão específica
      setConnections(prev => prev.map(c => 
        c.id === connection.id ? { ...c, agentConfigured: isConfigured } : c
      ));

    } catch (error) {
      setAgentConfigured(false);
      setConnections(prev => prev.map(c => 
        c.id === connection.id ? { ...c, agentConfigured: false } : c
      ));
    }
  }
  
  const loadDashboardStats = async (connection) => {
    if (!user || !connection) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch('/api/dashboard/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, connectionId: connection.id }),
      });
      const data = await response.json();
      
      if (data.success && data.stats) {
        setConnectionStats(prev => ({...prev, [connection.id]: data.stats}));
        setStats(data.stats); // Mantém o estado de stats para a UI atual
        setLastStatsUpdate(Date.now());
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
    setStatsLoading(false);
  }
  
  const checkWhatsAppStatus = async (connection) => {
    if (!user || !connection) return
    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, connectionId: connection.id }),
      })
      const data = await response.json()
      
      const newStatus = data.connected ? 'connected' : 'disconnected';
      setWhatsappStatus(newStatus);
      if (data.connected) {
          setConnecting(false);
          setQrCode(null);
      }

      // Atualiza o estado da conexão específica
      setConnections(prev => prev.map(c => 
          c.id === connection.id ? { ...c, status: newStatus, qrCode: null } : c
      ));

    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setWhatsappStatus('error');
      setConnections(prev => prev.map(c => 
          c.id === connection.id ? { ...c, status: 'error' } : c
      ));
    }
  }
  
  const connectWhatsApp = async (connection) => {
    const targetConnection = connection || activeConnection;
    
    // Verificar se tem assinatura ativa ou trial válido
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trial')) {
      setShowCheckoutModal(true)
      return
    }
    
    // Se trial expirado, mostrar checkout sem trial
    if (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)) {
      setShowCheckoutModal(true)
      return
    }
    
    if (targetConnection) {
        await proceedWithWhatsAppConnection(targetConnection);
    } else {
        // Se não houver conexão, pode ser um slot vazio para ativar.
        alert("Selecione ou ative uma conexão primeiro.");
    }
  }
  
  const proceedWithWhatsAppConnection = async (connection) => {
    setConnecting(true)
    setQrCode(null)
    try {
      const response = await fetch('/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, connectionId: connection.id }),
      })
      const data = await response.json()
      
      if (data.success) {
        if (data.qrCode) {
          setQrCode(data.qrCode)
          setWhatsappStatus('pending_qr')

          setConnections(prev => prev.map(c =>
            c.id === connection.id ? { ...c, status: 'pending_qr', qrCode: data.qrCode } : c
          ));
          
          const checkInterval = setInterval(async () => {
            const statusResponse = await fetch('/api/whatsapp/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, connectionId: connection.id }),
            })
            const statusData = await statusResponse.json()
            
            if (statusData.connected) {
              setWhatsappStatus('connected');
              setConnecting(false);
              setQrCode(null);
              clearInterval(checkInterval);
              
              setConnections(prev => prev.map(c =>
                c.id === connection.id ? { ...c, status: 'connected', qrCode: null } : c
              ));

              setTimeout(() => loadDashboardStats(connection), 2000);
            }
          }, 3000)
          
          setTimeout(() => {
            clearInterval(checkInterval)
            // Re-verifica o status após o timeout
            const currentConn = connections.find(c => c.id === connection.id);
            if (currentConn && currentConn.status !== 'connected') {
                setConnecting(false);
                setQrCode(null);
                setWhatsappStatus('disconnected');
                setConnections(prev => prev.map(c => 
                    c.id === connection.id ? { ...c, status: 'disconnected', qrCode: null } : c
                ));
            }
          }, 60000)
          
        } else {
          alert('QR Code não foi gerado. Tente novamente.')
          setConnecting(false)
        }
      } else {
        alert('Erro ao gerar QR Code: ' + (data.error || 'Erro desconhecido'))
        setConnecting(false)
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error)
      alert('Erro ao conectar WhatsApp: ' + error.message)
      setConnecting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
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
  
  const getSubscriptionStatus = () => {
    if (!subscription) return 'none'
    
    // 🔍 DEBUG - ADICIONE ISSO TEMPORARIAMENTE
    console.log('🔍 DEBUG SUBSCRIPTION:', {
      status: subscription.status,
      trial_end_date: subscription.trial_end_date,
      current_date: new Date().toISOString(),
      is_trial_expired: subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)
    })
    
    if (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)) {
      return 'expired'
    }
    return subscription.status
  }

  // FUNÇÕES CORRIGIDAS COM PRICING TABLES LOCAIS
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
  
  // Verificar se o usuário já usou trial antes
  const hasUsedTrial = () => {
    if (!subscription) return false
    
    // Se tem uma subscription (mesmo cancelada/expirada), já usou trial
    return subscription.status === 'canceled' || 
           subscription.status === 'expired' || 
           (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date))
  }
  
  // Verificar se deve mostrar trial ou pagamento direto
  const shouldShowTrial = () => {
    // Não mostra trial se for upgrade
    if (subscription && selectedPlan.connections > subscription.connections_purchased) {
        return false;
    }
    return !hasUsedTrial()
  }
  
  const getStatusColor = () => {
    switch (whatsappStatus) {
      case 'connected': return 'bg-[#04F5A0]/20 text-[#04F5A0] border-[#04F5A0]/30'
      case 'pending_qr': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }
  
  const getStatusText = () => {
    switch (whatsappStatus) {
      case 'connected': return '🟢 Conectado'
      case 'pending_qr': return '🟡 Aguardando QR'
      case 'error': return '🔴 Erro'
      default: return '🔴 Desconectado'
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
          <p className="text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    )
  }
  
  const subscriptionStatus = getSubscriptionStatus()
  
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
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
      <header className="relative z-30 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center group">
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                <div className="w-6 h-6 bg-[#04F5A0] rounded-sm opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(4,245,160,0.6)]"
                     style={{
                       clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                     }}
                />
              </div>
              <h1 className="text-xl font-bold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                SwiftBot Dashboard
              </h1>
            </div>
            
            {user && userProfile && (
              <AccountDropdown user={user} userProfile={userProfile} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-2">
            Bem-vindo de volta! 🎉
          </h2>
          <p className="text-gray-400">
            Gerencie seu chatbot WhatsApp com inteligência artificial
          </p>
        </div>
        
        {/* Banner de Status da Assinatura */}
        {subscription && (
          <div className={`mb-8 p-6 rounded-3xl relative overflow-hidden ${
            subscriptionStatus === 'active' ? 'bg-black/30 backdrop-blur-xl border border-[#04F5A0]/30' :
            subscriptionStatus === 'trial' ? 'bg-black/30 backdrop-blur-xl border border-blue-500/30' :
            'bg-black/30 backdrop-blur-xl border border-red-500/30'
          }`}>
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl animate-pulse ${
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/40' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/40' :
                'bg-red-500/40'
              }`}></div>
              <div className={`absolute bottom-0 right-0 w-24 h-24 rounded-full blur-xl animate-pulse ${
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/30' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/30' :
                'bg-red-500/30'
              }`} style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  subscriptionStatus === 'active' ? 'text-[#04F5A0]' :
                  subscriptionStatus === 'trial' ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {subscriptionStatus === 'active' ? '💎 Plano Ativo' :
                   subscriptionStatus === 'trial' ? '🔥 Trial Ativo' :
                   '⚠️ Plano Expirado'}
                </h3>
                <p className="text-gray-300">
                  {subscriptionStatus === 'active' ?
                    `${subscription.connections_purchased} conexão(ões) • Próxima cobrança: ${new Date(subscription.next_billing_date).toLocaleDateString()}` :
                    subscriptionStatus === 'trial' ?
                    `Trial expira em: ${new Date(subscription.trial_end_date).toLocaleDateString()}` :
                    'Renove seu plano para continuar usando o SwiftBot'
                  }
                </p>
              </div>
              {subscriptionStatus === 'expired' ? (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="bg-[#04F5A0] hover:bg-[#03E691] text-black px-6 py-2 rounded-xl font-bold transition-all duration-300 relative z-50"
                >
                  Renovar Plano
                </button>
              ) : (
                <button onClick={syncSubscriptionStatus} title="Sincronizar status da assinatura" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-2 rounded-full transition-all duration-300 relative z-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Seletor de Conexões */}
        <div className="mb-8 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 right-0 w-32 h-32 bg-pink-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-violet-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Suas Conexões WhatsApp</h3>
                    {subscription?.status === 'active' && connections.length < subscription?.connections_purchased && (
                    <button onClick={handleAddConnection} className="bg-[#04F5A0] hover:bg-[#03E691] text-black px-4 py-2 rounded-xl font-bold transition-all duration-300 text-sm relative z-50">
                        + Nova Conexão
                    </button>
                    )}
                     {subscription?.status === 'active' && connections.length >= subscription?.connections_purchased && (
                    <button onClick={handleUpgradeConnections} className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-xl font-bold transition-all duration-300 text-sm relative z-50">
                        + Fazer Upgrade
                    </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: subscription?.connections_purchased || 1}).map((_, index) => {
                        const connection = connections.find(c => c.connection_number === index + 1);
                        return (
                            <ConnectionCard 
                                key={index} 
                                connectionIndex={index}
                                connection={connection}
                                isActive={activeConnection?.connection_number === index + 1}
                                onSelect={() => handleConnectionSelect(index)}
                                onConnect={(conn) => connectWhatsApp(conn || connection)}
                                onConfigure={(conn) => router.push(`/agent-config?connectionId=${(conn || activeConnection).id}`)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
        
        {/* Seção de Estatísticas */}
        <div className="mb-8 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#04F5A0]/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                📊 Estatísticas da Conexão {activeConnection?.connection_number || ''}
                {statsLoading && (
                  <div className="ml-2 animate-spin rounded-full h-5 w-5 border-b-2 border-[#04F5A0]"></div>
                )}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { value: stats.mensagensHoje, label: 'Mensagens Hoje', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { value: stats.conversasAtivas, label: 'Conversas Ativas', color: 'text-[#04F5A0]', bg: 'bg-[#04F5A0]/10' },
                { value: `${stats.taxaResposta}%`, label: 'Taxa de Resposta', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { value: stats.clientesAtendidos, label: 'Clientes Atendidos', color: 'text-orange-400', bg: 'bg-orange-500/10' }
              ].map((stat, index) => (
                <div key={index} className={`${stat.bg} backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-[#04F5A0]/30 transition-all duration-300 group relative overflow-hidden`}>
                  {/* Individual Animated Background Effects */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className={`absolute top-0 right-0 w-12 h-12 ${stat.bg.replace('/10', '/20')} rounded-full blur-lg animate-pulse`}></div>
                    <div className={`absolute bottom-0 left-0 w-8 h-8 ${stat.bg.replace('/10', '/15')} rounded-full blur-md animate-pulse`} style={{animationDelay: '0.7s'}}></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`text-3xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      {(statsLoading || !activeConnection) ? '...' : stat.value}
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {whatsappStatus !== 'connected' && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-yellow-400 text-center">
                  💡 Conecte a conexão selecionada para ver estatísticas em tempo real
                </p>
              </div>
            )}
            {lastStatsUpdate && (
              <div className="mt-3 text-xs text-gray-500 text-center">
                Última atualização: {new Date(lastStatsUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        {/* Cards do Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card WhatsApp */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-500 group lg:col-span-1 relative overflow-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-28 h-28 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-[#04F5A0]/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">Conexão Ativa: {activeConnection?.connection_number || 'N/A'}</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📱</span>
              </div>
              <div className="mb-4">
                {!activeConnection ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-400 border border-white/20">
                    Selecione uma conexão
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 ${
                    whatsappStatus === 'connected' ? 'text-[#04F5A0] border-[#04F5A0]/30 bg-[#04F5A0]/10' :
                    whatsappStatus === 'pending_qr' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                    'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}>
                    {getStatusText()}
                  </span>
                )}
              </div>
              
              {qrCode && (
                <div className="mb-4 p-4 bg-black/20 backdrop-blur-sm rounded-2xl text-center border border-white/10 relative overflow-hidden">
                  {/* QR Code Background Effect */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#04F5A0]/20 rounded-full blur-md animate-pulse"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-sm text-gray-300 mb-3">Escaneie o QR Code com seu WhatsApp:</p>
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="mx-auto max-w-48 max-h-48 border border-[#04F5A0]/30 rounded-xl"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Abra o WhatsApp → Menu → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                </div>
              )}
              
              {whatsappStatus === 'connected' ? (
                <div className="text-center">
                  <div className="text-[#04F5A0] text-sm mb-3">✅ WhatsApp conectado com sucesso!</div>
                  <button
                    onClick={() => checkWhatsAppStatus(activeConnection)}
                    className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-white/20 relative z-50"
                  >
                    🔄 Verificar Status
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectWhatsApp(activeConnection)}
                  disabled={connecting || !activeConnection}
                  className="w-full bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)] flex items-center justify-center relative z-50"
                >
                  {connecting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Conectando...
                    </div>
                  ) : (
                    subscriptionStatus === 'none' || subscriptionStatus === 'expired' ?
                    '💳 Ativar Plano' :
                    '📱 Conectar WhatsApp'
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Card Agente IA */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-500 group relative overflow-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">Agente IA (Conexão {activeConnection?.connection_number || 'N/A'})</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🤖</span>
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
                Configure a personalidade do bot para a conexão ativa.
              </p>
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                  agentConfigured
                    ? 'bg-[#04F5A0]/10 text-[#04F5A0] border-[#04F5A0]/30'
                    : 'bg-white/10 text-gray-400 border-white/20'
                }`}>
                  {agentConfigured ? '✅ Configurado' : '⏳ Não configurado'}
                </span>
              </div>
              <button
                onClick={() => {
                  if(activeConnection) {
                      router.push(`/agent-config?connectionId=${activeConnection.id}`)
                  } else {
                      alert("Por favor, selecione uma conexão primeiro.")
                  }
                }}
                disabled={!activeConnection}
                className="w-full bg-blue-600/60 backdrop-blur-sm hover:bg-blue-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] border border-blue-500/30 relative z-50"
              >
                ⚙️ {agentConfigured ? 'Editar' : 'Configurar'} Agente
              </button>
            </div>
          </div>

          {/* Card Chat */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-500 group relative overflow-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-28 h-28 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-pink-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">Bate-Papo</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">💬</span>
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
                Visualize conversas em tempo real
              </p>
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 backdrop-blur-sm">
                  {activeConnection ? `${stats.conversasAtivas} conversas hoje` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-white/5 backdrop-blur-sm border border-purple-500/30 text-purple-300 font-medium py-3 px-4 rounded-xl text-center relative z-50">
                🚀 Em breve
              </div>
            </div>
          </div>
          
        </div>
      </main>
      
      {/* 💳 MODAL DE CHECKOUT COM CPF E ENDEREÇO */}
      {showCheckoutModal && (
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
          
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg lg:max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(4,245,160,0.15)] z-[70]">
            
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-1/2 right-0 w-56 h-56 bg-pink-500/35 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-0 left-1/3 w-52 h-52 bg-violet-500/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Step 1: Seleção de Plano */}
            {checkoutStep === 'plan' && (
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-black rounded-sm"
                         style={{
                           clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                         }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {shouldShowTrial() ? '🔥 Trial Grátis' : '💳 Ativar ou Fazer Upgrade'}
                  </h2>
                  <p className="text-gray-400">
                    {shouldShowTrial() 
                      ? 'Teste todos os recursos sem compromisso' 
                      : 'Ative ou adicione mais conexões ao seu plano'
                    }
                  </p>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-1 flex border border-white/20">
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
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                  <div className="text-center mb-4">
                    {shouldShowTrial() ? (
                      <>
                        <div className="text-5xl font-bold text-[#04F5A0] mb-2">
                          R$ 0,00
                        </div>
                        <div className="text-sm text-gray-400 mb-3">
                          por 1 dia
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
                          🎉 Economize {calculateAnnualDiscount()}% no plano anual!
                        </div>
                      </>
                    )}
                    
                    {!shouldShowTrial() && (
                      <div className="text-red-400 text-sm font-medium mt-2">
                        ⚠️ Trial já utilizado ou modo de upgrade - Cobrança imediata
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-yellow-400 text-sm font-medium mb-2">
                      {shouldShowTrial() 
                        ? '🎉 Trial completo e sem compromisso' 
                        : '💎 Acesso completo aos recursos'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {shouldShowTrial() 
                        ? 'Cancele a qualquer momento durante o trial'
                        : 'Cancele a qualquer momento'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">✅ Incluído no plano:</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>• Inteligência Artificial GPT-4</div>
                    <div>• Dashboard de análise em tempo real</div>
                    <div>• Configuração de personalidade do agente</div>
                    <div>• Sistema de qualificação e objeções</div>
                    <div>• Suporte técnico via chat</div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setCheckoutStep('payment')}
                    className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)]"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Dados do Cartão COM CPF E ENDEREÇO */}
            {checkoutStep === 'payment' && (
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Dados do Cartão</h2>
                  <p className="text-gray-400">Checkout seguro e criptografado</p>
                </div>
                
                {/* DESTAQUE DO VALOR FINAL */}
                <div className="bg-gradient-to-r from-[#04F5A0]/10 to-orange-500/10 border border-[#04F5A0]/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
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
                          <div className="text-xs text-gray-400">por 1 dia</div>
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
                                🎉 Economize {calculateAnnualDiscount()}% vs mensal
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
                
                <form onSubmit={handleTokenizedSubmit}>
                  <div className="space-y-4 mb-6">
                    {/* Campos do Cartão */}
                    <div>
                      <label htmlFor="card_holder_name" className="block text-sm font-medium text-gray-300 mb-2">Nome no Cartão</label>
                      <input type="text" id="card_holder_name" name="card_holder_name" required className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" />
                    </div>
                    <div>
                      <label htmlFor="card_number" className="block text-sm font-medium text-gray-300 mb-2">Número do Cartão</label>
                      <input type="text" id="card_number" name="card_number" required placeholder="0000 0000 0000 0000" className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="card_expiration_month" className="block text-sm font-medium text-gray-300 mb-2">Mês</label>
                        <input type="text" id="card_expiration_month" name="card_expiration_month" required placeholder="MM" maxLength="2" className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" />
                      </div>
                      <div>
                        <label htmlFor="card_expiration_year" className="block text-sm font-medium text-gray-300 mb-2">Ano</label>
                        <input type="text" id="card_expiration_year" name="card_expiration_year" required placeholder="AA" maxLength="2" className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" />
                      </div>
                      <div>
                        <label htmlFor="card_cvv" className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                        <input type="text" id="card_cvv" name="card_cvv" required placeholder="123" maxLength="4" className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" />
                      </div>
                    </div>

                    {/* ✅ CAMPO: CPF */}
                    <div>
                      <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-2">
                        CPF <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        placeholder="000.000.000-00"
                        maxLength="14"
                        required
                        className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          value = value.replace(/(\d{3})(\d)/, '$1.$2')
                          value = value.replace(/(\d{3})(\d)/, '$1.$2')
                          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                          e.target.value = value
                        }}
                      />
                    </div>

                    {/* ✅ CAMPOS DE ENDEREÇO */}
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-gray-300 mb-4">🏠 Endereço de Cobrança</h4>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-300 mb-2">
                            CEP <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="zipcode"
                            name="zipcode"
                            placeholder="00000-000"
                            maxLength="9"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                            onChange={async (e) => {
                              let value = e.target.value.replace(/\D/g, '')
                              value = value.replace(/(\d{5})(\d)/, '$1-$2')
                              e.target.value = value
                              
                              if (value.replace(/\D/g, '').length === 8) {
                                const addressData = await fetchAddressByCEP(value)
                                if (addressData) {
                                  document.getElementById('state').value = addressData.state
                                  document.getElementById('city').value = addressData.city
                                  document.getElementById('neighborhood').value = addressData.neighborhood
                                  document.getElementById('street').value = addressData.street
                                }
                              }
                            }}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                            Estado <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            placeholder="SP"
                            maxLength="2"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300 uppercase"
                            onChange={(e) => {
                              e.target.value = e.target.value.toUpperCase()
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                            Cidade <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            placeholder="São Paulo"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-300 mb-2">
                            Bairro <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="neighborhood"
                            name="neighborhood"
                            placeholder="Centro"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="col-span-2">
                          <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-2">
                            Rua <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="street"
                            name="street"
                            placeholder="Rua das Flores"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="street_number" className="block text-sm font-medium text-gray-300 mb-2">
                            Número <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            id="street_number"
                            name="street_number"
                            placeholder="123"
                            required
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                          />
                        </div>
                      </div>

                       <div>
                          <label htmlFor="complementary" className="block text-sm font-medium text-gray-300 mb-2">
                            Complemento
                          </label>
                          <input
                            type="text"
                            id="complementary"
                            name="complementary"
                            placeholder="Apto 101, Bloco B"
                            className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                          />
                        </div>
                    </div>

                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('plan')}
                      disabled={checkoutLoading}
                      className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-white/20"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 disabled:cursor-not-allowed text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)]"
                    >
                      {checkoutLoading ? 'Processando...' : (shouldShowTrial() ? 'Ativar Trial Grátis' : 'Pagar e Ativar')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Step 3: Processing */}
            {checkoutStep === 'processing' && (
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Processando Pagamento</h2>
                <p className="text-gray-400">Por favor, aguarde. Não feche esta janela.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}