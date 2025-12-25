// lib/supabase/chat-server.js
// ============================================================================
// CLIENTE ADMIN DO CHAT - APENAS para API Routes (backend)
// ============================================================================
// ⚠️ CRÍTICO: Este arquivo NUNCA deve ser importado em componentes React cliente
// ⚠️ CHAT_SUPABASE_SERVICE_ROLE_KEY bypassa RLS - use apenas em API routes seguras (ex: webhooks)

// Lazy initialization - client is created on first use
let _chatSupabaseAdmin = null
let _initPromise = null

// Internal function to initialize the client (only called once)
async function initClient() {
  if (_chatSupabaseAdmin) return _chatSupabaseAdmin

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

  return _chatSupabaseAdmin
}

// Async function to get the client (preferred method for new code)
export async function getChatSupabaseAdmin() {
  if (_chatSupabaseAdmin) return _chatSupabaseAdmin
  if (!_initPromise) {
    _initPromise = initClient()
  }
  return _initPromise
}

// Legacy export for backward compatibility
// This Proxy will auto-initialize and forward all method calls
export const chatSupabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    // If client not initialized yet, trigger initialization
    if (!_chatSupabaseAdmin) {
      // For synchronous property access, we need to return a function that returns a promise
      // This works because all Supabase methods return promises anyway
      return (...args) => {
        return getChatSupabaseAdmin().then(client => {
          if (!client) {
            console.error('⚠️ chatSupabaseAdmin não inicializado - verifique as variáveis de ambiente')
            return Promise.reject(new Error('Chat Supabase client not initialized'))
          }
          const method = client[prop]
          if (typeof method === 'function') {
            return method.apply(client, args)
          }
          return method
        })
      }
    }
    return _chatSupabaseAdmin[prop]
  }
})

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
