// lib/supabase.js
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cliente para componentes do lado do cliente
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}

// MANTER COMPATIBILIDADE - Export do cliente antigo para não quebrar código existente
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

// Cliente para Server Components e Route Handlers (CORRIGIDO para Next.js 15)
export function createServerSupabaseClient(cookieStore) {
  return createServerClient(supabaseUrl, supabaseKey, {
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