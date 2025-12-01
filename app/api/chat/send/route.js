/**
 * API Route: /api/chat/send
 * Send a text message
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

export async function POST(request) {
  try {
    const supabase = createAuthClient();

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('❌ [SendMessage] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('📤 [SendMessage] userId:', userId);
    const body = await request.json();

    const { conversationId, message } = body;

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode ser vazia' },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: 'Mensagem muito longa (máximo 10.000 caracteres)' },
        { status: 400 }
      );
    }

    // Send message
    const sentMessage = await MessageService.sendTextMessage(
      conversationId,
      message,
      userId
    );

    return NextResponse.json(sentMessage);

  } catch (error) {
    console.error('Error in POST /api/chat/send:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
