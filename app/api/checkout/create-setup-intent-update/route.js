import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }

        // 1. Buscar Customer ID
        const { data: subscription } = await supabaseAdmin
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        if (!subscription || !subscription.stripe_customer_id) {
            return NextResponse.json({ success: false, error: 'Cliente Stripe não encontrado' }, { status: 404 })
        }

        // 2. Criar Setup Intent associado ao Customer
        const setupIntent = await stripe.setupIntents.create({
            customer: subscription.stripe_customer_id,
            payment_method_types: ['card'],
            usage: 'off_session',
            metadata: {
                user_id: userId,
                action: 'update_payment_method'
            }
        })

        return NextResponse.json({
            success: true,
            clientSecret: setupIntent.client_secret
        })

    } catch (error) {
        console.error('Erro ao criar SetupIntent de update:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
