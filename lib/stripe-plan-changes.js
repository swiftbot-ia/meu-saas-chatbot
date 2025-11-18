// lib/stripe-plan-changes.js
// Funções para gerenciar upgrades e downgrades seguindo boas práticas da Stripe
// Baseado em: https://docs.stripe.com/billing/subscriptions/upgrade-downgrade

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ============================================
// PRICE IDS DA STRIPE
// ============================================

export const STRIPE_PRICE_IDS = {
  monthly: {
    1: 'price_1SUN8V2Y59Hv79eSFK38Likw',
    2: 'price_1SUN8W2Y59Hv79eSZiee9YzA',
    3: 'price_1SUN8X2Y59Hv79eSIbv7khXR',
    4: 'price_1SUN8X2Y59Hv79eSlG0e6jhC',
    5: 'price_1SUN8Y2Y59Hv79eSyrSc2t11',
    6: 'price_1SUN8a2Y59Hv79eS87Pr0zVp',
    7: 'price_1SUN8a2Y59Hv79eSrCAtWgus',
  },
  annual: {
    1: 'price_1SUN8b2Y59Hv79eSXGcUCWG0',
    2: 'price_1SUN8c2Y59Hv79eSFzR6QAbq',
    3: 'price_1SUN8c2Y59Hv79eSRIn8Talg',
    4: 'price_1SUN8d2Y59Hv79eSPisigfG0',
    5: 'price_1SUN8e2Y59Hv79eS47ZRl951',
    6: 'price_1SUN8f2Y59Hv79eS8fgHTXPd',
    7: 'price_1SUN8g2Y59Hv79eSKMkQ5uec',
  }
}

export const PLAN_PRICES = {
  monthly: {
    1: 165, 2: 20, 3: 445, 4: 585, 5: 625, 6: 750, 7: 875
  },
  annual: {
    1: 1776, 2: 3294, 3: 4806, 4: 6318, 5: 6750, 6: 8100, 7: 9450
  }
}

// ============================================
// HELPER: BUSCAR PRICE ID
// ============================================

export function getPriceId(connections, billingPeriod) {
  if (!STRIPE_PRICE_IDS[billingPeriod] || !STRIPE_PRICE_IDS[billingPeriod][connections]) {
    throw new Error(`Price ID não encontrado para ${connections} conexões ${billingPeriod}`)
  }
  return STRIPE_PRICE_IDS[billingPeriod][connections]
}

// ============================================
// DETERMINAR TIPO DE MUDANÇA
// ============================================

/**
 * Determina se é upgrade ou downgrade baseado no valor total
 * REGRA: Se novo valor > valor atual = UPGRADE (cobra imediato)
 *        Se novo valor < valor atual = DOWNGRADE (agenda)
 */
export function determineChangeType(currentPlan, newPlan) {
  const currentValue = PLAN_PRICES[currentPlan.billing_period][currentPlan.connections]
  const newValue = PLAN_PRICES[newPlan.billing_period][newPlan.connections]
  
  console.log('📊 Comparando valores:', {
    current: `R$ ${currentValue} (${currentPlan.connections} ${currentPlan.billing_period})`,
    new: `R$ ${newValue} (${newPlan.connections} ${newPlan.billing_period})`,
    difference: newValue - currentValue
  })

  if (newValue > currentValue) {
    return 'upgrade' // Cobra imediato com proration
  } else if (newValue < currentValue) {
    return 'downgrade' // Agenda para próximo ciclo
  } else {
    throw new Error('Novo plano tem o mesmo valor do plano atual')
  }
}

// ============================================
// UPGRADE: COBRA IMEDIATO COM PRORATION
// ============================================

/**
 * Processa upgrade imediato usando proration da Stripe
 * A Stripe calcula automaticamente:
 * - Crédito não usado do plano atual
 * - Custo proporcional do novo plano
 * - Cobra a diferença imediatamente
 * 
 * Docs: https://docs.stripe.com/billing/subscriptions/upgrade-downgrade
 */
export async function processUpgrade(stripeSubscriptionId, newPlan) {
  try {
    console.log('🚀 Processando UPGRADE imediato...')
    console.log('📝 Dados:', {
      subscriptionId: stripeSubscriptionId,
      newPlan
    })

    // 1. Buscar subscription atual
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    
    if (!subscription || subscription.status === 'canceled') {
      throw new Error('Assinatura não encontrada ou cancelada')
    }

    console.log('✅ Subscription encontrada:', {
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })

    // 2. Buscar Price ID do novo plano
    const newPriceId = getPriceId(newPlan.connections, newPlan.billing_period)
    console.log('💰 Novo Price ID:', newPriceId)

    // 3. Atualizar subscription com proration automática
    // A Stripe calcula tudo automaticamente quando usamos proration_behavior: 'create_prorations'
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations', // Cria proration automaticamente
      billing_cycle_anchor: 'unchanged', // Mantém data de renovação
      metadata: {
        ...subscription.metadata,
        connections: String(newPlan.connections),
        billing_period: newPlan.billing_period,
        last_change: new Date().toISOString(),
        change_type: 'upgrade'
      }
    })

    console.log('✅ Subscription atualizada:', {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      latest_invoice: updatedSubscription.latest_invoice
    })

    // 4. Buscar invoice criada com proration
    let invoice = null
    if (updatedSubscription.latest_invoice) {
      invoice = await stripe.invoices.retrieve(updatedSubscription.latest_invoice)
      console.log('💳 Invoice gerada:', {
        id: invoice.id,
        amount_due: invoice.amount_due / 100,
        status: invoice.status
      })
    }

    return {
      success: true,
      subscription: updatedSubscription,
      invoice: invoice,
      charged_amount: invoice ? invoice.amount_due / 100 : 0,
      next_billing_date: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    }

  } catch (error) {
    console.error('❌ Erro no upgrade:', error)
    return {
      success: false,
      error: error.message,
      code: error.code,
      type: error.type
    }
  }
}

