/**
 * API Route: /api/chat/messages
 * List messages for a conversation
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import MessageService from '@/lib/MessageService';

// Helper para criar cliente Supabase com cookies (para autenticação)
function createAuthClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET(request) {
  try {
    console.log('📋 [Messages] Iniciando listagem de mensagens');

    const supabase = createAuthClient();

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('❌ [Messages] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log('👤 [Messages] userId:', session.user.id);
    const userId = session.user.id;

    // Get query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    // List messages
    const messages = await MessageService.listMessages(conversationId, userId, {
      limit,
      before
    });

    return NextResponse.json({
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar mensagens' },
      { status: 500 }
    );
  }
}
