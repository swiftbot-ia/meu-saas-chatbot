// app/api/checkout/create-subscription/route.js
// MIGRADO PARA STRIPE - Mantém mesma lógica de negócio do Pagar.me
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { 
  createCustomer, 
  createPaymentMethod,
  attachPaymentMethodToCustomer,
  createSubscription,
  cancelSubscription,
  detectCardBrand 
} from '../../../../lib/stripe'

// 🧪 CONFIGURAÇÕES DE TESTE
const TEST_MODE = false  // false = PRODUÇÃO (cobrança real)
const TEST_TRIAL_DAYS = 1  // ✅ TESTE: 1 dia de trial (para testes rápidos em produção)

export async function POST(request) {
  try {
    const { userId, plan, cardData, addressData, userEmail, userName } = await request.json()
    
    console.log('🎯 Dados recebidos (STRIPE):', {
      userId,
      plan,
      cardData: {
        ...cardData,
        card_number: cardData.card_number ? cardData.card_number.substring(0, 4) + '****' : 'N/A',
        // Stripe NÃO precisa de CPF
      },
      userEmail,
      userName,
      TEST_MODE: TEST_MODE
    })

    // ✅ VALIDAR DADOS OBRIGATÓRIOS
    if (!userId || !plan || !cardData || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 })
    }

    // ✅ BUSCAR TELEFONE DO PERFIL DO USUÁRIO (opcional para Stripe)
    console.log('🔍 Buscando dados do usuário...')
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('phone, full_name, company_name')
      .eq('user_id', userId)
      .single()

    console.log('📊 Dados do usuário:', {
      profileError: profileError ? profileError.message : null,
      hasPhone: !!userProfile?.phone,
      hasFullName: !!userProfile?.full_name
    })

    // ⚠️ IMPORTANTE: Telefone é OPCIONAL na Stripe (diferente do Pagar.me)
    // Se não encontrar, continua normalmente
    if (profileError) {
      console.warn('⚠️ Erro ao buscar perfil (continuando sem telefone):', profileError.message)
    }

    // ✅ VERIFICAR SE JÁ TEM ASSINATURA ATIVA
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .single()

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Você já possui uma assinatura ativa. Por favor, cancele a atual antes de criar uma nova.'
      }, { status: 400 })
    }

    // ✅ DEFINIR PREÇOS - VALORES CORRETOS
    const pricing = {
      monthly: {
        1: 10,    // ✅ R$ 10 para teste em produção
        2: 305,
        3: 445,
        4: 585,
        5: 625,
        6: 750,
        7: 875
      },
      annual: {
        // ✅ VALORES ANUAIS COMPLETOS (não divididos por 12)
        1: 1776,  // R$ 1.776/ano (equivalente a R$ 148/mês)
        2: 3294,  // R$ 3.294/ano (equivalente a R$ 274/mês)
        3: 4806,  // R$ 4.806/ano (equivalente a R$ 400/mês)
        4: 6318,  // R$ 6.318/ano (equivalente a R$ 526/mês)
        5: 6750,  // R$ 6.750/ano (equivalente a R$ 562/mês)
        6: 8100,  // R$ 8.100/ano (equivalente a R$ 675/mês)
        7: 9450   // R$ 9.450/ano (equivalente a R$ 787/mês)
      }
    }

    const basePlanPrice = pricing[plan.billingPeriod][plan.connections]
    const planPrice = basePlanPrice

    const displayAmount = planPrice
    const finalAmount = planPrice
    const billingFrequency = plan.billingPeriod === 'monthly' ? '/mês' : '/ano'
    const trialDays = TEST_TRIAL_DAYS

    // ✅ VERIFICAR ELEGIBILIDADE PARA TRIAL
    const isTrialEligible = !(await hasUserUsedTrial(userId))

    console.log('💰 Valores calculados (STRIPE):', {
      planPrice,
      finalAmount,
      displayAmount,
      billingFrequency,
      isTrialEligible,
      trialDays,
      TEST_MODE
    })

    // ✅ EXTRAIR DADOS DO CARTÃO
    const { card_number, card_holder_name, card_expiration_month, card_expiration_year, card_cvv } = cardData

    // ==================================================================
    // 🚀 INTEGRAÇÃO COM STRIPE
    // ==================================================================
    let stripeCustomer, stripePaymentMethod, stripeSubscription
    
    try {
      // PASSO 1: CRIAR CUSTOMER NA STRIPE
      console.log('🔷 STEP 1: Criando customer na Stripe...')
      stripeCustomer = await createCustomer({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        phone: userProfile?.phone || undefined  // Opcional na Stripe
      })

      console.log('✅ Customer Stripe criado:', stripeCustomer.id)

      // PASSO 2: CRIAR PAYMENT METHOD
      console.log('🔷 STEP 2: Criando Payment Method...')
      stripePaymentMethod = await createPaymentMethod({
        card_number: card_number.replace(/\s/g, ''),
        card_holder_name: card_holder_name,
        card_expiration_month: card_expiration_month,
        card_expiration_year: card_expiration_year,
        card_cvv: card_cvv
      })

      console.log('✅ Payment Method criado:', stripePaymentMethod.id)

      // PASSO 3: ANEXAR PAYMENT METHOD AO CUSTOMER
      console.log('🔷 STEP 3: Anexando Payment Method ao Customer...')
      await attachPaymentMethodToCustomer(stripePaymentMethod.id, stripeCustomer.id)

      console.log('✅ Payment Method anexado')

      // PASSO 4: CRIAR ASSINATURA COM TRIAL
      console.log('🔷 STEP 4: Criando assinatura na Stripe...')
      stripeSubscription = await createSubscription({
        customerId: stripeCustomer.id,
        paymentMethodId: stripePaymentMethod.id,
        planData: {
          billingPeriod: plan.billingPeriod,
          connections: plan.connections,
          isTrialEligible,
          planPrice: finalAmount,
          trialDays: isTrialEligible ? trialDays : 0
        },
        metadata: {
          userId,
          userName: userName || userEmail.split('@')[0],
          userEmail,
          display_amount: displayAmount,
          final_amount: finalAmount,
          billing_frequency: billingFrequency,
          test_mode: TEST_MODE,
          trial_days: isTrialEligible ? trialDays : 0,
          phone: userProfile?.phone || 'not_provided'
        }
      })

      console.log('✅ Assinatura Stripe criada:', stripeSubscription.id)
      console.log('📊 Status da assinatura:', stripeSubscription.status)

    } catch (stripeError) {
      console.error('❌ Erro na integração Stripe:', stripeError)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao processar pagamento: ' + stripeError.message
      }, { status: 500 })
    }

    // ==================================================================
    // 💾 SALVAR NO BANCO LOCAL (apenas se Stripe OK)
    // ==================================================================
    const now = new Date()
    
    // Calcular datas
    let trialEndDate = null
    if (isTrialEligible && stripeSubscription.trial_end) {
      trialEndDate = new Date(stripeSubscription.trial_end * 1000) // Stripe usa Unix timestamp
    }

    let nextBillingDate = new Date()
    if (stripeSubscription.current_period_end) {
      nextBillingDate = new Date(stripeSubscription.current_period_end * 1000)
    } else {
      // Fallback: calcular manualmente
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
      status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
      trial_start_date: isTrialEligible ? now.toISOString() : null,
      trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      // ✅ CAMPOS STRIPE (substituem pagarme_*)
      stripe_customer_id: stripeCustomer.id,
      stripe_payment_method_id: stripePaymentMethod.id,
      stripe_subscription_id: stripeSubscription.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }

    console.log('💾 Salvando assinatura local (STRIPE):', subscriptionData)

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert([subscriptionData])
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao salvar assinatura:', subscriptionError)
      
      // ✅ SE ERRO NO BANCO, CANCELAR NA STRIPE
      try {
        await cancelSubscription(stripeSubscription.id, 'database_error')
        console.log('✅ Assinatura cancelada na Stripe devido a erro no banco')
      } catch (cancelError) {
        console.error('❌ Erro ao cancelar na Stripe:', cancelError)
      }
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar assinatura: ' + subscriptionError.message
      }, { status: 500 })
    }

    // ==================================================================
    // 📊 LOG DA TRANSAÇÃO
    // ==================================================================
    if (subscription && subscription.id) {
      const { error: logError } = await supabase
        .from('payment_logs')
        .insert([{
          user_id: userId,
          subscription_id: subscription.id,
          event_type: isTrialEligible ? 'trial_started' : 'subscription_created',
          amount: finalAmount,
          payment_method: 'credit_card',
          stripe_transaction_id: stripeSubscription.id,
          status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
          metadata: {
            trial_days: isTrialEligible ? trialDays : 0,
            billing_period: plan.billingPeriod,
            connections: plan.connections,
            test_mode: TEST_MODE,
            gateway: 'stripe'
          },
          created_at: now.toISOString()
        }])

      if (logError) {
        console.warn('⚠️ Erro ao criar log de pagamento:', logError)
      }
    }

    // ==================================================================
    // 🎉 RESPOSTA DE SUCESSO
    // ==================================================================
    const successMessage = isTrialEligible 
      ? `🎉 Trial de ${trialDays} dia${trialDays > 1 ? 's' : ''} ativado com sucesso!` 
      : plan.billingPeriod === 'annual'
        ? `Plano anual ativado! Cobrado R$ ${finalAmount.toFixed(2)}/ano`
        : `Plano mensal ativado! Cobrado R$ ${finalAmount.toFixed(2)}/mês`

    console.log(`✅ ${isTrialEligible ? 'Trial iniciado' : 'Assinatura ativada'} na Stripe:`, subscription.id)

    return NextResponse.json({
      success: true,
      message: successMessage,
      subscription: subscription,
      trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      payment: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        amount: isTrialEligible ? 0 : finalAmount,
        display_amount: displayAmount,
        final_amount: finalAmount,
        billing_frequency: billingFrequency,
        card: {
          last_four_digits: stripePaymentMethod.card.last4,
          holder_name: card_holder_name,
          brand: stripePaymentMethod.card.brand
        }
      },
      is_trial: isTrialEligible,
      amount_charged: isTrialEligible ? 0 : finalAmount,
      test_mode: TEST_MODE,
      trial_days: isTrialEligible ? trialDays : 0,
      stripe: {
        customer_id: stripeCustomer.id,
        subscription_id: stripeSubscription.id,
        payment_method_id: stripePaymentMethod.id
      }
    })

  } catch (error) {
    console.error('❌ Erro geral na API:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}

// ✅ FUNÇÃO AUXILIAR PARA VERIFICAR SE USUÁRIO JÁ USOU TRIAL
async function hasUserUsedTrial(userId) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .not('trial_start_date', 'is', null)
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