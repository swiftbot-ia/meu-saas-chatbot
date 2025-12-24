'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gift } from 'lucide-react'
import { captureUtmFromCurrentUrl, getUtmForSubmission } from '@/lib/utmUtils'

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]"></div>
      </div>
    }>
      <AuthPage />
    </Suspense>
  )
}

function AuthPage() {
  // ==================================================================================
  // 🧠 LÓGICA DE ESTADO (MANTIDA 100% IGUAL)
  // ==================================================================================
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const [message, setMessage] = useState('')
  const [authView, setAuthView] = useState('login')
  const [errors, setErrors] = useState({})
  const [referralInfo, setReferralInfo] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // 🔒 URL FIXA DE PRODUÇÃO (Para garantir que o Supabase aceite)
  // Se um dia for testar local, altere para 'http://localhost:3000'
  const SITE_URL = 'https://swiftbot.com.br'

  // CSS Classes extraídas do Design System da referência para consistência
  const baseInputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-500 rounded-3xl px-6 py-4 border outline-none focus:outline-none focus:rounded-3xl focus:bg-[#282828] transition-all duration-300 ease-in-out"

  const getInputClass = (hasError) => {
    if (hasError) {
      return `${baseInputClass} border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]`
    }
    return `${baseInputClass} border-transparent focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]`
  }

  const labelClass = "block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider"

  useEffect(() => {
    // Captura UTMs da URL ao carregar a página
    captureUtmFromCurrentUrl()

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

  // ==================================================================================
  // 🔗 CAPTURAR CÓDIGO DE AFILIADO DA URL
  // ==================================================================================
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      // Salvar no localStorage para usar no checkout
      localStorage.setItem('affiliate_ref_code', refCode.toUpperCase())

      // Validar código e buscar nome do afiliado
      fetch(`/api/affiliates/validate-code?code=${refCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.valid) {
            setReferralInfo({
              code: data.code,
              name: data.affiliate_name
            })
          }
        })
        .catch(err => console.log('Erro ao validar código:', err))
    } else {
      // Verificar se já tem código salvo
      const savedCode = localStorage.getItem('affiliate_ref_code')
      if (savedCode) {
        fetch(`/api/affiliates/validate-code?code=${savedCode}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.valid) {
              setReferralInfo({
                code: data.code,
                name: data.affiliate_name
              })
            }
          })
          .catch(err => console.log('Erro ao validar código salvo:', err))
      }
    }
  }, [searchParams])

  // ==================================================================================
  // 🗣️ TRADUTOR DE ERROS
  // ==================================================================================
  const translateError = (errorMsg) => {
    const msg = errorMsg?.toLowerCase() || ''

    if (msg.includes('invalid login credentials')) {
      return 'Email ou senha incorretos. Tente novamente.'
    }
    if (msg.includes('user already registered')) {
      return 'Este email já está cadastrado. Tente fazer login.'
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve ter no mínimo 6 caracteres.'
    }
    if (msg.includes('rate limit exceeded')) {
      return 'Muitas tentativas. Aguarde um momento e tente novamente.'
    }

    // Fallback: se não for nenhum erro conhecido, retorna o original (ou uma mensagem genérica)
    return errorMsg
  }

  const validateForm = () => {
    const newErrors = {}
    if (authView === 'register') {
      if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório'
      if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem'
      if (password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    if (!email.includes('@')) newErrors.email = 'Email inválido'

    if (authView !== 'forgotPassword' && !password) {
      newErrors.password = 'Senha é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkProfileCompletion = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone')
        .eq('user_id', userId)
        .single()

      const needsCompletion = !profile ||
        !profile.company_name ||
        profile.company_name.trim() === '' ||
        !profile.full_name ||
        profile.full_name.trim() === '' ||
        !profile.phone ||
        profile.phone.trim() === ''

      return needsCompletion
    } catch (error) {
      console.error('Erro ao verificar perfil:', error)
      return true
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    if (authView !== 'forgotPassword') {
      if (!validateForm()) return
    }

    setLoading(true)
    setMessage('')

    try {
      if (authView === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        })

        if (error) {
          // AQUI: Usamos a função de tradução
          setMessage(`❌ ${translateError(error.message)}`)
        } else {
          setMessage('✅ Login realizado com sucesso!')
          const needsCompletion = await checkProfileCompletion(data.user.id)

          if (needsCompletion) {
            router.push('/complete-profile')
          } else {
            router.push('/dashboard')
          }
        }
      } else if (authView === 'register') {

        // ==============================================================================
        // 🔧 CORREÇÃO: URL FIXA + CAPTURA UTMs
        // ==============================================================================
        // Removemos o 'window.location.origin' e usamos a constante fixa
        // Isso garante que o Supabase receba uma URL absoluta válida.

        // Captura UTMs do storage/URL para salvar com o usuário
        const utmData = getUtmForSubmission()

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              // Salva UTMs como metadata do usuário
              utm_source: utmData.utm_source || null,
              utm_medium: utmData.utm_medium || null,
              utm_campaign: utmData.utm_campaign || null,
              utm_term: utmData.utm_term || null,
              utm_content: utmData.utm_content || null,
              registered_from: 'login_page'
            },
            // Força o redirecionamento para o domínio oficial + /login
            emailRedirectTo: `${SITE_URL}/login`
          }
        })

        if (error) {
          // AQUI: Usamos a função de tradução
          setMessage(`❌ ${translateError(error.message)}`)
        } else {
          setMessage('✅ Conta criada com sucesso! Verifique seu email para confirmar.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullName('')
        }
      }
    } catch (error) {
      setMessage(`❌ ${translateError(error.message)}`)
    }
    setLoading(false)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    if (!email) {
      setErrors({ email: 'Email é obrigatório' })
      return
    }
    setLoading(true)
    setMessage('')
    setErrors({})

    try {
      // Usa a URL fixa também para o reset de senha
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/reset-password`,
      })

      if (error) throw error
      setMessage('✅ Email enviado! Verifique sua caixa de entrada.')

    } catch (error) {
      setMessage(`❌ Erro: ${translateError(error.message)}`)
    }
    setLoading(false)
  }

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider)
    try {
      // Conforme documentação oficial: https://supabase.com/docs/guides/auth/social-login/auth-google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${SITE_URL}/auth/callback`,
        }
      })

      if (error) {
        setMessage(`❌ Erro no login com ${provider}: ${translateError(error.message)}`)
        setSocialLoading('')
      }
      // Se não houver erro, o supabase automaticamente redireciona
    } catch (error) {
      setMessage(`❌ ${translateError(error.message)}`)
      setSocialLoading('')
    }
  }

  const socialProviders = [
    {
      name: 'google',
      label: 'Google',
      gradient: 'from-[#DB4437] to-[#C53929]',
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
      gradient: 'from-[#4267B2] to-[#365899]',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    }
  ]

  // ==================================================================================
  // 🎨 RENDERIZAÇÃO
  // ==================================================================================
  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden flex items-center justify-center px-4 pt-24 pb-16">

        {/* Background Ambient Light */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00FF99]/5 rounded-full blur-[100px]" />

        {/* Auth Card Container */}
        <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 relative w-full max-w-lg">

          {/* ✨ Borda Gradiente via Parent Wrapper */}
          <div
            className="rounded-[32px] p-[2px]"
            style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
          >
            <div className="bg-[#111111] rounded-[30px] p-8 md:p-10 shadow-2xl">

              {/* VIEW: ESQUECEU A SENHA */}
              {authView === 'forgotPassword' ? (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
                    <p className="text-[#B0B0B0] text-sm">Digite seu email para enviarmos um link de redefinição.</p>
                  </div>

                  <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={getInputClass(errors.email)}
                        placeholder="seu@email.com"
                      />
                      {errors.email && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.email}</p>}
                    </div>

                    {message && (
                      <div className={`p-4 rounded-2xl text-sm border text-center font-medium ${message.includes('✅')
                        ? 'bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-4 rounded-3xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      ) : (
                        'Enviar Link de Recuperação'
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => { setAuthView('login'); setMessage(''); setErrors({}); }}
                      className="text-[#B0B0B0] hover:text-[#00FF99] text-sm transition-colors duration-300 font-medium"
                    >
                      ← Voltar para o Login
                    </button>
                  </div>
                </>

              ) : (

                /* VIEW: LOGIN / REGISTRO */
                <>
                  {/* Referral Banner */}
                  {referralInfo && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-[#00FF99]/10 to-[#00E88C]/10 border border-[#00FF99]/20 rounded-2xl">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-[#00FF99]" />
                        <span className="text-gray-300">
                          Você foi indicado por <span className="text-[#00FF99] font-bold">{referralInfo.name}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Badge Trial */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-[#1E1E1E] rounded-full px-5 py-2">
                      <div className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse shadow-[0_0_10px_#00FF99]" />
                      <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">4 dias grátis</span>
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {authView === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h1>
                    <p className="text-[#B0B0B0]">
                      {authView === 'login' ? 'Entre para continuar automatizando.' : 'Comece em segundos.'}
                    </p>
                  </div>

                  {/* Social Buttons */}
                  <div className="space-y-3 mb-8">
                    {socialProviders.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => handleSocialLogin(provider.name)}
                        disabled={socialLoading === provider.name}
                        className={`group w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r ${provider.gradient} rounded-3xl text-white font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {socialLoading === provider.name ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            {provider.icon}
                            <span className="text-sm">Continuar com {provider.label}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex items-center justify-center mb-8">
                    <div className="flex-1 border-t border-white/10"></div>
                    <span className="text-xs text-[#505050] uppercase px-4 font-bold tracking-widest">ou continue com email</span>
                    <div className="flex-1 border-t border-white/10"></div>
                  </div>

                  {/* Toggle Personalizado */}
                  <div className="flex bg-[#1E1E1E] rounded-2xl p-1 mb-8">
                    <button
                      onClick={() => { setAuthView('login'); setMessage(''); setErrors({}); }}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${authView === 'login'
                        ? 'bg-[#2A2A2A] text-white shadow-lg'
                        : 'text-gray-500 hover:text-white'
                        }`}
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => { setAuthView('register'); setMessage(''); setErrors({}); }}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${authView === 'register'
                        ? 'bg-[#2A2A2A] text-white shadow-lg'
                        : 'text-gray-500 hover:text-white'
                        }`}
                    >
                      Cadastrar
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-6">

                    {authView === 'register' && (
                      <div>
                        <label className={labelClass}>Nome Completo</label>
                        <input
                          type="text"
                          required={authView === 'register'}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={getInputClass(errors.fullName)}
                          placeholder="Ex: João Silva"
                        />
                        {errors.fullName && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.fullName}</p>}
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={getInputClass(errors.email)}
                        placeholder="seu@email.com"
                      />
                      {errors.email && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.email}</p>}
                    </div>

                    <div>
                      <label className={labelClass}>Senha</label>
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

                    {authView === 'register' && (
                      <div>
                        <label className={labelClass}>Confirmar Senha</label>
                        <input
                          type="password"
                          required={authView === 'register'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={getInputClass(errors.confirmPassword)}
                          placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.confirmPassword}</p>}
                      </div>
                    )}

                    {authView === 'login' && (
                      <div className="flex justify-end pr-2">
                        <button
                          type="button"
                          onClick={() => { setAuthView('forgotPassword'); setMessage(''); setErrors({}); }}
                          className="text-xs text-[#B0B0B0] hover:text-[#00FF99] transition-colors font-medium"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                    )}

                    {message && (
                      <div className={`p-4 rounded-2xl text-sm border text-center font-medium ${message.includes('✅')
                        ? 'bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {message}
                      </div>
                    )}

                    {/* Termos */}
                    {authView === 'register' && (
                      <p className="text-[10px] text-gray-500 text-center px-4">
                        Ao criar conta, você aceita nossos <a href="#" className="text-[#00FF99] hover:underline">Termos</a> e <a href="#" className="text-[#00FF99] hover:underline">Privacidade</a>.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-4 rounded-3xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      ) : (
                        authView === 'login' ? 'Entrar na Plataforma' : 'Criar Conta Grátis'
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => router.push('/')}
                      className="text-[#B0B0B0] hover:text-white text-xs transition-colors font-medium"
                    >
                      Voltar ao início
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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