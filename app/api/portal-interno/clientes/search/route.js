// ====================================================================
// 1. app/api/portal-interno/clientes/search/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { searchClients } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const result = await searchClients(query);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, clients: result.clients });

  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}