// app/api/affiliates/withdraw/route.js
// Endpoint para solicitar saque via Stripe Connect

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_API_URL = 'https://api.stripe.com/v1'
const MIN_WITHDRAWAL = 100 // R$100

export const dynamic = 'force-dynamic'

// Função helper para requisições Stripe
async function stripeRequest(endpoint, method = 'POST', data = {}) {
    const formData = new URLSearchParams()
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            formData.append(key, value)
        }
    }

    const response = await fetch(`${STRIPE_API_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: method !== 'GET' ? formData.toString() : undefined
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(result.error?.message || 'Stripe API error')
    }

    return result
}

export async function POST(request) {
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

        if (affiliate.status !== 'active') {
            return NextResponse.json({
                success: false,
                error: 'Seu cadastro de afiliado precisa estar ativo para solicitar saques'
            }, { status: 403 })
        }

        if (!affiliate.stripe_account_id || !affiliate.stripe_onboarding_complete) {
            return NextResponse.json({
                success: false,
                error: 'Complete o cadastro do Stripe Connect antes de solicitar saques'
            }, { status: 403 })
        }

        // Validar valor do saque
        const body = await request.json()
        const { amount } = body

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({
                success: false,
                error: 'Valor de saque inválido'
            }, { status: 400 })
        }

        // Calcular saldo disponível real
        const { data: availableCommissions } = await supabase
            .from('affiliate_commissions')
            .select('commission_amount')
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'available')

        const availableBalance = (availableCommissions || [])
            .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0)

        if (amount < MIN_WITHDRAWAL) {
            return NextResponse.json({
                success: false,
                error: `Valor mínimo para saque é R$${MIN_WITHDRAWAL}`
            }, { status: 400 })
        }

        if (amount > availableBalance) {
            return NextResponse.json({
                success: false,
                error: `Saldo disponível insuficiente. Você tem R$${availableBalance.toFixed(2)} disponível.`
            }, { status: 400 })
        }

        // Criar solicitação de saque
        const { data: withdrawal, error: wdError } = await supabase
            .from('affiliate_withdrawals')
            .insert([{
                affiliate_id: affiliate.id,
                amount,
                status: 'processing'
            }])
            .select()
            .single()

        if (wdError) {
            console.error('Erro ao criar saque:', wdError)
            return NextResponse.json({
                success: false,
                error: 'Erro ao processar solicitação de saque'
            }, { status: 500 })
        }

        try {
            // Criar transfer via Stripe Connect
            const amountInCents = Math.round(amount * 100)

            const transfer = await stripeRequest('/transfers', 'POST', {
                amount: amountInCents,
                currency: 'brl',
                destination: affiliate.stripe_account_id,
                description: `SwiftBot Affiliate Withdrawal - ${withdrawal.id}`
            })

            // Atualizar withdrawal com ID do transfer
            await supabase
                .from('affiliate_withdrawals')
                .update({
                    stripe_transfer_id: transfer.id,
                    status: 'completed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', withdrawal.id)

            // Marcar comissões como sacadas (até o valor solicitado)
            let remaining = amount
            for (const commission of (availableCommissions || [])) {
                if (remaining <= 0) break

                const commAmount = parseFloat(commission.commission_amount)
                if (commAmount <= remaining) {
                    await supabase
                        .from('affiliate_commissions')
                        .update({ status: 'withdrawn' })
                        .eq('id', commission.id)
                    remaining -= commAmount
                }
            }

            // Atualizar totais do afiliado
            await supabase
                .from('affiliates')
                .update({
                    total_withdrawn: (parseFloat(affiliate.total_withdrawn) + amount),
                    available_balance: Math.max(0, availableBalance - amount),
                    updated_at: new Date().toISOString()
                })
                .eq('id', affiliate.id)

            console.log('✅ Saque processado com sucesso:', withdrawal.id)

            return NextResponse.json({
                success: true,
                message: `Saque de R$${amount.toFixed(2)} processado com sucesso!`,
                withdrawal: {
                    id: withdrawal.id,
                    amount,
                    stripe_transfer_id: transfer.id,
                    status: 'completed'
                }
            })

        } catch (stripeError) {
            console.error('❌ Erro no Stripe:', stripeError)

            // Atualizar withdrawal como falha
            await supabase
                .from('affiliate_withdrawals')
                .update({
                    status: 'failed',
                    error_message: stripeError.message,
                    processed_at: new Date().toISOString()
                })
                .eq('id', withdrawal.id)

            return NextResponse.json({
                success: false,
                error: `Erro ao processar saque: ${stripeError.message}`
            }, { status: 500 })
        }

    } catch (error) {
        console.error('❌ Erro ao processar saque:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
