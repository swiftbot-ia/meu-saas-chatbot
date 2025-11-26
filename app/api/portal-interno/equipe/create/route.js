// app/api/portal-interno/equipe/create/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession, hasPermission, createSupportUser } from '@/lib/support-auth';

export async function POST(request) {
  try {
    console.log('📝 ========================================');
    console.log('📝 INICIANDO CRIAÇÃO DE USUÁRIO');
    console.log('📝 ========================================');

    // Verificar autenticação
    const session = await getCurrentSession();
    
    if (!session) {
      console.error('❌ Não autenticado');
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ Usuário autenticado:', session.user.full_name);
    console.log('   Role:', session.user.role);

    // Verificar permissão (apenas admin pode criar usuários)
    if (!hasPermission(session.user, ['admin'])) {
      console.error('❌ Sem permissão - Role:', session.user.role);
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      );
    }

    console.log('✅ Permissão verificada');

    // Obter dados do body
    const body = await request.json();
    const { full_name, email, password, role } = body;

    console.log('📦 Dados recebidos:');
    console.log('   Nome:', full_name);
    console.log('   Email:', email);
    console.log('   Role:', role);

    // Validações
    if (!full_name || !email || !password || !role) {
      console.error('❌ Campos obrigatórios faltando');
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Email inválido');
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      console.error('❌ Senha muito curta');
      return NextResponse.json(
        { success: false, error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar role
    const validRoles = ['admin', 'gerente', 'suporte'];
    if (!validRoles.includes(role)) {
      console.error('❌ Role inválida:', role);
      return NextResponse.json(
        { success: false, error: 'Role inválida' },
        { status: 400 }
      );
    }

    console.log('✅ Validações OK');
    console.log('💾 Criando usuário no banco...');

    // Criar usuário
    const result = await createSupportUser(session.user.id, {
      full_name,
      email,
      password,
      role
    });

    if (!result.success) {
      console.error('❌ Erro ao criar usuário:', result.error);
      
      // Mensagem específica para email duplicado
      if (result.error.includes('duplicate') || result.error.includes('unique')) {
        return NextResponse.json(
          { success: false, error: 'Este email já está cadastrado' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ ========================================');
    console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
    console.log('✅ ID:', result.user.id);
    console.log('✅ Nome:', result.user.full_name);
    console.log('✅ Email:', result.user.email);
    console.log('✅ Role:', result.user.role);
    console.log('✅ ========================================');

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERRO FATAL AO CRIAR USUÁRIO');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ========================================');
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}