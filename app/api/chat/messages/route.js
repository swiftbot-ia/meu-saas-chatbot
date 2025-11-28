/**
 * API Route: /api/chat/messages
 * List messages for a conversation
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import MessageService from '@/lib/MessageService';

export async function GET(request) {
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
