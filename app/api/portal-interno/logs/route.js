// app/api/portal-interno/logs/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { getActionLogs } from '@/lib/support-actions';

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      supportUserId: searchParams.get('supportUserId') || undefined,
      targetUserId: searchParams.get('targetUserId') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      limit: parseInt(searchParams.get('limit') || '100')
    };

    const result = await getActionLogs(filters);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: result.logs
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}