// app/api/checkout/create-subscription/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { 
  createCustomer, 
  createCard, 
  createSubscription,
  cancelSubscription,  // ✅ ADICIONAR ESTA IMPORTAÇÃO
  detectCardBrand 
} from '../../../../lib/pagarme'

// 🧪 CONFIGURAÇÕES DE TESTE - MODO PRODUÇÃO COM VALORES DE TESTE
const TEST_MODE = false  // ✅ IMPORTANTE: false = PRODUÇÃO (cobrança real)
const TEST_TRIAL_DAYS = 1  // ✅ TESTE: 1 dia de trial (em vez de 4)
const TEST_PRICE_OVERRIDE = 10  // ✅ TESTE: R$ 10 para plano de 1 conexão mensal

export async function POST(request) {
  try {
    const { userId, plan, cardData, addressData, userEmail, userName } = await request.json()
    
    console.log('🎯 Dados recebidos:', {
      userId,
      plan,
      cardData: {
        ...cardData,
        card_number: cardData.card_number ? cardData.card_number.substring(0, 4) + '****' : 'N/A',
        cpf: cardData.cpf ? cardData.cpf.substring(0, 3) + '***' + cardData.cpf.substring(9) : 'N/A'
      },
      addressData: {
        ...addressData,
        zipcode: addressData.zipcode ? addressData.zipcode.substring(0, 5) + '-***' : 'N/A'
      },
      userEmail,
      userName,
      TEST_MODE: TEST_MODE
    })

    // ✅ VALIDAR DADOS OBRIGATÓRIOS
    if (!userId || !plan || !cardData || !addressData || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 })
    }

    // ✅ BUSCAR TELEFONE DO PERFIL DO USUÁRIO - USANDO SERVICE ROLE
    console.log('🔍 INICIANDO BUSCA DO TELEFONE...')
    
    // Criar cliente Supabase com service role (ignora RLS)
    const { createClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Chave que ignora RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('phone, full_name, company_name')
      .eq('user_id', userId)
      .single()

    console.log('📊 DEBUG TELEFONE (Service Role):', {
      profileError: profileError,
      userProfile: userProfile,
      userId: userId
    })

    if (profileError || !userProfile?.phone) {
      console.log('❌ TELEFONE NÃO ENCONTRADO:', {
        profileError,
        userProfile,
        phone: userProfile?.phone
      })
      return NextResponse.json({
        success: false,
        error: 'Telefone é obrigatório. Por favor, atualize seu perfil com um número de telefone válido antes de continuar.'
      }, { status: 400 })
    }

    // ✅ VERIFICAR ASSINATURA ATIVA EXISTENTE
    console.log('🔍 Verificando assinaturas existentes...')
    
    const { data: existingSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subError && existingSubscription) {
      console.log('❌ Usuário já possui assinatura ativa:', existingSubscription.status)
      return NextResponse.json({
        success: false,
        error: `Você já possui uma assinatura ${existingSubscription.status === 'trial' ? 'trial' : 'ativa'}. Não é possível criar nova assinatura.`
      }, { status: 400 })
    }

    // ✅ EXTRAIR DADOS DOS CAMPOS
    const {
      card_number,
      card_holder_name,
      card_expiration_month,
      card_expiration_year,
      card_cvv,
      cpf
    } = cardData

    const {
      zipcode,
      street,
      street_number,
      neighborhood,
      city,
      state
    } = addressData

    // ✅ CONFIGURAÇÃO DE PREÇOS
    const pricing = {
      monthly: { 1: 165, 2: 305, 3: 445, 5: 585 },
      annual: { 1: 150, 2: 275, 3: 400, 5: 525 }
    }

    // ✅ LÓGICA DE TESTE: R$ 10 para 1 conexão mensal
    const isTestPrice = plan.billingPeriod === 'monthly' && plan.connections === 1
    const planPrice = isTestPrice ? TEST_PRICE_OVERRIDE : pricing[plan.billingPeriod][plan.connections]
    
    // ✅ VERIFICAR ELEGIBILIDADE PARA TRIAL
    const isTrialEligible = !await hasUserUsedTrial(userId)
    const trialDays = isTrialEligible ? TEST_TRIAL_DAYS : 0

    // ✅ CALCULAR VALORES
    const finalAmount = planPrice
    const displayAmount = `R$ ${planPrice}`
    const billingFrequency = plan.billingPeriod === 'monthly' ? '/mês' : '/ano'

    // ✅ CALCULAR DATAS
    const now = new Date()
    const trialEndDate = isTrialEligible ? new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000)) : null
    const nextBillingDate = new Date(trialEndDate || now)
    
    if (plan.billingPeriod === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    }

    // ✅ CORREÇÃO: Valor para cobrança no trial vs valor real da assinatura
    const chargeAmount = isTrialEligible ? 0 : finalAmount
    const subscriptionAmount = finalAmount // ✅ SEMPRE o valor real da assinatura

    console.log('💰 Valores calculados (TESTE):', { 
      planPrice, 
      finalAmount, 
      displayAmount, 
      chargeAmount, 
      subscriptionAmount,
      billingFrequency,
      isTrialEligible,
      trialDays: trialDays,
      TEST_MODE: TEST_MODE,
      IS_TEST_OVERRIDE: plan.billingPeriod === 'monthly' && plan.connections === 1
    })

    // ==================================================================
    // 🚀 INTEGRAÇÃO REAL COM PAGAR.ME (PRODUÇÃO) - MODELO CORRIGIDO
    // ==================================================================
    let pagarmeCustomer, pagarmeCard, pagarmeSubscription
    try {
      // ✅ 1. CRIAR CUSTOMER NO PAGAR.ME COM CPF, TELEFONE E ENDEREÇO COMPLETO
      pagarmeCustomer = await createCustomer({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        document: cpf.replace(/\D/g, ''), // ✅ ENVIAR CPF LIMPO
        phone: userProfile.phone, // ✅ TELEFONE DO PERFIL DO USUÁRIO
        // ✅ ENDEREÇO COMPLETO PARA PAGAR.ME
        address: {
          street: street,
          street_number: street_number,
          neighborhood: neighborhood,
          zipcode: zipcode.replace(/\D/g, ''), // ✅ CEP LIMPO
          city: city,
          state: state,
          country: 'BR',
          complementary: addressData.complementary || ''
        }
      })

      // 2. CRIAR CARTÃO TOKENIZADO
      pagarmeCard = await createCard(pagarmeCustomer.id, cardData, {
        street: street,
        street_number: street_number,
        neighborhood: neighborhood,
        zipcode: zipcode.replace(/\D/g, ''),
        city: city,
        state: state,
        complementary: addressData.complementary || ''
      })

      // ✅ 3. CRIAR ASSINATURA - MODELO ORIGINAL QUE FUNCIONAVA
      pagarmeSubscription = await createSubscription({
        customerId: pagarmeCustomer.id,
        cardId: pagarmeCard.id,
        planData: {
          billingPeriod: plan.billingPeriod,
          connections: plan.connections,
          isTrialEligible,
          planPrice: subscriptionAmount, // ✅ VALOR REAL (R$ 10 para 1 conexão mensal)
          trialDays: trialDays  // ✅ 1 dia de trial
        },
        metadata: {
          userId,
          userName: userName || userEmail.split('@')[0],
          userEmail,
          display_amount: displayAmount,
          final_amount: finalAmount,
          billing_frequency: billingFrequency,
          test_mode: TEST_MODE,
          trial_days: trialDays,
          cpf: cpf.replace(/\D/g, ''), // ✅ SALVAR CPF NOS METADADOS
          phone: userProfile.phone, // ✅ SALVAR TELEFONE NOS METADADOS
          // ✅ METADADOS DE TESTE
          is_test_price: plan.billingPeriod === 'monthly' && plan.connections === 1,
          original_price: pricing[plan.billingPeriod][plan.connections],
          test_price_used: planPrice,
          // ✅ SALVAR ENDEREÇO NOS METADADOS
          address: {
            street: street,
            street_number: street_number,
            neighborhood: neighborhood,
            zipcode: zipcode.replace(/\D/g, ''),
            city: city,
            state: state,
            complementary: addressData.complementary || ''
          }
        }
      })

      console.log('✅ Assinatura Pagar.me criada (TESTE):', pagarmeSubscription.id)
    } catch (pagarmeError) {
      console.error('❌ Erro na integração Pagar.me:', pagarmeError)
      
      // ✅ CRÍTICO: NÃO SALVAR NO BANCO SE PAGAR.ME FALHOU
      return NextResponse.json({
        success: false,
        error: 'Erro ao processar pagamento: ' + pagarmeError.message
      }, { status: 500 })
    }

    // ==================================================================
    // 💾 SALVAR NO BANCO LOCAL APENAS SE PAGAR.ME OK
    // ==================================================================
    const subscriptionData = {
      user_id: userId,
      billing_period: plan.billingPeriod,
      connections_purchased: plan.connections,
      status: isTrialEligible ? 'trial' : 'active',
      trial_start_date: isTrialEligible ? now.toISOString() : null,
      trial_end_date: isTrialEligible ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      // amount: finalAmount,  // ❌ REMOVER - coluna não existe
      pagarme_customer_id: pagarmeCustomer.id,
      pagarme_card_id: pagarmeCard.id,
      pagarme_subscription_id: pagarmeSubscription.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }

    console.log('💾 Salvando assinatura local (TESTE):', subscriptionData)

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert([subscriptionData])
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao salvar assinatura:', subscriptionError)
      
      // ✅ SE ERRO NO BANCO, CANCELAR NO PAGAR.ME
      try {
        await fetch('/api/subscription/cancel-pagarme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscriptionId: pagarmeSubscription.id,
            reason: 'Database error'
          }),
        })
      } catch (cancelError) {
        console.error('❌ Erro ao cancelar no Pagar.me:', cancelError)
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
          amount: subscriptionAmount,
          payment_method: 'credit_card',
          pagarme_transaction_id: pagarmeSubscription.id,
          status: isTrialEligible ? 'trial' : 'active',
          metadata: {
            trial_days: trialDays,
            billing_period: plan.billingPeriod,
            connections: plan.connections,
            test_mode: TEST_MODE,
            is_test_price: isTestPrice,
            original_price: pricing[plan.billingPeriod][plan.connections],
            test_price_used: planPrice
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
      ? `🧪 ${isTestPrice ? 'TESTE: ' : ''}Trial de ${trialDays} dia${trialDays > 1 ? 's' : ''} ativado com sucesso!` 
      : plan.billingPeriod === 'annual'
        ? `Plano anual ativado! Cobrado R$ ${finalAmount.toFixed(2)}/ano`
        : `Plano mensal ativado! Cobrado R$ ${finalAmount.toFixed(2)}/mês`

    console.log(`✅ ${isTrialEligible ? 'Trial iniciado (TESTE)' : 'Assinatura ativada (TESTE)'}:`, subscription.id)

    return NextResponse.json({
      success: true,
      message: successMessage,
      subscription: subscription,
      trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
      next_billing_date: nextBillingDate.toISOString(),
      payment: {
        id: pagarmeSubscription.id,
        status: pagarmeSubscription.status,
        amount: chargeAmount,
        display_amount: displayAmount,
        final_amount: finalAmount,
        billing_frequency: billingFrequency,
        card: {
          last_four_digits: card_number.slice(-4),
          holder_name: card_holder_name,
          brand: detectCardBrand(card_number)
        }
      },
      is_trial: isTrialEligible,
      amount_charged: chargeAmount,
      test_mode: TEST_MODE,
      trial_days: trialDays,
      // ✅ INFORMAÇÕES DE TESTE
      test_config: {
        is_test_price: isTestPrice,
        original_price: pricing[plan.billingPeriod][plan.connections],
        test_price_used: planPrice,
        test_trial_days: TEST_TRIAL_DAYS
      },
      pagarme: {
        customer_id: pagarmeCustomer.id,
        subscription_id: pagarmeSubscription.id
      },
      // ✅ CONFIRMAR ENDEREÇO PROCESSADO
      address_processed: {
        zipcode: zipcode,
        city: city,
        state: state,
        street: `${street}, ${street_number}`
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
      return false // Em caso de erro, permitir trial
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Erro na verificação de trial:', error)
    return false // Em caso de erro, permitir trial
  }
}