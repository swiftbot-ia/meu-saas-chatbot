/**
 * API Route: /api/chat/conversations
 * List conversations for the authenticated user
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ConversationService from '@/lib/ConversationService';
import { getOwnerUserIdFromMember } from '@/lib/account-service';

// Helper para criar cliente Supabase com cookies (para autenticação)
async function createAuthClient() {
  const cookieStore = await cookies()
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
    const supabase = await createAuthClient();

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get owner's user ID for team data sharing
    let ownerUserId = userId;
    try {
      const ownerFromService = await getOwnerUserIdFromMember(userId);
      if (ownerFromService) {
        ownerUserId = ownerFromService;
        if (ownerUserId !== userId) {
          console.log('👥 [Conversations] Team member, using owner data:', ownerUserId);
        }
      }
    } catch (accountError) {
      console.log('⚠️ [Conversations] Account check failed:', accountError.message);
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // List conversations using owner's user ID
    const result = await ConversationService.listConversations(ownerUserId, {
      connectionId,
      search,
      limit,
      offset
    });

    console.log(`📋 [Conversations] userId=${userId}, ownerUserId=${ownerUserId}, connectionId=${connectionId}, total=${result.total}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar conversas' },
      { status: 500 }
    );
  }
}

