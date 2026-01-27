// app/api/checkout/confirm-subscription/route.js
// ✅ ETAPA 2: Criar CUSTOMER + SUBSCRIPTION após cartão validado
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { createCustomer, createSubscription, cancelSubscription, mapStripeStatus } from '../../../../lib/stripe'
import { sendTrialIniciadoWebhook, sendAssinaturaCriadaWebhook } from '@/lib/webhooks/onboarding-webhook'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const TEST_TRIAL_DAYS = 4

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const {
      userId,
      paymentMethodId,
      plan,
      userEmail,
      userName,
      affiliate_ref_code, // Código de afiliado (se indicado)
      promotionCodeId // [NOVO] ID do Promotion Code da Stripe (ex: promo_xyz)
    } = await request.json()

    console.log('🎯 [STEP 2] Confirmando Subscription:', {
      userId,
      paymentMethodId,
      plan,
      affiliate_ref_code,
      promotionCodeId
    })

    // ✅ VALIDAR DADOS OBRIGATÓRIOS
    if (!userId || !paymentMethodId || !plan) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 })
    }

    // ✅ VERIFICAR SE JÁ TEM ASSINATURA ATIVA
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .single()

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Você já possui uma assinatura ativa.'
      }, { status: 400 })
    }

    // ✅ BUSCAR DADOS DO PERFIL
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('phone, full_name')
      .eq('user_id', userId)
      .single()

    // ✅ CRIAR CUSTOMER NA STRIPE (AGORA SIM!)
    console.log('📝 Criando customer na Stripe...')

    const stripeCustomer = await createCustomer({
      name: userName || userEmail.split('@')[0],
      email: userEmail,
      phone: userProfile?.phone || undefined,
      metadata: {
        user_id: userId,
        environment: 'production'
      }
    })

    console.log('✅ Customer criado:', stripeCustomer.id)

    // ✅ ANEXAR PAYMENT METHOD AO CUSTOMER
    console.log('📎 Anexando payment method ao customer...')
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id,
    })

    // ✅ DEFINIR COMO PAYMENT METHOD PADRÃO
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    console.log('✅ Payment method anexado e definido como padrão')

    // ✅ DEFINIR PREÇOS
    // ✅ DEFINIR PREÇOS (Atualizado 19/01/2026)
    const pricing = {
      monthly: {
        1: 288.75, 2: 533.75, 3: 778.75, 4: 1023.75, 5: 1093.75, 6: 1312.50, 7: 1531.25
      },
      annual: {
        1: 2575.20, 2: 4776.30, 3: 6968.70, 4: 9161.10, 5: 9787.50, 6: 11745.00, 7: 13702.50
      }
    }

    const planPrice = pricing[plan.billingPeriod][plan.connections]
    const billingFrequency = plan.billingPeriod === 'monthly' ? '/mês' : '/ano'

    const isTrialEligible = !(await hasUserUsedTrial(userId))
    const trialDays = isTrialEligible ? TEST_TRIAL_DAYS : 0

    console.log('💰 Valores:', {
      planPrice,
      billingFrequency,
      isTrialEligible,
      trialDays
    })

    // ✅ [AFILIADO] VERIFICAR E CONFIGURAR SPLIT (ANTES DE CRIAR ASSINATURA)
    let transferData = null
    let affiliateRecord = null

    if (affiliate_ref_code) {
      try {
        console.log('🔗 [Affiliate] Verificando código pré-checkout:', affiliate_ref_code)

        const { data: affData, error: affErr } = await supabaseAdmin
          .from('affiliates')
          .select('id, status, stripe_account_id, commission_rate')
          .eq('affiliate_code', affiliate_ref_code.toUpperCase())
          .eq('status', 'active')
          .single()

        if (affData && !affErr) {
          affiliateRecord = affData

          // Verificar se tem conta Stripe conectada para split automático (SAFEGUARD)
          if (affData.stripe_account_id && affData.stripe_account_id.startsWith('acct_')) {
            const commissionRate = affData.commission_rate ? (affData.commission_rate * 100) : 30

            console.log(`💸 [Affiliate] Split configurado: ${commissionRate}% para ${affData.stripe_account_id}`)

            transferData = {
              destination: affData.stripe_account_id,
              amountPercent: commissionRate
            }
          } else {
            console.warn('⚠️ [Affiliate] Afiliado sem conta Stripe conectada. Split ignorado (venda segue normal).')
          }
        }
      } catch (err) {
        console.error('⚠️ [Affiliate] Erro na verificação pré-checkout:', err)
        // Não falhar checkout
      }
    }

    // ✅ CRIAR SUBSCRIPTION NA STRIPE
    let stripeSubscription

    try {
      console.log('📝 Criando assinatura na Stripe...')

      stripeSubscription = await createSubscription({
        customerId: stripeCustomer.id,
        paymentMethodId: paymentMethodId,
        planData: {
          billingPeriod: plan.billingPeriod,
          connections: plan.connections,
          isTrialEligible: isTrialEligible,
          planPrice: planPrice,
          trialDays: trialDays
        },
        promotionCode: promotionCodeId, // ✅ Usar Promotion Code Validado
        metadata: {
          userId: userId,
          userName: userName || userEmail.split('@')[0],
          userEmail: userEmail,
          display_amount: planPrice,
          final_amount: planPrice,
          billing_frequency: billingFrequency,
          trial_days: trialDays,
          phone: userProfile?.phone || 'not_provided',
          affiliateCode: affiliate_ref_code ? affiliate_ref_code.toUpperCase() : undefined
        },
        transferData: transferData // ✅ Passar dados de split se existirem
      })

      console.log('✅ Subscription criada:', stripeSubscription.id)

      // ✅ [FIRST PAYMENT ONLY] Remover transfer_data para cobranças futuras
      if (transferData) {
        try {
          await stripe.subscriptions.update(stripeSubscription.id, {
            transfer_data: null
          })
          console.log('✅ [Affiliate] Split removido de cobranças futuras (apenas 1ª parcela paga ao afiliado)')
        } catch (updateError) {
          console.error('⚠️ [Affiliate] Erro ao remover split de futuras cobranças:', updateError)
          // Não falhamos o fluxo principal, mas logamos o alerta
        }
      }

      // ✅ [RE-FETCH] GARANTIR EXPANSÃO (Workaround para falha na criação)
      // Se status incomplete e não temos payment_intent, buscamos novamente com SDK oficial
      if (stripeSubscription.status === 'incomplete' &&
        (!stripeSubscription.latest_invoice ||
          typeof stripeSubscription.latest_invoice === 'string' ||
          !stripeSubscription.latest_invoice.payment_intent)) {

        console.log('🔄 [Stripe] Re-buscando assinatura para garantir expansão...');
        const refreshedSub = await stripe.subscriptions.retrieve(stripeSubscription.id, {
          expand: ['latest_invoice.payment_intent']
        });

        if (refreshedSub) {
          console.log('✅ Assinatura atualizada com expansão.');
          stripeSubscription = refreshedSub;
        }
      }

    } catch (stripeError) {
      console.error('❌ Erro na Stripe:', stripeError)

      // Deletar customer criado em caso de erro
      try {
        await stripe.customers.del(stripeCustomer.id)
      } catch (e) { }

      return NextResponse.json({
        success: false,
        error: 'Erro ao criar assinatura: ' + stripeError.message
      }, { status: 500 })
    }

    // ✅ SALVAR NO BANCO LOCAL
    const now = new Date()

    let trialEndDate = null
    if (isTrialEligible && stripeSubscription.trial_end) {
      trialEndDate = new Date(stripeSubscription.trial_end * 1000)
    }

    let nextBillingDate = new Date()
    if (stripeSubscription.current_period_end) {
      nextBillingDate = new Date(stripeSubscription.current_period_end * 1000)
    } else {
      const baseDate = trialEndDate || now
      if (plan.billingPeriod === 'monthly') {
        nextBillingDate = new Date(baseDate)
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      } else {
        nextBillingDate = new Date(baseDate)
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
      }
    }

    const subscriptionData = {
      user_id: userId,
      billing_period: plan.billingPeriod,
      connections_purchased: plan.connections,
      status: mapStripeStatus(stripeSubscription.status),
      trial_start_date: isTrialEligible ? now.toISOString() : null,
      trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      stripe_customer_id: stripeCustomer.id,
      stripe_payment_method_id: paymentMethodId,
      stripe_subscription_id: stripeSubscription.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      affiliate_code: affiliate_ref_code ? affiliate_ref_code.toUpperCase() : null // ✅ Salvar cupom usado
    }

    console.log('💾 Salvando no banco:', subscriptionData)

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert([subscriptionData])
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao salvar:', subscriptionError)

      // Cancelar na Stripe
      try {
        await cancelSubscription(stripeSubscription.id, 'database_error')
        await stripe.customers.del(stripeCustomer.id)
      } catch (e) { }

      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar assinatura: ' + subscriptionError.message
      }, { status: 500 })
    }

    // ✅ LOG DA TRANSAÇÃO
    if (subscription && subscription.id) {
      await supabaseAdmin
        .from('payment_logs')
        .insert([{
          user_id: userId,
          subscription_id: subscription.id,
          event_type: isTrialEligible ? 'trial_started' : 'subscription_created',
          amount: planPrice,
          payment_method: 'credit_card',
          stripe_transaction_id: stripeSubscription.id,
          status: mapStripeStatus(stripeSubscription.status),
          metadata: {
            trial_days: trialDays,
            billing_period: plan.billingPeriod,
            connections: plan.connections,
            gateway: 'stripe'
          },
          created_at: now.toISOString()
        }])

      // 📡 Enviar webhooks de onboarding (fire and forget)
      if (isTrialEligible) {
        sendTrialIniciadoWebhook(
          { user_id: userId, email: userEmail, full_name: userName },
          {
            trial_start_date: now.toISOString(),
            trial_end_date: trialEndDate?.toISOString(),
            connections_purchased: plan.connections
          }
        ).catch(err => console.warn('⚠️ Webhook trial falhou:', err.message))
      } else {
        sendAssinaturaCriadaWebhook(userId, {
          id: subscription.id,
          status: 'active',
          billing_period: plan.billingPeriod,
          connections_purchased: plan.connections,
          stripe_subscription_id: stripeSubscription.id
        }, { amount: planPrice }).catch(err => console.warn('⚠️ Webhook assinatura falhou:', err.message))
      }
    }

    // ✅ CRIAR REFERRAL DE AFILIADO (se indicado)
    if (affiliate_ref_code) {
      try {
        console.log('🔗 [Affiliate] Verificando código:', affiliate_ref_code)

          .single()

        // Se já buscamos antes (affiliateRecord), usamos ele, senão consultamos agora
        const affiliate = affiliateRecord || (affiliateQuery.data)
        const affError = affiliateQuery.error

        if (affiliate && !affError) {
          // Verificar se usuário já não foi indicado antes
          const { data: existingReferral } = await supabaseAdmin
            .from('affiliate_referrals')
            .select('id')
            .eq('referred_user_id', userId)
            .single()

          if (!existingReferral) {
            // Criar referral
            const { error: refError } = await supabaseAdmin
              .from('affiliate_referrals')
              .insert([{
                affiliate_id: affiliate.id,
                referred_user_id: userId,
                referral_code_used: affiliate_ref_code.toUpperCase(),
                signup_date: now.toISOString(),
                status: 'registered'
              }])

            if (refError) {
              console.error('⚠️ [Affiliate] Erro ao criar referral:', refError)
            } else {
              console.log('✅ [Affiliate] Referral criado para afiliado:', affiliate.id)
            }
          } else {
            console.log('ℹ️ [Affiliate] Usuário já foi indicado anteriormente')
          }
        } else {
          console.log('⚠️ [Affiliate] Código inválido ou afiliado inativo:', affiliate_ref_code)
        }
      } catch (affError) {
        console.error('⚠️ [Affiliate] Erro ao processar referral:', affError)
        // Não bloquear checkout por erro de afiliado
      }
    }

    const successMessage = isTrialEligible
      ? `🎉 Trial de ${trialDays} dias ativado!`
      : `✅ Plano ativado com sucesso!`

    console.log('✅ SUBSCRIPTION CONFIRMADA:', subscription.id)

    return NextResponse.json({
      success: true,
      message: successMessage,
      subscription: subscription,
      stripe_subscription: stripeSubscription, // ✅ Necessário para o frontend confirmar o pagamento (3DS)
      trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      is_trial: isTrialEligible,
      amount_charged: isTrialEligible ? 0 : planPrice,
      trial_days: trialDays
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + error.message
    }, { status: 500 })
  }
}

async function hasUserUsedTrial(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .not('trial_start_date', 'is', null) // Só considera se data de trial foi gerada
      .neq('status', 'pending')            // IGNORA status 'pending' (Trial não validado/falha no cartão)
      .limit(1)

    if (error) {
      console.error('Erro ao verificar trial:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Erro na verificação de trial:', error)
    return false
  }
}