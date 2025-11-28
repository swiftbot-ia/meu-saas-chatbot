/**
 * ============================================================================
 * Supabase Chat Service Client
 * ============================================================================
 * Cliente com Service Role Key para bypass de RLS
 * Usado em webhooks e processos servidor que não têm contexto de usuário
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

/**
 * Cria cliente Supabase do Chat Database com Service Role Key
 * ATENÇÃO: Bypassa Row Level Security - usar apenas em servidor
 */
export function createChatServiceClient() {
  if (!chatSupabaseUrl || !chatSupabaseServiceKey) {
    throw new Error('Chat Supabase Service credentials not configured')
  }

  return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
