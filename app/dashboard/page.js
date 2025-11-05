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
        className="flex items-center space-x-3 bg-black/30 backdrop-blur-xl hover:bg-black/40 rounded-xl px-3 py-2 transition-all duration-300 border border-white/10 hover:border-[#04F5A0]/30 relative overflow-hidden z-[210]"
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
            className="fixed inset-0 z-[220]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-[230] overflow-hidden">
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
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/profile')
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl transition-colors duration-200 flex items-center space-x-3 text-gray-300 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors duration-200 flex items-center space-x-3 text-gray-300 hover:text-red-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ====================================================================
// MODAL DE QR CODE GRANDE
// ====================================================================
const QRCodeModal = ({ qrCode, onClose }) => {
  if (!qrCode) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#04F5A0]/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
        
        {/* Botão X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Conteúdo */}
        <div className="relative z-10 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            📱 Conectar WhatsApp
          </h3>
          <p className="text-gray-400 mb-6">
            Escaneie o QR Code com seu WhatsApp
          </p>
          
          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 mb-4 inline-block">
            <img
              src={qrCode}
              alt="QR Code WhatsApp"
              className="w-64 h-64"
            />
          </div>
          
          {/* Instruções */}
          <div className="bg-[#04F5A0]/10 border border-[#04F5A0]/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-gray-300 mb-2 font-medium">
              📲 Como conectar:
            </p>
            <ol className="text-xs text-gray-400 space-y-1 text-left">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Toque em Menu (⋮) ou Configurações</li>
              <li>3. Toque em "Aparelhos conectados"</li>
              <li>4. Toque em "Conectar um aparelho"</li>
              <li>5. Aponte a câmera para este QR Code</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 🆕 DROPDOWN DE CONEXÕES
// ====================================================================
const ConnectionsDropdown = ({ connections, activeConnection, subscription, onSelect, onConnect, onConfigure, onUpgrade, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getStatusText = (connection) => {
    if (!connection) return '🔴 Inativa';
    switch (connection.status) {
      case 'connected': return '🟢 Conectado';
      case 'pending_qr': return '🟡 Aguardando QR';
      case 'error': return '🔴 Erro';
      default: return '🔴 Desconectado';
    }
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const totalSlots = subscription?.connections_purchased || 1;

return (
    <div className="relative z-[240]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 hover:border-[#04F5A0]/30 transition-all duration-300 group relative w-full"
      >  
        {/* Animated Background Effects */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-pink-500/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📱</span>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                Suas Conexões
              </h3>
              <p className="text-sm text-gray-400">
                {connectedCount} de {totalSlots} ativas
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown - AGORA COM Z-INDEX ALTO E SEM OVERFLOW */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[250]" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full mt-2 left-0 right-0 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-[260] max-h-[400px] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white">
                  {connectedCount}/{totalSlots} Conexões Ativas
                </h4>
                {subscription?.status === 'active' && connections.length < totalSlots && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onAddNew();
                    }}
                    className="text-xs bg-[#04F5A0] hover:bg-[#03E691] text-black px-3 py-1.5 rounded-lg font-bold transition-all duration-300"
                  >
                    + Nova
                  </button>
                )}
                {subscription?.status === 'active' && connections.length >= totalSlots && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onUpgrade();
                    }}
                    className="text-xs bg-orange-500 hover:bg-orange-400 text-black px-3 py-1.5 rounded-lg font-bold transition-all duration-300"
                  >
                    + Upgrade
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {Array.from({length: totalSlots}).map((_, index) => {
                  const connection = connections.find(c => c.connection_number === index + 1);
                  const isActive = activeConnection?.connection_number === index + 1;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (connection) {
                          onSelect(index);
                          setIsOpen(false);
                        }
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#04F5A0]/10 border border-[#04F5A0]/30' 
                          : 'bg-white/5 border border-white/10 hover:border-[#04F5A0]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${isActive ? 'text-[#04F5A0]' : 'text-white'}`}>
                            Conexão {index + 1}
                          </span>
                          {isActive && <div className="w-2 h-2 bg-[#04F5A0] rounded-full animate-pulse"></div>}
                        </div>
                        <span className="text-xs text-gray-400">
                          {getStatusText(connection)}
                        </span>
                      </div>
                      
                      {connection ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfigure(connection);
                              setIsOpen(false);
                            }}
                            className="flex-1 text-xs bg-blue-600/60 hover:bg-blue-600/80 text-white font-medium py-1.5 px-2 rounded-lg transition-all border border-blue-500/30"
                          >
                            Agente
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onConnect(connection);
                              setIsOpen(false);
                            }}
                            className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white font-medium py-1.5 px-2 rounded-lg transition-all border border-white/20"
                          >
                            {connection.status === 'connected' ? 'Status' : 'Conectar'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onAddNew();
                          }}
                          className="w-full text-xs bg-[#04F5A0]/20 hover:bg-[#04F5A0]/30 text-[#04F5A0] font-medium py-1.5 px-2 rounded-lg transition-all border border-[#04F5A0]/30"
                        >
                          + Adicionar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
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
  
  // 🆕 Estado para controlar o modal do QR Code
  const [showQRModal, setShowQRModal] = useState(false)
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // 💳 Estados para checkout
  const [subscription, setSubscription] = useState(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({
    connections: 1,
    billingPeriod: 'annual'
  })
  const [checkoutStep, setCheckoutStep] = useState('plan')
  
  // 🆕 Estados para Stripe Elements
  const [stripeElements, setStripeElements] = useState(null)
  const [cardElement, setCardElement] = useState(null)
  
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

  // ============================================================================
  // 1. CARREGAR STRIPE.JS E INICIALIZAR ELEMENTS
  // ============================================================================
  useEffect(() => {
    if (!window.Stripe && !document.querySelector('script[src*="stripe"]')) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.onload = () => {
        console.log('✅ Stripe.js carregado')
        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
          console.log('✅ Stripe inicializado')
        } else {
          console.error("❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não encontrada")
        }
      }
      script.onerror = () => {
        console.error("❌ Erro ao carregar Stripe.js")
      }
      document.head.appendChild(script)
    } else if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !window.stripeInstance) {
      window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      console.log('✅ Stripe inicializado (já estava carregado)')
    }
  }, [])

  // ============================================================================
  // 2. CRIAR STRIPE ELEMENTS QUANDO MODAL ABRE
  // ============================================================================
  useEffect(() => {
    if (showCheckoutModal && checkoutStep === 'payment' && window.stripeInstance && !stripeElements) {
      console.log('🎨 Criando Stripe Elements...')
      
      const elements = window.stripeInstance.elements()
      setStripeElements(elements)
      
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => {
        const cardElementContainer = document.getElementById('card-element')
        if (cardElementContainer) {
          const card = elements.create('card', {
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#9ca3af',
                },
                backgroundColor: 'transparent',
              },
              invalid: {
                color: '#ef4444',
              },
            },
          })
          
          card.mount('#card-element')
          setCardElement(card)
          console.log('✅ Stripe Card Element montado')
          
          // Event listener para erros
          card.on('change', (event) => {
            const displayError = document.getElementById('card-errors')
            if (event.error) {
              displayError.textContent = event.error.message
            } else {
              displayError.textContent = ''
            }
          })
        }
      }, 100)
    }
    
    // Cleanup quando modal fecha
    return () => {
      if (cardElement) {
        cardElement.unmount()
        setCardElement(null)
      }
      if (stripeElements) {
        setStripeElements(null)
      }
    }
  }, [showCheckoutModal, checkoutStep])

  // ============================================================================
  // 3. ATUALIZAR handleTokenizedSubmit PARA USAR STRIPE ELEMENTS
  // ============================================================================
  const handleTokenizedSubmit = async (e) => {
    e.preventDefault()
    setCheckoutLoading(true)
    setCheckoutStep('processing')

    let subscriptionCreated = null

    try {
      if (!window.stripeInstance) {
        throw new Error('Stripe.js não carregado')
      }

      if (!cardElement) {
        throw new Error('Stripe Card Element não inicializado')
      }

      console.log('🔐 Criando Payment Method com Stripe Elements...')

      // ✅ CRIAR PAYMENT METHOD COM STRIPE ELEMENTS
      const { paymentMethod, error } = await window.stripeInstance.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: document.getElementById('card_holder_name')?.value,
          email: user.email,
        },
      })

      if (error) {
        console.error('❌ Erro ao criar Payment Method:', error)
        throw new Error(error.message)
      }

      console.log('✅ Payment Method criado:', paymentMethod.id)

      // ✅ ENVIAR APENAS O TOKEN PARA O BACKEND
      const isUpgrade = subscription && selectedPlan.connections > subscription.connections_purchased
      const apiEndpoint = isUpgrade 
        ? '/api/checkout/upgrade-subscription' 
        : '/api/checkout/create-subscription'

      const payload = {
        userId: user.id,
        plan: selectedPlan,
        paymentMethodId: paymentMethod.id,
        userEmail: user.email,
        userName: userProfile?.full_name || user.email.split('@')[0],
        ...(isUpgrade && { subscriptionId: subscription.stripe_subscription_id })
      }

      console.log('📤 Enviando para backend:', {
        ...payload,
        paymentMethodId: paymentMethod.id.substring(0, 10) + '****'
      })

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        subscriptionCreated = data.subscription
        setSubscription(data.subscription)
        setShowCheckoutModal(false)
        setCheckoutStep('plan')
        
        const message = data.is_trial 
          ? `🎉 Trial de ${data.trial_days} dia${data.trial_days > 1 ? 's' : ''} ativado com sucesso!`
          : isUpgrade
          ? `🚀 Upgrade realizado com sucesso! Total de conexões: ${selectedPlan.connections}`
          : `💳 Plano ativado! Cobrado R$ ${data.amount_charged ? data.amount_charged.toFixed(2) : '0.00'}`
          
        alert(message)
        
        await loadUserConnections()

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
  
  // Funções de Gerenciamento de Conexão
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
    if (connections.length < subscription?.connections_purchased) {
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
    setSelectedPlan({
        ...selectedPlan,
        connections: subscription.connections_purchased + 1
    });
    setCheckoutStep('plan');
    setShowCheckoutModal(true);
  };
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
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
      // 🆕 SUPER ACCOUNT CHECK - PRIORIDADE MÁXIMA
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_super_account')
        .eq('user_id', user.id)
        .single()
      
      if (profile?.is_super_account) {
        console.log('👑 SUPER ACCOUNT DETECTADA - Bypass total')
        
        const fakeSubscription = {
          id: 'super-account-fake-id',
          user_id: user.id,
          status: 'active',
          connections_purchased: 7,
          billing_period: 'annual',
          trial_end_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: 'super_account_bypass', 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setSubscription(fakeSubscription)
        return
      }
      
      // Continua com a lógica normal para usuários não-super
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data && !error) {
        setSubscription(data)
        
        const lastUpdate = new Date(data.updated_at)
        const now = new Date()
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)
        
        const shouldSync = (
          (data.status === 'trial' && new Date() > new Date(data.trial_end_date)) ||
          hoursSinceUpdate > 24
        )
        
        if (shouldSync && data.stripe_subscription_id) { 
          try {
            const syncResponse = await fetch('/api/subscription/sync-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            })
            
            const syncResult = await syncResponse.json()
            
            if (syncResult.success && syncResult.updated) {
              setTimeout(() => checkSubscriptionStatus(), 1000)
            }
          } catch (syncError) {
            console.error('⚠️ Erro na sincronização:', syncError)
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
        checkSubscriptionStatus()
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
        setStats(data.stats);
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
          setShowQRModal(false);
      }

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
    
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trial')) {
      setShowCheckoutModal(true)
      return
    }
    
    if (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)) {
      setShowCheckoutModal(true)
      return
    }
    
    if (targetConnection) {
        await proceedWithWhatsAppConnection(targetConnection);
    } else {
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
          setShowQRModal(true)
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
              setShowQRModal(false);
              clearInterval(checkInterval);
              
              setConnections(prev => prev.map(c =>
                c.id === connection.id ? { ...c, status: 'connected', qrCode: null } : c
              ));

              setTimeout(() => loadDashboardStats(connection), 2000);
            }
          }, 3000)
          
          setTimeout(() => {
            clearInterval(checkInterval)
            setConnecting(false)
          }, 120000)
        } else {
          setConnecting(false);
          setWhatsappStatus('connected');
          setConnections(prev => prev.map(c =>
            c.id === connection.id ? { ...c, status: 'connected' } : c
          ));
        }
      } else {
        setConnecting(false);
        alert('Erro ao gerar QR Code: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error)
      setConnecting(false)
      alert('Erro ao conectar: ' + error.message)
    }
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  const calculatePrice = () => {
    const connections = selectedPlan.connections;
    const basePrice = {
      monthly: { 1: 165, 2: 295, 3: 395, 4: 490, 5: 575, 6: 650, 7: 715 },
      annual: { 1: 148, 2: 265, 3: 355, 4: 441, 5: 518, 6: 585, 7: 644 }
    };
    return basePrice[selectedPlan.billingPeriod][connections] || 0;
  };

  const calculateAnnualTotal = () => {
    return calculatePrice() * 12;
  };

  const calculateAnnualDiscount = () => {
    const monthly = calculatePrice();
    const annual = monthly * 12;
    const annualPrice = calculateAnnualTotal();
    return Math.round(((annual - annualPrice) / annual) * 100);
  };

  const hasDiscount = () => {
    const discountMap = { 1: 0, 2: 10, 3: 20, 4: 25, 5: 30, 6: 35, 7: 39 };
    return discountMap[selectedPlan.connections] || 0;
  };

  const shouldShowTrial = () => {
    return !subscription || !subscription.has_used_trial;
  };

  const getStatusText = () => {
    switch (whatsappStatus) {
      case 'connected': return '🟢 Conectado';
      case 'pending_qr': return '🟡 Aguardando QR';
      case 'error': return '🔴 Erro';
      default: return '🔴 Desconectado';
    }
  };

  const subscriptionStatus = subscription
    ? subscription.stripe_subscription_id === 'super_account_bypass'
      ? 'active'
      : subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)
      ? 'expired'
      : subscription.status
    : 'none';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#04F5A0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Elementos de fundo animados */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-[#04F5A0]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>
      
      {/* Efeito de cursor */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.06), transparent 40%)`
        }}
      />
      
      {/* Modal QR Code */}
      {showQRModal && <QRCodeModal qrCode={qrCode} onClose={() => setShowQRModal(false)} />}
      
      {/* Header/Navbar */}
      <div className="relative z-20 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/dashboard')}>
              <div className="w-12 h-12 bg-[#04F5A0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="w-6 h-6 bg-black rounded-sm relative z-10"
                     style={{
                       clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                     }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#04F5A0] to-white bg-clip-text text-transparent">
                  SwiftBot
                </h1>
                <p className="text-xs text-gray-400">Seu chatbot inteligente</p>
              </div>
            </div>
            
            {/* Account Dropdown */}
            <AccountDropdown 
              user={user} 
              userProfile={userProfile} 
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-20 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#04F5A0] to-white bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-gray-400">
            Gerencie seu chatbot WhatsApp com inteligência artificial
          </p>
        </div>
        
        {/* Banner de Status da Assinatura */}
        {subscription && (
          <div className={`mb-8 p-6 rounded-3xl relative overflow-hidden ${
            subscription.stripe_subscription_id === 'super_account_bypass' ? 'bg-black/30 backdrop-blur-xl border border-purple-500/30' :
            subscriptionStatus === 'active' ? 'bg-black/30 backdrop-blur-xl border border-[#04F5A0]/30' :
            subscriptionStatus === 'trial' ? 'bg-black/30 backdrop-blur-xl border border-blue-500/30' :
            'bg-black/30 backdrop-blur-xl border border-red-500/30'
          }`}>
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl animate-pulse ${
                subscription.stripe_subscription_id === 'super_account_bypass' ? 'bg-purple-500/40' :
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/40' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/40' :
                'bg-red-500/40'
              }`}></div>
              <div className={`absolute bottom-0 right-0 w-24 h-24 rounded-full blur-xl animate-pulse ${
                subscription.stripe_subscription_id === 'super_account_bypass' ? 'bg-purple-500/30' :
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/30' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/30' :
                'bg-red-500/30'
              }`} style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-20 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  subscription.stripe_subscription_id === 'super_account_bypass' ? 'text-purple-400' :
                  subscriptionStatus === 'active' ? 'text-[#04F5A0]' :
                  subscriptionStatus === 'trial' ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {subscription.stripe_subscription_id === 'super_account_bypass' ? '👑 Super Account' :
                   subscriptionStatus === 'active' ? '💎 Plano Ativo' :
                   subscriptionStatus === 'trial' ? '🔥 Trial Ativo' :
                   '⚠️ Plano Expirado'}
                </h3>
                <p className="text-gray-300">
                  {subscription.stripe_subscription_id === 'super_account_bypass' ?
                    `${subscription.connections_purchased} conexão(ões) • Acesso supremo ilimitado` :
                    subscriptionStatus === 'active' ?
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
              ) : subscription.stripe_subscription_id !== 'super_account_bypass' ? (
                <button onClick={syncSubscriptionStatus} title="Sincronizar status da assinatura" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-2 rounded-full transition-all duration-300 relative z-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>
                </button>
              ) : null}
            </div>
          </div>
        )}
        
        {/* Cards do Dashboard - AGORA EM GRID COM DROPDOWN INTEGRADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 relative z-20">
          
{/* Card WhatsApp (Conexão Ativa) - COM DROPDOWN INTEGRADO */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-500 group relative overflow-visible">
            <div className="absolute inset-0 opacity-40 pointer-events-none rounded-2xl">
              <div className="absolute top-0 left-0 w-28 h-28 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-[#04F5A0]/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none rounded-2xl"></div>
            
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">
                  Conexão Ativa
                </h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📱</span>
              </div>
              
              {/* 🆕 DROPDOWN DE CONEXÕES INTEGRADO */}
              <div className="mb-4">
                <ConnectionsDropdown
                  connections={connections}
                  activeConnection={activeConnection}
                  subscription={subscription}
                  onSelect={handleConnectionSelect}
                  onConnect={connectWhatsApp}
                  onConfigure={(conn) => router.push(`/agent-config?connectionId=${conn.id}`)}
                  onUpgrade={handleUpgradeConnections}
                  onAddNew={handleAddConnection}
                />
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
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">Agente IA</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🤖</span>
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
                Configure a personalidade do bot
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
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-28 h-28 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-pink-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#04F5A0] transition-colors duration-300">Conversas</h3>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">💬</span>
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
                Histórico e análise de conversas
              </p>
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-400 border border-white/20 backdrop-blur-sm">
                  {statsLoading ? '🔄 Carregando...' : `📊 ${stats.conversasAtivas} ativas`}
                </span>
              </div>
              <button
                onClick={() => {
                  if(activeConnection) {
                      router.push(`/chat?connectionId=${activeConnection.id}`)
                  } else {
                      alert("Por favor, selecione uma conexão primeiro.")
                  }
                }}
                disabled={!activeConnection}
                className="w-full bg-purple-600/60 backdrop-blur-sm hover:bg-purple-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] border border-purple-500/30 relative z-50"
              >
                📱 Ver Conversas
              </button>
            </div>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#04F5A0]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
          
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">📊 Estatísticas Hoje</h3>
              {lastStatsUpdate && (
                <span className="text-xs text-gray-500">
                  Atualizado: {new Date(lastStatsUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Mensagens</div>
                <div className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.mensagensHoje}</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Conversas Ativas</div>
                <div className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.conversasAtivas}</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Taxa Resposta</div>
                <div className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.taxaResposta}%</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Clientes</div>
                <div className="text-2xl font-bold text-white">{statsLoading ? '...' : stats.clientesAtendidos}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de Checkout */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            onClick={() => !checkoutLoading && setShowCheckoutModal(false)}
          />
          
          {/* Efeito de cursor no modal */}
          <div 
            className="absolute inset-0 pointer-events-none z-[65] transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.1), transparent 40%)`
            }}
          />
          
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg lg:max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(4,245,160,0.15)] z-[70]">
            
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-1/2 right-0 w-56 h-56 bg-pink-500/35 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-0 left-1/3 w-52 h-52 bg-violet-500/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
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
            
            {/* Step 2: Dados do Cartão COM STRIPE ELEMENTS */}
            {checkoutStep === 'payment' && (
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Dados do Cartão</h2>
                  <p className="text-gray-400">Checkout seguro e criptografado via Stripe</p>
                </div>
                
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
                
                {/* FORMULÁRIO COM STRIPE ELEMENTS */}
                <form onSubmit={handleTokenizedSubmit}>
                  <div className="space-y-4 mb-6">
                    {/* Nome no Cartão */}
                    <div>
                      <label htmlFor="card_holder_name" className="block text-sm font-medium text-gray-300 mb-2">
                        Nome no Cartão
                      </label>
                      <input 
                        type="text" 
                        id="card_holder_name" 
                        name="card_holder_name" 
                        required 
                        className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300" 
                      />
                    </div>
                    
                    {/* Stripe Card Element */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dados do Cartão
                      </label>
                      <div 
                        id="card-element" 
                        className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 min-h-[44px] focus-within:border-[#04F5A0] transition-colors duration-300"
                      />
                      <div id="card-errors" className="text-red-400 text-sm mt-2"></div>
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