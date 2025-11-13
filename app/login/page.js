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
  const router = useRouter()

  // ✅ Animação IntersectionObserver (padrão estabelecido)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -100px 0px' }
    )
    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
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

  // Verificar se perfil está completo
  const checkProfileCompletion = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone')
        .eq('user_id', userId)
        .single()

      console.log('Profile check:', { profile, error })

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
      return true
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
    } catch (error) {
      setMessage(`❌ ${error.message}`)
      setSocialLoading('')
    }
  }

  const socialProviders = [
    { 
      name: 'google', 
      label: 'Google', 
      gradient: 'from-pink-500 via-purple-500 to-indigo-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )
    },
    { 
      name: 'facebook', 
      label: 'Facebook', 
      gradient: 'from-cyan-400 via-blue-500 to-purple-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  ]

  return (
    <>

      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4 pt-24 pb-16">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Animated Gradient Background - Padrão Pricing */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        
        {/* Orbs de luz animados */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />

        {/* Auth Card com IntersectionObserver */}
        <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 relative w-full max-w-md">
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl hover:bg-white/[0.07] transition-all duration-500">
            
            {/* Badge Trial Gratuito */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2">
                <div className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse" />
                <span className="text-sm text-gray-300 font-light">4 dias grátis • Sem cartão de crédito</span>
              </div>
            </div>

            {/* Título */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-white mb-3">
                Bem-vindo ao <span className="font-normal bg-gradient-to-r from-[#00FF99] to-[#00E88C] bg-clip-text text-transparent">SwiftBot</span>
              </h1>
              <p className="text-gray-400 font-light">
                {isLogin ? 'Entre na sua conta e continue automatizando' : 'Crie sua conta e comece em segundos'}
              </p>
            </div>

            {/* Social Login Buttons - Gradientes do Design System */}
            <div className="space-y-3 mb-6">
              {socialProviders.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleSocialLogin(provider.name)}
                  disabled={socialLoading === provider.name}
                  className={`group w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r ${provider.gradient} rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
                >
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                  
                  {socialLoading === provider.name ? (
                    <div className="flex items-center relative z-10">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span className="font-light">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 relative z-10">
                      {provider.icon}
                      <span className="font-light">Continuar com {provider.label}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

{/* Divider */}
<div className="relative flex items-center justify-center mb-6 gap-4">
  <div className="flex-1 border-t border-white/10"></div>
  <span className="text-sm text-gray-400 font-light">ou</span>
  <div className="flex-1 border-t border-white/10"></div>
</div>

            {/* Toggle Login/Register */}
            <div className="flex bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-light transition-all duration-300 ${
                  isLogin 
                    ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-lg font-medium' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-light transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black shadow-lg font-medium' 
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
                  <label className="block text-sm font-light text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] focus:border-[#00FF99] outline-none transition-all duration-300 font-light ${
                      errors.fullName ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="João Silva"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.fullName}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] focus:border-[#00FF99] outline-none transition-all duration-300 font-light ${
                    errors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.email}</p>}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">
                  Senha *
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

              {/* Confirmar Senha - apenas no cadastro */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-light text-gray-300 mb-2">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required={!isLogin}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] focus:border-[#00FF99] outline-none transition-all duration-300 font-light ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Esqueceu senha link - apenas no login */}
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-gray-400 hover:text-[#00FF99] transition-colors duration-300 font-light"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-xl text-sm border backdrop-blur-sm font-light ${
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
                className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    <span className="font-light">{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                  </div>
                ) : (
                  <span className="font-medium">
                    {isLogin ? '🚀 Entrar na Plataforma' : '✨ Criar Minha Conta'}
                  </span>
                )}
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-[#00FF99] text-sm transition-colors duration-300 flex items-center justify-center mx-auto font-light group"
              >
                <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">←</span>
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para animações */}
      <style jsx global>{`
        .animate-on-scroll {
          transition-property: opacity, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-on-scroll.animate-in {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) !important;
        }
      `}</style>
    </>
  )
}