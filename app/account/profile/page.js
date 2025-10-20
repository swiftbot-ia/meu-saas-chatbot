'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountProfile() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(null)
  const [errors, setErrors] = useState({})
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    email: '',
    avatar_url: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
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
          email: user?.email || '',
          avatar_url: profile.avatar_url || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      } else {
        // Criar perfil se não existir
        const newProfile = {
          user_id: userId,
          full_name: user?.user_metadata?.full_name || '',
          company_name: '',
          phone: '',
          avatar_url: user?.user_metadata?.avatar_url || '',
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
          email: user?.email || '',
          avatar_url: newProfile.avatar_url,
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
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
    
    // Se há mudança sensível, pedir confirmação de senha
    const sensitiveChanges = formData.email !== user.email || formData.new_password
    
    if (sensitiveChanges) {
      setPendingChanges(formData)
      setShowPasswordConfirm(true)
      return
    }
    
    // Se não há mudanças sensíveis, salvar diretamente
    await saveProfile()
  }

  const confirmAndSave = async (password) => {
    if (!password) {
      setErrors({...errors, current_password: 'Senha atual é obrigatória'})
      return
    }

    try {
      // Verificar senha atual
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

      // Atualizar perfil no banco
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          phone: cleanPhone,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      // Atualizar email se mudou
      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        })
        if (emailError) throw emailError
      }

      // Atualizar senha se fornecida
      if (data.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password
        })
        if (passwordError) throw passwordError
      }

      alert('✅ Perfil atualizado com sucesso!')
      
      // Recarregar dados
      await loadUserProfile(user.id)
      
      // Limpar campos de senha
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
          <p className="text-gray-300">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
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
      <header className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
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
            <h1 className="text-xl font-bold text-white">Configurações da Conta</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 right-0 w-32 h-32 bg-pink-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-violet-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-4">
                Informações do Perfil
              </h2>
              <p className="text-gray-400">Gerencie suas informações pessoais e preferências da conta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Section */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Mini Animated Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#04F5A0]/30 rounded-full blur-xl animate-pulse"></div>
                </div>
                
                <div className="relative z-10 flex items-center space-x-6">
                  <div className="relative group">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-4 border-[#04F5A0]/50 group-hover:border-[#04F5A0] transition-all duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold text-3xl group-hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(4,245,160,0.3)]">
                        {formData.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      🖼️ URL do Avatar
                    </label>
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                      placeholder="https://exemplo.com/avatar.jpg"
                      className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Mini Animated Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute bottom-0 left-0 w-28 h-28 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-blue-400 mb-6 flex items-center">
                    👤 Informações Pessoais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome Completo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      />
                      {errors.full_name && <p className="mt-1 text-red-400 text-sm">{errors.full_name}</p>}
                    </div>

                    {/* Telefone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📱 Telefone de Contato *
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
                        className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      />
                      {errors.phone && <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>}
                      {!errors.phone && (
                        <p className="mt-1 text-gray-500 text-xs">
                          💡 Necessário para notificações e suporte
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Mini Animated Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-1/2 right-0 w-24 h-24 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-purple-400 mb-6 flex items-center">
                    🏢 Informações da Empresa
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
                      className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Segurança da Conta */}
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Mini Animated Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-orange-400 mb-6 flex items-center">
                    🔐 Segurança da Conta
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📧 Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      />
                      {errors.email && <p className="mt-1 text-red-400 text-sm">{errors.email}</p>}
                      {formData.email !== user?.email && !errors.email && (
                        <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
                          <p className="text-yellow-400 text-sm flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Alterar o email exigirá confirmação de senha
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Alterar Senha */}
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-lg font-semibold text-white mb-4">🔑 Alterar Senha</h4>
                      
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
                            className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
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
                            className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                          />
                          {errors.confirm_password && <p className="mt-1 text-red-400 text-sm">{errors.confirm_password}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] flex items-center"
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
          
          <div className="relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(4,245,160,0.15)] z-[70]">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-500/35 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🔐 Senha Atual *
                </label>
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
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
                  className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmAndSave(formData.current_password)}
                  disabled={saving}
                  className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)]"
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