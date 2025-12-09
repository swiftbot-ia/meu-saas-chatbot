// lib/supabase/client.js
// ============================================================================
// CLIENTE PÚBLICO - Pode ser usado em componentes React (frontend)
// ============================================================================
// ⚠️ Este arquivo DEVE usar APENAS variáveis com prefixo NEXT_PUBLIC_

import { createBrowserClient, createServerClient } from '@supabase/ssr'

function getSupabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    // During build time or when not configured, return placeholder
    // This prevents build errors while still catching missing config at runtime
    if (typeof window === 'undefined') {
      return 'https://placeholder.supabase.co'
    }
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  return supabaseUrl
}

function getSupabaseAnonKey() {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    // During build time or when not configured, return placeholder
    // This prevents build errors while still catching missing config at runtime
    if (typeof window === 'undefined') {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlBsYWNlaG9sZGVyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    }
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  return supabaseAnonKey
}

// Cliente para componentes do lado do cliente (React Components)
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
    }
  })
}

// Cliente padrão para compatibilidade com código existente - lazy initialization
let _supabaseClient = null
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
        }
      })
    }
    return _supabaseClient[prop]
  }
})

// Cliente para Server Components (com cookies)
export function createServerSupabaseClient(cookieStore) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
  })
}
