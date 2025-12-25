// app/api/portal-interno/tickets/team-members/route.js
import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/support-auth'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization with dynamic import to avoid build-time errors
let supabaseAdmin = null
async function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      supabaseAdmin = createClient(url, key)
    }
  }
  return supabaseAdmin
}

export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar membros ativos da equipe
    const { data: teamMembers, error } = await getSupabaseAdmin()
      .from('support_users')
      .select('id, full_name, email, role')
      .eq('is_active', true)
      .order('full_name')

    if (error) {
      console.error('Erro ao buscar equipe:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar equipe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      teamMembers: teamMembers || []
    })

  } catch (error) {
    console.error('Erro ao buscar membros da equipe:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar equipe' },
      { status: 500 }
    )
  }
}