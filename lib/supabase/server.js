// lib/supabase/server.js
// ============================================================================
// CLIENTES SERVIDOR - Para API Routes, Server Components, Route Handlers
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================================================
// createClient - Para Server Components, Route Handlers (usa cookies)
// Conforme documentação oficial: https://supabase.com/docs/guides/auth/server-side/nextjs
// ============================================================================
export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
// Lazy initialization com dynamic import para evitar erros no build
// ============================================================================
let _supabaseAdmin = null
let _adminInitPromise = null

async function initAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseServiceKey) {
    const { createClient } = await import('@supabase/supabase-js')
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return _supabaseAdmin
}

// Async getter for new code
export async function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  if (!_adminInitPromise) {
    _adminInitPromise = initAdmin()
  }
  return _adminInitPromise
}

// Legacy export - Proxy that lazy-initializes on first use
export const supabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    if (!_supabaseAdmin) {
      return (...args) => {
        return getSupabaseAdmin().then(client => {
          if (!client) {
            console.error('⚠️ supabaseAdmin não inicializado - verifique as variáveis de ambiente')
            return Promise.reject(new Error('Supabase admin client not initialized'))
          }
          const method = client[prop]
          if (typeof method === 'function') {
            return method.apply(client, args)
          }
          return method
        })
      }
    }
    return _supabaseAdmin[prop]
  }
})
