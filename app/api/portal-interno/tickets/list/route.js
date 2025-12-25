// app/api/portal-interno/tickets/list/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentSession } from '@/lib/support-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Verificar autenticação
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // open, in_progress, resolved, closed, all
    const priority = searchParams.get('priority') // low, normal, high, urgent, all
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search') // Busca por assunto ou mensagem
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Construir query
    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles (
          id,
          email,
          full_name,
          phone
        ),
        assigned_to_user:support_users!support_tickets_assigned_to_fkey (
          id,
          full_name
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        query = query.is('assigned_to', null)
      } else {
        query = query.eq('assigned_to', assignedTo)
      }
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false })

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Erro ao buscar tickets:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar tickets' },
        { status: 500 }
      )
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil(count / limit)

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasMore: page < totalPages
      }
    })

  } catch (error) {
    console.error('Erro ao listar tickets:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar tickets' },
      { status: 500 }
    )
  }
}