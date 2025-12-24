// app/api/affiliates/commissions/route.js
// Endpoint para listar comissões do afiliado

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar se é afiliado
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!affiliate) {
            return NextResponse.json({
                success: false,
                error: 'Você não é um afiliado aprovado'
            }, { status: 403 })
        }

        // Parâmetros de paginação e filtro
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 20
        const status = searchParams.get('status') || null
        const offset = (page - 1) * limit

        // Query base
        let query = supabase
            .from('affiliate_commissions')
            .select(`
        id,
        payment_amount,
        commission_amount,
        commission_rate,
        status,
        payment_date,
        available_date,
        created_at,
        stripe_invoice_id,
        affiliate_referrals (
          id,
          referred_user_id
        )
      `, { count: 'exact' })
            .eq('affiliate_id', affiliate.id)
            .order('payment_date', { ascending: false })
            .range(offset, offset + limit - 1)

        // Filtro por status
        if (status) {
            query = query.eq('status', status)
        }

        const { data: commissions, error: commError, count } = await query

        if (commError) {
            console.error('Erro ao buscar comissões:', commError)
            return NextResponse.json({ success: false, error: 'Erro ao buscar comissões' }, { status: 500 })
        }

        // Calcular totais
        const { data: totals } = await supabase
            .from('affiliate_commissions')
            .select('commission_amount, status')
            .eq('affiliate_id', affiliate.id)

        const summary = {
            pending: (totals || []).filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0),
            available: (totals || []).filter(c => c.status === 'available')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0),
            withdrawn: (totals || []).filter(c => c.status === 'withdrawn')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0),
            total: (totals || []).reduce((sum, c) => sum + parseFloat(c.commission_amount), 0)
        }

        return NextResponse.json({
            success: true,
            commissions: commissions?.map(c => ({
                ...c,
                payment_amount: parseFloat(c.payment_amount),
                commission_amount: parseFloat(c.commission_amount),
                commission_rate: parseFloat(c.commission_rate) * 100,
                is_available: c.status === 'available',
                days_until_available: c.status === 'pending'
                    ? Math.max(0, Math.ceil((new Date(c.available_date) - new Date()) / (1000 * 60 * 60 * 24)))
                    : 0
            })) || [],
            summary,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('❌ Erro ao buscar comissões:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
