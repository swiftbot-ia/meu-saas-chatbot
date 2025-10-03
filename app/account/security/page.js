'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountSecurity() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
    }
    setLoading(false)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.current_password) {
      newErrors.current_password = 'Senha atual é obrigatória'
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'Nova senha é obrigatória'
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Nova senha deve ter pelo menos 6 caracteres'
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Confirmação de senha é obrigatória'
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Senhas não coincidem'
    }
    
    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'A nova senha deve ser diferente da senha atual'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    setErrors({})

    try {
      // Verificar senha atual primeiro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.current_password
      })

      if (signInError) {
        setErrors({ current_password: 'Senha atual incorreta' })
        setSaving(false)
        return
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.new_password
      })

      if (updateError) {
        throw updateError
      }

      // Log da alteração de senha
      await supabase
        .from('payment_logs')
        .insert([{
          user_id: user.id,
          subscription_id: null,
          event_type: 'password_changed',
          amount: 0,
          status: 'success',
          metadata: {
            changed_at: new Date().toISOString(),
            ip_address: 'unknown' // Em produção, capturar o IP real
          }
        }])

      alert('✅ Senha alterada com sucesso!')
      
      // Limpar formulário
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      alert('❌ Erro ao alterar senha: ' + error.message)
    }

    setSaving(false)
  }

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: 'bg-gray-600' }
    
    let score = 0
    let feedback = []
    
    if (password.length >= 8) score += 1
    else feedback.push('pelo menos 8 caracteres')
    
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('letras minúsculas')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('letras maiúsculas')
    
    if (/[0-9]/.test(password)) score += 1
    else feedback.push('números')
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('símbolos especiais')
    
    const levels = [
      { score: 0, text: 'Muito fraca', color: 'bg-red-500' },
      { score: 1, text: 'Fraca', color: 'bg-red-400' },
      { score: 2, text: 'Razoável', color: 'bg-yellow-500' },
      { score: 3, text: 'Boa', color: 'bg-yellow-400' },
      { score: 4, text: 'Forte', color: 'bg-green-500' },
      { score: 5, text: 'Muito forte', color: 'bg-green-400' }
    ]
    
    return {
      ...levels[score],
      feedback: feedback.length > 0 ? 'Adicione: ' + feedback.join(', ') : 'Senha segura!'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto animate-pulse mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
          <p className="text-gray-300">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(formData.new_password)

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-300 hover:text-[#04F5A0] transition-colors duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </button>
            <h1 className="text-xl font-bold text-white">Segurança da Conta</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Alterar Senha */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Alterar Senha</h2>
                <p className="text-gray-400">
                  Mantenha sua conta segura com uma senha forte e única.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Senha Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha Atual *
                  </label>
                  <input
                    type="password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                    placeholder="Digite sua senha atual"
                  />
                  {errors.current_password && (
                    <p className="mt-1 text-red-400 text-sm">{errors.current_password}</p>
                  )}
                </div>

                {/* Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                    placeholder="Digite sua nova senha"
                  />
                  {errors.new_password && (
                    <p className="mt-1 text-red-400 text-sm">{errors.new_password}</p>
                  )}
                  
                  {/* Indicador de Força da Senha */}
                  {formData.new_password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Força da senha:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score >= 4 ? 'text-green-400' :
                          passwordStrength.score >= 2 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Confirmar Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#04F5A0] focus:outline-none transition-colors duration-300"
                    placeholder="Confirme sua nova senha"
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-red-400 text-sm">{errors.confirm_password}</p>
                  )}
                  
                  {/* Indicador de Correspondência */}
                  {formData.confirm_password && (
                    <div className="mt-1 flex items-center">
                      {formData.new_password === formData.confirm_password ? (
                        <>
                          <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-green-400">Senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-red-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-xs text-red-400">Senhas não coincidem</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || passwordStrength.score < 2}
                    className="px-6 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(4,245,160,0.4)] flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Alterando...
                      </>
                    ) : (
                      'Alterar Senha'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Coluna Lateral - Informações de Segurança */}
          <div className="space-y-6">
            
            {/* Dicas de Segurança */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#04F5A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dicas de Segurança
              </h3>
              
              <div className="space-y-4 text-sm text-gray-400">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#04F5A0] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong className="text-gray-300">Use senhas fortes:</strong>
                    <br />Combine letras maiúsculas, minúsculas, números e símbolos.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#04F5A0] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong className="text-gray-300">Senhas únicas:</strong>
                    <br />Não reutilize a mesma senha em outros serviços.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#04F5A0] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong className="text-gray-300">Altere regularmente:</strong>
                    <br />Atualize sua senha a cada 3-6 meses.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#04F5A0] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong className="text-gray-300">Mantenha segredo:</strong>
                    <br />Nunca compartilhe sua senha com terceiros.
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Conta */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informações da Sessão
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{user?.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Último login:</span>
                  <span className="text-white">
                    {user?.last_sign_in_at ? 
                      new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') 
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Conta criada:</span>
                  <span className="text-white">
                    {new Date(user?.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Adicionais */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Outras Ações</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/account/profile')}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 text-left"
                >
                  👤 Editar Perfil
                </button>
                
                <button
                  onClick={() => router.push('/account/subscription')}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 text-left"
                >
                  💳 Gerenciar Assinatura
                </button>
                
                <button
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja sair da conta?')) {
                      await supabase.auth.signOut()
                      router.push('/login')
                    }
                  }}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 text-left"
                >
                  🚪 Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}