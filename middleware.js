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
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
        // Isso é executado em TODA requisição que passa pelo matcher
        const { data: { user }, error } = await supabase.auth.getUser()

        // Se houver erro de autenticação e usuário estiver acessando rota protegida,
        // redireciona para login (opcional, dependendo da sua lógica)
        if (error) {
            console.error('Middleware: Erro ao verificar sessão', error)
        }

        return supabaseResponse
    } catch (err) {
        console.error('Middleware: Erro crítico', err)
        // Em caso de erro, permite que a requisição continue
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
