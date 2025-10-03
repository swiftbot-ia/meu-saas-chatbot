// app/complete-profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('') // ✅ NOVO CAMPO
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

      // Verificar IMEDIATAMENTE se já tem dados completos
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone') // ✅ INCLUIR TELEFONE
        .eq('user_id', user.id)
        .single()

      // Se já tem company_name E telefone preenchidos, redirecionar IMEDIATAMENTE
      if (profile && 
          profile.company_name && 
          profile.company_name.trim() !== '' &&
          profile.company_name !== null &&
          profile.phone && // ✅ VERIFICAR TELEFONE TAMBÉM
          profile.phone.trim() !== '' &&
          profile.phone !== null) {
        router.push('/dashboard')
        return
      }

      // Só chega aqui se realmente precisa completar o perfil
      setUser(user)
      
      // Pré-preencher com dados disponíveis
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || ''
      setFullName(displayName)
      
      // Pré-preencher dados existentes se houver
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

  // ✅ FUNÇÃO PARA FORMATAR TELEFONE
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  // ✅ FUNÇÃO PARA VALIDAR TELEFONE
  const validatePhone = (phone) => {
    const numbers = phone.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório'
    if (!companyName.trim()) newErrors.companyName = 'Nome da empresa é obrigatório'
    
    // ✅ VALIDAÇÃO DO TELEFONE
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
      // ✅ LIMPAR TELEFONE PARA SALVAR APENAS NÚMEROS
      const cleanPhone = phone.replace(/\D/g, '')
      
      // Atualizar perfil existente (não inserir novo)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          phone: cleanPhone, // ✅ SALVAR TELEFONE LIMPO
          avatar_url: user.user_metadata?.avatar_url || null
        })
        .eq('user_id', user.id)

      if (error) {
        setMessage(`❌ Erro ao salvar: ${error.message}`)
      } else {
        setMessage('✅ Perfil completado com sucesso!')
        // Redirecionar mais rápido
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }

    setLoading(false)
  }

  // Loading de verificação inicial
  if (checking || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 bg-[#04F5A0] rounded-xl flex items-center justify-center mx-auto animate-pulse mb-3">
              <div className="w-6 h-6 bg-black rounded-sm" 
                   style={{
                     clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                   }}
              />
            </div>
            <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-xl blur-lg animate-pulse mx-auto w-12 h-12" />
          </div>
          <p className="text-gray-400 text-sm">Verificando perfil...</p>
        </div>
      </div>
    )
  }

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

      {/* Profile Completion Card */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl shadow-2xl w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-black rounded-sm" 
                   style={{
                     clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                   }}
              />
            </div>
            <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-2xl blur-xl mx-auto w-16 h-16" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Bem-vindo ao SwiftBot! 🎉
          </h1>
          <p className="text-gray-400">Precisamos de mais algumas informações para completar seu perfil</p>
        </div>

        {/* User Info Display */}
        <div className="bg-gray-800/30 rounded-xl p-4 mb-6 border border-gray-700/50">
          <div className="flex items-center">
            {user.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar"
                className="w-12 h-12 rounded-full mr-3 border-2 border-[#04F5A0]/50"
              />
            )}
            <div>
              <p className="text-white font-medium">{user.email}</p>
              <p className="text-gray-400 text-sm">
                Conectado via {user.app_metadata?.provider || 'social login'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleComplete} className="space-y-4">
          
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirme seu Nome Completo *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                errors.fullName ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="João Silva"
            />
            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Nome da Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da sua Empresa *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                errors.companyName ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="Minha Empresa Ltda"
            />
            {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
          </div>

          {/* ✅ NOVO CAMPO: TELEFONE */}
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
                if (formatted.length <= 15) { // Limite de caracteres
                  setPhone(formatted)
                }
              }}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 ${
                errors.phone ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="(11) 99999-9999"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-xl text-sm border ${
              message.includes('✅') 
                ? 'bg-green-900/30 text-green-400 border-green-800' 
                : 'bg-red-900/30 text-red-400 border-red-800'
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
                Salvando...
              </div>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Completar Perfil e Continuar
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
          <p className="text-blue-300 text-sm text-center">
            💡 Esses dados nos ajudam a personalizar sua experiência no SwiftBot
          </p>
        </div>
      </div>
    </div>
  )
}