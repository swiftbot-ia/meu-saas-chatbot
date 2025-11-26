'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
// Importações para o telefone
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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
  
  // Novo estado para controlar o Modal de Resultado (Sucesso/Erro)
  const [resultModal, setResultModal] = useState({
    show: false,
    type: 'success', // 'success' ou 'error'
    title: '',
    message: ''
  })
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '', 
    email: '',
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
        if (session?.user?.email) {
          setOriginalEmail(session.user.email)
          setFormData(prev => ({
            ...prev,
            email: session.user.email
          }))
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
      setUser(user)
      setOriginalEmail(user.email)
      await loadUserProfile(user.id)
    }
    setLoading(false)
  }

  const loadUserProfile = async (userId) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        setUserProfile(profile)
        setFormData({
          full_name: profile.full_name || '',
          company_name: profile.company_name || '',
          phone: profile.phone || '', 
          email: currentUser?.email || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      } else {
        // Fallback para criação de perfil se não existir
        const newProfile = {
          user_id: userId,
          full_name: currentUser?.user_metadata?.full_name || '',
          company_name: '',
          phone: '',
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
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.full_name.trim()) newErrors.full_name = 'Nome completo é obrigatório'
    
    if (emailEditMode) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email é obrigatório'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email inválido'
      }
    }

    // Validação de telefone usando a biblioteca
    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Número de telefone inválido para o país selecionado'
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
      const phoneToSave = data.phone

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          phone: phoneToSave,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      let emailWasChanged = false
      if (emailEditMode && data.email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        })
        
        if (emailError) throw emailError
        emailWasChanged = true
      }

      if (data.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password
        })
        if (passwordError) throw passwordError
      }

      // UX MELHORADA: Usando o Modal em vez de Alert
      if (emailWasChanged) {
        setResultModal({
          show: true,
          type: 'success',
          title: 'Verifique seu Email',
          message: `Solicitação de mudança enviada para ${data.email}. Por favor, confirme a alteração no link enviado.`
        })
      } else {
        setResultModal({
          show: true,
          type: 'success',
          title: 'Perfil Atualizado',
          message: 'Suas informações foram salvas com sucesso!'
        })
      }
      
      setEmailEditMode(false)
      await loadUserProfile(user.id)
      
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      // UX MELHORADA: Modal de Erro
      setResultModal({
        show: true,
        type: 'error',
        title: 'Falha ao Salvar',
        message: error.message || 'Ocorreu um erro inesperado ao atualizar o perfil.'
      })
    }

    setSaving(false)
  }

  const handleCancelEmailEdit = () => {
    setEmailEditMode(false)
    setFormData({...formData, email: originalEmail})
    setErrors({...errors, email: ''})
  }

  // Função para fechar o modal de resultado
  const closeResultModal = () => {
    setResultModal(prev => ({ ...prev, show: false }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar />

      <style jsx global>{`
        .PhoneInput {
          display: flex;
          align-items: center;
          width: 100%;
          background-color: #0A0A0A;
          border-radius: 0.75rem; 
          padding-left: 1rem;
          padding-right: 1rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          transition: all 300ms;
        }
        .PhoneInput:focus-within {
          box-shadow: 0 0 0 2px #00FF99;
        }
        .PhoneInputInput {
          flex: 1;
          min-width: 0;
          background-color: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 1rem;
        }
        .PhoneInputInput::placeholder {
          color: #6b7280;
        }
        .PhoneInputCountry {
          margin-right: 0.75rem;
        }
        .PhoneInputCountrySelect {
          background-color: #0A0A0A;
          color: white;
        }
        .PhoneInputCountrySelectArrow {
          border-color: #9ca3af;
          opacity: 0.7;
        }
      `}</style>

      <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-8 pt-8">
              <h1 className="text-4xl font-bold text-white">
                Configurações da Conta
              </h1>
              <p className="text-[#B0B0B0] text-lg mt-3">
                Gerencie suas informações pessoais e de segurança
              </p>
            </div>

            <div className="bg-[#111111] rounded-2xl p-8">
              
              <div className="relative z-20">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Informações do Perfil
                  </h2>
                  <p className="text-gray-400">Gerencie suas informações pessoais e preferências da conta.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  
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
                          
                          <PhoneInput
                            international
                            defaultCountry="BR"
                            value={formData.phone}
                            onChange={(value) => setFormData({...formData, phone: value})}
                            placeholder="(11) 99999-9999"
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

      {/* MODAL DE RESULTADO (SUCESSO/ERRO) - SUBSTITUI O ALERT */}
      {resultModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className={`bg-[#1E1E1E] p-8 rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full text-center transform transition-all scale-100 ${
              resultModal.type === 'error' 
                ? 'border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]' 
                : 'border-[#00FF99]/20 shadow-[0_0_50px_rgba(0,255,153,0.1)]'
            }`}
          >
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                resultModal.type === 'error' ? 'bg-red-500/10' : 'bg-[#00FF99]/10'
              }`}
            >
              {resultModal.type === 'error' ? (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">
              {resultModal.title}
            </h3>
            
            <p className="text-gray-400 mb-8">
              {resultModal.message}
            </p>
            
            <button 
              onClick={closeResultModal}
              className={`w-full py-4 font-bold rounded-2xl transition-all ${
                resultModal.type === 'error'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black hover:shadow-[0_0_20px_rgba(0,255,153,0.3)]'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}