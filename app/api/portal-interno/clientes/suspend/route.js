// ====================================================================
// 6. app/api/portal-interno/clientes/suspend/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { suspendAccount, reactivateAccount } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { clientId, action, reason } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let result;
    if (action === 'suspend') {
      result = await suspendAccount(session.user.id, clientId, reason, ipAddress, userAgent);
    } else if (action === 'reactivate') {
      result = await reactivateAccount(session.user.id, clientId, ipAddress, userAgent);
    } else {
      return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Erro na ação:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
