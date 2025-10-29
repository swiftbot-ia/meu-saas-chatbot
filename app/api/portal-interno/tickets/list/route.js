// ====================================================================
// 1. app/api/portal-interno/tickets/list/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { getTickets } from '@/lib/support-actions';

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '50')
    };

    const result = await getTickets(filters);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, tickets: result.tickets });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}