// ====================================================================
// 5. app/api/portal-interno/clientes/activate-plan/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { activatePlan } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { clientId, planType } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await activatePlan(
      session.user.id,
      clientId,
      planType,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Erro ao ativar plano:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}