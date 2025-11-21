// lib/supabase/client.js
// ============================================================================
// CLIENTE PÚBLICO - Pode ser usado em componentes React (frontend)
// ============================================================================
// ⚠️ Este arquivo DEVE usar APENAS variáveis com prefixo NEXT_PUBLIC_

import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validação
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

// Cliente para componentes do lado do cliente (React Components)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Cliente padrão para compatibilidade com código existente
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Cliente para Server Components (com cookies)
export function createServerSupabaseClient(cookieStore) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
