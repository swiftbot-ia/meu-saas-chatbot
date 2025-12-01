// ====================================================================
// 2. app/api/portal-interno/clientes/[id]/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { getClientDetails } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const result = await getClientDetails(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: result.client });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}