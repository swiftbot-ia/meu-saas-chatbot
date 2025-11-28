/**
 * Chat Supabase Client
 * Cliente específico para o banco de dados do chat ao vivo
 */

import { createClient } from '@supabase/supabase-js';

// URLs do Supabase do Chat
const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;

if (!chatSupabaseUrl || !chatSupabaseAnonKey) {
  console.warn('⚠️ Chat Supabase credentials not configured');
}

// Cliente singleton para o chat
let chatSupabaseInstance = null;

export function getChatSupabaseClient() {
  if (!chatSupabaseInstance && chatSupabaseUrl && chatSupabaseAnonKey) {
    chatSupabaseInstance = createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
      auth: {
        persistSession: false, // Não persistir sessão (usaremos a do banco principal)
        autoRefreshToken: false,
      }
    });
  }
  return chatSupabaseInstance;
}

// Cliente para uso no servidor (com service role se necessário)
export function createChatSupabaseClient() {
  if (!chatSupabaseUrl || !chatSupabaseAnonKey) {
    throw new Error('Chat Supabase credentials not configured');
  }

  return createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

export const chatSupabase = getChatSupabaseClient();
export default chatSupabase;
