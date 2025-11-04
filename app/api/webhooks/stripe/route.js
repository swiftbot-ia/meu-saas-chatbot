// app/api/webhooks/stripe/route.js
// WEBHOOK HANDLER PARA STRIPE - Substitui o Pagar.me
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import crypto from 'crypto'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    console.log('📡 Webhook Stripe recebido')

    // ✅ VERIFICAR ASSINATURA DO WEBHOOK (CRÍTICO PARA SEGURANÇA)
    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        const verified = verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
        if (!verified) {
          console.error('❌ Assinatura do webhook inválida')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
        console.log('✅ Assinatura do webhook verificada')
      } catch (verifyError) {
        console.error('❌ Erro ao verificar assinatura:', verifyError)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    
    console.log('📡 Evento Stripe:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    })

    // ✅ PROCESSAR EVENTOS DA STRIPE
    switch (event.type) {
      // EVENTOS DE ASSINATURA
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object)
        break

      // EVENTOS DE PAGAMENTO
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break

      // EVENTOS DE CUSTOMER
      case 'customer.created':
        console.log('👤 Customer criado:', event.data.object.id)
        break

      case 'customer.updated':
        console.log('👤 Customer atualizado:', event.data.object.id)
        break

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object)
        break

      default:
        console.log('⚠️ Evento não processado:', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao processar webhook Stripe:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ============================================================================
// VERIFICAR ASSINATURA DO WEBHOOK (Segurança)
// ============================================================================
function verifyStripeSignature(payload, header, secret) {
  try {
    const timestamp = header.split(',')[0].split('=')[1]
    const signatures = header.split(',').slice(1).map(s => s.split('=')[1])
    
    const signedPayload = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')
    
    return signatures.some(sig => crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    ))
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return false
  }
}

// ============================================================================
// HANDLERS DE EVENTOS DE ASSINATURA
// ============================================================================

// ✅ ASSINATURA CRIADA
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('📝 Assinatura criada via webhook:', subscription.id)
    
    // Atualizar status no banco local
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: mapStripeStatus(subscription.status),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('❌ Erro ao atualizar assinatura criada:', error)
    } else {
      console.log('✅ Status da assinatura atualizado')
    }

  } catch (error) {
    console.error('❌ Erro ao processar criação de assinatura:', error)
  }
}

// ✅ ASSINATURA ATUALIZADA
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Assinatura atualizada via webhook:', subscription.id)
    
    const updateData = {
      status: mapStripeStatus(subscription.status),
      updated_at: new Date().toISOString()
    }

    // Se trial acabou, atualizar data de próxima cobrança
    if (subscription.current_period_end) {
      updateData.next_billing_date = new Date(subscription.current_period_end * 1000).toISOString()
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('❌ Erro ao atualizar assinatura:', error)
    } else {
      console.log('✅ Assinatura atualizada no banco')
    }

  } catch (error) {
    console.error('❌ Erro ao processar atualização de assinatura:', error)
  }
}

// ✅ ASSINATURA CANCELADA (CRÍTICO)
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('🚨 Processando cancelamento de assinatura:', subscription.id)

    // Buscar assinatura no banco local
    const { data: localSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (fetchError || !localSubscription) {
      console.error('❌ Assinatura não encontrada no banco local:', subscription.id)
      return
    }

    // ✅ DESCONECTAR WHATSAPP IMEDIATAMENTE
    await disconnectUserWhatsApp(localSubscription.user_id)

    // ✅ ATUALIZAR STATUS NO BANCO
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: now,
        updated_at: now
      })
      .eq('id', localSubscription.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar status da assinatura:', updateError)
      return
    }

    // ✅ LOG DO EVENTO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: localSubscription.user_id,
        subscription_id: localSubscription.id,
        event_type: 'subscription_canceled_webhook',
        amount: 0,
        payment_method: 'credit_card',
        stripe_transaction_id: subscription.id,
        status: 'canceled',
        metadata: {
          reason: 'webhook_notification',
          canceled_by: 'stripe',
          webhook_data: {
            subscription_id: subscription.id,
            customer_id: subscription.customer,
            cancel_at_period_end: subscription.cancel_at_period_end
          },
          whatsapp_disconnected: true,
          processed_at: now
        },
        created_at: now
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log do webhook:', logError)
    }

    console.log('✅ Cancelamento processado via webhook - WhatsApp desconectado')

  } catch (error) {
    console.error('❌ Erro ao processar cancelamento via webhook:', error)
  }
}

// ✅ TRIAL VAI TERMINAR (3 dias antes)
async function handleTrialWillEnd(subscription) {
  try {
    console.log('⏰ Trial vai terminar em breve:', subscription.id)
    
    // Buscar dados do usuário
    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (localSubscription) {
      // TODO: Enviar email/notificação para o usuário
      console.log('📧 Enviar notificação de fim de trial para user:', localSubscription.user_id)
    }

  } catch (error) {
    console.error('❌ Erro ao processar aviso de fim de trial:', error)
  }
}

// ============================================================================
// HANDLERS DE EVENTOS DE PAGAMENTO
// ============================================================================

