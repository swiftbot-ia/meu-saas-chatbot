import { createClient } from '@supabase/supabase-js';

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;

let chatClient = null;

export function createChatSupabaseClient() {
  // Durante o build, retorna um cliente mock se não tiver credenciais
  if (!chatSupabaseUrl || !chatSupabaseAnonKey) {
    // Em produção, isso só acontece durante o build
    if (typeof window === 'undefined') {
      console.warn('⚠️ Chat Supabase não configurado - modo build');
      return null;
    }
    throw new Error('Chat Supabase credentials not configured');
  }

  if (!chatClient) {
    chatClient = createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  return chatClient;
}
