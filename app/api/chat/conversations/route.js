/**
 * API Route: /api/chat/conversations
 * List conversations for the authenticated user
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import ConversationService from '@/lib/ConversationService';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [Conversations] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get query params
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📥 [Conversations] Params:', { userId, connectionId, search, limit, offset });

    // List conversations
    const result = await ConversationService.listConversations(userId, {
      connectionId,
      search,
      limit,
      offset
    });

    console.log('✅ [Conversations] Result:', { count: result.conversations?.length });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [Conversations] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar conversas' },
      { status: 500 }
    );
  }
}
