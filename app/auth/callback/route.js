import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    try {
      const cookieStore = await cookies()

      // ✅ ATUALIZADO: Padrão getAll/setAll (Mais robusto para evitar 502)
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch (err) {
                // Ignora erros de cookie em contextos onde não é permitido setar
                // Isso evita o crash 502
              }
            },
          },
        }
      )

      // Troca o código pela sessão
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Erro de troca de sessão:', error)
        return NextResponse.redirect(`${origin}/login?error=auth-exchange-error`)
      }

      // ==================================================================
      // 🧠 LÓGICA DE PERFIL (Mantida)
      // ==================================================================
      if (data?.user) {
        try {
          let { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('company_name, full_name, phone')
            .eq('user_id', data.user.id)
            .single()

          // Cria perfil se não existir
          if (profileError && profileError.code === 'PGRST116') {
            const newProfile = {
              user_id: data.user.id,
              full_name: data.user.user_metadata?.full_name || '',
              company_name: '',
              phone: '',
              email: data.user.email,
              avatar_url: data.user.user_metadata?.avatar_url || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            const { data: createdProfile } = await supabase
              .from('user_profiles')
              .insert([newProfile])
              .select()
              .single()
              
            if (createdProfile) profile = createdProfile
          }

          // Verifica se precisa completar cadastro
          const needsCompletion = !profile || 
                                 !profile.company_name || 
                                 !profile.full_name ||
                                 !profile.phone

          if (needsCompletion) {
             return NextResponse.redirect(`${origin}/complete-profile`)
          }
        } catch (profileErr) {
          console.error('Erro ao verificar perfil:', profileErr)
          // Continua o fluxo para não travar o usuário
        }
      }

      return NextResponse.redirect(`${origin}${next}`)

    } catch (err) {
      console.error('CRITICAL ERROR in Callback:', err)
      // Redireciona para login com erro genérico em vez de dar tela branca 502
      return NextResponse.redirect(`${origin}/login?error=server-error`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no-code`)
}