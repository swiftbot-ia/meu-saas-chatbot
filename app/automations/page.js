'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import UnderDevelopment from '../components/UnderDevelopment'

/**
 * Página de Automações (Em Desenvolvimento)
 */
export default function AutomationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <UnderDevelopment
      title="Automações"
      icon="🤖"
      description="Configure fluxos automatizados, respostas inteligentes e gatilhos personalizados para otimizar seu atendimento."
      backUrl="/dashboard"
    />
  )
}
