import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { userId, setupIntentId } = await request.json()

        console.log('💳 Atualizando método de pagamento:', { userId, setupIntentId })

        if (!userId || !setupIntentId) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 })
        }

        // 1. Recuperar SetupIntent para pegar PM ID
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
        if (!setupIntent || setupIntent.status !== 'succeeded') {
            return NextResponse.json({ success: false, error: 'SetupIntent inválido ou não concluído' }, { status: 400 })
        }

        const paymentMethodId = setupIntent.payment_method
        const customerId = setupIntent.customer

        console.log('✅ Novo Payment Method:', paymentMethodId)

        // 2. Atualizar Customer na Stripe (Default Payment Method)
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        })

        // 3. Opcional: Remover métodos antigos para limpar (manter apenas o novo)
        // (Não vamos fazer isso agora para segurança, apenas setamos o default)

        // 4. Atualizar no Banco de Dados
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
                stripe_payment_method_id: paymentMethodId,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

        if (error) {
            console.error('Erro ao atualizar DB:', error)
            // Não falha a request pois na Stripe já foi
        }

        return NextResponse.json({
            success: true,
            message: 'Método de pagamento atualizado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao atualizar pagamento:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
