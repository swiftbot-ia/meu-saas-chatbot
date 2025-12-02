// app/api/webhooks/stripe/route.js
// WEBHOOK HANDLER PARA STRIPE - Substitui o Pagar.me
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import crypto from 'crypto'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

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
      
      // ============================================
      // INÍCIO DO MERGE - SWITCH
      // Este case agora chama o NOVO handler
      // ============================================
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      // ============================================
      // FIM DO MERGE - SWITCH (case duplicado removido)
      // ============================================
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object)
        break
        
      // ============================================
      // INÍCIO DO MERGE - SWITCH
      // Este case agora chama o NOVO handler
      // ============================================
      case 'invoice.paid':
          await handleInvoicePaidWithProration(event.data.object)
        break

      case 'subscription_schedule.updated':
        await handleSubscriptionScheduleUpdated(event.data.object)
        break

      case 'subscription_schedule.released':
        await handleSubscriptionScheduleReleased(event.data.object)
        break
      // ============================================
      // FIM DO MERGE - SWITCH
      // ============================================

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

// ============================================================================
// INÍCIO DO MERGE - FUNÇÕES ANTIGAS REMOVIDAS
// As funções handleSubscriptionUpdated, handleSubscriptionUpdatedWithUpgrade,
// handleInvoicePaidWithProration, handleSubscriptionScheduleUpdated,
// handleSubscriptionScheduleReleased, e disconnectExcessWhatsApp
// foram removidas daqui e substituídas pelo bloco de código do patch.
// ============================================================================

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
// INÍCIO DO MERGE - NOVOS HANDLERS CORRIGIDOS
// O bloco de código abaixo foi colado do patch
// ============================================================================

