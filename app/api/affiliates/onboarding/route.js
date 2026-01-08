// app/api/affiliates/onboarding/route.js
// Endpoint para gerar link de onboarding Stripe Connect

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_API_URL = 'https://api.stripe.com/v1'

export const dynamic = 'force-dynamic'

// Função helper para requisições Stripe
async function stripeRequest(endpoint, method = 'POST', data = {}) {
    const formData = new URLSearchParams()

    const flattenObject = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}[${key}]` : key
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                flattenObject(value, newKey)
            } else if (value !== undefined && value !== null) {
                formData.append(newKey, value)
            }
        }
    }

    flattenObject(data)

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

        // Verificar se é afiliado aprovado
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

        if (affiliate.stripe_onboarding_complete) {
            return NextResponse.json({
                success: false,
                error: 'Você já completou o onboarding do Stripe'
            }, { status: 400 })
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swiftbot.com.br'
        let stripeAccountId = affiliate.stripe_account_id

        // Criar conta Stripe Connect se não existir
        if (!stripeAccountId) {
            console.log('🔄 Criando conta Stripe Connect para afiliado:', affiliate.id)

            // Buscar dados da aplicação para pré-preencher
            const { data: application } = await supabase
                .from('affiliate_applications')
                .select('full_name, email')
                .eq('id', affiliate.application_id)
                .single()

            const account = await stripeRequest('/accounts', 'POST', {
                type: 'express',
                country: 'BR',
                email: application?.email || user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true }
                },
                business_type: 'individual',
                business_profile: {
                    product_description: 'SwiftBot Affiliate Partner',
                    url: baseUrl
                },
                metadata: {
                    affiliate_id: affiliate.id,
                    user_id: user.id
                }
            })

            stripeAccountId = account.id

            // Salvar ID da conta
            await supabase
                .from('affiliates')
                .update({
                    stripe_account_id: stripeAccountId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', affiliate.id)

            console.log('✅ Conta Stripe Connect criada:', stripeAccountId)
        }

        // Gerar link de onboarding
        const accountLink = await stripeRequest('/account_links', 'POST', {
            account: stripeAccountId,
            refresh_url: `${baseUrl}/affiliates?refresh=true`,
            return_url: `${baseUrl}/affiliates?onboarding=complete`,
            type: 'account_onboarding'
        })

        console.log('✅ Link de onboarding gerado para:', affiliate.id)

        return NextResponse.json({
            success: true,
            onboarding_url: accountLink.url
        })

    } catch (error) {
        console.error('❌ Erro ao gerar link de onboarding:', error)
        return NextResponse.json({
            success: false,
            error: `Erro ao gerar link: ${error.message}`
        }, { status: 500 })
    }
}

// Verificar status do onboarding
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
            .select('id, stripe_account_id, stripe_onboarding_complete')
            .eq('user_id', user.id)
            .single()

        if (!affiliate || !affiliate.stripe_account_id) {
            return NextResponse.json({
                success: true,
                onboarding_complete: false,
                needs_onboarding: true
            })
        }

        // Verificar status da conta Stripe
        const response = await fetch(`${STRIPE_API_URL}/accounts/${affiliate.stripe_account_id}`, {
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
            }
        })

        const account = await response.json()

        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: 'Erro ao verificar conta Stripe'
            }, { status: 500 })
        }

        console.log('🔍 Checando status Stripe:', {
            id: account.id,
            details_submitted: account.details_submitted,
            payouts_enabled: account.payouts_enabled,
            capabilities: account.capabilities
        })

        const isComplete = account.details_submitted &&
            account.payouts_enabled &&
            (account.capabilities?.transfers === 'active' || account.capabilities?.transfers === 'pending')

        // Atualizar status se necessário
        if (isComplete && !affiliate.stripe_onboarding_complete) {
            await supabase
                .from('affiliates')
                .update({
                    stripe_onboarding_complete: true,
                    status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', affiliate.id)

            console.log('✅ Onboarding Stripe concluído para afiliado:', affiliate.id)
        }

        return NextResponse.json({
            success: true,
            onboarding_complete: isComplete,
            details_submitted: account.details_submitted,
            payouts_enabled: account.payouts_enabled,
            transfers_enabled: account.capabilities?.transfers === 'active'
        })

    } catch (error) {
        console.error('❌ Erro ao verificar onboarding:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
