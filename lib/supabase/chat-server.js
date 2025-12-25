// lib/supabase/chat-server.js
// ============================================================================
// CLIENTE ADMIN DO CHAT - APENAS para API Routes (backend)
// ============================================================================
// ⚠️ CRÍTICO: Este arquivo NUNCA deve ser importado em componentes React cliente
// ⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY bypassa RLS - use apenas em API routes seguras (ex: webhooks)

import { createClient } from '@supabase/supabase-js'

// Chat Supabase URLs
const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

// Validação
if (!chatSupabaseUrl) {
  console.warn('⚠️ NEXT_PUBLIC_CHAT_SUPABASE_URL não encontrada')
}

if (!chatSupabaseServiceKey) {
  console.warn('⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY não encontrada - chatSupabaseAdmin não funcionará')
  console.warn('⚠️ Verifique se a variável está definida em .env.local')
}

// Cliente ADMIN do Chat - bypassa Row Level Security (RLS)
// Use este cliente para operações de backend que precisam bypassar RLS
// Exemplo: webhooks que recebem mensagens sem contexto de autenticação
export const chatSupabaseAdmin = chatSupabaseServiceKey && chatSupabaseUrl
  ? createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Função helper para criar cliente admin
export function createChatSupabaseAdminClient() {
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
