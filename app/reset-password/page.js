'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  // ==================================================================================
  // 🎨 DESIGN SYSTEM (CSS Classes)
  // ==================================================================================
  const baseInputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-500 rounded-3xl px-6 py-4 border outline-none focus:outline-none focus:rounded-3xl focus:bg-[#282828] transition-all duration-300 ease-in-out"
  
  const getInputClass = (hasError) => {
    if (hasError) {
        return `${baseInputClass} border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]`
    }
    return `${baseInputClass} border-transparent focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]`
  }

  const labelClass = "block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider"

  // ==================================================================================
  // 🧠 LÓGICA (MANTIDA)
  // ==================================================================================
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
        setMessage('✅ Link verificado. Crie sua nova senha.')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true)
        setMessage('✅ Link verificado. Crie sua nova senha.')
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const translateError = (errorMessage) => {
    const translations = {
      'New password should be different from the old password': 'A nova senha deve ser diferente da senha anterior',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Email inválido',
      'Invalid login credentials': 'Credenciais inválidas',
      'Email not confirmed': 'Email não confirmado',
      'User not found': 'Usuário não encontrado',
      'Invalid email or password': 'Email ou senha inválidos',
      'Password is too weak': 'Senha muito fraca',
      'Signup requires a valid password': 'É necessário uma senha válida'
    }

    return translations[errorMessage] || errorMessage
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setErrors({})
    setMessage('')

    if (password.length < 6) {
      setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' })
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Senhas não coincidem' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage('✅ Senha atualizada com sucesso! Redirecionando...')
      
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      const translatedError = translateError(error.message)
      setMessage(`❌ Erro: ${translatedError}`)
    } finally {
      setLoading(false)
    }
  }

  // ==================================================================================
  // 🖌️ RENDERIZAÇÃO
  // ==================================================================================
  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden flex items-center justify-center px-4 pt-24 pb-16">
        
        {/* Background Ambient Light */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00FF99]/5 rounded-full blur-[100px]" />

        {/* Card Container */}
        <div className="relative w-full max-w-md animate-fade-in-up">
          
          {/* ✨ Borda Gradiente */}
          <div 
            className="rounded-[32px] p-[2px]"
            style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
          >
            <div className="bg-[#111111] rounded-[30px] p-8 md:p-10 shadow-2xl">
            
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Redefinir <span className="text-[#00FF99]">Senha</span>
                </h1>
                <p className="text-[#B0B0B0] text-sm font-medium">
                  {!isReady ? 'Verificando seu link...' : 'Digite sua nova senha abaixo.'}
                </p>
              </div>

              {!isReady ? (
                <div className="text-center space-y-4 py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00FF99] mx-auto"></div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest animate-pulse">Processando...</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <label className={labelClass}>
                      Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={getInputClass(errors.password)}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    {errors.password && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.password}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={getInputClass(errors.confirmPassword)}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.confirmPassword}</p>}
                  </div>

                  {message && (
                    <div className={`p-4 rounded-2xl text-sm border text-center font-medium animate-in fade-in zoom-in duration-300 ${
                      message.includes('✅') 
                        ? 'bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {message}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-4 rounded-3xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <span>Salvar Nova Senha</span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-[#B0B0B0] hover:text-white text-xs transition-colors duration-300 font-medium hover:underline"
                >
                  ← Voltar ao Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  )
}