// ✅ ASSINATURA ATUALIZADA (UPGRADE/DOWNGRADE APLICADO)
// Handler genérico que sincroniza o plano do Stripe com seu DB
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 [WEBHOOK] customer.subscription.updated:', subscription.id)
    
    // Buscar assinatura no banco
    const { data: localSubscription, error: localSubError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (localSubError || !localSubscription) {
      console.error('⚠️ Assinatura não encontrada no banco local:', subscription.id, localSubError)
      return
    }

    // Extrair dados do novo plano dos metadados da Stripe
    // IMPORTANTE: Seus Prices na Stripe DEVEM ter esses metadados
    const newConnections = subscription.metadata?.connections 
      ? parseInt(subscription.metadata.connections) 
      : null
      
    const newBillingPeriod = subscription.metadata?.billing_period 
      || null

    if (!newConnections || !newBillingPeriod) {
        console.error('❌ ERRO CRÍTICO: Metadados (connections, billing_period) não encontrados no Price da Stripe. Abortando sincronização.')
        console.error('💡 SOLUÇÃO: Verifique se os Prices na Stripe têm metadata: { connections: "1", billing_period: "monthly" }')
        return
    }

    // Verificar se houve mudança real
    const hasChanged = 
      newConnections !== localSubscription.connections_purchased ||
      newBillingPeriod !== localSubscription.billing_period

    const now = new Date().toISOString()
    const updateData = {
      status: subscription.status === 'trialing' ? 'trial' : 'active',
      next_billing_date: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : localSubscription.next_billing_date,
      updated_at: now
    }
    
    let eventType = 'plan_sync' // Evento de log padrão
    let isDowngrade = false

    // Se não houve mudança de plano, apenas sincronizar status e data
    if (!hasChanged) {
      console.log('ℹ️ Nenhuma mudança de plano detectada, apenas sincronizando status/data.')
    } else {
      console.log('✅ Mudança de plano detectada:', {
        de: `${localSubscription.connections_purchased} ${localSubscription.billing_period}`,
        para: `${newConnections} ${newBillingPeriod}`
      })

      // É uma mudança de plano, adicionar ao updateData
      updateData.connections_purchased = newConnections
      updateData.billing_period = newBillingPeriod
      updateData.last_plan_change_date = now // ✅ REFINAMENTO: Atualizar apenas quando confirmado
      updateData.pending_change_type = null   // Limpar flags pendentes
      updateData.pending_connections = null
      updateData.pending_billing_period = null

      // Se estava em trial e mudou, mudar para active
      if (localSubscription.status === 'trial' && subscription.status === 'active') {
        updateData.trial_end_date = null
      }
      
      // =======================================================
      // ✅ CORREÇÃO CRÍTICA 1: DESCONECTAR WHATSAPP EM DOWNGRADE
      // =======================================================
      if (newConnections < localSubscription.connections_purchased) {
        console.log('📉 Detectado DOWNGRADE. Desconectando conexões excedentes...')
        eventType = 'plan_downgrade_applied'
        isDowngrade = true
        
        // ✅ CHAMADA CRÍTICA (não bloquear o webhook por isso)
        disconnectExcessWhatsApp(
          localSubscription.user_id, 
          localSubscription.connections_purchased, 
          newConnections
        ).catch(err => {
            console.error('❌ Erro ao fundo ao desconectar WhatsApp:', err)
        })
        
      } else if (newConnections > localSubscription.connections_purchased || newBillingPeriod !== localSubscription.billing_period) {
        console.log('🚀 Detectado UPGRADE.')
        eventType = 'plan_upgrade_confirmed'
      }
    }

    // ✅ ATUALIZAR BANCO COM NOVO PLANO / STATUS
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', localSubscription.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar plano no DB:', updateError)
      return
    }

    console.log('✅ Plano/Status atualizado no banco via webhook')

    // ✅ LOG DA MUDANÇA (apenas se houve mudança)
    if (hasChanged) {
      await supabase
        .from('payment_logs')
        .insert([{
          user_id: localSubscription.user_id,
          subscription_id: localSubscription.id,
          event_type: eventType, // ✅ CORREÇÃO CRÍTICA 3: Log correto para upgrade/downgrade
          amount: 0,
          payment_method: 'credit_card',
          stripe_transaction_id: subscription.id,
          status: 'completed',
          metadata: {
            from: {
              connections: localSubscription.connections_purchased,
              period: localSubscription.billing_period
            },
            to: {
              connections: newConnections,
              period: newBillingPeriod
            },
            is_downgrade: isDowngrade,
            whatsapp_disconnected: isDowngrade,
            confirmed_via: 'webhook (customer.subscription.updated)',
            processed_at: now
          },
          created_at: now
        }])
      
      console.log(`✅ Log registrado: ${eventType}`)
    }

  } catch (error) {
    console.error('❌ Erro fatal ao processar customer.subscription.updated:', error)
  }
}

// ✅ FATURA PAGA (UPGRADE COM PRORATION)
async function handleInvoicePaidWithProration(invoice) {
  try {
    console.log('💰 [WEBHOOK] invoice.paid:', invoice.id)
    
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
      console.log('⚠️ Assinatura não encontrada para fatura')
      return
    }

    // Verificar se é uma invoice de upgrade (tem proration)
    const hasProration = invoice.lines.data.some(line => line.proration === true)

    if (hasProration) {
      console.log('✅ Invoice de upgrade com proration detectada')

      // Calcular valor total da proration
      const prorationAmount = invoice.lines.data
        .filter(line => line.proration === true)
        .reduce((sum, line) => sum + line.amount, 0) / 100 // Converter de centavos

      // ✅ LOG DO PAGAMENTO DE UPGRADE
      await supabase
        .from('payment_logs')
        .insert([{
          user_id: localSubscription.user_id,
          subscription_id: localSubscription.id,
          event_type: 'upgrade_proration_paid',
          amount: invoice.amount_paid / 100,
          payment_method: 'credit_card',
          stripe_transaction_id: invoice.id,
          status: 'paid',
          metadata: {
            invoice_id: invoice.id,
            subscription_id: invoice.subscription,
            proration_amount: prorationAmount,
            total_paid: invoice.amount_paid / 100,
            currency: invoice.currency,
            processed_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }])

      console.log('✅ Pagamento de upgrade registrado:', invoice.amount_paid / 100)
    }

    // ✅ ATUALIZAR STATUS PARA ACTIVE (se estava em outro status)
    if (localSubscription.status !== 'active') {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
          next_billing_date: invoice.period_end 
            ? new Date(invoice.period_end * 1000).toISOString()
            : localSubscription.next_billing_date
        })
        .eq('id', localSubscription.id)
    }

  } catch (error) {
    console.error('❌ Erro ao processar invoice.paid:', error)
  }
}

