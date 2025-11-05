import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { action, user_id, connection_number, quantity } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
    }

    // Verificar se é super account
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_account')
      .eq('user_id', user_id)
      .single();

    if (!profile?.is_super_account) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    switch (action) {
      case 'add':
        const { data: maxConnection } = await supabase
          .from('user_connections')
          .select('connection_number')
          .eq('user_id', user_id)
          .order('connection_number', { ascending: false })
          .limit(1)
          .single();

        const startNumber = (maxConnection?.connection_number || 0) + 1;
        const newConnections = Array.from({ length: quantity || 1 }, (_, i) => ({
          user_id: user_id,
          connection_number: startNumber + i,
          instance_name: `swiftbot_${user_id.substring(0, 8)}_${startNumber + i}`,
          status: 'disconnected'
        }));

        const { data: created, error: createError } = await supabase
          .from('user_connections')
          .insert(newConnections)
          .select();

        if (createError) throw createError;

        return NextResponse.json({
          success: true,
          connections: created,
          message: `${quantity || 1} conexão(ões) adicionada(s)`
        });

      case 'remove':
        if (!connection_number) {
          return NextResponse.json({ error: 'connection_number obrigatório' }, { status: 400 });
        }

        const { error: deleteError } = await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user_id)
          .eq('connection_number', connection_number);

        if (deleteError) throw deleteError;

        return NextResponse.json({
          success: true,
          message: `Conexão ${connection_number} removida`
        });

      case 'reset_all':
        await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user_id);

        const defaultConnections = Array.from({ length: 7 }, (_, i) => ({
          user_id: user_id,
          connection_number: i + 1,
          instance_name: `swiftbot_${user_id.substring(0, 8)}_${i + 1}`,
          status: 'disconnected'
        }));

        const { error: resetError } = await supabase
          .from('user_connections')
          .insert(defaultConnections);

        if (resetError) throw resetError;

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