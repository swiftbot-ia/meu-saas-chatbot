// lib/supabase/chat-server.js
// ============================================================================
// CLIENTE ADMIN DO CHAT - APENAS para API Routes (backend)
// ============================================================================
// ⚠️ CRÍTICO: Este arquivo NUNCA deve ser importado em componentes React cliente
// ⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY bypassa RLS - use apenas em API routes seguras (ex: webhooks)

import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let _chatSupabaseAdmin = null
let _initialized = false

// Função para obter o cliente admin do Chat (lazy init)
export function getChatSupabaseAdmin() {
  if (!_initialized) {
    _initialized = true
    const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
    const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

    if (chatSupabaseUrl && chatSupabaseServiceKey) {
      _chatSupabaseAdmin = createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } else {
      console.warn('⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_CHAT_SUPABASE_URL não encontrada - chatSupabaseAdmin não funcionará')
    }
  }
  return _chatSupabaseAdmin
}

// Export legacy para compatibilidade - usa getter
export const chatSupabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    const client = getChatSupabaseAdmin()
    if (!client) {
      console.warn('⚠️ chatSupabaseAdmin não inicializado - verifique as variáveis de ambiente')
      return undefined
    }
    return client[prop]
  }
})

// Função helper para criar cliente admin
export function createChatSupabaseAdminClient() {
  const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
  const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

  if (!chatSupabaseUrl || !chatSupabaseServiceKey) {
    throw new Error('Chat Supabase admin credentials not configured. Please set NEXT_PUBLIC_CHAT_SUPABASE_URL and CHAT_SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Garantir que não seja exportado acidentalmente para o cliente
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ERRO DE SEGURANÇA: lib/supabase/chat-server.js não deve ser importado no cliente! ' +
    'Use lib/supabase/chat-client.js para componentes React.'
  )
}

