// lib/stripe.js - CLIENTE STRIPE PARA SWIFTBOT
// Substitui completamente o lib/pagarme.js mantendo a mesma estrutura de funções

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE'
const STRIPE_API_URL = 'https://api.stripe.com/v1'

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// Função helper para fazer requisições à Stripe API
async function stripeRequest(endpoint, method = 'POST', data = {}) {
  try {
    const url = `${STRIPE_API_URL}${endpoint}`
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }

    // Stripe usa form-encoded ao invés de JSON
    if (method !== 'GET' && method !== 'DELETE') {
      options.body = new URLSearchParams(data).toString()
    }

    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      console.error(`Stripe API Error [${endpoint}]:`, result)
      throw new Error(result.error?.message || 'Erro na requisição à Stripe')
    }

    return result
  } catch (error) {
    console.error('Erro na requisição Stripe:', error)
    throw error
  }
}

// ============================================================================
// CRIAR CUSTOMER (equivalente ao createCustomer do Pagar.me)
// ============================================================================
export async function createCustomer({ name, email, phone }) {
  try {
    console.log('Criando customer na Stripe...')

    // Stripe NÃO exige CPF nem endereço completo (apenas para Brazilian tax ID se necessário)
    const customerData = {
      name: name,
      email: email,
      phone: phone || undefined, // Opcional na Stripe
      'metadata[source]': 'swiftbot',
      'metadata[created_at]': new Date().toISOString()
    }

    const customer = await stripeRequest('/customers', 'POST', customerData)
    
    console.log('✅ Customer Stripe criado:', customer.id)
    return customer

  } catch (error) {
    console.error('❌ Erro ao criar customer na Stripe:', error)
    throw error
  }
}

// ============================================================================
// ANEXAR PAYMENT METHOD AO CUSTOMER
// ============================================================================
export async function attachPaymentMethodToCustomer(paymentMethodId, customerId) {
  try {
    console.log(`Anexando Payment Method ${paymentMethodId} ao Customer ${customerId}...`)

    const attachData = {
      customer: customerId
    }

    const attached = await stripeRequest(
      `/payment_methods/${paymentMethodId}/attach`,
      'POST',
      attachData
    )

    // Definir como método de pagamento padrão
    await stripeRequest(`/customers/${customerId}`, 'POST', {
      'invoice_settings[default_payment_method]': paymentMethodId
    })

    console.log('✅ Payment Method anexado e definido como padrão')
    return attached

  } catch (error) {
    console.error('❌ Erro ao anexar Payment Method:', error)
    throw error
  }
}

// ============================================================================
// CRIAR ASSINATURA COM TRIAL (substitui createSubscription do Pagar.me)
// ============================================================================
export async function createSubscription({ 
  customerId, 
  paymentMethodId, 
  planData, 
  metadata = {} 
}) {
  try {
    console.log('Criando assinatura na Stripe...')

    const { billingPeriod, connections, isTrialEligible, planPrice, trialDays = 4 } = planData

    // PASSO 1: Criar ou buscar Price ID para este plano
    const priceId = await getOrCreatePrice({
      amount: Math.round(planPrice * 100), // Stripe usa centavos
      currency: 'brl',
      interval: billingPeriod === 'monthly' ? 'month' : 'year',
      productName: `SwiftBot ${connections} Conexão${connections > 1 ? 'ões' : ''}`
    })

    // PASSO 2: Criar a assinatura
    const subscriptionData = {
      customer: customerId,
      'items[0][price]': priceId,
      'default_payment_method': paymentMethodId,
      'payment_behavior': 'default_incomplete', // Permite controlar o trial
      'metadata[connections]': connections.toString(),
      'metadata[billing_period]': billingPeriod,
      'metadata[user_id]': metadata.userId || '',
      'metadata[user_name]': metadata.userName || '',
      'metadata[user_email]': metadata.userEmail || ''
    }

    // Se tiver trial, adicionar trial_period_days
    if (isTrialEligible && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays
      subscriptionData['trial_settings[end_behavior][missing_payment_method]'] = 'cancel'
    } else {
      // Sem trial, cobrar imediatamente
      subscriptionData.payment_behavior = 'default_incomplete'
    }

    const subscription = await stripeRequest('/subscriptions', 'POST', subscriptionData)

    console.log('✅ Assinatura Stripe criada:', subscription.id)
    console.log('Status:', subscription.status)
    console.log('Trial end:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A')

    return subscription

  } catch (error) {
    console.error('❌ Erro ao criar assinatura na Stripe:', error)
    throw error
  }
}

// ============================================================================
// CRIAR OU BUSCAR PRICE (Plano de Preço na Stripe)
// ============================================================================
async function getOrCreatePrice({ amount, currency, interval, productName }) {
  try {
    // Na Stripe, você pode criar prices dinamicamente OU usar prices pré-criados
    // Por simplicidade, vamos criar dinamicamente (ou você pode usar IDs fixos)
    
    // PASSO 1: Criar ou buscar produto
    const product = await stripeRequest('/products', 'POST', {
      name: productName,
      'metadata[source]': 'swiftbot'
    })

    // PASSO 2: Criar price para este produto
    const price = await stripeRequest('/prices', 'POST', {
      product: product.id,
      unit_amount: amount,
      currency: currency,
      'recurring[interval]': interval,
      'recurring[interval_count]': 1
    })

    console.log('✅ Price criado:', price.id)
    return price.id

  } catch (error) {
    console.error('❌ Erro ao criar price:', error)
    throw error
  }
}

