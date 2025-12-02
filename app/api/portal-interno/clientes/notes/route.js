// ====================================================================
// 7. app/api/portal-interno/clientes/notes/route.js
// ====================================================================
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { addNote, getClientNotes } from '@/lib/support-actions';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const result = await getClientNotes(clientId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, notes: result.notes });

  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { clientId, note, isImportant } = await request.json();

    const result = await addNote(session.user.id, clientId, note, isImportant);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, note: result.note });

  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}