/**
 * API Route: /api/chat/send
 * Send a text message
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

export async function POST(request) {
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

    // Get owner's user ID for team data sharing
    let ownerUserId = userId;
    try {
      const ownerFromService = await getOwnerUserIdFromMember(userId);
      if (ownerFromService) {
        ownerUserId = ownerFromService;
        if (ownerUserId !== userId) {
          console.log('👥 [ChatSend] Team member, using owner data:', ownerUserId);
        }
      }
    } catch (accountError) {
      console.log('⚠️ [ChatSend] Account check failed:', accountError.message);
    }

    // Send message using owner's user ID
    const result = await MessageService.sendTextMessage(
      conversationId,
      message,
      ownerUserId
    );

    // Return success - webhook will save the message shortly
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        message_content: message,
        direction: 'outbound',
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('Error in POST /api/chat/send:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}

