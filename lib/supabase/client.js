// lib/supabase/client.js
// ============================================================================
// CLIENTE BROWSER - Para componentes React (frontend)
// ============================================================================

import { createBrowserClient, createServerClient } from '@supabase/ssr'

// ✅ Usando fluxo IMPLICIT em vez de PKCE (não precisa de code_verifier)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
      }
    }
  )
}

// Cliente padrão para compatibilidade com código existente - lazy initialization
let _supabaseClient = null
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            flowType: 'implicit',
            detectSessionInUrl: true,
            persistSession: true,
          }
        }
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
