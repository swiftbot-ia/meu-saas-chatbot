'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css' // Importante: Garanta que seu projeto suporte import de CSS de node_modules

// ==================================================================================
// 🚀 COMPONENTE PRINCIPAL
// ==================================================================================
export default function CompleteProfile() {
  const [user, setUser] = useState(null)
  
  // Form States
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('') // O PhoneInput gerencia o valor completo (E.164)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // Styles (Design System)
  const baseInputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-500 rounded-3xl px-6 py-4 border outline-none focus:outline-none focus:rounded-3xl focus:bg-[#282828] transition-all duration-300 ease-in-out"
  const labelClass = "block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider"

  const getInputClass = (hasError) => {
    if (hasError) {
        return `${baseInputClass} border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]`
    }
    return `${baseInputClass} border-transparent focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]`
  }

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone')
        .eq('user_id', user.id)
        .single()

      // Se já estiver completo, redireciona
      if (profile && profile.company_name && profile.phone) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      
      // Pre-fill
      const displayName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || ''
      setFullName(displayName)
      
      if (profile) {
        if (profile.company_name) setCompanyName(profile.company_name)
        if (profile.full_name) setFullName(profile.full_name)
        if (profile.phone) setPhone(profile.phone)
      }
      
      setChecking(false)
      
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório'
    if (!companyName.trim()) newErrors.companyName = 'Nome da empresa é obrigatório'
    
    if (!phone) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (phone && !isValidPhoneNumber(phone)) {
       // isValidPhoneNumber verifica se o número bate com o padrão do país
       newErrors.phone = 'Número de telefone inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          phone: phone, // Já está no formato E.164 (ex: +5511999999999)
          avatar_url: user.user_metadata?.avatar_url || null
        })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage('✅ Perfil atualizado!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }

    setLoading(false)
  }

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden flex items-center justify-center px-4 py-12">
      
      {/* Background Ambient Light */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#00FF99]/5 rounded-full blur-[100px]" />

      {/* Main Container com Borda Gradiente */}
      <div className="relative w-full max-w-lg animate-fade-in-up">
        <div 
            className="rounded-[32px] p-[2px]"
            style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
        >
            <div className="bg-[#111111] rounded-[30px] p-8 md:p-10 shadow-2xl">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#00FF99]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-[#00FF99]/20">
                        <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-2">
                    Complete seu <span className="text-[#00FF99]">Perfil</span>
                    </h1>
                    <p className="text-[#B0B0B0]">
                    Precisamos de alguns detalhes para personalizar sua experiência.
                    </p>
                </div>

                {/* Avatar Display */}
                {user.user_metadata?.avatar_url && (
                    <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] rounded-3xl mb-8 border border-white/5">
                        <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Avatar"
                            className="w-14 h-14 rounded-full border-2 border-[#00FF99]/30 p-0.5"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-white font-bold truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Conta Verificada</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleComplete} className="space-y-6">
                    
                    {/* Nome Completo */}
                    <div>
                        <label className={labelClass}>Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={getInputClass(errors.fullName)}
                            placeholder="Ex: João Silva"
                        />
                        {errors.fullName && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.fullName}</p>}
                    </div>

                    {/* Nome da Empresa */}
                    <div>
                        <label className={labelClass}>Nome da Empresa</label>
                        <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={getInputClass(errors.companyName)}
                            placeholder="Ex: Tech Solutions Ltda"
                        />
                        {errors.companyName && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.companyName}</p>}
                    </div>

                    {/* Telefone Global via react-phone-number-input */}
                    <div>
                        <label className={labelClass}>WhatsApp / Celular</label>
                        <div className={`
                            relative transition-all duration-300
                            ${errors.phone ? 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
                        `}>
                            <PhoneInput
                                international
                                defaultCountry="BR"
                                value={phone}
                                onChange={setPhone}
                                className={`custom-phone-input ${errors.phone ? 'error' : ''}`}
                            />
                        </div>
                        {errors.phone && <p className="text-red-400 text-xs ml-4 mt-1.5">{errors.phone}</p>}
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`p-4 rounded-2xl text-sm border text-center font-medium animate-in fade-in zoom-in duration-300 ${
                            message.includes('✅') 
                            ? 'bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                            {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-4 rounded-3xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <span>Concluir Cadastro</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Info */}
                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <p className="text-[#505050] text-xs max-w-xs mx-auto">
                        Seus dados são utilizados apenas para personalizar sua comunicação dentro da plataforma.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 text-[#B0B0B0] hover:text-white text-xs transition-colors font-medium hover:underline"
                    >
                        Sair desta conta
                    </button>
                </div>
            </div>
        </div>
      </div>

      <style jsx global>{`
        /* Animações */
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* CUSTOMIZAÇÃO TOTAL DO REACT-PHONE-NUMBER-INPUT 
           Para matching perfeito com o design system #1E1E1E Rounded-3xl
        */
        .custom-phone-input {
            display: flex;
            align-items: center;
            background-color: #1E1E1E; /* Cor de fundo sólida */
            border-radius: 24px; /* Rounded-3xl equivalent */
            padding: 4px 16px 4px 8px; /* Padding interno */
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }

        /* Estado Focus no container */
        .custom-phone-input:focus-within {
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
            background-color: #282828;
        }

        /* Estado de Erro */
        .custom-phone-input.error {
            border-color: #ef4444;
        }

        /* Input de texto real (o campo onde digita os números) */
        .PhoneInputInput {
            background-color: transparent;
            border: none;
            color: white;
            font-size: 16px;
            height: 56px; /* Altura consistente com os outros inputs */
            outline: none;
            padding-left: 12px;
            width: 100%;
        }

        .PhoneInputInput::placeholder {
            color: #6b7280; /* gray-500 */
        }

        /* Seletor de País (Bandeira) */
        .PhoneInputCountry {
            margin-right: 0;
            padding: 8px 12px;
            border-radius: 18px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .PhoneInputCountry:hover {
            background-color: rgba(255,255,255,0.05);
        }

        .PhoneInputCountrySelect {
            background-color: #1E1E1E;
            color: white;
            border-radius: 8px;
        }

        .PhoneInputCountrySelectArrow {
            color: #9ca3af; /* gray-400 */
            opacity: 0.7;
            border-bottom-width: 2px;
            border-right-width: 2px;
            width: 8px;
            height: 8px;
        }

        /* Foco na bandeira */
        .PhoneInputCountry:focus .PhoneInputCountrySelectArrow {
            color: #00FF99;
        }
      `}</style>
    </div>
  )
}