'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // O Supabase Auth automaticamente detecta o código na URL e troca por sessão
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
        setMessage('✅ Link verificado. Crie sua nova senha.')
      }
    })

    // Verifica se já existe uma sessão de recuperação ativa
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
      setMessage(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4 pt-24 pb-16">
        
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />

        <div className="relative w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-white mb-3">
                Redefinir <span className="font-normal bg-gradient-to-r from-[#00FF99] to-[#00E88C] bg-clip-text text-transparent">Senha</span>
              </h1>
              <p className="text-gray-400 font-light">
                {!isReady ? 'Verificando seu link...' : 'Digite sua nova senha abaixo.'}
              </p>
            </div>

            {!isReady ? (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-400 text-sm font-light">Processando link de recuperação...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-300 mb-2">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] focus:border-[#00FF99] outline-none transition-all duration-300 font-light ${
                      errors.password ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-light text-gray-300 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] focus:border-[#00FF99] outline-none transition-all duration-300 font-light ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.confirmPassword}</p>}
                </div>

                {message && (
                  <div className={`p-3 rounded-xl text-sm border backdrop-blur-sm font-light ${
                    message.includes('✅') 
                      ? 'bg-green-900/20 text-green-400 border-green-800/50' 
                      : 'bg-red-900/20 text-red-400 border-red-800/50'
                  }`}>
                    {message}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      <span className="font-light">Salvando...</span>
                    </div>
                  ) : (
                    <span className="font-medium">Salvar Nova Senha</span>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-500 hover:text-[#00FF99] text-sm transition-colors duration-300 flex items-center justify-center mx-auto font-light group"
              >
                <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">←</span>
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}