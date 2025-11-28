/**
 * API Route: /api/chat/conversations
 * List conversations for the authenticated user
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import ConversationService from '@/lib/ConversationService';

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
    const connectionId = searchParams.get('connectionId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // List conversations
    const result = await ConversationService.listConversations(userId, {
      connectionId,
      search,
      limit,
      offset
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar conversas' },
      { status: 500 }
    );
  }
}
