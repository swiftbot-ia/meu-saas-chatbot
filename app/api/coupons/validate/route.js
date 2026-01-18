import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import Stripe from 'stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const AFFILIATE_COUPON_ID = 'AFFILIATE40'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({ isValid: false, error: 'Código não fornecido' }, { status: 400 })
        }

        const normalizedCode = code.trim().toUpperCase()
        console.log(`🔍 Validando cupom: ${normalizedCode}`)

        // 1. Tentar encontrar Promo Code nativo na Stripe (Exact Match)
        // Listamos promo codes ativos com esse código
        const promoCodes = await stripe.promotionCodes.list({
            code: normalizedCode,
            active: true,
            limit: 1
        })

        if (promoCodes.data.length > 0) {
            const promo = promoCodes.data[0]
            console.log('✅ Promo Code Stripe encontrado:', promo.id)
            return NextResponse.json({
                isValid: true,
                type: 'stripe_promo',
                code: promo.code,
                promotionCodeId: promo.id,
                discount: promo.coupon.percent_off,
                couponName: promo.coupon.name
            })
        }

        // 2. Se não achou na Stripe, verificar se é um AFILIADO
        const { data: affiliate } = await supabaseAdmin
            .from('affiliates')
            .select('id, affiliate_code, status')
            .eq('affiliate_code', normalizedCode)
            .eq('status', 'active') // Apenas afiliados ativos
            .single()

        if (affiliate) {
            console.log('✅ Código de Afiliado válido encontrado. Gerando Promo Code...')

            // 3. Criar Promo Code dinâmico na Stripe linked ao AFFILIATE40
            try {
                const newPromo = await stripe.promotionCodes.create({
                    coupon: AFFILIATE_COUPON_ID,
                    code: normalizedCode,
                    metadata: {
                        affiliate_id: affiliate.id,
                        source: 'swiftbot_dynamic_generation'
                    }
                })

                console.log('🎉 Promo Code gerado com sucesso:', newPromo.id)

                return NextResponse.json({
                    isValid: true,
                    type: 'affiliate',
                    code: newPromo.code,
                    promotionCodeId: newPromo.id,
                    discount: 40, // Sabemos que é 40% pois é vinculado ao AFFILIATE40
                    couponName: `Afiliado ${normalizedCode}`
                })

            } catch (stripeError) {
                console.error('❌ Erro ao criar Promo Code na Stripe:', stripeError)

                // Se der erro de "code already exists" (race condition), tentamos buscar de novo
                if (stripeError.code === 'resource_already_exists') {
                    // Fallback: Busca novamente caso tenha sido criado milissegundos atrás
                    const retryPromo = await stripe.promotionCodes.list({ code: normalizedCode, active: true, limit: 1 })
                    if (retryPromo.data.length > 0) {
                        const p = retryPromo.data[0]
                        return NextResponse.json({
                            isValid: true,
                            type: 'affiliate',
                            code: p.code,
                            promotionCodeId: p.id,
                            discount: p.coupon.percent_off,
                            couponName: `Afiliado ${normalizedCode}`
                        })
                    }
                }

                return NextResponse.json({
                    isValid: false,
                    error: 'Erro ao gerar cupom de afiliado na Stripe'
                }, { status: 500 })
            }
        }

        // 4. Inválido
        console.warn('❌ Código inválido ou não encontrado:', normalizedCode)
        return NextResponse.json({
            isValid: false,
            error: 'Cupom inválido ou expirado'
        })

    } catch (error) {
        console.error('❌ Erro na validação de cupom:', error)
        return NextResponse.json({
            isValid: false,
            error: 'Erro interno ao validar cupom'
        }, { status: 500 })
    }
}
