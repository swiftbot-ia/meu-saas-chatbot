import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Parâmetro "next" opcional para redirecionamento customizado
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    // 1. Cria o cliente Supabase com manipulação correta de cookies para Route Handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // 2. Troca o código pela sessão (Aqui os cookies são setados)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('✅ Auth success! User ID:', data.user?.id)

      // ==================================================================
      // 🧠 SUA LÓGICA DE PERFIL (Mantida e Protegida)
      // ==================================================================
      try {
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_name, full_name, phone')
          .eq('user_id', data.user.id)
          .single()

        // Se perfil não existe, cria automaticamente usando metadados do Google/Face
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Creating profile from auth metadata...')
          
          const newProfile = {
            user_id: data.user.id,
            full_name: data.user.user_metadata?.full_name || '',
            company_name: '', // Google não fornece empresa, deixamos vazio para o usuário preencher
            phone: '', // Google raramente fornece telefone confiável
            email: data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([newProfile])
            .select()
            .single()

          if (!createError) {
            profile = createdProfile
          }
        }

        // Verifica se precisa completar cadastro
        const needsCompletion = !profile || 
                               !profile.company_name || 
                               profile.company_name.trim() === '' ||
                               !profile.full_name ||
                               profile.full_name.trim() === '' ||
                               !profile.phone ||
                               profile.phone.trim() === ''

        if (needsCompletion) {
          return NextResponse.redirect(`${origin}/complete-profile`)
        }

      } catch (err) {
        console.error('Erro não crítico na verificação de perfil:', err)
        // Se der erro no perfil, ainda deixamos o usuário entrar, ele será barrado no dashboard se necessário
      }

      // 3. Sucesso total - Redireciona
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se houver erro no código ou na troca
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}