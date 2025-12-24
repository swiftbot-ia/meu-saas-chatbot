// app/api/affiliates/status/route.js
// Endpoint para verificar status da aplicação e dados do afiliado

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
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (affiliate) {
            return NextResponse.json({
                success: true,
                is_affiliate: true,
                affiliate: {
                    id: affiliate.id,
                    code: affiliate.affiliate_code,
                    status: affiliate.status,
                    stripe_onboarding_complete: affiliate.stripe_onboarding_complete,
                    commission_rate: affiliate.commission_rate,
                    commission_months: affiliate.commission_months,
                    total_earned: affiliate.total_earned,
                    total_withdrawn: affiliate.total_withdrawn,
                    available_balance: affiliate.available_balance,
                    created_at: affiliate.created_at
                }
            })
        }

        // Verificar se tem aplicação pendente
        const { data: application } = await supabase
            .from('affiliate_applications')
            .select('id, status, rejection_reason, created_at, reviewed_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (application) {
            return NextResponse.json({
                success: true,
                is_affiliate: false,
                has_application: true,
                application: {
                    id: application.id,
                    status: application.status,
                    rejection_reason: application.rejection_reason,
                    created_at: application.created_at,
                    reviewed_at: application.reviewed_at
                }
            })
        }

        // Nenhuma aplicação ou afiliado
        return NextResponse.json({
            success: true,
            is_affiliate: false,
            has_application: false
        })

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
