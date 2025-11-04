// app/api/portal-interno/tickets/[id]/update-status/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const statusLabels = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

export async function POST(request, { params }) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { status, internalNote } = await request.json();

    // Validar status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      );
    }

    console.log(`📝 Atualizando ticket ${id} para status: ${status} por ${session.user.full_name}`);

    // Buscar status anterior
    const { data: ticketBefore } = await supabaseAdmin
      .from('support_tickets')
      .select('status')
      .eq('id', id)
      .single();

    // Atualizar ticket
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Se resolvido, adicionar campos
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_by = session.user.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar ticket:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    // ✅ CRÍTICO: Registrar ação COM NOME DO USUÁRIO
    const oldStatusLabel = statusLabels[ticketBefore?.status] || ticketBefore?.status;
    const newStatusLabel = statusLabels[status];

    await supabaseAdmin
      .from('support_actions_log')
      .insert({
        support_user_id: session.user.id, // ✅ ID do usuário que fez a ação
        action_type: 'status_changed',
        target_ticket_id: id,
        description: `Status alterado para: ${newStatusLabel}`,
        metadata: {
          old_status: ticketBefore?.status,
          new_status: status,
          changed_by: session.user.full_name // ✅ Nome para garantia extra
        }
      });

    // Se houver nota interna, adicionar
    if (internalNote && internalNote.trim()) {
      await supabaseAdmin
        .from('support_ticket_responses')
        .insert({
          ticket_id: id,
          support_user_id: session.user.id,
          message: internalNote,
          is_internal_note: true
        });

      // Log da nota interna
      await supabaseAdmin
        .from('support_actions_log')
        .insert({
          support_user_id: session.user.id,
          action_type: 'internal_note_added',
          target_ticket_id: id,
          description: 'Nota interna adicionada'
        });
    }

    console.log('✅ Status atualizado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}