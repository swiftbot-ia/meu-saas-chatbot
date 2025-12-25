// lib/supabase/server.js
// ============================================================================
// CLIENTES SERVIDOR - Para API Routes, Server Components, Route Handlers
// ============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ============================================================================
// createClient - Para Server Components, Route Handlers (usa cookies)
// Conforme documentação oficial: https://supabase.com/docs/guides/auth/server-side/nextjs
// ============================================================================
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing user sessions.
          }
        },
      },
    }
  )
}

// ============================================================================
// supabaseAdmin - Cliente ADMIN que bypassa RLS (apenas para backend seguro)
// ============================================================================
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null

// Garantir que não seja exportado acidentalmente para o cliente
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ERRO DE SEGURANÇA: lib/supabase/server.js não deve ser importado no cliente! ' +
    'Use lib/supabase/client.js para componentes React.'
  )
}
