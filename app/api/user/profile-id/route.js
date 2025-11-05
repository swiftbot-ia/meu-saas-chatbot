// app/api/user/profile-id/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, company_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      companyName: profile.company_name
    })

  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}