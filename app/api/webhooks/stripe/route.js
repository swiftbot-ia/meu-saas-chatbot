import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

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

  // 1. Atualizar status da assinatura
  const { data: updatedSub, error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'active',
      next_billing_date: periodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id')
    .single()

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (succeeded):', error)
  } else if (updatedSub?.user_id) {
    // 2. Processar Afiliados (Comissão e Upgrade)
    await Promise.all([
      recordAffiliateCommission(updatedSub.user_id, invoice.amount_paid, invoice.id),
      checkAndUpgradeAffiliate(updatedSub.user_id)
    ])
  }
}

// ✅ NOVA: Gravar comissão do afiliado (Regra: Apenas 1ª Mensalidade)
async function recordAffiliateCommission(userId, invoiceAmount, invoiceId) {
  try {
    // 1. Buscar se usuário veio por indicação
    const { data: referral } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('id, affiliate_id, status, referral_code_used')
      .eq('referred_user_id', userId)
      .single()

    if (!referral) return // Usuário orgânico (não veio de afiliado)

    // 2. Verificar se já existe comissão para este referral
    // REGRA DE NEGÓCIO: "First Payment Only" -> Se já tiver comissão, ignora.
    const { data: existingComm } = await supabaseAdmin
      .from('affiliate_commissions')
      .select('id')
      .eq('referral_id', referral.id)
      .single()

    if (existingComm) {
      console.log(`ℹ️ [Affiliate] Comissão já processada anteriormente para referral ${referral.id}. Ignorando novos pagamentos.`)
      return
    }

    // 3. Buscar dados do afiliado para pegar a taxa
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, commission_rate, total_earned, available_balance')
      .eq('id', referral.affiliate_id)
      .single()

    if (!affiliate) return

    // 4. Calcular valor
    // invoiceAmount vem em centavos do Stripe (ex: 10000 = R$ 100,00)
    const saleAmount = invoiceAmount / 100
    const commissionAmount = saleAmount * affiliate.commission_rate

    console.log(`💰 [Affiliate] Gerando comissão de R$ ${commissionAmount.toFixed(2)} (${affiliate.commission_rate * 100}%) para afiliado ${affiliate.id}`)

    // 5. Inserir registro de comissão
    const { error: commError } = await supabaseAdmin
      .from('affiliate_commissions')
      .insert([{
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        amount: commissionAmount,
        status: 'paid', // Consideramos pago pois o Split do Stripe é automático na transação
        commission_rate: affiliate.commission_rate,
        currency: 'BRL',
        created_at: new Date().toISOString()
      }])

    if (commError) {
      console.error('❌ Erro ao gravar comissão:', commError)
      return
    }

    // 6. Atualizar Total Ganho no Dashboard do Afiliado
    // (Apenas visual, pois o dinheiro já foi pro Stripe dele via Split)
    await supabaseAdmin
      .from('affiliates')
      .update({
        total_earned: (Number(affiliate.total_earned) || 0) + commissionAmount,
        available_balance: (Number(affiliate.available_balance) || 0) + commissionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id)

    console.log('✅ [Affiliate] Dashboard atualizado com sucesso.')

  } catch (e) {
    console.error('❌ Erro no processamento de comissão:', e)
  }
}

async function checkAndUpgradeAffiliate(userId) {
  try {
    // 1. Verificar se usuário é afiliado
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, commission_rate, status')
      .eq('user_id', userId)
      .single()

    if (affiliate) {
      // 2. Se a taxa for menor que 30%, fazer upgrade
      if (affiliate.commission_rate < 0.30) {
        console.log(`🚀 [Upgrade] Afiliado ${affiliate.id} (User ${userId}) pagou assinatura. Subindo comissão para 30%.`)

        await supabaseAdmin
          .from('affiliates')
          .update({
            commission_rate: 0.30,
            updated_at: new Date().toISOString()
          })
          .eq('id', affiliate.id)
      } else {
        console.log(`ℹ️ [Upgrade] Afiliado ${affiliate.id} já possui taxa de ${(affiliate.commission_rate * 100)}%. Nenhuma alteração.`)
      }
    }
  } catch (error) {
    console.error('⚠️ Erro no auto-upgrade de afiliado:', error)
  }
}

async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return

  const subscriptionId = invoice.subscription
  console.log(`❌ Pagamento falhou para assinatura: ${subscriptionId}`)

  // O status exato (past_due, unpaid) será atualizado pelo evento customer.subscription.updated
  // Mas podemos forçar uma verificação ou notificar o usuário aqui

  // Exemplo: Atualizar para 'past_due' (atrasado) se já não estiver
  const { error } = await supabaseAdmin
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

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Erro ao atualizar assinatura (updated):', error)
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`🗑️ Assinatura cancelada/deletada: ${subscription.id}`)

  const { error } = await supabaseAdmin
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