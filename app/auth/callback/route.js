import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  if (!code) {
    return new Response(`
      <html><head><meta http-equiv="refresh" content="0;url=https://swiftbot.com.br/login"></head></html>
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return new Response(`
        <html><head><meta http-equiv="refresh" content="0;url=https://swiftbot.com.br/login?error=auth"></head></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }
    // ✅ Redirect via JavaScript (mais confiável após setar cookies)
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <script>window.location.href = 'https://swiftbot.com.br/dashboard';</script>
          <meta http-equiv="refresh" content="0;url=https://swiftbot.com.br/dashboard">
        </head>
        <body>Login realizado! Redirecionando...</body>
      </html>
    `, { 
      status: 200,
      headers: { 'Content-Type': 'text/html' } 
    })
  } catch (err) {
    console.error('ERRO:', err)
    return new Response(`
      <html><head><meta http-equiv="refresh" content="0;url=https://swiftbot.com.br/login"></head></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
}
