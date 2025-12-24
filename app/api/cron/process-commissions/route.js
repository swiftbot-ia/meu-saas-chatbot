// app/api/cron/process-commissions/route.js
// Cron job para processar comissões pendentes → disponíveis
// Executar diariamente via Vercel Cron

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Proteger com secret para Vercel Cron
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request) {
    try {
        // Verificar autorização
        const authHeader = request.headers.get('authorization')
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            console.log('⚠️ Cron não autorizado')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔄 Iniciando processamento de comissões...')

        const now = new Date().toISOString()

        // 1. Buscar comissões pendentes que já passaram dos 7 dias
        const { data: pendingCommissions, error: fetchError } = await supabase
            .from('affiliate_commissions')
            .select('id, affiliate_id, commission_amount')
            .eq('status', 'pending')
            .lte('available_date', now)

        if (fetchError) {
            console.error('Erro ao buscar comissões:', fetchError)
            return NextResponse.json({ success: false, error: 'Erro ao buscar comissões' }, { status: 500 })
        }

        if (!pendingCommissions || pendingCommissions.length === 0) {
            console.log('✅ Nenhuma comissão para processar')
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'Nenhuma comissão pendente para processar'
            })
        }

        console.log(`📊 Encontradas ${pendingCommissions.length} comissões para processar`)

        // 2. Atualizar status para 'available'
        const commissionIds = pendingCommissions.map(c => c.id)

        const { error: updateError } = await supabase
            .from('affiliate_commissions')
            .update({ status: 'available' })
            .in('id', commissionIds)

        if (updateError) {
            console.error('Erro ao atualizar comissões:', updateError)
            return NextResponse.json({ success: false, error: 'Erro ao atualizar comissões' }, { status: 500 })
        }

        // 3. Atualizar saldo disponível dos afiliados
        const affiliateUpdates = {}
        for (const commission of pendingCommissions) {
            if (!affiliateUpdates[commission.affiliate_id]) {
                affiliateUpdates[commission.affiliate_id] = 0
            }
            affiliateUpdates[commission.affiliate_id] += parseFloat(commission.commission_amount)
        }

        for (const [affiliateId, amount] of Object.entries(affiliateUpdates)) {
            const { data: affiliate } = await supabase
                .from('affiliates')
                .select('available_balance, total_earned')
                .eq('id', affiliateId)
                .single()

            if (affiliate) {
                await supabase
                    .from('affiliates')
                    .update({
                        available_balance: parseFloat(affiliate.available_balance) + amount,
                        total_earned: parseFloat(affiliate.total_earned) + amount,
                        updated_at: now
                    })
                    .eq('id', affiliateId)
            }
        }

        // 4. Verificar referrals expirados (mais de 6 meses)
        const { data: expiredReferrals, error: expError } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .eq('status', 'active')
            .lte('expires_at', now)

        if (expiredReferrals && expiredReferrals.length > 0) {
            await supabase
                .from('affiliate_referrals')
                .update({ status: 'expired' })
                .in('id', expiredReferrals.map(r => r.id))

            console.log(`📊 ${expiredReferrals.length} referrals marcados como expirados`)
        }

        console.log(`✅ Processadas ${pendingCommissions.length} comissões`)

        return NextResponse.json({
            success: true,
            processed: pendingCommissions.length,
            affiliates_updated: Object.keys(affiliateUpdates).length,
            referrals_expired: expiredReferrals?.length || 0,
            message: `${pendingCommissions.length} comissões processadas com sucesso`
        })

    } catch (error) {
        console.error('❌ Erro no cron:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
