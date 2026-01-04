import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`❌ Erro de assinatura no webhook: ${err.message}`)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const { type, data } = event
    console.log(`🔔 Evento Stripe recebido: ${type}`)

    switch (type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object)
        break
      default:
        console.log(`🤷‍♂️ Evento não tratado: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`❌ Erro no processamento do webhook: ${err.message}`)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) return

  const subscriptionId = invoice.subscription
  const periodEnd = new Date(invoice.lines.data[0].period.end * 1000)

  console.log(`✅ Pagamento aprovado para assinatura: ${subscriptionId}`)

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      next_billing_date: periodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (succeeded):', error)
  }
}

async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return

  const subscriptionId = invoice.subscription
  console.log(`❌ Pagamento falhou para assinatura: ${subscriptionId}`)

  // O status exato (past_due, unpaid) será atualizado pelo evento customer.subscription.updated
  // Mas podemos forçar uma verificação ou notificar o usuário aqui

  // Exemplo: Atualizar para 'past_due' (atrasado) se já não estiver
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (failed):', error)
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log(`🔄 Assinatura atualizada: ${subscription.id} -> Status: ${subscription.status}`)

  // Mapear status do Stripe para nosso status interno
  const statusMap = {
    'active': 'active',
    'trialing': 'trial',
    'past_due': 'past_due',
    'unpaid': 'expired',
    'canceled': 'canceled',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'paused': 'paused'
  }

  const newStatus = statusMap[subscription.status] || 'expired'

  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  // Atualizar datas de período se disponíveis
  if (subscription.current_period_end) {
    updateData.next_billing_date = new Date(subscription.current_period_end * 1000).toISOString()
  }

  if (subscription.trial_end) {
    updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString()
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (updated):', error)
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`🗑️ Assinatura cancelada/deletada: ${subscription.id}`)

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (deleted):', error)
  }
}