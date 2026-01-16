import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const supabase = await createClient()

        // 1. Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // 2. Buscar dados do afiliado
        const { data: affiliate, error: affError } = await supabase
            .from('affiliates')
            .select('stripe_account_id')
            .eq('user_id', user.id)
            .single()

        if (affError || !affiliate || !affiliate.stripe_account_id) {
            return NextResponse.json({
                success: false,
                error: 'Conta de afiliado não encontrada ou não conectada ao Stripe'
            }, { status: 404 })
        }

        // 3. Gerar link de login do Stripe Express
        const loginLink = await stripe.accounts.createLoginLink(
            affiliate.stripe_account_id
        )

        return NextResponse.json({
            success: true,
            url: loginLink.url
        })

    } catch (error) {
        console.error('❌ Erro ao gerar link do portal:', error)
        return NextResponse.json({
            success: false,
            error: 'Erro ao acessar portal financeiro'
        }, { status: 500 })
    }
}
