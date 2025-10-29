// app/api/portal-interno/auth/logout/route.js
import { NextResponse } from 'next/server';
import { logoutSupport, getCurrentSession } from '@/lib/support-auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    
    if (session?.token) {
      await logoutSupport(session.token);
    }

    // Remover cookie
    const cookieStore = await cookies();
    cookieStore.delete('support_session');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}