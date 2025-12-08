'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ====================================================================
// BACKGROUND ANIMADO REUTILIZÁVEL
// ====================================================================
export const AnimatedBackground = ({ variant = 'purple' }) => {
  const variants = {
    purple: 'from-purple-500/10 to-pink-500/10',
    green: 'from-green-500/10 to-[#00FF99]/10',
    blue: 'from-blue-500/10 to-purple-500/10',
    cyan: 'from-cyan-500/10 to-blue-500/10'
  }

  return (
    <>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${variants[variant]} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br ${variants[variant]} rounded-full blur-2xl animate-pulse`} style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none rounded-3xl" />
    </>
  )
}

// ====================================================================
// BADGE DE STATUS
// ====================================================================
export const StatusBadge = ({ status, text, className = '' }) => {
  const statusColors = {
    connected: 'text-[#00FF99] border-[#00FF99]/30 bg-[#00FF99]/10',
    pending: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    configured: 'text-[#00FF99] border-[#00FF99]/30 bg-[#00FF99]/10',
    notConfigured: 'bg-white/10 text-gray-400 border-white/20',
    default: 'bg-white/10 text-gray-400 border-white/20'
  }

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-light backdrop-blur-sm border ${statusColors[status] || statusColors.default} ${className}`}>
      {text}
    </span>
  )
}

