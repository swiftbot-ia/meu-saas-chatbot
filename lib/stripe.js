// lib/stripe.js 

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
  paymentMethodId = null,
  planData,
  metadata = {},
  transferData = null // { destination: string, amountPercent: number }
}) {
  try {
    console.log('Criando assinatura na Stripe...')

    const { billingPeriod, connections, isTrialEligible, planPrice, trialDays = 4 } = planData

    const priceId = await getOrCreatePrice({
      amount: Math.round(planPrice * 100),
      currency: 'brl',
      interval: billingPeriod === 'monthly' ? 'month' : 'year',
      productName: `SwiftBot ${connections} Conexão${connections > 1 ? 'ões' : ''}`
    })

    // ✅ USAR ARRAY DE ENTRIES PARA PERMITIR CHAVES DUPLICADAS (expand[])
    const subscriptionData = [
      ['customer', customerId],
      ['items[0][price]', priceId],
      ['payment_behavior', 'default_incomplete'],
      ['payment_settings[save_default_payment_method]', 'on_subscription'],
      ['expand[]', 'latest_invoice.payment_intent'], // <--- AGORA VAI FUNCIONAR
      ['expand[]', 'pending_setup_intent'],          // <--- AGORA VAI FUNCIONAR
      ['metadata[connections]', connections.toString()],
      ['metadata[billing_period]', billingPeriod],
      ['metadata[user_id]', metadata.userId || ''],
      ['metadata[user_name]', metadata.userName || ''],
      ['metadata[user_email]', metadata.userEmail || ''],
      ['metadata[affiliate_code]', metadata.affiliateCode || '']
    ]

    // ✅ Adicionar split de pagamento (Stripe Connect)
    if (transferData?.destination) {
      console.log(`💸 Configurando split de pagamento para: ${transferData.destination}`)
      subscriptionData.push(['transfer_data[destination]', transferData.destination])

      if (transferData.amountPercent) {
        subscriptionData.push(['transfer_data[amount_percent]', transferData.amountPercent.toString()])
      }
    }

    // ✅ Adicionar trial se elegível
    if (isTrialEligible && trialDays > 0) {
      subscriptionData.push(['trial_period_days', trialDays.toString()])
      subscriptionData.push(['trial_settings[end_behavior][missing_payment_method]', 'cancel'])
    }

    const subscription = await stripeRequest('/subscriptions', 'POST', subscriptionData)

    console.log('✅ Assinatura Stripe criada:', subscription.id)
    console.log('Status:', subscription.status)

    return subscription
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
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
// CANCELAR ASSINATURA IMEDIATAMENTE (para 7 primeiros dias)
// ============================================================================
export async function cancelSubscriptionImmediately(subscriptionId, reason = 'customer_request') {
  try {
    console.log(`❌ Cancelando assinatura IMEDIATAMENTE: ${subscriptionId}`)

    const cancelData = {
      'metadata[cancellation_reason]': reason,
      'metadata[canceled_at]': new Date().toISOString()
    }

    // DELETE = cancela imediatamente
    const subscription = await stripeRequest(
      `/subscriptions/${subscriptionId}`,
      'DELETE',
      cancelData
    )

    console.log('✅ Assinatura cancelada imediatamente na Stripe')
    return {
      success: true,
      subscription_id: subscriptionId,
      canceled_at: subscription.canceled_at
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura:', error)
    throw error
  }
}

// ============================================================================
// CANCELAR ASSINATURA NO FIM DO PERÍODO (após 7 dias)
// ============================================================================
export async function cancelSubscriptionAtPeriodEnd(subscriptionId, reason = 'customer_request') {
  try {
    console.log(`🔄 Cancelando assinatura no fim do período: ${subscriptionId}`)

    const updateData = {
      'cancel_at_period_end': 'true',
      'metadata[cancellation_reason]': reason,
      'metadata[cancel_requested_at]': new Date().toISOString()
    }

    // POST = atualiza, não cancela imediatamente
    const subscription = await stripeRequest(
      `/subscriptions/${subscriptionId}`,
      'POST',
      updateData
    )

    console.log('✅ Assinatura marcada para cancelar no fim do período')

    // Validar current_period_end antes de usar
    let periodEndDate = null
    try {
      if (subscription.current_period_end) {
        periodEndDate = new Date(subscription.current_period_end * 1000).toISOString()
        console.log(`📅 Acesso até: ${periodEndDate}`)
      }
    } catch (dateError) {
      console.warn('⚠️ Erro ao processar data:', dateError)
    }

    return {
      success: true,
      subscription_id: subscriptionId,
      cancel_at_period_end: true,
      current_period_end: subscription.current_period_end,
      access_until: periodEndDate
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura no fim do período:', error)
    throw error
  }
}

// ============================================================================
// BUSCAR INVOICES DA ASSINATURA (para reembolso)
// ============================================================================
export async function getSubscriptionInvoices(subscriptionId) {
  try {
    console.log(`📄 Buscando invoices da assinatura: ${subscriptionId}`)

    const invoices = await stripeRequest(
      `/invoices?subscription=${subscriptionId}&limit=10`,
      'GET'
    )

    console.log(`✅ Encontradas ${invoices.data.length} invoices`)
    return invoices.data

  } catch (error) {
    console.error('❌ Erro ao buscar invoices:', error)
    throw error
  }
}

// ============================================================================
// CRIAR REEMBOLSO (para 7 primeiros dias)
// ============================================================================
export async function createRefund(chargeId, amount = null, reason = 'requested_by_customer') {
  try {
    console.log(`💰 Criando reembolso para charge: ${chargeId}`)

    const refundData = {
      charge: chargeId,
      reason: reason,
      'metadata[refund_type]': '7_day_policy',
      'metadata[refunded_at]': new Date().toISOString()
    }

    // Se amount não for especificado, reembolsa tudo
    if (amount) {
      refundData.amount = Math.round(amount * 100) // Stripe usa centavos
    }

    const refund = await stripeRequest('/refunds', 'POST', refundData)

    console.log('✅ Reembolso criado:', refund.id)
    console.log(`💵 Valor: R$ ${(refund.amount / 100).toFixed(2)}`)

    return refund

  } catch (error) {
    console.error('❌ Erro ao criar reembolso:', error)
    throw error
  }
}

// ============================================================================
// BUSCAR ÚLTIMO CHARGE DE UMA SUBSCRIPTION (para reembolso)
// ============================================================================
export async function getLastChargeFromSubscription(subscriptionId) {
  try {
    console.log(`🔍 Buscando último charge da subscription: ${subscriptionId}`)

    // 1. Buscar invoices da subscription
    const invoices = await getSubscriptionInvoices(subscriptionId)

    if (!invoices || invoices.length === 0) {
      console.warn('⚠️ Nenhuma invoice encontrada')
      return null
    }

    // 2. Pegar a invoice mais recente que foi paga
    const paidInvoice = invoices.find(inv => inv.status === 'paid' && inv.charge)

    if (!paidInvoice) {
      console.warn('⚠️ Nenhuma invoice paga encontrada')
      return null
    }

    console.log('✅ Charge encontrado:', paidInvoice.charge)

    return {
      charge_id: paidInvoice.charge,
      amount: paidInvoice.amount_paid,
      invoice_id: paidInvoice.id,
      created: paidInvoice.created
    }

  } catch (error) {
    console.error('❌ Erro ao buscar charge:', error)
    return null
  }
}

// ============================================================================
// MANTER FUNÇÃO ANTIGA PARA COMPATIBILIDADE (usa cancelamento no fim do período)
// ============================================================================
export async function cancelSubscription(subscriptionId, reason = 'customer_request') {
  // Por padrão, cancela no fim do período (comportamento mais seguro)
  return await cancelSubscriptionAtPeriodEnd(subscriptionId, reason)
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
  cancelSubscriptionImmediately,
  cancelSubscriptionAtPeriodEnd,
  createRefund,
  getLastChargeFromSubscription,
  getSubscriptionInvoices,
  updateSubscription,
  detectCardBrand,
  hasUserUsedTrial,
  mapStripeStatus,
  createCheckoutSession
}