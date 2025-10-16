// lib/pagarme.js - VERSÃO CONCISA CORRIGIDA
const PAGARME_API_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_908d35ab3a724f368bd986d858324ed5'
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

// CRIAR CUSTOMER COM ENDEREÇO COMPLETO
export async function createCustomer({ name, email, document, phone, address }) {
  try {
    console.log('Criando customer no Pagar.me...')
    
    if (!phone) {
      throw new Error('Telefone é obrigatório para criar cliente no Pagar.me')
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new Error('Telefone deve ter 10 ou 11 dígitos')
    }

    const areaCode = cleanPhone.substring(0, 2)
    const phoneNumber = cleanPhone.substring(2)
    
    const customerData = {
      name: name,
      email: email,
      document: document,
      type: 'individual',
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: areaCode,
          number: phoneNumber
        }
      },
      address: {
        line_1: `${address.street}, ${address.street_number}`,
        line_2: address.complementary || '',
        zip_code: address.zipcode,
        city: address.city,
        state: address.state,
        country: 'BR'
      }
    }

    const response = await fetch(`${PAGARME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    })

    const customer = await response.json()
    
    if (!response.ok) {
      console.error('Erro ao criar customer:', customer)
      throw new Error(customer.message || 'Erro ao criar customer no Pagar.me')
    }

    console.log('Customer criado com sucesso:', customer.id)
    return customer
  } catch (error) {
    console.error('Erro na criação do customer:', error)
    throw error
  }
}

// CRIAR CARTÃO
export async function createCard(customerId, cardData, address) {
  try {
    console.log('Criando cartão no Pagar.me...')
    
    const cardPayload = {
      number: cardData.card_number.replace(/\s/g, ''),
      holder_name: cardData.card_holder_name.toUpperCase(),
      exp_month: parseInt(cardData.card_expiration_month),
      exp_year: parseInt(cardData.card_expiration_year),
      cvv: cardData.card_cvv,
      billing_address: {
        line_1: `${address.street}, ${address.street_number}`,
        line_2: address.complementary || '',
        zip_code: address.zipcode,
        city: address.city,
        state: address.state,
        country: 'BR'
      }
    }

    const response = await fetch(`${PAGARME_API_URL}/customers/${customerId}/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardPayload)
    })

    const card = await response.json()
    
    if (!response.ok) {
      console.error('Erro ao criar cartão:', card)
      throw new Error(card.message || 'Erro ao criar cartão no Pagar.me')
    }

    console.log('Cartão criado com sucesso:', card.id)
    return card
  } catch (error) {
    console.error('Erro na criação do cartão:', error)
    throw error
  }
}

// CRIAR ASSINATURA - MODELO BASEADO NO MEDIUM QUE FUNCIONA
export async function createSubscription({ customerId, cardId, planData, metadata = {} }) {
  try {
    console.log('Criando assinatura no Pagar.me (MODELO MEDIUM)...')
    
    const { billingPeriod, connections, isTrialEligible, planPrice, trialDays = 4 } = planData

    // Buscar dados do customer criado
    const customerResponse = await fetch(`${PAGARME_API_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })
    const customerData = await customerResponse.json()

    // Modelo correto baseado no exemplo do Medium que funciona
    const subscriptionData = {
      payment_method: 'credit_card',
      interval: billingPeriod === 'monthly' ? 'month' : 'year',
      interval_count: 1,
      billing_type: 'prepaid',
      installments: 1,
      currency: 'BRL',
      customer: {
        phones: customerData.phones || {},
        name: customerData.name,
        email: customerData.email,
        document_type: 'CPF',
        document: customerData.document,
        type: 'individual'  // ✅ CORRIGIDO: era customer_type
      },
      card_id: cardId,
      pricing_scheme: {
        scheme_type: 'unit',
        price: planPrice * 100
      },
      quantity: 1,
      description: `SwiftBot ${connections} Conexão${connections > 1 ? 'ões' : ''} - ${billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}`,
      ...(isTrialEligible && {
        trial_period_days: trialDays
      })
    }

    const response = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })
    
    const subscription = await response.json()
    
    if (!response.ok) {
      console.error('Erro ao criar assinatura:', subscription)
      console.error('Request que falhou:', JSON.stringify(subscriptionData, null, 2))
      throw new Error(subscription.message || 'Erro ao criar assinatura no Pagar.me')
    }
    
    console.log('Assinatura criada com sucesso:', subscription.id)
    console.log('Status da assinatura:', subscription.status)
    console.log('Valor configurado:', planPrice, billingPeriod === 'monthly' ? '/mês' : '/ano')
    
    return subscription
  } catch (error) {
    console.error('Erro na criação da assinatura:', error)
    throw error
  }
}

// BUSCAR STATUS DA ASSINATURA
export async function getSubscriptionStatus(subscriptionId) {
  try {
    const response = await fetch(`${PAGARME_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })
    
    const subscription = await response.json()
    
    if (!response.ok) {
      throw new Error(subscription.message || 'Erro ao buscar assinatura no Pagar.me')
    }
    
    return subscription
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error)
    throw error
  }
}

// CANCELAR ASSINATURA
export async function cancelSubscription(subscriptionId, reason = 'customer_request') {
  try {
    const response = await fetch(`${PAGARME_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao cancelar assinatura no Pagar.me')
    }
    
    return { success: true, subscription_id: subscriptionId }
  } catch (error) {
    console.error('Erro no cancelamento da assinatura:', error)
    throw error
  }
}

// DETECTAR BANDEIRA DO CARTÃO
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

// VERIFICAR SE USUÁRIO JÁ USOU TRIAL
export const hasUserUsedTrial = async (userId) => {
  return false
}