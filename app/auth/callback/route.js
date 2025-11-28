import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = 'https://swiftbot.com.br'
  if (!code) {
    return new Response(`
      <html><head><meta http-equiv="refresh" content="0;url=${origin}/login"></head></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
            })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Erro de troca de sessão:', error)
      return new Response(`
        <html><head><meta http-equiv="refresh" content="0;url=${origin}/login?error=auth-exchange-error"></head></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }
    // ✅ Lógica completa de perfil
    if (data?.user) {
      try {
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_name, full_name, phone')
          .eq('user_id', data.user.id)
          .single()
        // Criar perfil se não existir
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
        // Verificar se precisa completar cadastro
        const needsCompletion = !profile ||
          !profile.company_name ||
          !profile.full_name ||
          !profile.phone
        if (needsCompletion) {
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <script>window.location.href = '${origin}/complete-profile';</script>
                <meta http-equiv="refresh" content="0;url=${origin}/complete-profile">
              </head>
              <body>Redirecionando para completar perfil...</body>
            </html>
          `, { 
            status: 200,
            headers: { 'Content-Type': 'text/html' } 
          })
        }
      } catch (profileErr) {
        console.error('Erro ao verificar perfil:', profileErr)
        // Continua o fluxo para não travar o usuário
      }
    }
    // Redirect final
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>window.location.href = '${origin}${next}';</script>
          <meta http-equiv="refresh" content="0;url=${origin}${next}">
        </head>
        <body>Login realizado! Redirecionando...</body>
      </html>
    `, { 
      status: 200,
      headers: { 'Content-Type': 'text/html' } 
    })
  } catch (err) {
    console.error('CRITICAL ERROR in Callback:', err)
    return new Response(`
      <html><head><meta http-equiv="refresh" content="0;url=${origin}/login?error=server-error"></head></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
}