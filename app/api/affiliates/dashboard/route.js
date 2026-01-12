// app/api/affiliates/dashboard/route.js
// Endpoint para obter dados do painel do afiliado

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

        // Verificar se é afiliado ativo
        const { data: affiliate, error: affError } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (affError || !affiliate) {
            return NextResponse.json({
                success: false,
                error: 'Você não é um afiliado aprovado'
            }, { status: 403 })
        }

        // Buscar estatísticas de referrals
        const { data: referrals, error: refError } = await supabase
            .from('affiliate_referrals')
            .select('id, status')
            .eq('affiliate_id', affiliate.id)

        const referralStats = {
            total: referrals?.length || 0,
            active: referrals?.filter(r => r.status === 'active').length || 0,
            registered: referrals?.filter(r => r.status === 'registered').length || 0,
            expired: referrals?.filter(r => r.status === 'expired').length || 0,
            churned: referrals?.filter(r => r.status === 'churned').length || 0
        }

        // Buscar estatísticas de comissões
        const { data: commissions, error: commError } = await supabase
            .from('affiliate_commissions')
            .select('commission_amount, status, created_at')
            .eq('affiliate_id', affiliate.id)

        const commissionStats = {
            total_pending: commissions?.filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0,
            total_available: commissions?.filter(c => c.status === 'available')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0,
            total_withdrawn: commissions?.filter(c => c.status === 'withdrawn')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0
        }

        // Buscar últimas comissões
        const { data: recentCommissions } = await supabase
            .from('affiliate_commissions')
            .select(`
        id,
        payment_amount,
        commission_amount,
        status,
        payment_date,
        available_date,
        referral_id,
        affiliate_referrals (
          referred_user_id
        )
      `)
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .limit(10)

        // Buscar últimos saques
        const { data: recentWithdrawals } = await supabase
            .from('affiliate_withdrawals')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .limit(5)

        // Agregação de dados para gráficos
        const now = new Date()
        const dailyData = {}
        const monthlyData = {}

        // Inicializar últimos 12 meses com zero (mantendo logica mensal fixa por enquanto ou também dinâmica? O usuario pediu mensal 12 meses amostrativo)
        // O usuario disse: "registro por mes de quanto foi vendido no periodo de até 12 meses amotrativo"
        for (let i = 11; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = d.toISOString().substring(0, 7) // YYYY-MM
            monthlyData[key] = 0
        }

        commissions?.forEach(comm => {
            if (!comm.created_at) return
            const date = comm.created_at.split('T')[0] // YYYY-MM-DD
            const month = comm.created_at.substring(0, 7) // YYYY-MM
            const amount = parseFloat(comm.commission_amount || 0)

            // Acumular dia (histórico completo)
            if (dailyData[date] === undefined) {
                dailyData[date] = 0
            }
            dailyData[date] += amount

            // Acumular mês (apenas se estiver no range dos ultimos 12 ou tudo? vamos pegar os ultimos 12 do loop acima e somar se existir)
            if (monthlyData[month] !== undefined) {
                monthlyData[month] += amount
            }
        })

        const history = {
            daily: Object.entries(dailyData).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date)),
            monthly: Object.entries(monthlyData).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date))
        }

        // Gerar link de referência
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swiftbot.com.br'
        const referralLink = affiliate.affiliate_code ? `${baseUrl}/?ref=${affiliate.affiliate_code}` : null

        return NextResponse.json({
            success: true,
            affiliate: {
                id: affiliate.id,
                code: affiliate.affiliate_code,
                status: affiliate.status,
                stripe_onboarding_complete: affiliate.stripe_onboarding_complete,
                commission_rate: parseFloat(affiliate.commission_rate) * 100, // Em percentual
                commission_months: affiliate.commission_months,
                created_at: affiliate.created_at
            },
            stats: {
                referrals: referralStats,
                commissions: commissionStats,
                total_earned: parseFloat(affiliate.total_earned),
                available_balance: parseFloat(affiliate.available_balance),
                total_withdrawn: parseFloat(affiliate.total_withdrawn)
            },
            history,
            referral_link: referralLink,
            recent_commissions: recentCommissions || [],
            recent_withdrawals: recentWithdrawals || [],
            min_withdrawal: 100 // R$100 mínimo
        })

    } catch (error) {
        console.error('❌ Erro ao buscar dashboard:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
