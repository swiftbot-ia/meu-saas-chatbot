/**
 * API Route: /api/chat/conversations
 * List conversations for the authenticated user
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ConversationService from '@/lib/ConversationService';

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

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = createAuthClient();

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
