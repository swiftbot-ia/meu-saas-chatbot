'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AccountProfile() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(null)
  const [errors, setErrors] = useState({})
  const [emailEditMode, setEmailEditMode] = useState(false)
  const [originalEmail, setOriginalEmail] = useState('')
  const [showEmailChangeSuccess, setShowEmailChangeSuccess] = useState(false)
  
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  // REMOVIDO: Estado de loading do avatar
  // const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    email: '',
    // avatar_url: '', // REMOVIDO
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, 'Email:', session?.user?.email)
      
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        console.log('📧 Email pode ter mudado, atualizando...')
        
        if (session?.user?.email) {
          setOriginalEmail(session.user.email)
          setFormData(prev => ({
            ...prev,
            email: session.user.email
          }))
          console.log('✅ Email atualizado para:', session.user.email)
        }
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
    } else {
      console.log('👤 Usuário carregado - Email atual:', user.email)
      setUser(user)
      setOriginalEmail(user.email)
      await loadUserProfile(user.id)
    }
    setLoading(false)
  }

  const loadUserProfile = async (userId) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('📧 loadUserProfile - Email do usuário:', currentUser?.email)
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        setUserProfile(profile)
        setFormData({
          full_name: profile.full_name || '',
          company_name: profile.company_name || '',
          phone: profile.phone ? formatPhone(profile.phone) : '',
          email: currentUser?.email || '',
          // avatar_url: profile.avatar_url || '', // REMOVIDO
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        console.log('✅ FormData preenchido com email:', currentUser?.email)
      } else {
        const newProfile = {
          user_id: userId,
          full_name: currentUser?.user_metadata?.full_name || '',
          company_name: '',
          phone: '',
          // avatar_url: currentUser?.user_metadata?.avatar_url || '', // REMOVIDO
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: createdProfile } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()
          
        setUserProfile(createdProfile)
        setFormData({
          full_name: newProfile.full_name,
          company_name: newProfile.company_name,
          phone: newProfile.phone,
          email: currentUser?.email || '',
          // avatar_url: newProfile.avatar_url, // REMOVIDO
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  // REMOVIDA: Função de Upload de Avatar
  // const handleAvatarUpload = async (event) => { ... }

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const validatePhone = (phone) => {
    const numbers = phone.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório'
    }
    
    if (emailEditMode) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email é obrigatório'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email inválido'
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos'
    }
    
    if (formData.new_password) {
      if (formData.new_password.length < 6) {
        newErrors.new_password = 'Nova senha deve ter pelo menos 6 caracteres'
      }
      
      if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Senhas não coincidem'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const emailChanged = emailEditMode && formData.email !== originalEmail
    const sensitiveChanges = emailChanged || formData.new_password
    
    if (sensitiveChanges) {
      setPendingChanges(formData)
      setShowPasswordConfirm(true)
      return
    }
    
    await saveProfile()
  }

  const confirmAndSave = async (password) => {
    if (!password) {
      setErrors({...errors, current_password: 'Senha atual é obrigatória'})
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      })

      if (signInError) {
        setErrors({...errors, current_password: 'Senha atual incorreta'})
        return
      }

      await saveProfile(pendingChanges)
      setShowPasswordConfirm(false)
      setPendingChanges(null)
    } catch (error) {
      setErrors({...errors, current_password: 'Erro ao verificar senha'})
    }
  }

  const saveProfile = async (data = formData) => {
    setSaving(true)
    setErrors({})

    try {
      const cleanPhone = data.phone.replace(/\D/g, '')

      // Atualizar perfil no banco (sem avatar_url)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          phone: cleanPhone,
          // avatar_url: data.avatar_url, // REMOVIDO
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      let emailWasChanged = false
      if (emailEditMode && data.email !== originalEmail) {
        console.log('🔄 Tentando atualizar email de:', originalEmail, 'para:', data.email)
        
        const { data: updateData, error: emailError } = await supabase.auth.updateUser({
          email: data.email
        })
        
        if (emailError) {
          console.error('❌ Erro ao atualizar email:', emailError)
          alert(`❌ Erro ao atualizar email: ${emailError.message}`)
          throw emailError
        }
        
        console.log('✅ RESPOSTA COMPLETA do updateUser:', JSON.stringify(updateData, null, 2))
        emailWasChanged = true
      }

      if (data.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password
        })
        if (passwordError) throw passwordError
      }

      if (emailWasChanged) {
        alert(`✅ Solicitação de mudança de email enviada!

📧 Um email de confirmação foi enviado para: ${data.email}

⚠️ Você precisa:
1. Abrir o email em: ${data.email}
2. Clicar no link de confirmação
3. Aguardar alguns segundos
4. Recarregar esta página (F5)

O email só será atualizado após você confirmar no link.`)
      } else {
        alert('✅ Perfil atualizado com sucesso!')
      }
      
      setEmailEditMode(false)
      await loadUserProfile(user.id)
      
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser?.email) {
        setOriginalEmail(updatedUser.email)
      }
      
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('❌ Erro ao salvar perfil: ' + error.message)
    }

    setSaving(false)
  }

  const handleCancelEmailEdit = () => {
    setEmailEditMode(false)
    setFormData({...formData, email: originalEmail})
    setErrors({...errors, email: ''})
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
    <div className="min-h-screen bg-[#0A0A0A]">
      
      {/* REMOVIDO: Input de file escondido */}

      <main className="relative z-10 max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

        <div className="mb-12 flex justify-between items-start gap-4">
          
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
            
            <h1 className="text-5xl font-bold text-white">
              Configurações da Conta
            </h1>
            <p className="text-[#B0B0B0] text-lg mt-3">
              Gerencie suas informações pessoais e de segurança
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center justify-center p-2 rounded-xl hover:opacity-80 transition-opacity duration-200"
              style={{ backgroundColor: '#272727' }}
            >
              
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

              <div className="lg:hidden w-9 h-9 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>

            </button>

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
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>                      Configurar Conta
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

        <div className="bg-[#111111] rounded-2xl p-8">
          
          <div className="relative z-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Informações do Perfil
              </h2>
              <p className="text-gray-400">Gerencie suas informações pessoais e preferências da conta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* REMOVIDA: Seção do Avatar */}
              
              {/* Informações Pessoais */}
              <div className="bg-[#0A0A0A] rounded-2xl p-6">
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Informações Pessoais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                      />
                      {errors.full_name && <p className="mt-1 text-red-400 text-sm">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        Telefone de Contato *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value)
                          if (formatted.length <= 15) {
                            setFormData({...formData, phone: formatted})
                          }
                        }}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                      />
                      {errors.phone && <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="bg-[#0A0A0A] rounded-2xl p-6">
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Informações da Empresa
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      placeholder="Ex: TechSolutions Ltda"
                      className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Segurança da Conta */}
              <div className="bg-[#0A0A0A] rounded-2xl p-6">
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Segurança da Conta
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Email *
                      </label>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={!emailEditMode}
                            className={`w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all duration-300 ${
                              emailEditMode 
                                ? 'focus:ring-2 focus:ring-[#00FF99] outline-none' 
                                : 'opacity-60 cursor-not-allowed'
                            }`}
                          />
                          {errors.email && <p className="mt-1 text-red-400 text-sm">{errors.email}</p>}
                          {emailEditMode && formData.email !== originalEmail && !errors.email && (
                            <div className="mt-2 p-3 bg-yellow-500/10 rounded-lg">
                              <p className="text-yellow-400 text-sm flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Alterar o email exigirá confirmação de senha
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => emailEditMode ? handleCancelEmailEdit() : setEmailEditMode(true)}
                          className="bg-[#272727] hover:bg-[#333333] text-white px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap flex items-center gap-2"
                        >
                          {emailEditMode ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          )}
                          {emailEditMode ? 'Cancelar' : 'Editar'}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                        <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="#BDBDBD" strokeWidth="1.5"></path> <path d="M9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12Z" fill="#BDBDBD"></path> <path d="M13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12Z" fill="#BDBDBD"></path> <path d="M17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11C16.5523 11 17 11.4477 17 12Z" fill="#BDBDBD"></path> </g></svg>
                        Alterar Senha
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nova Senha
                          </label>
                          <input
                            type="password"
                            value={formData.new_password}
                            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                            placeholder="Deixe em branco para manter a atual"
                            className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                          />
                          {errors.new_password && <p className="mt-1 text-red-400 text-sm">{errors.new_password}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type="password"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                            placeholder="Confirme a nova senha"
                            className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                          />
                          {errors.confirm_password && <p className="mt-1 text-red-400 text-sm">{errors.confirm_password}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-[#272727] hover:bg-[#333333] text-white rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] disabled:opacity-50 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Senha */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          
          <div className="relative bg-[#111111] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl z-[70]">
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirmar Alterações</h3>
                <p className="text-gray-400">
                  Para sua segurança, confirme sua senha atual para salvar as alterações sensíveis.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="#BDBDBD" strokeWidth="1.5"></path> <path d="M9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12Z" fill="#BDBDBD"></path> <path d="M13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12Z" fill="#BDBDBD"></path> <path d="M17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11C16.5523 11 17 11.4477 17 12Z" fill="#BDBDBD"></path> </g></svg>
                  Senha Atual *
                </label>
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all duration-300"
                  autoFocus
                />
                {errors.current_password && <p className="mt-1 text-red-400 text-sm">{errors.current_password}</p>}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordConfirm(false)
                    setPendingChanges(null)
                    setFormData({...formData, current_password: ''})
                    setErrors({})
                  }}
                  className="flex-1 bg-[#272727] hover:bg-[#333333] text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmAndSave(formData.current_password)}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] disabled:opacity-50 text-black py-3 px-4 rounded-xl font-bold transition-all duration-300"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Confirmando...
                    </div>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}