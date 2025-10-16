'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const [message, setMessage] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [errors, setErrors] = useState({})
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()

  // Mouse tracking para efeitos visuais
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Validações em tempo real
  const validateForm = () => {
    const newErrors = {}
    if (!isLogin) {
      if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório'
      if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem'
      if (password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    if (!email.includes('@')) newErrors.email = 'Email inválido'
    if (!password) newErrors.password = 'Senha é obrigatória'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ NOVA FUNÇÃO: Verificar se perfil está completo
  const checkProfileCompletion = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone')
        .eq('user_id', userId)
        .single()

      console.log('Profile check:', { profile, error })

      // Se não existe perfil ou está incompleto
      const needsCompletion = !profile || 
                             !profile.company_name || 
                             profile.company_name.trim() === '' ||
                             !profile.full_name ||
                             profile.full_name.trim() === '' ||
                             !profile.phone || 
                             profile.phone.trim() === ''

      console.log('Needs completion:', needsCompletion, {
        hasProfile: !!profile,
        hasCompanyName: !!profile?.company_name,
        hasFullName: !!profile?.full_name,
        hasPhone: !!profile?.phone
      })

      return needsCompletion
    } catch (error) {
      console.error('Erro ao verificar perfil:', error)
      return true // Em caso de erro, assumir que precisa completar
    }
  }

  // Autenticação tradicional
  const handleAuth = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // ✅ LOGIN TRADICIONAL COM VERIFICAÇÃO DE PERFIL
        console.log('🔍 Tentando login com:', { email: email, passwordLength: password.length })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        })

        if (error) {
          console.error('❌ Erro detalhado do login:', error)
          setMessage(`❌ ${error.message}`)
        } else {
          console.log('✅ Login bem-sucedido:', data)
          setMessage('✅ Login realizado com sucesso!')
          
          // ✅ VERIFICAR SE PERFIL ESTÁ COMPLETO
          const needsCompletion = await checkProfileCompletion(data.user.id)
          
          if (needsCompletion) {
            console.log('Perfil incompleto - redirecionando para complete-profile')
            router.push('/complete-profile')
          } else {
            console.log('Perfil completo - redirecionando para dashboard')
            router.push('/dashboard')
          }
        }
      } else {
        // ✅ CADASTRO TRADICIONAL SIMPLIFICADO (sem empresa/telefone)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        })

        if (error) {
          setMessage(`❌ ${error.message}`)
        } else {
          setMessage('✅ Conta criada com sucesso! Verifique seu email para confirmar.')
          // Limpar formulário após sucesso
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullName('')
        }
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }
    setLoading(false)
  }

  // Login social
  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `http://localhost:3000/auth/callback`
        }
      })
      if (error) {
        setMessage(`❌ Erro no login com ${provider}: ${error.message}`)
        setSocialLoading('')
      }
      // Se não há erro, o usuário será redirecionado automaticamente
    } catch (error) {
      setMessage(`❌ ${error.message}`)
      setSocialLoading('')
    }
  }

  const socialProviders = [
    { name: 'google', icon: '🔍', label: 'Google', color: 'from-red-500 to-yellow-500' },
    { name: 'facebook', icon: '📘', label: 'Facebook', color: 'from-blue-600 to-blue-700' }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}
        />
      </div>

      {/* Dynamic Gradient */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.1), transparent 40%)`
        }}
      />

      {/* Auth Card com Efeito de Pulsação */}
      <div className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
        
        {/* Animated Background Effects - Similar ao pricing */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-pink-500/35 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-0 left-1/3 w-52 h-52 bg-violet-500/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/4 left-1/2 w-44 h-44 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10">
          
          {/* Logo e Título */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <div className="w-8 h-8 bg-black rounded-sm" 
                     style={{
                       clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                     }}
                />
              </div>
              <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-2xl blur-xl animate-pulse mx-auto w-16 h-16" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-2">
              SwiftBot
            </h1>
            <p className="text-gray-400">Sua plataforma de IA para WhatsApp</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {socialProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSocialLogin(provider.name)}
                disabled={socialLoading === provider.name}
                className={`w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r ${provider.color} rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {socialLoading === provider.name ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Conectando...
                  </div>
                ) : (
                  <>
                    <span className="mr-3 text-lg">{provider.icon}</span>
                    Continuar com {provider.label}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative bg-transparent px-4 text-sm text-gray-400">ou</div>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex bg-gray-800/30 backdrop-blur-sm rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                isLogin 
                  ? 'bg-[#04F5A0] text-black shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                !isLogin 
                  ? 'bg-[#04F5A0] text-black shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Nome Completo - apenas no cadastro */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                    errors.fullName ? 'border-red-500/50' : 'border-gray-700/50'
                  }`}
                  placeholder="João Silva"
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                  errors.email ? 'border-red-500/50' : 'border-gray-700/50'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                  errors.password ? 'border-red-500/50' : 'border-gray-700/50'
                }`}
                placeholder="••••••••"
                minLength={6}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirmar Senha - apenas no cadastro */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700/50'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Esqueceu senha link - apenas no login */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-[#04F5A0] transition-colors duration-300"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-xl text-sm border backdrop-blur-sm ${
                message.includes('✅') 
                  ? 'bg-green-900/20 text-green-400 border-green-800/50' 
                  : 'bg-red-900/20 text-red-400 border-red-800/50'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </div>
              ) : (
                <>
                  <span className="mr-2">{isLogin ? '🚀' : '✨'}</span>
                  {isLogin ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
                </>
              )}
            </button>
          </form>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-[#04F5A0] text-sm transition-colors duration-300 flex items-center justify-center mx-auto"
            >
              <span className="mr-2">←</span>
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}