// ============================================
// DOWNGRADE: AGENDA COM SUBSCRIPTION SCHEDULE
// ============================================

/**
 * Agenda downgrade para o fim do período atual usando Subscription Schedules
 * Isso é a melhor prática recomendada pela Stripe
 * 
 * Docs: https://docs.stripe.com/billing/subscriptions/subscription-schedules
 */
export async function processDowngrade(stripeSubscriptionId, newPlan, currentPeriodEnd) {
  try {
    console.log('📅 Processando DOWNGRADE agendado...')
    console.log('📝 Dados:', {
      subscriptionId: stripeSubscriptionId,
      newPlan,
      currentPeriodEnd
    })

    // 1. Buscar subscription atual
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    
    if (!subscription || subscription.status === 'canceled') {
      throw new Error('Assinatura não encontrada ou cancelada')
    }

    // 2. Verificar se já tem um schedule
    let schedule = null
    if (subscription.schedule) {
      console.log('📋 Schedule existente encontrado:', subscription.schedule)
      schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule)
    }

    // 3. Buscar Price ID do novo plano
    const newPriceId = getPriceId(newPlan.connections, newPlan.billing_period)
    const currentPriceId = subscription.items.data[0].price.id

    // 4. Criar ou atualizar subscription schedule
    if (schedule) {
      // Atualizar schedule existente
      console.log('🔄 Atualizando schedule existente...')
      
      const currentPhase = schedule.phases.find(p => p.start_date <= Math.floor(Date.now() / 1000))
      
      schedule = await stripe.subscriptionSchedules.update(schedule.id, {
        phases: [
          {
            items: [{
              price: currentPriceId,
              quantity: 1
            }],
            start_date: currentPhase.start_date,
            end_date: subscription.current_period_end
          },
          {
            items: [{
              price: newPriceId,
              quantity: 1
            }],
            start_date: subscription.current_period_end,
            iterations: 12 // 12 ciclos (1 ano)
          }
        ],
        proration_behavior: 'none', // Sem proration em downgrade
        metadata: {
          change_type: 'downgrade',
          scheduled_at: new Date().toISOString(),
          new_connections: String(newPlan.connections),
          new_period: newPlan.billing_period
        }
      })
    } else {
      // Criar novo schedule
      console.log('🆕 Criando novo schedule...')
      
      schedule = await stripe.subscriptionSchedules.create({
        from_subscription: stripeSubscriptionId,
        phases: [
          {
            items: [{
              price: currentPriceId,
              quantity: 1
            }],
            start_date: 'now',
            end_date: subscription.current_period_end
          },
          {
            items: [{
              price: newPriceId,
              quantity: 1
            }],
            start_date: subscription.current_period_end,
            iterations: 12
          }
        ],
        proration_behavior: 'none',
        metadata: {
          change_type: 'downgrade',
          scheduled_at: new Date().toISOString(),
          new_connections: String(newPlan.connections),
          new_period: newPlan.billing_period
        }
      })
    }

    console.log('✅ Schedule configurado:', {
      id: schedule.id,
      phases: schedule.phases.length,
      next_phase_start: new Date(schedule.phases[1].start_date * 1000).toISOString()
    })

    return {
      success: true,
      schedule: schedule,
      effective_date: new Date(subscription.current_period_end * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    }

  } catch (error) {
    console.error('❌ Erro no downgrade:', error)
    return {
      success: false,
      error: error.message,
      code: error.code,
      type: error.type
    }
  }
}

// ============================================
// CANCELAR MUDANÇA AGENDADA
// ============================================

/**
 * Cancela um downgrade agendado removendo o schedule
 */
export async function cancelScheduledChange(stripeSubscriptionId) {
  try {
    console.log('🔄 Cancelando mudança agendada...')

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    
    if (!subscription.schedule) {
      return {
        success: false,
        error: 'Nenhuma mudança agendada encontrada'
      }
    }

    // Release do schedule (volta subscription para estado normal)
    await stripe.subscriptionSchedules.release(subscription.schedule)

    console.log('✅ Mudança agendada cancelada')

    return {
      success: true,
      message: 'Mudança agendada cancelada com sucesso'
    }

  } catch (error) {
    console.error('❌ Erro ao cancelar mudança:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// CALCULAR PREVIEW DE UPGRADE (opcional)
// ============================================

/**
 * Calcula quanto será cobrado em um upgrade (preview)
 * Útil para mostrar ao usuário antes de confirmar
 */
export async function previewUpgrade(stripeSubscriptionId, newPlan) {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const newPriceId = getPriceId(newPlan.connections, newPlan.billing_period)

    // Usar API de preview invoice da Stripe
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      subscription: stripeSubscriptionId,
      subscription_items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      subscription_proration_behavior: 'create_prorations',
      subscription_proration_date: Math.floor(Date.now() / 1000)
    })

    const prorationAmount = upcomingInvoice.lines.data
      .filter(line => line.proration)
      .reduce((sum, line) => sum + line.amount, 0)

    return {
      success: true,
      amount_due: upcomingInvoice.amount_due / 100,
      proration_amount: prorationAmount / 100,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
    }

  } catch (error) {
    console.error('❌ Erro no preview:', error)
    return {
      success: false,
      error: error.message
    }
  }
}