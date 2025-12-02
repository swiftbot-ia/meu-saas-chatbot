// app/api/portal-interno/equipe/[id]/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession, hasPermission, deleteSupportUser } from '@/lib/support-auth';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Não pode deletar a si mesmo
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      );
    }

    const result = await deleteSupportUser(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}