// lib/supabase.js
// ============================================================================
// ARQUIVO DE COMPATIBILIDADE
// ============================================================================
// Este arquivo mantém exports antigos funcionando para não quebrar código existente
//
// ⚠️ MIGRAÇÃO RECOMENDADA:
// - Componentes React: use 'lib/supabase/client.js'
// - API Routes: use 'lib/supabase/server.js'

// Re-exportar cliente público (seguro para usar no frontend)
export { supabase, createClient, createServerSupabaseClient } from './supabase/client.js'

// Re-exportar cliente admin (APENAS para API routes)
export { supabaseAdmin } from './supabase/server.js'
