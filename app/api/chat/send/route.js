/**
 * API Route: /api/chat/send
 * Send a text message
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import MessageService from '@/lib/MessageService';

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
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