// ✅ FATURA PAGA (Renovação bem-sucedida)
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('💰 Fatura paga via webhook:', invoice.id)
    
    if (!invoice.subscription) {
      console.log('⚠️ Fatura sem subscription_id associado')
      return
    }

    // Buscar assinatura no banco
    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single()

    if (!localSubscription) {
      console.log('⚠️ Assinatura não encontrada para fatura:', invoice.subscription)
      return
    }

    // ✅ ATUALIZAR STATUS PARA ACTIVE
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
        next_billing_date: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
      })
      .eq('id', localSubscription.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar assinatura após pagamento:', updateError)
    }

    // ✅ LOG DO PAGAMENTO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: localSubscription.user_id,
        subscription_id: localSubscription.id,
        event_type: 'invoice_paid_webhook',
        amount: invoice.amount_paid / 100, // Stripe usa centavos
        payment_method: 'credit_card',
        stripe_transaction_id: invoice.id,
        status: 'paid',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          customer_id: invoice.customer,
          amount_paid: invoice.amount_paid / 100,
          currency: invoice.currency,
          processed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log de pagamento:', logError)
    }

    console.log('✅ Pagamento processado com sucesso')

  } catch (error) {
    console.error('❌ Erro ao processar fatura paga:', error)
  }
}

// ✅ FATURA COM FALHA (Renovação falhou)
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('❌ Falha no pagamento da fatura:', invoice.id)
    
    if (!invoice.subscription) {
      console.log('⚠️ Fatura sem subscription_id associado')
      return
    }

    // Buscar assinatura no banco
    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single()

    if (!localSubscription) {
      console.log('⚠️ Assinatura não encontrada para fatura:', invoice.subscription)
      return
    }

    // ✅ DESCONECTAR WHATSAPP POR FALHA DE PAGAMENTO
    console.log('🚨 Desconectando WhatsApp por falha de pagamento')
    await disconnectUserWhatsApp(localSubscription.user_id)

    // ✅ ATUALIZAR STATUS PARA CANCELED
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now,
        updated_at: now
      })
      .eq('id', localSubscription.id)

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError)
    }

    // ✅ LOG DA FALHA
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: localSubscription.user_id,
        subscription_id: localSubscription.id,
        event_type: 'invoice_payment_failed_webhook',
        amount: invoice.amount_due / 100,
        payment_method: 'credit_card',
        stripe_transaction_id: invoice.id,
        status: 'failed',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          customer_id: invoice.customer,
          amount_due: invoice.amount_due / 100,
          currency: invoice.currency,
          attempt_count: invoice.attempt_count,
          next_payment_attempt: invoice.next_payment_attempt,
          whatsapp_disconnected: true,
          processed_at: now
        },
        created_at: now
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log de falha:', logError)
    }

    console.log('✅ Falha de pagamento processada - WhatsApp desconectado')

  } catch (error) {
    console.error('❌ Erro ao processar falha de pagamento:', error)
  }
}

// ✅ PAYMENT INTENT SUCESSO
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('💳 Payment Intent bem-sucedido:', paymentIntent.id)
    // Pode ser usado para pagamentos únicos ou setup
  } catch (error) {
    console.error('❌ Erro ao processar Payment Intent:', error)
  }
}

// ✅ PAYMENT INTENT FALHOU
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('💳❌ Payment Intent falhou:', paymentIntent.id)
    // Notificar usuário sobre falha
  } catch (error) {
    console.error('❌ Erro ao processar falha de Payment Intent:', error)
  }
}

// ============================================================================
// HANDLERS DE EVENTOS DE CUSTOMER
// ============================================================================

// ✅ CUSTOMER DELETADO
async function handleCustomerDeleted(customer) {
  try {
    console.log('👤 Customer deletado:', customer.id)
    
    // Limpar dados relacionados ao customer
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customer.id)

    if (error) {
      console.error('❌ Erro ao limpar assinaturas do customer:', error)
    }

  } catch (error) {
    console.error('❌ Erro ao processar deleção de customer:', error)
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// ✅ MAPEAR STATUS STRIPE PARA STATUS LOCAL
function mapStripeStatus(stripeStatus) {
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

// ✅ DESCONECTAR WHATSAPP DO USUÁRIO
async function disconnectUserWhatsApp(userId) {
  try {
    console.log('🔌 Desconectando WhatsApp via webhook:', userId)

    // Buscar todas as conexões WhatsApp do usuário
    const { data: connections, error: fetchError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('❌ Erro ao buscar conexões WhatsApp:', fetchError)
      return false
    }

    if (!connections || connections.length === 0) {
      console.log('⚠️ Nenhuma conexão WhatsApp encontrada')
      return true
    }

    // Desconectar cada conexão
    for (const connection of connections) {
      if (connection.evolution_instance_name) {
        try {
          // Desconectar na Evolution API
          const evolutionResponse = await fetch(
            `${process.env.EVOLUTION_API_URL}/instance/logout/${connection.evolution_instance_name}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': process.env.EVOLUTION_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          )

          if (evolutionResponse.ok) {
            console.log('✅ WhatsApp desconectado na Evolution API:', connection.evolution_instance_name)
          } else {
            console.warn('⚠️ Erro ao desconectar na Evolution API:', evolutionResponse.status)
          }
        } catch (evolutionError) {
          console.warn('⚠️ Erro na Evolution API:', evolutionError)
        }
      }

      // Remover conexão do banco
      const { error: deleteError } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connection.id)

      if (deleteError) {
        console.error('❌ Erro ao remover conexão do banco:', deleteError)
      }
    }

    console.log('✅ Todas as conexões WhatsApp desconectadas')
    return true

  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp via webhook:', error)
    return false
  }
}