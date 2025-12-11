/**
 * API Route: /api/chat/conversations/[id]
 * Get conversation details and mark as read
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

export async function GET(request, { params }) {
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
    const { id: conversationId } = await params;

    // Get owner's user ID for team data sharing
    let ownerUserId = userId;
    try {
      const ownerFromService = await getOwnerUserIdFromMember(userId);
      if (ownerFromService) {
        ownerUserId = ownerFromService;
        if (ownerUserId !== userId) {
          console.log('👥 [Conversation] Team member, using owner data:', ownerUserId);
        }
      }
    } catch (accountError) {
      console.log('⚠️ [Conversation] Account check failed:', accountError.message);
    }

    // Get conversation using owner's user ID
    const conversation = await ConversationService.getConversation(conversationId, ownerUserId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);

  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter conversa' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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
    const { id: conversationId } = await params;
    const body = await request.json();

    // Handle different actions
    if (body.action === 'mark_read') {
      await ConversationService.markAsRead(conversationId, userId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'archive') {
      await ConversationService.archiveConversation(conversationId, userId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'unarchive') {
      await ConversationService.unarchiveConversation(conversationId, userId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle_pin') {
      await ConversationService.togglePin(conversationId, userId, body.isPinned);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar conversa' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
    const { id: conversationId } = await params;

    await ConversationService.deleteConversation(conversationId, userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar conversa' },
      { status: 500 }
    );
  }
}
