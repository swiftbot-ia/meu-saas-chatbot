import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { action, target_user_id } = await request.json();

    // Este endpoint deve ser chamado apenas por super admins
    // Você deve implementar autenticação adequada aqui
    
    switch (action) {
      case 'grant_super':
        const { error: grantError } = await supabase
          .from('user_profiles')
          .update({ is_super_account: true })
          .eq('user_id', target_user_id);

        if (grantError) throw grantError;
        return NextResponse.json({ success: true, message: 'Super account concedida' });

      case 'revoke_super':
        const { error: revokeError } = await supabase
          .from('user_profiles')
          .update({ is_super_account: false })
          .eq('user_id', target_user_id);

        if (revokeError) throw revokeError;
        return NextResponse.json({ success: true, message: 'Super account revogada' });

      case 'list_supers':
        const { data: superAccounts, error: listError } = await supabase
          .from('user_profiles')
          .select('user_id, empresa, email')
          .eq('is_super_account', true);

        if (listError) throw listError;
        return NextResponse.json({ superAccounts });

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}