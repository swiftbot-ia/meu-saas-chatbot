// app/auth/verify-profile/page.js
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function VerifyProfile() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        // Verificar se o usuário está autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }

        // Verificar perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_name, full_name')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile || !profile.company_name || profile.company_name.trim() === '') {
          router.push('/complete-profile')
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erro na verificação:', error)
        router.push('/complete-profile')
      }
    }

    verifyAndRedirect()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verificando seu perfil...</p>
      </div>
    </div>
  )
}