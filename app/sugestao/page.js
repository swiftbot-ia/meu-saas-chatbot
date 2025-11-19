'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

// REMOVIDO: Componente AccountDropdown antigo

export default function FeedbackPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  // REMOVIDO: mousePosition
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // ADICIONADO: Estado do menu da conta
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    impact: 'medium'
  })
  
  const [errors, setErrors] = useState({})
  const router = useRouter()

  // MODIFICADO: Emojis removidos. Os SVGs serão adicionados no render.
  const suggestionTypes = [
    { value: 'feature', label: 'Nova Funcionalidade', desc: 'Sugira uma nova feature' },
    { value: 'improvement', label: 'Melhoria', desc: 'Melhore algo existente' },
    { value: 'integration', label: 'Integração', desc: 'Integração com outras plataformas' },
    { value: 'ux', label: 'Design/UX', desc: 'Melhorias visuais ou de usabilidade' }
  ]

  // MODIFICADO: Emojis removidos.
  const impactLevels = [
    { value: 'low', label: 'Baixo', color: 'text-blue-400', desc: 'Legal de ter' },
    { value: 'medium', label: 'Médio', color: 'text-yellow-400', desc: 'Útil para vários usuários' },
    { value: 'high', label: 'Alto', color: 'text-orange-400', desc: 'Muito importante' },
    { value: 'critical', label: 'Crítico', color: 'text-red-400', desc: 'Essencial para o negócio' }
  ]

  // REMOVIDO: useEffect do mouseMove

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
      // MODIFICADO: Tela de loading padronizada
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  // ADICIONADO: Constantes para o menu da conta
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    // MODIFICADO: Fundo principal
    <div className="min-h-screen bg-[#0A0A0A]">
      
      {/* REMOVIDO: Background Effects (grid e mouse gradient) */}
      
      {/* REMOVIDO: Header antigo */}
      
      {/* Conteúdo Principal */}
      {/* MODIFICADO: Padding top alterado para pt-16 */}
      <main className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

        {/*
          ADICIONADO: Novo Header Padrão (igual ao dashboard)
        */}
        <div className="mb-12 flex justify-between items-start gap-4">
          
          {/* Coluna da Esquerda: "Voltar" e Título */}
          <div className="flex-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm text-[#B0B0B0] hover:text-white transition-colors duration-200 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </button>
            
            {/* MODIFICADO: Título da página e SVG */}
            <h1 className="text-5xl font-bold text-white flex items-center gap-4">
              Central de Feedback
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12c0-4.556 3.86-8.25 8.625-8.25S21 7.444 21 12z" /></svg>
            </h1>
            <p className="text-[#B0B0B0] text-lg mt-3">
              Ajude-nos a construir o SwiftBot ideal para você
            </p>
          </div>

          {/* Coluna da Direita: Novo Header (Menu da Conta) */}
          <div className="relative">
            {/* Botão Responsivo (Desktop/Mobile) */}
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center justify-center p-2 rounded-xl hover:opacity-80 transition-opacity duration-200"
              style={{ backgroundColor: '#272727' }}
            >
              
              {/* --- Conteúdo Desktop (Avatar + Seta) --- */}
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
                <svg className={`w-4 h-4 text-white/60 transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* --- Conteúdo Mobile (Ícone "=") --- */}
              <div className="lg:hidden w-9 h-9 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>

            </button>

            {/* Dropdown Menu */}
            {accountDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountDropdownOpen(false)} />
                <div 
                  className="absolute right-0 mt-3 w-64 shadow-2xl rounded-2xl overflow-hidden z-50"
                  style={{ backgroundColor: '#272727' }}
                >
                  <div className="py-2">
                    <button
                      onClick={() => { setAccountDropdownOpen(false); router.push('/account/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Configurar Conta
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); router.push('/account/subscription'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      Gerenciar Assinatura
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); router.push('/sugestao'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                      Central de Sugestões
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); router.push('/suporte'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#B0B0B0] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Central de Ajuda
                    </button>
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <button
                        onClick={() => { setAccountDropdownOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Form Card */}
        {/* MODIFICADO: Estilo do card principal (sem borda, sem blur) */}
        <div className="bg-[#111111] rounded-2xl overflow-hidden relative">
          
          {/* REMOVIDO: Efeitos de blur e vidro */}
          
          <form onSubmit={handleSubmit} className="relative z-20">
            <div className="p-8">
              <div className="space-y-6">
                
                {/* Tipo de Sugestão */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                    Tipo de Sugestão *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ADICIONADO: SVGs inline */}
                    <SuggestionButton
                      type="feature"
                      label="Nova Funcionalidade"
                      desc="Sugira uma nova feature"
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>}
                      formData={formData}
                      setFormData={setFormData}
                    />
                    <SuggestionButton
                      type="improvement"
                      label="Melhoria"
                      desc="Melhore algo existente"
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
                      formData={formData}
                      setFormData={setFormData}
                    />
                    <SuggestionButton
                      type="integration"
                      label="Integração"
                      desc="Integração com outras plataformas"
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>}
                      formData={formData}
                      setFormData={setFormData}
                    />
                    <SuggestionButton
                      type="ux"
                      label="Design/UX"
                      desc="Melhorias visuais ou de usabilidade"
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.034 15.114a.09.09 0 010-.09l4.42-4.42a.09.09 0 01.127 0l4.42 4.42a.09.09 0 010 .09l-4.42 4.42a.09.09 0 01-.127 0l-4.42-4.42zM19.966 9.114a.09.09 0 010-.09l-4.42-4.42a.09.09 0 01-.127 0l-4.42 4.42a.09.09 0 010 .09l4.42 4.42a.09.09 0 01.127 0l4.42-4.42z" /></svg>}
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </div>
                  {errors.type && <p className="mt-2 text-red-400 text-sm">{errors.type}</p>}
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                    Título da Sugestão *
                  </label>
                  {/* MODIFICADO: Estilo do Input */}
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Adicionar integração com Telegram"
                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-300"
                  />
                  {errors.title && <p className="mt-1 text-red-400 text-sm">{errors.title}</p>}
                </div>

                {/* Impacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                    Impacto Esperado
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {impactLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({...formData, impact: level.value})}
                        // MODIFICADO: Estilo do botão de impacto
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          formData.impact === level.value
                            ? 'bg-[#0A0A0A] ring-2 ring-white/50'
                            : 'bg-[#0A0A0A] hover:bg-[#1C1C1C]'
                        }`}
                      >
                        {/* REMOVIDO: Emoji */}
                        <div className={`text-sm font-medium ${level.color} mb-1`}>{level.label}</div>
                        <div className="text-xs text-gray-400">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                    Descreva sua ideia detalhadamente *
                  </label>
                  {/* MODIFICADO: Estilo do Textarea */}
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
                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-300 resize-none"
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
                {/* MODIFICADO: Estilo do Info Box (sem borda/blur) */}
                <div className="bg-purple-500/10 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-purple-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      {/* MODIFICADO: SVG de coração */}
                      <p className="text-purple-300 text-sm font-medium mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                        Como avaliamos sugestões
                      </p>
                      <ul className="text-purple-200 text-sm space-y-1">
                        <li>• Todas as sugestões são analisadas pela nossa equipe</li>
                        <li>• Priorizamos ideias com maior impacto no negócio dos clientes</li>
                        <li>• Você pode acompanhar o status da sua sugestão por email</li>
                        {/* MODIFICADO: SVG de presente */}
                        <li className="flex items-center gap-2">
                          • Sugestões implementadas ganham créditos especiais!
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0115 5v2H5V5zm0 3h10v2H5V8zm0 3h10v2H5v-2zm0 3h10v3H5v-3z" clipRule="evenodd" /></svg>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Botões */}
            {/* MODIFICADO: Estilo dos botões de rodapé */}
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
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center"
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
          {/* MODIFICADO: Card de stat (sem borda, sem blur, com SVG) */}
          <div className="bg-[#111111] rounded-2xl p-4 text-center">
            <div className="relative z-10">
              <div className="text-3xl mb-2">
                <svg className="w-8 h-8 inline-block text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.25c-5.508 0-10.099 3.21-12.12 7.75h4.8m2.58 5.84l2.61-2.61m0 0l2.61 2.61m-2.61-2.61V21m0 0l2.61 2.61m-2.61-2.61l-2.61 2.61" /></svg>
              </div>
              <div className="text-2xl font-bold text-[#00FF99]">127</div>
              <div className="text-sm text-gray-400">Sugestões recebidas</div>
            </div>
          </div>
          
          {/* MODIFICADO: Card de stat (sem borda, sem blur, com SVG) */}
          <div className="bg-[#111111] rounded-2xl p-4 text-center">
            <div className="relative z-10">
              <div className="text-3xl mb-2">
                <svg className="w-8 h-8 inline-block text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-2xl font-bold text-green-400">43</div>
              <div className="text-sm text-gray-400">Features implementadas</div>
            </div>
          </div>
          
          {/* MODIFICADO: Card de stat (sem borda, sem blur, com SVG) */}
          <div className="bg-[#111111] rounded-2xl p-4 text-center">
            <div className="relative z-10">
              <div className="text-3xl mb-2">
                <svg className="w-8 h-8 inline-block text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-2xl font-bold text-yellow-400">18</div>
              <div className="text-sm text-gray-400">Em desenvolvimento</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ADICIONADO: Componente helper para os botões de sugestão (para incluir os SVGs)
const SuggestionButton = ({ type, label, desc, icon, formData, setFormData }) => (
  <button
    type="button"
    onClick={() => setFormData({...formData, type: type})}
    // MODIFICADO: Estilo dos botões de tipo
    className={`p-4 rounded-xl transition-all duration-300 text-left ${
      formData.type === type
        ? 'bg-[#0A0A0A] ring-2 ring-purple-500'
        : 'bg-[#0A0A0A] hover:bg-[#1C1C1C]'
    }`}
  >
    <div className="flex items-start">
      <div className="text-3xl mr-3 text-purple-400">{icon}</div>
      <div>
        <div className="text-white font-medium mb-1">{label}</div>
        <div className="text-gray-400 text-sm">{desc}</div>
      </div>
    </div>
  </button>
)