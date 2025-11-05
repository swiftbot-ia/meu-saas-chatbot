// ====================================================================
// 3. app/api/portal-interno/clientes/reset-email/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { resetClientEmail } from '@/lib/support-actions';

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { clientId, newEmail } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await resetClientEmail(
      session.user.id,
      clientId,
      newEmail,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Erro ao resetar email:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}