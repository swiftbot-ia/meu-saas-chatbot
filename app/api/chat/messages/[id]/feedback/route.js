/**
 * API Route: /api/chat/messages/[id]/feedback
 * Register like/dislike feedback for agent messages
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getOwnerUserIdFromMember } from '@/lib/account-service';

// Chat database admin client 
const chatSupabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL,
  process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY
);

// Helper para criar cliente Supabase com cookies (para autenticação)
async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/messages/[id]/feedback
 * Register feedback for a message
 * 
 * Body: { rating: 'like' | 'dislike' }
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createAuthClient();
    const { id } = await params;

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
      }
    } catch (accountError) {
      console.log('⚠️ [Feedback] Account check failed:', accountError.message);
    }

    // Parse request body
    const body = await request.json();
    const { rating } = body;

    // Validate rating
    if (!rating || !['like', 'dislike'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating deve ser "like" ou "dislike"' },
        { status: 400 }
      );
    }

    // Find the message
    const { data: message, error: findError } = await chatSupabaseAdmin
      .from('whatsapp_messages')
      .select('id, message_id, direction, user_id, feedback_rating')
      .eq('id', id)
      .maybeSingle();

    if (findError || !message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Verify ownership (message must belong to user's account)
    if (message.user_id !== ownerUserId) {
      return NextResponse.json(
        { error: 'Sem permissão para avaliar esta mensagem' },
        { status: 403 }
      );
    }

    // Verify it's an outbound message (from the agent)
    if (message.direction !== 'outbound') {
      return NextResponse.json(
        { error: 'Apenas mensagens do agente podem ser avaliadas' },
        { status: 400 }
      );
    }

    // Update the feedback rating
    const { data: updated, error: updateError } = await chatSupabaseAdmin
      .from('whatsapp_messages')
      .update({
        feedback_rating: rating,
        feedback_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar feedback' },
        { status: 500 }
      );
    }

    console.log(`✅ [Feedback] Message ${id} rated as "${rating}" by user ${userId}`);

    return NextResponse.json({
      success: true,
      message_id: id,
      rating: rating,
      feedback_at: updated.feedback_at
    });

  } catch (error) {
    console.error('Error in POST /api/chat/messages/[id]/feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar feedback' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/messages/[id]/feedback
 * Remove feedback from a message
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createAuthClient();
    const { id } = await params;

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get owner's user ID
    let ownerUserId = userId;
    try {
      const ownerFromService = await getOwnerUserIdFromMember(userId);
      if (ownerFromService) {
        ownerUserId = ownerFromService;
      }
    } catch (accountError) {
      console.log('⚠️ [Feedback] Account check failed:', accountError.message);
    }

    // Find the message
    const { data: message, error: findError } = await chatSupabaseAdmin
      .from('whatsapp_messages')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (message.user_id !== ownerUserId) {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    // Remove feedback
    const { error: updateError } = await chatSupabaseAdmin
      .from('whatsapp_messages')
      .update({
        feedback_rating: null,
        feedback_at: null
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error removing feedback:', updateError);
      return NextResponse.json(
        { error: 'Erro ao remover feedback' },
        { status: 500 }
      );
    }

    console.log(`✅ [Feedback] Removed feedback from message ${id}`);

    return NextResponse.json({
      success: true,
      message_id: id,
      rating: null
    });

  } catch (error) {
    console.error('Error in DELETE /api/chat/messages/[id]/feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao remover feedback' },
      { status: 500 }
    );
  }
}
