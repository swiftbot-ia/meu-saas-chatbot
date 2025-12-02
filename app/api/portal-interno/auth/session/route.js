// app/api/portal-interno/auth/session/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session.user
    });

  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar sessão' },
      { status: 500 }
    );
  }
}