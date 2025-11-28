import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  // Captura a URL de origem e o código
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // 🛡️ DEBUG: Verifica se as chaves existem no ambiente do servidor
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Variáveis de ambiente do Supabase não encontradas.')
    return NextResponse.json({ 
      error: 'Server Configuration Error', 
      message: 'Supabase URL or Key missing in Vercel Environment Variables.' 
    }, { status: 500 })
  }

  if (code) {
    try {
      // 🛡️ Tenta acessar os cookies (compatível com Next.js 13, 14 e 15)
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              try {
                cookieStore.set({ name, value, ...options })
              } catch (err) {
                // Ignora erro de setar cookies em Server Components se acontecer
              }
            },
            remove(name, options) {
              try {
                cookieStore.delete({ name, ...options })
              } catch (err) {
                 // Ignora erro
              }
            },
          },
        }
      )

      // Troca o código pela sessão
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Erro ao trocar código por sessão:', error)
        return NextResponse.redirect(`${origin}/login?error=auth-exchange-error`)
      }

      // ==================================================================
      // 🧠 LÓGICA DE PERFIL (Protegida)
      // ==================================================================
      try {
        if (data?.user) {
            let { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('company_name, full_name, phone')
            .eq('user_id', data.user.id)
            .single()

            // Cria perfil se não existir (PGRST116 = não encontrado)
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
        }
      } catch (err) {
        console.error('Erro não crítico no perfil:', err)
        // Não bloqueia o login por erro no perfil
      }

      return NextResponse.redirect(`${origin}${next}`)

    } catch (err) {
      console.error('CRITICAL ERROR in Auth Callback:', err)
      // Retorna erro visível em vez de 502
      return NextResponse.json({ error: 'Auth Callback Failed', details: err.message }, { status: 500 })
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no-code`)
}