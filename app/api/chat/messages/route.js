/**
 * API Route: /api/chat/messages
 * List messages for a conversation
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import MessageService from '@/lib/MessageService';
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
          console.log('👥 [Messages] Team member, using owner data:', ownerUserId);
        }
      }
    } catch (accountError) {
      console.log('⚠️ [Messages] Account check failed:', accountError.message);
    }

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

    // List messages using owner's user ID
    console.log(`🔍 [API/messages] Requesting messages for:`, {
      conversationId,
      userId,
      ownerUserId,
      limit,
      before
    });

    const messages = await MessageService.listMessages(conversationId, ownerUserId, {
      limit,
      before
    });

    console.log(`✅ [API/messages] Returning ${messages.length} messages for conversation ${conversationId}`);

    return NextResponse.json({
      messages,
      count: messages.length,
      debug: {
        conversationId,
        limit,
        before
      }
    });

  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar mensagens' },
      { status: 500 }
    );
  }
}

