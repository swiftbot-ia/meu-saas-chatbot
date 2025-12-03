/**
 * API Route: /api/chat/send-media
 * Send a media message (image, video, audio, document)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import MessageService from '@/lib/MessageService';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller);

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

export async function POST(request) {
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

    // Parse form data
    const formData = await request.formData();
    const conversationId = formData.get('conversationId');
    let mediaUrl = formData.get('mediaUrl');
    const caption = formData.get('caption') || '';
    const mediaType = formData.get('mediaType');
    const file = formData.get('file'); // File upload

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
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

    // If file uploaded, save it to VPS
    if (file && file.size > 0) {
      // Create uploads directory if doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalExt = file.name.split('.').pop();
      const filename = `${timestamp}.${originalExt}`;
      const filepath = join(uploadsDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // If audio/webm, convert to ogg
      if (mediaType === 'audio' && (originalExt === 'webm' || file.type.includes('webm'))) {
        const oggFilename = `${timestamp}.ogg`;
        const oggFilepath = join(uploadsDir, oggFilename);

        await new Promise((resolve, reject) => {
          ffmpeg(filepath)
            .toFormat('ogg')
            .audioCodec('libopus')
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .save(oggFilepath);
        });

        // Delete original webm file
        await unlink(filepath);

        // Update mediaUrl to point to the new ogg file
        // Use the dynamic API route for serving the file
        mediaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/uploads/audio/${oggFilename}`;
      } else {
        // Use the dynamic API route for serving the file
        mediaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/uploads/audio/${filename}`;
      }
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'mediaUrl ou file é obrigatório' },
        { status: 400 }
      );
    }

    // Send media message
    const sentMessage = await MessageService.sendMediaMessage(
      conversationId,
      {
        mediaUrl,
        caption,
        mediaType,
        ptt: mediaType === 'audio' // Send as voice note if audio
      },
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'Mídia enviada com sucesso',
      data: sentMessage
    });

  } catch (error) {
    console.error('Error in POST /api/chat/send-media:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mídia' },
      { status: 500 }
    );
  }
}
