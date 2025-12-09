// lib/supabase/client.js
// ============================================================================
// CLIENTE BROWSER - Para componentes React (frontend)
// Conforme documentação oficial: https://supabase.com/docs/guides/auth/server-side/nextjs
// ============================================================================

import { createBrowserClient, createServerClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Cliente padrão para compatibilidade com código existente - lazy initialization
let _supabaseClient = null
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    }
    return _supabaseClient[prop]
  }
})

// ============================================================================
// createServerSupabaseClient - Para Server Components (mantido para compatibilidade)
// ============================================================================
export function createServerSupabaseClient(cookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          try {
            const cookie = await cookieStore.get(name)
            return cookie?.value
          } catch (error) {
            return undefined
          }
        },
        async set(name, value, options) {
          try {
            await cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignora erros silenciosamente
          }
        },
        async remove(name, options) {
          try {
            await cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignora erros silenciosamente
          }
        },
      },
    }
  )
}
