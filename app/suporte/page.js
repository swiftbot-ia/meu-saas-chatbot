'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'normal'
  })
  
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const categories = [
    { value: 'technical', label: 'Problema Técnico', icon: '⚙️' },
    { value: 'billing', label: 'Cobrança/Pagamento', icon: '💰' },
    { value: 'connection', label: 'Conexão WhatsApp', icon: '📲' },
    { value: 'agent', label: 'Agente IA', icon: '🧠' },
    { value: 'account', label: 'Conta/Perfil', icon: '🔐' },
    { value: 'other', label: 'Outro Assunto', icon: '💬' }
  ]

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'text-blue-400', icon: '🔵' },
    { value: 'normal', label: 'Normal', color: 'text-green-400', icon: '🟢' },
    { value: 'high', label: 'Alta', color: 'text-orange-400', icon: '🟠' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400', icon: '🔴' }
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

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria'
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Assunto é obrigatório'
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Assunto deve ter pelo menos 5 caracteres'
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Mensagem deve ter pelo menos 20 caracteres'
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
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          user_name: userProfile?.full_name || user.email.split('@')[0],
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          status: 'open',
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      
      await fetch('/api/support/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'suporte@swiftbot.com.br',
          userEmail: user.email,
          userName: userProfile?.full_name || user.email.split('@')[0],
          category: categories.find(c => c.value === formData.category)?.label || formData.category,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority
        })
      })
      
      alert('✅ Solicitação enviada com sucesso! Nossa equipe responderá em breve.')
      
      setFormData({
        category: '',
        subject: '',
        message: '',
        priority: 'normal'
      })
      setErrors({})
      
    } catch (error) {
      console.error('Erro ao enviar:', error)
      alert('❌ Erro ao enviar solicitação. Tente novamente.')
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
            <h1 className="text-xl font-bold text-white">Central de Ajuda</h1>
          </div>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-2">
            Como podemos ajudar? 🆘
          </h2>
          <p className="text-gray-400">
            Envie sua dúvida ou problema. Responderemos em breve!
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(4,245,160,0.1)] relative">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#04F5A0]/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="relative z-20">
            <div className="p-8">
              <div className="space-y-6">
                
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    📂 Categoria do Problema *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.value})}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          formData.category === cat.value
                            ? 'bg-[#04F5A0]/20 border-[#04F5A0] shadow-[0_0_20px_rgba(4,245,160,0.3)]'
                            : 'bg-black/30 border-white/10 hover:border-[#04F5A0]/30 hover:bg-black/40'
                        }`}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className="text-sm text-white font-medium">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="mt-2 text-red-400 text-sm">{errors.category}</p>}
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    🚨 Prioridade
                  </label>
                  <div className="flex gap-3">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p.value})}
                        className={`flex-1 p-3 rounded-xl border transition-all duration-300 ${
                          formData.priority === p.value
                            ? 'bg-black/50 border-white/30 shadow-lg'
                            : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xl mb-1">{p.icon}</div>
                        <div className={`text-sm font-medium ${p.color}`}>{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ✉️ Assunto *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Ex: Erro ao conectar WhatsApp"
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                  />
                  {errors.subject && <p className="mt-1 text-red-400 text-sm">{errors.subject}</p>}
                </div>

                {/* Mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📝 Descreva seu problema ou dúvida *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Descreva detalhadamente seu problema ou dúvida. Quanto mais informações você fornecer, mais rápido poderemos ajudar!"
                    rows={8}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {errors.message && <p className="text-red-400 text-sm">{errors.message}</p>}
                    </div>
                    <div className={`text-sm ${formData.message.length >= 20 ? 'text-green-400' : 'text-gray-500'}`}>
                      {formData.message.length} / mínimo 20 caracteres
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">💡 Dica</p>
                      <p className="text-blue-200 text-sm">
                        Nossa equipe de suporte responde em até 72 horas úteis. Para problemas urgentes, 
                        selecione prioridade "Urgente". Você receberá uma cópia desta solicitação no email: <span className="font-semibold">{user?.email}</span>
                      </p>
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
                className="px-8 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] flex items-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar Solicitação
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">❓</span>
            Perguntas Frequentes
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <p><span className="text-[#04F5A0]">•</span> <strong>Quanto tempo leva para responder?</strong> Em até 72 horas úteis.</p>
            <p><span className="text-[#04F5A0]">•</span> <strong>Como acompanho minha solicitação?</strong> Você receberá atualizações por email.</p>
            <p><span className="text-[#04F5A0]">•</span> <strong>Posso enviar imagens/arquivos?</strong> Por enquanto não, mas descreva detalhadamente o problema.</p>
          </div>
        </div>
      </main>
    </div>
  )
}