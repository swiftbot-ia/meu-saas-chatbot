// app/api/portal-interno/tickets/[id]/note/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentSession } from '@/lib/support-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

    const { id } = params
    const body = await request.json()
    const { note } = body

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nota não pode estar vazia' },
        { status: 400 }
      )
    }

    // Verificar se ticket existe
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar nota interna
    const { data: response, error: responseError } = await supabaseAdmin
      .from('support_ticket_responses')
      .insert({
        ticket_id: id,
        support_user_id: session.userId,
        message: note,
        is_internal_note: true // Nota interna (não será enviada por email)
      })
      .select()
      .single()

    if (responseError) {
      console.error('Erro ao adicionar nota:', responseError)
      return NextResponse.json(
        { success: false, error: 'Erro ao adicionar nota' },
        { status: 500 }
      )
    }

    // Atualizar timestamp do ticket
    await supabaseAdmin
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    // Registrar no log de ações
    await supabaseAdmin
      .from('support_actions_log')
      .insert({
        support_user_id: session.userId,
        action_type: 'internal_note',
        target_user_id: ticket.user_id,
        description: `Nota interna adicionada ao ticket #${id}`
      })

    return NextResponse.json({
      success: true,
      note: response
    })

  } catch (error) {
    console.error('Erro ao adicionar nota interna:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar nota' },
      { status: 500 }
    )
  }
}