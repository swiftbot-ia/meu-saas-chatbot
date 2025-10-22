'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

// Componente Dropdown de Conta (mesmo do dashboard)
const AccountDropdown = ({ user, userProfile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const avatarUrl = userProfile?.avatar_url
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-black/30 backdrop-blur-xl hover:bg-black/40 rounded-xl px-3 py-2 transition-all duration-300 border border-white/10 hover:border-[#04F5A0]/30 relative overflow-hidden z-[210]"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/30 rounded-full blur-md animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 bg-[#04F5A0]/20 rounded-full blur-sm animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center space-x-3">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-[#04F5A0]/50" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          
          <span className="text-sm text-gray-300 font-medium">{displayName}</span>
          
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

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[220]" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-64 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-[230] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-[#04F5A0]/50" />
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

            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/dashboard')
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800/50 hover:text-[#04F5A0] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account/profile')
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800/50 hover:text-[#04F5A0] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil
              </button>

              <div className="border-t border-white/10 my-2"></div>

              <button
                onClick={onLogout}
                className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-gray-800/50 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function FeedbackPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    impact: 'medium'
  })
  
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const suggestionTypes = [
    { value: 'feature', label: 'Nova Funcionalidade', icon: '🚀', desc: 'Sugira uma nova feature' },
    { value: 'improvement', label: 'Melhoria', icon: '⚡', desc: 'Melhore algo existente' },
    { value: 'integration', label: 'Integração', icon: '🔌', desc: 'Integração com outras plataformas' },
    { value: 'ux', label: 'Design/UX', icon: '🖼️', desc: 'Melhorias visuais ou de usabilidade' }
  ]

  const impactLevels = [
    { value: 'low', label: 'Baixo', color: 'text-blue-400', desc: 'Legal de ter', icon: '🔵' },
    { value: 'medium', label: 'Médio', color: 'text-yellow-400', desc: 'Útil para vários usuários', icon: '🟡' },
    { value: 'high', label: 'Alto', color: 'text-orange-400', desc: 'Muito importante', icon: '🟠' },
    { value: 'critical', label: 'Crítico', color: 'text-red-400', desc: 'Essencial para o negócio', icon: '🔴' }
  ]

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
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.type) {
      newErrors.type = 'Selecione o tipo de sugestão'
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    } else if (formData.description.trim().length < 30) {
      newErrors.description = 'Descrição deve ter pelo menos 30 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSending(true)
    
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          user_name: userProfile?.full_name || user.email.split('@')[0],
          type: formData.type,
          title: formData.title,
          description: formData.description,
          impact: formData.impact,
          status: 'submitted',
          votes: 1,
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      
      await fetch('/api/feedback/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userProfile?.full_name || user.email.split('@')[0],
          userEmail: user.email,
          type: suggestionTypes.find(t => t.value === formData.type)?.label || formData.type,
          title: formData.title,
          description: formData.description,
          impact: impactLevels.find(i => i.value === formData.impact)?.label || formData.impact
        })
      })
      
      alert('🎉 Sugestão enviada com sucesso! Obrigado por contribuir para melhorar o SwiftBot!')
      
      setFormData({
        type: '',
        title: '',
        description: '',
        impact: 'medium'
      })
      setErrors({})
      
    } catch (error) {
      console.error('Erro ao enviar:', error)
      alert('❌ Erro ao enviar sugestão. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04F5A0] mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

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
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
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
            <h1 className="text-xl font-bold text-white">Central de Feedback</h1>
          </div>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-400 to-white bg-clip-text text-transparent mb-2">
            Sua opinião importa! 💡
          </h2>
          <p className="text-gray-400">
            Ajude-nos a construir o SwiftBot ideal para você
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.1)] relative">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
          </div>
          
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="relative z-20">
            <div className="p-8">
              <div className="space-y-6">
                
                {/* Tipo de Sugestão */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    🎯 Tipo de Sugestão *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestionTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({...formData, type: type.value})}
                        className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                          formData.type === type.value
                            ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                            : 'bg-black/30 border-white/10 hover:border-purple-500/30 hover:bg-black/40'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="text-3xl mr-3">{type.icon}</div>
                          <div>
                            <div className="text-white font-medium mb-1">{type.label}</div>
                            <div className="text-gray-400 text-sm">{type.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.type && <p className="mt-2 text-red-400 text-sm">{errors.type}</p>}
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📝 Título da Sugestão *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Adicionar integração com Telegram"
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300"
                  />
                  {errors.title && <p className="mt-1 text-red-400 text-sm">{errors.title}</p>}
                </div>

                {/* Impacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    📊 Impacto Esperado
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {impactLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({...formData, impact: level.value})}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                          formData.impact === level.value
                            ? 'bg-black/50 border-white/30 shadow-lg'
                            : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-2xl mb-1">{level.icon}</div>
                        <div className={`text-sm font-medium ${level.color} mb-1`}>{level.label}</div>
                        <div className="text-xs text-gray-400">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📖 Descreva sua ideia detalhadamente *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={`Descreva sua sugestão em detalhes:
• O que você gostaria que fosse adicionado/melhorado?
• Por que isso seria útil?
• Como você imagina que funcionaria?
• Que problema isso resolveria?

Quanto mais detalhes, melhor poderemos avaliar sua sugestão!`}
                    rows={10}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
                    </div>
                    <div className={`text-sm ${formData.description.length >= 30 ? 'text-green-400' : 'text-gray-500'}`}>
                      {formData.description.length} / mínimo 30 caracteres
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-purple-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-purple-300 text-sm font-medium mb-1">💜 Como avaliamos sugestões</p>
                      <ul className="text-purple-200 text-sm space-y-1">
                        <li>• Todas as sugestões são analisadas pela nossa equipe</li>
                        <li>• Priorizamos ideias com maior impacto no negócio dos clientes</li>
                        <li>• Você pode acompanhar o status da sua sugestão por email</li>
                        <li>• Sugestões implementadas ganham créditos especiais! 🎁</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/10 px-8 pb-8">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Enviar Sugestão
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Stats & Incentive */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-0 left-0 w-20 h-20 bg-[#04F5A0]/30 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-2xl font-bold text-[#04F5A0]">127</div>
              <div className="text-sm text-gray-400">Sugestões recebidas</div>
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-400">43</div>
              <div className="text-sm text-gray-400">Features implementadas</div>
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-yellow-500/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-2xl font-bold text-yellow-400">18</div>
              <div className="text-sm text-gray-400">Em desenvolvimento</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}