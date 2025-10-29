// app/api/portal-interno/equipe/toggle-status/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession, hasPermission, updateSupportUser } from '@/lib/support-auth';

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user, ['admin', 'gerente'])) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão' },
        { status: 403 }
      );
    }

    const { userId, isActive } = await request.json();

    // Não pode desativar a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode desativar sua própria conta' },
        { status: 400 }
      );
    }

    const result = await updateSupportUser(userId, { is_active: isActive });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('Erro ao alterar status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}