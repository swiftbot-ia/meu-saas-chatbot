/**
 * Chat Supabase Client
 * Cliente específico para o banco de dados do chat ao vivo
 *
 * IMPORTANTE: O chat database é separado do main database.
 * RLS usa auth.uid() mas a autenticação está no main database.
 * Por isso, usamos Service Role Key para bypass de RLS no servidor.
 * A validação de user_id é feita manualmente no código.
 */

import { createClient } from '@supabase/supabase-js';

// URLs do Supabase do Chat
const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;
const chatSupabaseServiceRoleKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY;

if (!chatSupabaseUrl) {
  console.warn('⚠️ Chat Supabase URL not configured');
}

// Cliente singleton para o chat (browser - com anon key)
let chatSupabaseInstance = null;

export function getChatSupabaseClient() {
  if (!chatSupabaseInstance && chatSupabaseUrl && chatSupabaseAnonKey) {
    chatSupabaseInstance = createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return chatSupabaseInstance;
}

// Cliente singleton para o servidor (com service role key para bypass RLS)
let chatSupabaseServerInstance = null;

/**
 * Cliente para uso no servidor - usa Service Role Key se disponível
 * Isso permite bypass de RLS já que o chat database não compartilha
 * autenticação com o main database.
 *
 * SEGURANÇA: A validação de user_id é feita manualmente no código
 * através do ConversationService.getConversation que verifica ownership.
 */
export function createChatSupabaseClient() {
  if (!chatSupabaseUrl) {
    throw new Error('Chat Supabase URL not configured');
  }

  // Usa service role key se disponível (bypass RLS)
  // Caso contrário, usa anon key (RLS ativado - pode falhar se auth não estiver configurada)
  const key = chatSupabaseServiceRoleKey || chatSupabaseAnonKey;

  if (!key) {
    throw new Error('Chat Supabase credentials not configured. Set CHAT_SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY');
  }

  // Cria singleton para evitar múltiplas conexões
  if (!chatSupabaseServerInstance) {
    chatSupabaseServerInstance = createClient(chatSupabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    if (chatSupabaseServiceRoleKey) {
      console.log('✅ Chat Supabase: Using Service Role Key (RLS bypassed)');
    } else {
      console.warn('⚠️ Chat Supabase: Using Anon Key (RLS may block queries if auth is not shared)');
    }
  }

  return chatSupabaseServerInstance;
}

export const chatSupabase = getChatSupabaseClient();
export default chatSupabase;
