'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'

export default function SupportPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'normal'
  })
  
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const categories = [
    { value: 'technical', label: 'Problema Técnico', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.108 1.204l.527.738c.313.436.337.996.12 1.45l-.773.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.204-.108-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.893-.15c-.543-.09-.94-.56-.94-1.11v-1.093c0-.55.397-1.02.94-1.11l.893-.149c.425-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.527-.738a1.125 1.125 0 01-.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.806.272 1.204.108.397-.165.71-.505.78-.93l.15-.893zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg> },
    { value: 'billing', label: 'Cobrança/Pagamento', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>},
    { value: 'connection', label: 'Conexão WhatsApp', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> },
    { value: 'agent', label: 'Agente IA', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect width="18" height="10" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" x2="8" y1="16" y2="16" /><line x1="16" x2="16" y1="16" y2="16" /></svg> },
    { value: 'account', label: 'Conta/Perfil', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
    { value: 'other', label: 'Outro Assunto', svg: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12c0-4.556 3.86-8.25 8.625-8.25S21 7.444 21 12z" /></svg> }
  ]

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'text-blue-400' },
    { value: 'normal', label: 'Normal', color: 'text-green-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400' }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/user/profile-id')
      const data = await response.json()
      
      if (!data.success) {
        router.push('/login')
        return
      }

      setUser({
        id: data.profileId,
        email: data.email
      })
      
      setUserProfile({
        full_name: data.fullName,
        company_name: data.companyName
      })
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
      const response = await fetch('/api/suporte/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          category: formData.category
        })
      })

      const data = await response.json()
      
      if (!data.success) throw new Error(data.error)
      
      await fetch('/api/support/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'caio.guedes@swiftbot.com.br',
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      
      {/* Conteúdo Principal */}
      {/* CORRIGIDO: Alterado de max-w-4xl para max-w-7xl para igualar ao Feedback */}
      <main className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

        <div className="mb-12 flex justify-between items-start gap-4">
          
          {/* Coluna da Esquerda */}
          <div className="flex-1">            
            <h1 className="text-5xl font-bold text-white flex items-center gap-4">
              Central de Ajuda
              {/* ADICIONADO: Ícone SVG no título para consistência com a página de Feedback */}
              <svg className="w-10 h-10 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </h1>
            <p className="text-[#B0B0B0] text-lg mt-3">
              Como podemos ajudar? Envie sua dúvida ou problema.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#111111] rounded-2xl overflow-hidden relative">
          
          <form onSubmit={handleSubmit} className="relative z-20">
            <div className="p-8">
              <div className="space-y-6">
                
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                    Categoria do Problema *
                  </label>
                  {/* Opcional: Se quiser os botões maiores como no feedback, troque md:grid-cols-3 por md:grid-cols-2 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.value})}
                        className={`p-4 rounded-xl transition-all duration-300 text-left ${
                          formData.category === cat.value
                            ? 'bg-[#0A0A0A] ring-2 ring-[#00FF99]'
                            : 'bg-[#0A0A0A] hover:bg-[#1C1C1C]'
                        }`}
                      >
                        <div className="text-3xl mb-2 text-[#00FF99]">{cat.svg}</div>
                        <div className="text-sm text-white font-medium">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="mt-2 text-red-400 text-sm">{errors.category}</p>}
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                    Prioridade
                  </label>
                  <div className="flex gap-3">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p.value})}
                        className={`flex-1 p-3 rounded-xl transition-all duration-300 ${
                          formData.priority === p.value
                            ? 'bg-[#0A0A0A] ring-2 ring-white/50'
                            : 'bg-[#0A0A0A] hover:bg-[#1C1C1C]'
                        }`}
                      >
                        <div className={`text-sm font-medium ${p.color}`}>{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                    Assunto *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Ex: Erro ao conectar WhatsApp"
                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                  />
                  {errors.subject && <p className="mt-1 text-red-400 text-sm">{errors.subject}</p>}
                </div>

                {/* Mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                    Descreva seu problema ou dúvida *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Descreva detalhadamente seu problema ou dúvida. Quanto mais informações você fornecer, mais rápido poderemos ajudar!"
                    rows={8}
                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300 resize-none"
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
                <div className="bg-[#0A0A0A] rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">Dica</p>
                      <p className="text-gray-400 text-sm">
                        Nossa equipe de suporte responde em até 72 horas úteis. Para problemas urgentes, 
                        selecione prioridade "Urgente". Você receberá uma cópia desta solicitação no email: <span className="font-semibold text-white">{user?.email || '...'}</span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/5 px-8 pb-8">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-[#272727] hover:bg-[#333333] text-white rounded-xl font-medium transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-8 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] disabled:opacity-50 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] flex items-center"
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
        <div className="mt-8 bg-[#111111] rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
            Perguntas Frequentes
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <p><span className="text-[#00FF99]">•</span> <strong>Quanto tempo leva para responder?</strong> Em até 72 horas úteis.</p>
            <p><span className="text-[#00FF99]">•</span> <strong>Como acompanho minha solicitação?</strong> Você receberá atualizações por email.</p>
            <p><span className="text-[#00FF99]">•</span> <strong>Posso enviar imagens/arquivos?</strong> Por enquanto não, mas descreva detalhadamente o problema.</p>
          </div>
        </div>
      </main>
    </div>
  )
}