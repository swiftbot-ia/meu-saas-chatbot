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
            .select('commission_amount, status')
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

        // Gerar link de referência
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swiftbot.com.br'
        const referralLink = `${baseUrl}/?ref=${affiliate.affiliate_code}`

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
