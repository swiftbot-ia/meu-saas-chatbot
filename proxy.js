// proxy.js (raiz do projeto)
// Conforme documentação oficial: https://supabase.com/docs/guides/auth/server-side/nextjs

import { updateSession } from './lib/supabase/proxy.js'

export async function proxy(request) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ogg|mp3|mp4|webm)$).*)',
    ],
}