// ============================================================================
// BUSCAR STATUS DA ASSINATURA (equivalente ao getSubscriptionStatus)
// ============================================================================
export async function getSubscriptionStatus(subscriptionId) {
  try {
    console.log(`Buscando status da assinatura ${subscriptionId}...`)

    const subscription = await stripeRequest(`/subscriptions/${subscriptionId}`, 'GET')
    
    console.log('Status da assinatura:', subscription.status)
    return subscription

  } catch (error) {
    console.error('❌ Erro ao buscar status da assinatura:', error)
    throw error
  }
}

// ============================================================================
// CANCELAR ASSINATURA (equivalente ao cancelSubscription)
// ============================================================================
export async function cancelSubscription(subscriptionId, reason = 'customer_request') {
  try {
    console.log(`Cancelando assinatura ${subscriptionId}...`)

    const cancelData = {
      'metadata[cancellation_reason]': reason,
      'metadata[canceled_at]': new Date().toISOString()
    }

    // Stripe cancela imediatamente por padrão
    // Se quiser manter até o fim do período: cancel_at_period_end: true
    const subscription = await stripeRequest(
      `/subscriptions/${subscriptionId}`,
      'DELETE',
      cancelData
    )

    console.log('✅ Assinatura cancelada na Stripe')
    return { 
      success: true, 
      subscription_id: subscriptionId,
      canceled_at: subscription.canceled_at 
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura na Stripe:', error)
    throw error
  }
}

// ============================================================================
// ATUALIZAR ASSINATURA (para upgrades/downgrades)
// ============================================================================
export async function updateSubscription(subscriptionId, newPlanData) {
  try {
    console.log(`Atualizando assinatura ${subscriptionId}...`)

    const { planPrice, billingPeriod, connections } = newPlanData

    // Criar novo price
    const priceId = await getOrCreatePrice({
      amount: Math.round(planPrice * 100),
      currency: 'brl',
      interval: billingPeriod === 'monthly' ? 'month' : 'year',
      productName: `SwiftBot ${connections} Conexão${connections > 1 ? 'ões' : ''}`
    })

    // Buscar subscription atual
    const currentSub = await getSubscriptionStatus(subscriptionId)
    const itemId = currentSub.items.data[0].id

    // Atualizar subscription
    const updateData = {
      'items[0][id]': itemId,
      'items[0][price]': priceId,
      'proration_behavior': 'create_prorations', // Calcular proporcionalmente
      'metadata[updated_at]': new Date().toISOString(),
      'metadata[new_connections]': connections.toString()
    }

    const updated = await stripeRequest(`/subscriptions/${subscriptionId}`, 'POST', updateData)

    console.log('✅ Assinatura atualizada com sucesso')
    return updated

  } catch (error) {
    console.error('❌ Erro ao atualizar assinatura:', error)
    throw error
  }
}

// ============================================================================
// DETECTAR BANDEIRA DO CARTÃO (mantém mesma função do Pagar.me)
// ============================================================================
export function detectCardBrand(cardNumber) {
  const number = cardNumber.replace(/\s/g, '')
  
  if (/^4/.test(number)) return 'visa'
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard'
  if (/^3[47]/.test(number)) return 'amex'
  if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6550|6555)/.test(number)) return 'elo'
  if (/^(38|60)/.test(number)) return 'hipercard'
  if (/^(30|36|38)/.test(number)) return 'dinners'
  
  return 'unknown'
}

// ============================================================================
// VERIFICAR SE USUÁRIO JÁ USOU TRIAL
// ============================================================================
export const hasUserUsedTrial = async (userId) => {
  // TODO: Implementar verificação no banco de dados
  // Por enquanto retorna false (todos elegíveis para trial)
  return false
}

// ============================================================================
// MAPEAR STATUS STRIPE PARA STATUS LOCAL
// ============================================================================
export function mapStripeStatus(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'trialing': 'trial',
    'canceled': 'canceled',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'past_due': 'expired',
    'unpaid': 'expired',
    'paused': 'paused'
  }

  return statusMap[stripeStatus] || 'expired'
}

// ============================================================================
// CONSTRUIR STRIPE CHECKOUT SESSION (Alternativa para hosted checkout)
// ============================================================================
export async function createCheckoutSession({ 
  customerId, 
  priceId, 
  successUrl, 
  cancelUrl,
  trialDays = 0 
}) {
  try {
    console.log('Criando Checkout Session na Stripe...')

    const sessionData = {
      customer: customerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': 1,
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl
    }

    if (trialDays > 0) {
      sessionData['subscription_data[trial_period_days]'] = trialDays
    }

    const session = await stripeRequest('/checkout/sessions', 'POST', sessionData)

    console.log('✅ Checkout Session criada:', session.id)
    return session

  } catch (error) {
    console.error('❌ Erro ao criar Checkout Session:', error)
    throw error
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  createCustomer,
  attachPaymentMethodToCustomer,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  updateSubscription,
  detectCardBrand,
  hasUserUsedTrial,
  mapStripeStatus,
  createCheckoutSession
}