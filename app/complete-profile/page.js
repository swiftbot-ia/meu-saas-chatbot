// app/complete-profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [checking, setChecking] = useState(true)
  const router = useRouter()

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

      if (profile && 
          profile.company_name && 
          profile.company_name.trim() !== '' &&
          profile.company_name !== null &&
          profile.phone && 
          profile.phone.trim() !== '' &&
          profile.phone !== null) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      
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
    
    if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório'
    if (!companyName.trim()) newErrors.companyName = 'Nome da empresa é obrigatório'
    
    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos'
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
      const cleanPhone = phone.replace(/\D/g, '')
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          phone: cleanPhone,
          avatar_url: user.user_metadata?.avatar_url || null
        })
        .eq('user_id', user.id)

      if (error) {
        setMessage(`❌ Erro ao salvar: ${error.message}`)
      } else {
        setMessage('✅ Perfil completado com sucesso!')
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }

    setLoading(false)
  }

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #0a0010 50%, #000000 100%)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Animated Gradient Blobs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main Card */}
      <div 
        className="relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <svg width="48" height="48" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
              <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99"/>
              <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao <span className="text-[#00FF99]">SwiftBot</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Complete seu perfil para continuar
          </p>
        </div>

        {/* User Info Display */}
        {user.user_metadata?.avatar_url && (
          <div 
            className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar"
              className="w-12 h-12 rounded-full border-2 border-[#00FF99]/30"
            />
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs">
                Conectado via {user.app_metadata?.provider || 'social login'}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleComplete} className="space-y-4">
          
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-300 ${
                errors.fullName ? 'border-2 border-red-500' : 'border border-gray-700'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
              placeholder="João Silva"
              onFocus={(e) => {
                e.target.style.borderColor = '#00FF99'
                e.target.style.boxShadow = '0 0 0 1px #00FF99'
              }}
              onBlur={(e) => {
                if (!errors.fullName) {
                  e.target.style.borderColor = 'rgb(55, 65, 81)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Nome da Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Empresa *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-300 ${
                errors.companyName ? 'border-2 border-red-500' : 'border border-gray-700'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
              placeholder="Minha Empresa Ltda"
              onFocus={(e) => {
                e.target.style.borderColor = '#00FF99'
                e.target.style.boxShadow = '0 0 0 1px #00FF99'
              }}
              onBlur={(e) => {
                if (!errors.companyName) {
                  e.target.style.borderColor = 'rgb(55, 65, 81)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.companyName && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.companyName}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefone de Contato *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value)
                if (formatted.length <= 15) {
                  setPhone(formatted)
                }
              }}
              className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all duration-300 ${
                errors.phone ? 'border-2 border-red-500' : 'border border-gray-700'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
              placeholder="(11) 99999-9999"
              onFocus={(e) => {
                e.target.style.borderColor = '#00FF99'
                e.target.style.boxShadow = '0 0 0 1px #00FF99'
              }}
              onBlur={(e) => {
                if (!errors.phone) {
                  e.target.style.borderColor = 'rgb(55, 65, 81)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Message */}
          {message && (
            <div 
              className={`p-4 rounded-xl text-sm ${
                message.includes('✅') 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_40px_rgba(0,255,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2" />
                Salvando...
              </>
            ) : (
              <>
                🚀 Completar Perfil e Continuar
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div 
          className="mt-6 p-4 rounded-xl text-center"
          style={{
            backgroundColor: 'rgba(35, 35, 35, 0.1)',
            border: '1px solid rgba(144, 0, 255, 0.3)'
          }}
        >
          <p className="text-white text-xs">
            Esses dados nos ajudam a personalizar sua experiência no SwiftBot
          </p>
        </div>

        {/* Voltar ao Início */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-gray-400 hover:text-white text-sm transition-colors duration-300 flex items-center justify-center gap-2"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}