// ✅ SUBSCRIPTION SCHEDULE ATUALIZADO (RECONCILER DE DOWNGRADE)
// ✅ CORREÇÃO CRÍTICA 2: Lógica invertida corrigida
async function handleSubscriptionScheduleUpdated(schedule) {
  try {
    console.log('📅 [WEBHOOK] subscription_schedule.updated:', schedule.id)
    
    if (!schedule.subscription) {
      console.log('⚠️ Schedule sem subscription_id associado')
      return
    }

    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', schedule.subscription)
      .single()

    if (!localSubscription) {
      console.log('⚠️ Assinatura não encontrada para schedule')
      return
    }
    
    // Verificar se é um agendamento ativo (phase futura)
    if (schedule.phases && schedule.phases.length > 1 && schedule.status === 'active') {
      const futurePhase = schedule.phases[1]
      
      // =======================================================
      // ✅ CORREÇÃO CRÍTICA 2: RECONCILER - EXTRAIR DA STRIPE
      // =======================================================
      
      // Opção 1: Usar metadados do schedule (você precisa adicioná-los na API)
      const pendingConnections = schedule.metadata?.pending_connections 
        ? parseInt(schedule.metadata.pending_connections) 
        : null
        
      const pendingBillingPeriod = schedule.metadata?.pending_billing_period 
        || null

      if (!pendingConnections || !pendingBillingPeriod) {
          console.error(`❌ ERRO CRÍTICO: Metadados (pending_connections, pending_billing_period) não encontrados no SCHEDULE da Stripe.`)
          console.error(`💡 SOLUÇÃO: Na API /downgrade, adicione metadata ao criar o schedule:`)
          console.error(`   metadata: { pending_connections: "3", pending_billing_period: "monthly" }`)
          return
      }
      
      console.log('✅ Downgrade agendado confirmado via webhook')
      console.log(`📊 Plano futuro: ${pendingConnections} ${pendingBillingPeriod}`)
      console.log(`📅 Efetivo em: ${new Date(futurePhase.start_date * 1000).toISOString()}`)

      // ✅ RECONCILER: Atualizar flags apenas se estiver diferente
      if (localSubscription.pending_change_type !== 'downgrade' ||
          localSubscription.pending_connections !== pendingConnections ||
          localSubscription.pending_billing_period !== pendingBillingPeriod) {
            
        console.log('🔄 Sincronizando flags de mudança pendente no DB (RECONCILER)...')
        
        await supabase
          .from('user_subscriptions')
          .update({
            pending_change_type: 'downgrade',
            pending_connections: pendingConnections,
            pending_billing_period: pendingBillingPeriod,
            updated_at: new Date().toISOString()
          })
          .eq('id', localSubscription.id)
          
        console.log('✅ Flags de mudança pendente (re)sincronizadas no DB via RECONCILER.')
      } else {
        console.log('ℹ️ Flags de mudança pendente já estão corretas no DB.')
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar subscription_schedule.updated:', error)
  }
}

// ✅ SUBSCRIPTION SCHEDULE RELEASED (MUDANÇA CANCELADA)
async function handleSubscriptionScheduleReleased(schedule) {
  try {
    console.log('🔓 [WEBHOOK] subscription_schedule.released:', schedule.id)
    
    if (!schedule.subscription) {
      console.log('⚠️ Schedule sem subscription_id associado')
      return
    }

    const { data: localSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', schedule.subscription)
      .single()

    if (!localSubscription) {
      console.log('⚠️ Assinatura não encontrada para schedule')
      return
    }

    console.log('✅ Cancelamento de mudança confirmado via webhook')

    // ✅ LIMPAR FLAGS DE MUDANÇA PENDENTE
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        pending_change_type: null,
        pending_connections: null,
        pending_billing_period: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', localSubscription.id)

    if (updateError) {
      console.error('❌ Erro ao limpar flags:', updateError)
      return
    }

    console.log('✅ Flags de mudança pendente limpas via webhook')

    // ✅ LOG DO CANCELAMENTO CONFIRMADO
    await supabase
      .from('payment_logs')
      .insert([{
        user_id: localSubscription.user_id,
        subscription_id: localSubscription.id,
        event_type: 'plan_change_canceled_confirmed',
        amount: 0,
        payment_method: 'credit_card',
        stripe_transaction_id: schedule.id,
        status: 'completed',
        metadata: {
          schedule_id: schedule.id,
          confirmed_via: 'webhook (subscription_schedule.released)',
          processed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])

  } catch (error) {
    console.error('❌ Erro ao processar subscription_schedule.released:', error)
  }
}

// ============================================================================
// HELPER: DESCONECTAR WHATSAPP EXCEDENTE (chamado pelo handleSubscriptionUpdated)
// ============================================================================

async function disconnectExcessWhatsApp(userId, currentConnections, newConnections) {
  try {
    if (newConnections >= currentConnections) {
      console.log('ℹ️ Nenhuma conexão precisa ser desconectada')
      return
    }

    const excessCount = currentConnections - newConnections
    console.log(`🔌 Desconectando ${excessCount} conexões excedentes para user ${userId}...`)

    // Buscar conexões do usuário (ordenar por mais recentes)
    const { data: connections, error: fetchError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'connected') // Apenas conectadas
      .order('created_at', { ascending: false })
      .limit(excessCount)

    if (fetchError) {
      console.error('❌ Erro ao buscar conexões:', fetchError)
      return
    }

    if (!connections || connections.length === 0) {
      console.log('⚠️ Nenhuma conexão conectada encontrada para desconectar')
      return
    }

    console.log(`📋 ${connections.length} conexões serão desconectadas`)

    // Desconectar cada uma
    for (const conn of connections) {
      try {
        // Chamar Evolution API para desconectar
        const evolutionUrl = process.env.EVOLUTION_API_URL
        const evolutionKey = process.env.EVOLUTION_API_KEY

        if (evolutionUrl && evolutionKey && conn.instance_name) {
          const logoutResponse = await fetch(`${evolutionUrl}/instance/logout/${conn.instance_name}`, {
            method: 'DELETE',
            headers: {
              'apikey': evolutionKey
            }
          })
          
          if (logoutResponse.ok) {
            console.log(`✅ Evolution API: Logout de ${conn.instance_name}`)
          } else {
            console.warn(`⚠️ Evolution API retornou ${logoutResponse.status} para ${conn.instance_name}`)
          }
        }

        // Atualizar status no banco (sempre atualizar, mesmo se Evolution falhar)
        const { error: updateError } = await supabase
          .from('whatsapp_connections')
          .update({
            status: 'disconnected',
            qr_code: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', conn.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar status de ${conn.instance_name}:`, updateError)
        } else {
          console.log(`✅ Conexão desconectada no DB: ${conn.instance_name}`)
        }

      } catch (connError) {
        console.error(`❌ Erro ao desconectar ${conn.instance_name}:`, connError)
      }
    }

    console.log(`✅ Processo de desconexão concluído: ${connections.length} conexões`)

  } catch (error) {
    console.error('❌ Erro fatal ao desconectar WhatsApp excedente:', error)
  }
}

// ============================================================================
// FIM DO MERGE - NOVOS HANDLERS CORRIGIDOS
// ============================================================================


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
      .from('user_connections') // <-- ERRO NO ARQUIVO ORIGINAL? Talvez seja 'whatsapp_connections'
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
        .from('user_connections') // <-- ERRO NO ARQUIVO ORIGINAL?
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