/**
 * API Route: /api/chat/send-media
 * Send a media message (image, video, audio, document)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import MessageService from '@/lib/MessageService';

export async function POST(request) {
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

    // Parse form data
    const formData = await request.formData();
    const conversationId = formData.get('conversationId');
    const mediaUrl = formData.get('mediaUrl');
    const caption = formData.get('caption') || '';
    const mediaType = formData.get('mediaType');

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'mediaUrl é obrigatório' },
        { status: 400 }
      );
    }

    if (!mediaType) {
      return NextResponse.json(
        { error: 'mediaType é obrigatório' },
        { status: 400 }
      );
    }

    // Validate media type
    const validTypes = ['image', 'video', 'audio', 'document'];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: `Tipo de mídia inválido. Tipos válidos: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Send media message
    const sentMessage = await MessageService.sendMediaMessage(
      conversationId,
      {
        mediaUrl,
        caption,
        mediaType
      },
      userId
    );

    return NextResponse.json(sentMessage);

  } catch (error) {
    console.error('Error in POST /api/chat/send-media:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mídia' },
      { status: 500 }
    );
  }
}
