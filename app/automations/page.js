'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Esta página redireciona para /automations/sequences
// O conteúdo real está nas subrotas:
// - /automations/templates
// - /automations/keywords
// - /automations/sequences

export default function AutomationsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/automations/sequences')
  }, [router])

  return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin text-[#00FF99]" size={32} />
    </div>
  )
}
