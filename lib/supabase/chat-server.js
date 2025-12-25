// lib/supabase/chat-server.js
// ============================================================================
// CLIENTE ADMIN DO CHAT - APENAS para API Routes (backend)
// ============================================================================
// ⚠️ CRÍTICO: Este arquivo NUNCA deve ser importado em componentes React cliente
// ⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY bypassa RLS - use apenas em API routes seguras (ex: webhooks)

// Lazy initialization with dynamic import to avoid build-time errors
let _chatSupabaseAdmin = null
let _initialized = false

// Função para obter o cliente admin do Chat (lazy init with dynamic import)
export async function getChatSupabaseAdmin() {
  if (!_initialized) {
    _initialized = true
    const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
    const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

    if (chatSupabaseUrl && chatSupabaseServiceKey) {
      const { createClient } = await import('@supabase/supabase-js')
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

// Função helper para criar cliente admin (também com dynamic import)
export async function createChatSupabaseAdminClient() {
  const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
  const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

  if (!chatSupabaseUrl || !chatSupabaseServiceKey) {
    throw new Error('Chat Supabase admin credentials not configured. Please set NEXT_PUBLIC_CHAT_SUPABASE_URL and CHAT_SUPABASE_SERVICE_ROLE_KEY');
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
