import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // ✅ Refresh da sessão se necessário (importante para evitar expiração)
        // getSession() é mais leve que getUser() e não lança erro se não houver sessão
        await supabase.auth.getSession()

        // Não precisa fazer nada com o resultado - o objetivo é apenas
        // permitir que o Supabase atualize os cookies de sessão automaticamente

        return supabaseResponse
    } catch (err) {
        // Apenas loga erros realmente críticos, não erros de "sessão ausente"
        if (err?.status !== 400 && err?.code !== 'AUTH_SESSION_MISSING') {
            console.error('Middleware: Erro crítico', err)
        }
        // Em qualquer caso, permite que a requisição continue
        return supabaseResponse
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
