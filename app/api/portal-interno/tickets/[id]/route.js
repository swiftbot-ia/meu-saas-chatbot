// ====================================================================
// 2. app/api/portal-interno/tickets/[id]/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { getTicketDetails } from '@/lib/support-actions';

export async function GET(request, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const result = await getTicketDetails(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