// ====================================================================
// CARD DE ESTATÍSTICA
// ====================================================================
export const StatCard = ({ value, label, color, bgColor, loading }) => {
  const colorVariants = {
    blue: 'blue',
    green: 'green',
    purple: 'purple',
    orange: 'purple'
  }

  const variant = colorVariants[color?.split('-')[1]] || 'purple'

  return (
    <div className={`${bgColor} backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-[#00FF99]/30 transition-all duration-300 group relative overflow-hidden`}>
      <AnimatedBackground variant={variant} />

      <div className="relative z-10">
        <div className={`text-4xl font-light ${color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
          {loading ? '...' : value}
        </div>
        <div className="text-sm text-gray-400 font-light group-hover:text-gray-300 transition-colors duration-300">
          {label}
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// CARD DE AÇÃO (WhatsApp, Agente IA, Chat)
// ====================================================================
export const ActionCard = ({
  title,
  emoji,
  description,
  status,
  statusText,
  buttonText,
  buttonVariant = 'primary',
  onClick,
  disabled,
  loading,
  children,
  backgroundVariant = 'purple'
}) => {
  const buttonStyles = {
    primary: 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] text-black font-semibold',
    secondary: 'bg-blue-600/60 hover:bg-blue-600/80 text-white font-medium border border-blue-500/30',
    disabled: 'bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20',
    soon: 'bg-white/5 border border-purple-500/30 text-purple-300 font-medium cursor-default'
  }

  return (
    <div className="glass-card p-6 group relative overflow-visible">
      <AnimatedBackground variant={backgroundVariant} />

      <div className="relative z-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-white group-hover:text-[#00FF99] transition-colors duration-300">
            {title}
          </h3>
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
        </div>

        {description && (
          <p className="text-gray-400 font-light mb-4 group-hover:text-gray-300 transition-colors duration-300">
            {description}
          </p>
        )}

        {children && (
          <div className="mb-4">
            {children}
          </div>
        )}

        {statusText && (
          <div className="mb-4">
            <StatusBadge status={status} text={statusText} />
          </div>
        )}

        {buttonText && (
          <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`w-full py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative z-50 ${buttonStyles[disabled ? 'disabled' : buttonVariant]}`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                <span className="font-light">Carregando...</span>
              </div>
            ) : buttonText}
          </button>
        )}
      </div>
    </div>
  )
}

// ====================================================================
// ÍCONES SVG REUTILIZÁVEIS
// ====================================================================
export const Icons = {
  Profile: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Subscription: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Suggestion: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  ),
  Help: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ChevronDown: ({ isOpen }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Sync: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

// ====================================================================
// DROPDOWN DE CONTA
// ====================================================================
export const AccountDropdown = ({ user, userProfile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const avatarUrl = userProfile?.avatar_url
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const menuItems = [
    { icon: Icons.Profile, label: 'Configurar Conta', path: '/account/profile' },
    { icon: Icons.Subscription, label: 'Gerenciar Assinatura', path: '/account/subscription' },
    { icon: Icons.Suggestion, label: 'Central de Sugestões', path: '/suggestions' },
    { icon: Icons.Help, label: 'Central de Ajuda', path: '/support' }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 glass-card px-3 py-2 hover:border-[#00FF99]/30 relative z-[210]"
      >
        <AnimatedBackground variant="green" />

        <div className="relative z-10 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full border-2 border-[#00FF99]/50"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] flex items-center justify-center text-black font-semibold text-sm">
              {initials}
            </div>
          )}
          <span className="text-sm text-gray-300 font-light">{displayName}</span>
          <Icons.ChevronDown isOpen={isOpen} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[220]" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-64 glass-card z-[230] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-[#00FF99]/50" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] flex items-center justify-center text-black font-bold text-lg">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-white font-normal">{displayName}</div>
                  <div className="text-gray-400 text-sm font-light">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsOpen(false)
                    router.push(item.path)
                  }}
                  className="w-full flex items-center px-4 py-3 text-gray-300 font-light hover:bg-white/5 hover:text-[#00FF99] transition-all duration-200"
                >
                  <item.icon />
                  <span className="ml-3">{item.label}</span>
                </button>
              ))}

              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center px-4 py-3 text-red-400 font-light hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
                >
                  <Icons.Logout />
                  <span className="ml-3">Sair da Conta</span>
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
// MODAL DE QR CODE
// ====================================================================
export const QRCodeModal = ({ qrCode, onClose }) => {
  if (!qrCode) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass-card p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,255,153,0.2)]">
        <AnimatedBackground variant="green" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20"
        >
          <Icons.Close />
        </button>

        <div className="relative z-10 text-center">
          <h3 className="text-2xl font-normal text-white mb-2">
            📱 Conectar WhatsApp
          </h3>
          <p className="text-gray-400 font-light mb-6">
            Escaneie o QR Code com seu WhatsApp
          </p>

          <div className="bg-white rounded-2xl p-4 mb-4 inline-block">
            <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
          </div>

          <div className="bg-[#00FF99]/10 border border-[#00FF99]/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-gray-300 mb-2 font-normal">📲 Como conectar:</p>
            <ol className="text-xs text-gray-400 font-light space-y-1 text-left">
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
  )
}

// ====================================================================
// DROPDOWN DE CONEXÕES
// ====================================================================
export const ConnectionsDropdown = ({ connections, activeConnection, subscription, onSelect, onConnect, onConfigure, onUpgrade, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false)

  const getStatusText = (connection) => {
    if (!connection) return '🔴 Inativa'
    switch (connection.status) {
      case 'connected': return '🟢 Conectado'
      case 'pending_qr': return '🟡 Aguardando QR'
      case 'error': return '🔴 Erro'
      default: return '🔴 Desconectado'
    }
  }

  const connectedCount = connections.filter(c => c.status === 'connected').length
  const totalSlots = subscription?.connections_purchased || 1

  return (
    <div className="relative z-[240]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card px-6 py-4 hover:border-[#00FF99]/30 w-full group relative"
      >
        <AnimatedBackground variant="purple" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div className="text-left">
              <h3 className="text-lg font-normal text-white group-hover:text-[#00FF99] transition-colors duration-300">
                Suas Conexões
              </h3>
              <p className="text-sm text-gray-400 font-light">
                {connectedCount} de {totalSlots} ativas
              </p>
            </div>
          </div>
          <Icons.ChevronDown isOpen={isOpen} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[245]" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 right-0 mt-2 glass-card z-[250] max-h-[400px] overflow-y-auto">
            <div className="p-2">
              {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-light">
                  Nenhuma conexão encontrada
                </div>
              ) : (
                connections.map((conn) => (
                  <div
                    key={conn.id}
                    className={`p-4 rounded-xl mb-2 cursor-pointer transition-all duration-300 ${activeConnection?.id === conn.id
                        ? 'bg-[#00FF99]/10 border border-[#00FF99]/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    onClick={() => {
                      onSelect(conn)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-normal">
                        📱 Conexão {conn.connection_number}
                      </span>
                      <StatusBadge
                        status={conn.status === 'connected' ? 'connected' : conn.status === 'pending_qr' ? 'pending' : 'error'}
                        text={getStatusText(conn)}
                      />
                    </div>
                    {conn.phone_number && (
                      <p className="text-sm text-gray-400 font-light">
                        {conn.phone_number}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {conn.status !== 'connected' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onConnect(conn)
                            setIsOpen(false)
                          }}
                          className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black text-xs py-2 px-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                        >
                          Conectar
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onConfigure(conn)
                          setIsOpen(false)
                        }}
                        className="flex-1 bg-white/10 text-white text-xs py-2 px-3 rounded-lg font-light hover:bg-white/20 transition-all duration-300"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                {connections.length < totalSlots && (
                  <button
                    onClick={() => {
                      onAddNew()
                      setIsOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-xl font-semibold hover:shadow-[0_0_25px_rgba(0,255,153,0.4)] transition-all duration-300"
                  >
                    ➕ Adicionar Nova Conexão
                  </button>
                )}
                <button
                  onClick={() => {
                    onUpgrade()
                    setIsOpen(false)
                  }}
                  className="w-full bg-purple-600/60 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-600/80 transition-all duration-300 border border-purple-500/30"
                >
                  🚀 Aumentar Limite de Conexões
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}