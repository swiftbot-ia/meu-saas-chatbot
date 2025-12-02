// ====================================================================
// 5. app/api/portal-interno/tickets/stats/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { getTicketStats } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const result = await getTicketStats();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, stats: result.stats });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}