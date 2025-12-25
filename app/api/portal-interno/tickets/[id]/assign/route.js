// app/api/portal-interno/tickets/[id]/assign/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentSession } from '@/lib/support-auth'

// Lazy initialization to avoid build-time errors
let supabaseAdmin = null
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      supabaseAdmin = createClient(url, key)
    }
  }
  return supabaseAdmin
}

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    // Verificar autenticação
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar permissão (apenas admin e gerente podem atribuir)
    if (session.role !== 'admin' && session.role !== 'gerente') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para atribuir tickets' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { assignedTo } = body

    if (!assignedTo) {
      return NextResponse.json(
        { success: false, error: 'ID do membro da equipe não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o membro da equipe existe
    const { data: teamMember, error: memberError } = await getSupabaseAdmin()
      .from('support_users')
      .select('id, full_name')
      .eq('id', assignedTo)
      .eq('is_active', true)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json(
        { success: false, error: 'Membro da equipe não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar ticket
    const { data: ticket, error: updateError } = await getSupabaseAdmin()
      .from('support_tickets')
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atribuir ticket:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atribuir ticket' },
        { status: 500 }
      )
    }

    // Registrar ação no histórico
    await getSupabaseAdmin()
      .from('support_ticket_responses')
      .insert({
        ticket_id: id,
        support_user_id: session.userId,
        message: `Ticket atribuído para: ${teamMember.full_name}`,
        is_internal_note: true
      })

    // Registrar no log de ações
    await getSupabaseAdmin()
      .from('support_actions_log')
      .insert({
        support_user_id: session.userId,
        action_type: 'ticket_assignment',
        target_user_id: ticket.user_id,
        description: `Ticket #${id} atribuído para ${teamMember.full_name}`
      })

    return NextResponse.json({
      success: true,
      ticket
    })

  } catch (error) {
    console.error('Erro ao atribuir ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atribuir ticket' },
      { status: 500 }
    )
  }
}