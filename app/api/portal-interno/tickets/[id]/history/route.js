// app/api/portal-interno/tickets/[id]/history/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request, { params }) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    console.log('📋 Buscando histórico do ticket:', id);

    // Buscar histórico de respostas e ações
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('support_ticket_responses')
      .select(`
        *,
        support_users (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Erro ao buscar respostas:', responsesError);
    }

    // Buscar logs de ações relacionadas ao ticket
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('support_actions_log')
      .select(`
        *,
        support_users (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('target_ticket_id', id)
      .order('created_at', { ascending: true });

    if (logsError) {
      console.error('Erro ao buscar logs:', logsError);
    }

    // Combinar e ordenar tudo por data
    const history = [
      ...(responses || []).map(r => ({
        id: r.id,
        type: r.is_internal_note ? 'internal_note' : 'response',
        message: r.message,
        created_at: r.created_at,
        user: r.support_users
      })),
      ...(logs || []).map(l => ({
        id: l.id,
        type: 'action',
        action_type: l.action_type,
        description: l.description,
        metadata: l.metadata,
        created_at: l.created_at,
        user: l.support_users
      }))
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    console.log('✅ Histórico encontrado:', history.length, 'itens');

    return NextResponse.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}