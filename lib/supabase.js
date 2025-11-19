// lib/supabase.js
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validação de variáveis de ambiente
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}
if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}
if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada - supabaseAdmin não funcionará')
}

// Cliente para componentes do lado do cliente
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}

// MANTER COMPATIBILIDADE - Export do cliente antigo para não quebrar código existente
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

// Cliente ADMIN para API routes (bypassa RLS com Service Role Key)
export const supabaseAdmin = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

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