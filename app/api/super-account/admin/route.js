import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { action, target_user_id } = await request.json();

    // Verificar se quem está chamando é super account
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('is_super_account')
      .eq('user_id', user.id)
      .single();

    if (!adminProfile?.is_super_account) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    switch (action) {
      case 'grant_super':
        await supabase
          .from('user_profiles')
          .update({ is_super_account: true })
          .eq('user_id', target_user_id);

        return NextResponse.json({ success: true, message: 'Super account concedida' });

      case 'revoke_super':
        await supabase
          .from('user_profiles')
          .update({ is_super_account: false })
          .eq('user_id', target_user_id);

        return NextResponse.json({ success: true, message: 'Super account revogada' });

      case 'list_supers':
        const { data: superAccounts } = await supabase
          .from('user_profiles')
          .select('user_id, empresa, email')
          .eq('is_super_account', true);

        return NextResponse.json({ superAccounts });

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}