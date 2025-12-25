// Lazy initialization with dynamic import to avoid build-time errors
let chatClient = null;

export async function createChatSupabaseClient() {
  const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
  const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;

  // Durante o build, retorna null se não tiver credenciais
  if (!chatSupabaseUrl || !chatSupabaseAnonKey) {
    // Em produção, isso só acontece durante o build
    if (typeof window === 'undefined') {
      console.warn('⚠️ Chat Supabase não configurado - modo build');
      return null;
    }
    throw new Error('Chat Supabase credentials not configured');
  }

  if (!chatClient) {
    const { createClient } = await import('@supabase/supabase-js');
    chatClient = createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  return chatClient;
}
