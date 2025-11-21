// lib/supabase/server.js
// ============================================================================
// CLIENTE ADMIN - APENAS para API Routes (backend)
// ============================================================================
// ⚠️ CRÍTICO: Este arquivo NUNCA deve ser importado em componentes React cliente
// ⚠️ SUPABASE_SERVICE_ROLE_KEY bypassa RLS - use apenas em API routes seguras

import { createClient } from '@supabase/supabase-js'

// SUPABASE_SERVICE_ROLE_KEY NÃO DEVE SER ACESSÍVEL NO CLIENTE
// Garanta que esta variável NÃO tenha o prefixo NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validação
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada - supabaseAdmin não funcionará')
  console.warn('⚠️ Verifique se a variável está definida em .env.local')
}

// Cliente ADMIN - bypassa Row Level Security (RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Garantir que não seja exportado acidentalmente para o cliente
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ERRO DE SEGURANÇA: lib/supabase/server.js não deve ser importado no cliente! ' +
    'Use lib/supabase/client.js para componentes React.'
  )
}
