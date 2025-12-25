// app/api/portal-interno/tickets/[id]/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // ✅ FIX: Await params (Next.js 15)
    const { id } = await params;

    // Buscar ticket completo com informações do usuário
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles (
          id,
          email,
          full_name,
          company_name,
          phone
        ),
        support_users!assigned_to (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket:', ticketError);
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Buscar respostas e histórico
    const { data: responses } = await supabaseAdmin
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

    // Buscar logs de ação
    const { data: logs } = await supabaseAdmin
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

    return NextResponse.json({
      success: true,
      ticket,
      responses: responses || [],
      logs: logs || []
    });

  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}