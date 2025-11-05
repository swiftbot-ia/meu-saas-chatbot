// app/api/portal-interno/tickets/team-members/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentSession } from '@/lib/support-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    const { data: teamMembers, error } = await supabaseAdmin
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