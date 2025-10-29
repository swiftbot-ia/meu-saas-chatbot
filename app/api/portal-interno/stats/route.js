// app/api/portal-interno/stats/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 1. Total de Clientes (user_profiles)
    const { count: totalClientes, error: totalError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Erro ao contar total de clientes:', totalError);
    }

    // 2. Clientes Ativos (com assinatura ativa ou trial)
    const { count: clientesAtivos, error: ativosError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trial']);

    if (ativosError) {
      console.error('Erro ao contar clientes ativos:', ativosError);
    }

    // 3. Ações Hoje (support_actions_log das últimas 24h)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const { count: acoesHoje, error: acoesError } = await supabaseAdmin
      .from('support_actions_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoje.toISOString());

    if (acoesError) {
      console.error('Erro ao contar ações hoje:', acoesError);
    }

    // 4. Total da Equipe (support_users)
    const { count: totalEquipe, error: equipeError } = await supabaseAdmin
      .from('support_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (equipeError) {
      console.error('Erro ao contar equipe:', equipeError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalClientes: totalClientes || 0,
        clientesAtivos: clientesAtivos || 0,
        acoesHoje: acoesHoje || 0,
        totalEquipe: totalEquipe || 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}