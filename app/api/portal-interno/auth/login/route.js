// app/api/portal-interno/auth/login/route.js
import { NextResponse } from 'next/server';
import { loginSupport } from '@/lib/support-auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter IP e User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Fazer login
    const result = await loginSupport(email, password, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Definir cookie com o token
    const cookieStore = await cookies();
    
    // ⚠️ CORREÇÃO: path deve ser '/' para funcionar em todas as rotas
    cookieStore.set('support_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/' // ⚠️ MUDOU AQUI: era '/portal-interno', agora é '/'
    });

    return NextResponse.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}