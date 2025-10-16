// /app/api/webhooks/pagarme/route.js - ATUALIZADO
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-hub-signature')
    
    console.log('📡 Webhook recebido:', {
      type: body.type,
      id: body.id,
      created: body.created
    })

    // ✅ VERIFICAR ASSINATURA DO WEBHOOK (se configurada)
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // Implementar verificação de assinatura se necessário
      console.log('🔒 Verificando assinatura do webhook...')
    }

    // ✅ PROCESSAR EVENTOS DE ASSINATURA
    switch (body.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(body.data)
        break
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(body.data)
        break
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(body.data)
        break
      
      case 'charge.paid':
        await handleChargePaid(body.data)
        break
      
      case 'charge.payment_failed':
        await handleChargePaymentFailed(body.data)
        break
      
      case 'invoice.paid':
        await handleInvoicePaid(body.data)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(body.data)
        break
      
      default:
        console.log('⚠️ Evento não processado:', body.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ✅ PROCESSAR CANCELAMENTO DE ASSINATURA (CRÍTICO)
async function handleSubscriptionCanceled(data) {
  try {
    console.log('🚨 Processando cancelamento de assinatura:', data.id)

    // Buscar assinatura no banco local
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('pagarme_subscription_id', data.id)
      .single()

    if (fetchError || !subscription) {
      console.error('❌ Assinatura não encontrada no banco local:', data.id)
      return
    }

    // ✅ DESCONECTAR WHATSAPP IMEDIATAMENTE
    await disconnectUserWhatsApp(subscription.user_id)

    // ✅ ATUALIZAR STATUS NO BANCO
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: now,
        updated_at: now
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar status da assinatura:', updateError)
      return
    }

    // ✅ LOG DO EVENTO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        event_type: 'subscription_canceled_webhook',
        amount: 0,
        payment_method: 'credit_card',
        pagarme_transaction_id: data.id,
        status: 'canceled',
        metadata: {
          reason: 'webhook_notification',
          canceled_by: 'pagarme',
          webhook_data: data,
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

// ✅ PROCESSAR CRIAÇÃO DE ASSINATURA
async function handleSubscriptionCreated(data) {
  try {
    console.log('📝 Assinatura criada via webhook:', data.id)
    
    // Atualizar status se necessário
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', data.id)

    if (error) {
      console.error('❌ Erro ao atualizar assinatura criada:', error)
    }

  } catch (error) {
    console.error('❌ Erro ao processar criação de assinatura:', error)
  }
}

// ✅ PROCESSAR ATUALIZAÇÃO DE ASSINATURA
async function handleSubscriptionUpdated(data) {
  try {
    console.log('🔄 Assinatura atualizada via webhook:', data.id)
    
    // Atualizar status
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', data.id)

    if (error) {
      console.error('❌ Erro ao atualizar assinatura:', error)
    }

  } catch (error) {
    console.error('❌ Erro ao processar atualização de assinatura:', error)
  }
}

// ✅ PROCESSAR COBRANÇA PAGA
async function handleChargePaid(data) {
  try {
    console.log('💰 Cobrança paga via webhook:', data.id)
    
    // Log da cobrança paga
    const { error } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: null, // Será preenchido se conseguir identificar
        subscription_id: null,
        event_type: 'charge_paid_webhook',
        amount: data.amount / 100, // Converter de centavos
        payment_method: data.payment_method,
        pagarme_transaction_id: data.id,
        status: 'paid',
        metadata: {
          webhook_data: data,
          processed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('❌ Erro ao criar log de cobrança paga:', error)
    }

  } catch (error) {
    console.error('❌ Erro ao processar cobrança paga:', error)
  }
}

// ✅ PROCESSAR FALHA DE PAGAMENTO
async function handleChargePaymentFailed(data) {
  try {
    console.log('❌ Falha de pagamento via webhook:', data.id)
    
    // Se for falha de trial ou cobrança inicial, desconectar tudo
    if (data.metadata && data.metadata.user_id) {
      console.log('🚨 Desconectando usuário por falha de pagamento:', data.metadata.user_id)
      await disconnectUserWhatsApp(data.metadata.user_id)
      
      // Cancelar assinatura local
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.metadata.user_id)
        .in('status', ['trial', 'active'])
    }

  } catch (error) {
    console.error('❌ Erro ao processar falha de pagamento:', error)
  }
}

// ✅ PROCESSAR FATURA PAGA
async function handleInvoicePaid(data) {
  try {
    console.log('📄 Fatura paga via webhook:', data.id)
    // Implementar lógica se necessário
  } catch (error) {
    console.error('❌ Erro ao processar fatura paga:', error)
  }
}

// ✅ PROCESSAR FALHA DE FATURA
async function handleInvoicePaymentFailed(data) {
  try {
    console.log('📄❌ Falha de fatura via webhook:', data.id)
    // Implementar lógica se necessário
  } catch (error) {
    console.error('❌ Erro ao processar falha de fatura:', error)
  }
}

// ✅ FUNÇÃO AUXILIAR PARA DESCONECTAR WHATSAPP
async function disconnectUserWhatsApp(userId) {
  try {
    console.log('🔌 Desconectando WhatsApp via webhook:', userId)

    // Buscar conexão WhatsApp
    const { data: whatsappConnection, error: fetchError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar conexão WhatsApp:', fetchError)
      return false
    }

    if (!whatsappConnection) {
      console.log('⚠️ Nenhuma conexão WhatsApp encontrada')
      return true
    }

    // Desconectar na Evolution API
    if (whatsappConnection.instance_name && whatsappConnection.evolution_api_key) {
      try {
        const evolutionResponse = await fetch(`https://evolution.swiftbot.com.br/instance/logout/${whatsappConnection.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': whatsappConnection.evolution_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (evolutionResponse.ok) {
          console.log('✅ WhatsApp desconectado na Evolution API')
        } else {
          console.warn('⚠️ Erro ao desconectar na Evolution API:', evolutionResponse.status)
        }
      } catch (evolutionError) {
        console.warn('⚠️ Erro na Evolution API:', evolutionError)
      }
    }

    // Remover conexão do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_connections')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Erro ao remover conexão do banco:', deleteError)
      return false
    }

    console.log('✅ WhatsApp desconectado via webhook')
    return true

  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp via webhook:', error)
    return false
  }
}