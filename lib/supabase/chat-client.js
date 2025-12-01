import { createClient } from '@supabase/supabase-js';

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
const chatSupabaseAnonKey = process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY;

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
