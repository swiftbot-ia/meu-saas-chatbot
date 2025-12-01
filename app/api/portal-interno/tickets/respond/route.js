// ====================================================================
// 4. app/api/portal-interno/tickets/respond/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { addTicketResponse } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { ticketId, message, isInternalNote } = await request.json();

    if (!message || !ticketId) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const result = await addTicketResponse(session.user.id, ticketId, message, isInternalNote);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, response: result.response });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}