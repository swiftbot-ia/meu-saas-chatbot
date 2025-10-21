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

// ====================================================================
// 🆕 MODAL DE QR CODE GRANDE
// ====================================================================
const QRCodeModal = ({ qrCode, onClose }) => {
  if (!qrCode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop com blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(4,245,160,0.2)]">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#04F5A0]/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-500/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none rounded-3xl"></div>
        
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
                            onConnect(null, index);
                            setIsOpen(false);
                          }}
                          className="w-full text-center text-xs text-orange-400 font-semibold hover:text-orange-300"
                        >
                          Ativar Conexão
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

  // Carregar script do Pagar.me apenas quando necessário
  useEffect(() => {
    if (checkoutStep === 'payment' && showCheckoutModal) {
      loadPagarmeScript()
    }
  }, [checkoutStep, showCheckoutModal])

  const loadPagarmeScript = () => {
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

  const handleTokenizedSubmit = async (e) => {
    e.preventDefault()
    setCheckoutLoading(true)
    setCheckoutStep('processing')

    let subscriptionCreated = null

    try {
      const formData = new FormData(e.target)
      const cardData = {
        card_number: formData.get('card_number').replace(/\s/g, ''),
        card_holder_name: formData.get('card_holder_name'),
        card_expiration_month: formData.get('card_expiration_month'),
        card_expiration_year: formData.get('card_expiration_year'),
        card_cvv: formData.get('card_cvv'),
        cpf: formData.get('cpf').replace(/[^\d]/g, '')
      }

      const addressData = {
        zipcode: formData.get('zipcode').replace(/[^\d]/g, ''),
        state: formData.get('state'),
        city: formData.get('city'),
        neighborhood: formData.get('neighborhood'),
        street: formData.get('street'),
        street_number: formData.get('street_number'),
        complementary: formData.get('complementary') || ''
      }

      if (!validateCPF(cardData.cpf)) {
        throw new Error('CPF inválido. Por favor, verifique e tente novamente.')
      }

      if (!addressData.zipcode || !addressData.state || !addressData.city || 
          !addressData.neighborhood || !addressData.street || !addressData.street_number) {
        throw new Error('Todos os campos de endereço são obrigatórios.')
      }

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
          : `💳 Plano ativado! Cobrado R$ ${data.amount_charged.toFixed(2)}`
          
        alert(message)
        
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
        
        // Criar subscription fake para super account
        const fakeSubscription = {
          id: 'super-account-fake-id',
          user_id: user.id,
          status: 'active',
          connections_purchased: 7,
          billing_period: 'annual',
          trial_end_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          pagarme_subscription_id: 'super_account_bypass',
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
        
        if (shouldSync && data.pagarme_subscription_id) {
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
          setShowQRModal(false); // 🆕 Fecha o modal se conectou
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
          setShowQRModal(true) // 🆕 Abre o modal com QR grande
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
              setShowQRModal(false); // 🆕 Fecha o modal quando conectar
              clearInterval(checkInterval);
              
              setConnections(prev => prev.map(c =>
                c.id === connection.id ? { ...c, status: 'connected', qrCode: null } : c
              ));

              setTimeout(() => loadDashboardStats(connection), 2000);
            }
          }, 3000)
          
          setTimeout(() => {
            clearInterval(checkInterval)
            const currentConn = connections.find(c => c.id === connection.id);
            if (currentConn && currentConn.status !== 'connected') {
                setConnecting(false);
                setQrCode(null);
                setShowQRModal(false); // 🆕 Fecha o modal no timeout
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
    
    if (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date)) {
      return 'expired'
    }
    return subscription.status
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
  
  const hasUsedTrial = () => {
    if (!subscription) return false
    
    return subscription.status === 'canceled' || 
           subscription.status === 'expired' || 
           (subscription.status === 'trial' && new Date() > new Date(subscription.trial_end_date))
  }
  
  const shouldShowTrial = () => {
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
    <div className="min-h-screen bg-black relative">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0"
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}
        />
      </div>
      
      {/* Dynamic Gradient */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.08), transparent 40%)`
        }}
      />
      
      {/* 🆕 Modal do QR Code */}
      {showQRModal && (
        <QRCodeModal 
          qrCode={qrCode} 
          onClose={() => {
            setShowQRModal(false);
            setConnecting(false);
          }} 
        />
      )}
      
      {/* Header - STICKY COM POSITION FIXED */}
      <header className="sticky top-0 z-[200] bg-black/40 backdrop-blur-2xl border-b border-white/10 shadow-lg">
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
            subscription.pagarme_subscription_id === 'super_account_bypass' ? 'bg-black/30 backdrop-blur-xl border border-purple-500/30' :
            subscriptionStatus === 'active' ? 'bg-black/30 backdrop-blur-xl border border-[#04F5A0]/30' :
            subscriptionStatus === 'trial' ? 'bg-black/30 backdrop-blur-xl border border-blue-500/30' :
            'bg-black/30 backdrop-blur-xl border border-red-500/30'
          }`}>
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl animate-pulse ${
                subscription.pagarme_subscription_id === 'super_account_bypass' ? 'bg-purple-500/40' :
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/40' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/40' :
                'bg-red-500/40'
              }`}></div>
              <div className={`absolute bottom-0 right-0 w-24 h-24 rounded-full blur-xl animate-pulse ${
                subscription.pagarme_subscription_id === 'super_account_bypass' ? 'bg-purple-500/30' :
                subscriptionStatus === 'active' ? 'bg-[#04F5A0]/30' :
                subscriptionStatus === 'trial' ? 'bg-blue-500/30' :
                'bg-red-500/30'
              }`} style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-20 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  subscription.pagarme_subscription_id === 'super_account_bypass' ? 'text-purple-400' :
                  subscriptionStatus === 'active' ? 'text-[#04F5A0]' :
                  subscriptionStatus === 'trial' ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {subscription.pagarme_subscription_id === 'super_account_bypass' ? '👑 Super Account' :
                   subscriptionStatus === 'active' ? '💎 Plano Ativo' :
                   subscriptionStatus === 'trial' ? '🔥 Trial Ativo' :
                   '⚠️ Plano Expirado'}
                </h3>
                <p className="text-gray-300">
                  {subscription.pagarme_subscription_id === 'super_account_bypass' ?
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
              ) : subscription.pagarme_subscription_id !== 'super_account_bypass' ? (
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
        
        {/* Seção de Estatísticas */}
        <div className="mb-8 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#04F5A0]/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
          
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
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className={`absolute top-0 right-0 w-12 h-12 ${stat.bg.replace('/10', '/20')} rounded-full blur-lg animate-pulse`}></div>
                    <div className={`absolute bottom-0 left-0 w-8 h-8 ${stat.bg.replace('/10', '/15')} rounded-full blur-md animate-pulse`} style={{animationDelay: '0.7s'}}></div>
                  </div>
                  
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