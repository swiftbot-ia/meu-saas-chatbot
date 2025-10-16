import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é super account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_account')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_super_account) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { action, connection_number, quantity } = await request.json();

    switch (action) {
      case 'add':
        // Adicionar novas conexões
        const { data: maxConnection } = await supabase
          .from('user_connections')
          .select('connection_number')
          .eq('user_id', user.id)
          .order('connection_number', { ascending: false })
          .limit(1)
          .single();

        const startNumber = (maxConnection?.connection_number || 0) + 1;
        const newConnections = Array.from({ length: quantity || 1 }, (_, i) => ({
          user_id: user.id,
          connection_number: startNumber + i,
          instance_name: `swiftbot_${user.id.substring(0, 8)}_${startNumber + i}`,
          status: 'disconnected'
        }));

        const { data: created } = await supabase
          .from('user_connections')
          .insert(newConnections)
          .select();

        return NextResponse.json({ 
          success: true, 
          connections: created,
          message: `${quantity || 1} conexão(ões) adicionada(s)` 
        });

      case 'remove':
        // Remover conexão específica
        if (!connection_number) {
          return NextResponse.json({ error: 'connection_number obrigatório' }, { status: 400 });
        }

        const { error: deleteError } = await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connection_number', connection_number);

        if (deleteError) throw deleteError;

        return NextResponse.json({ 
          success: true, 
          message: `Conexão ${connection_number} removida` 
        });

      case 'reset_all':
        // Resetar todas as conexões
        await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user.id);

        // Criar 7 conexões novas
        const defaultConnections = Array.from({ length: 7 }, (_, i) => ({
          user_id: user.id,
          connection_number: i + 1,
          instance_name: `swiftbot_${user.id.substring(0, 8)}_${i + 1}`,
          status: 'disconnected'
        }));

        await supabase
          .from('user_connections')
          .insert(defaultConnections);

        return NextResponse.json({ 
          success: true, 
          message: 'Todas as conexões foram resetadas' 
        });

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao gerenciar conexões:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerenciar conexões',
      details: error.message 
    }, { status: 500 });
  }
}