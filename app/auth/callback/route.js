// app/auth/callback/route.js
// Conforme documentação oficial: https://supabase.com/docs/guides/auth/social-login/auth-google

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Se "next" está no param, usa como redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/'
  }

  // URL de produção fixa
  const productionUrl = 'https://swiftbot.com.br'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // ✅ Login com sucesso - verificar perfil
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_name, full_name, phone')
          .eq('user_id', data.user.id)
          .single()

        // Criar perfil se não existir
        if (profileError && profileError.code === 'PGRST116') {
          await supabase
            .from('user_profiles')
            .insert([{
              user_id: data.user.id,
              full_name: data.user.user_metadata?.full_name || '',
              company_name: '',
              phone: '',
              email: data.user.email,
              avatar_url: data.user.user_metadata?.avatar_url || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])

          // Novo usuário precisa completar perfil
          return NextResponse.redirect(`${productionUrl}/complete-profile`)
        }

        // Verificar se precisa completar cadastro
        const needsCompletion = !profile ||
          !profile.company_name ||
          !profile.full_name ||
          !profile.phone

        if (needsCompletion) {
          return NextResponse.redirect(`${productionUrl}/complete-profile`)
        }
      } catch (profileErr) {
        console.error('Erro ao verificar perfil:', profileErr)
        // Continua para dashboard mesmo com erro de perfil
      }

      // Tudo OK - redirecionar para dashboard
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${productionUrl}${next}`)
      }
    }

    // Erro no exchange
    console.error('Erro de troca de sessão:', error)
  }

  // Erro - retornar para login
  return NextResponse.redirect(`${productionUrl}/login?error=auth-callback-error`)
}