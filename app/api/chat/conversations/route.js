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
    console.log('🔄 [Conversations] Iniciando requisição...');

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
    console.log('✅ [Conversations] Usuário autenticado:', userId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📥 [Conversations] Params:', { userId, connectionId, search, limit, offset });

    // List conversations
    console.log('🔍 [Conversations] Buscando conversas...');
    const result = await ConversationService.listConversations(userId, {
      connectionId,
      search,
      limit,
      offset
    });

    console.log('✅ [Conversations] Conversas encontradas:', {
      count: result.conversations?.length,
      total: result.total,
      hasMore: result.hasMore
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [Conversations] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar conversas' },
      { status: 500 }
    );
  }
}
