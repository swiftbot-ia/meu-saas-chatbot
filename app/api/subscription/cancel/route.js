// app/api/subscription/cancel/route.js
// MIGRADO PARA STRIPE - Mantém mesma lógica de cancelamento
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { cancelSubscription } from '../../../../lib/stripe'

export async function POST(request) {
  try {
    const { userId, confirmPassword } = await request.json()
    
    console.log('🚨 Cancelamento de assinatura solicitado (STRIPE):', { userId })

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID obrigatório'
      }, { status: 400 })
    }

    // ✅ 1. BUSCAR ASSINATURA ATIVA DO USUÁRIO
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !subscription) {
      console.error('❌ Assinatura não encontrada:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Nenhuma assinatura ativa encontrada'
      }, { status: 404 })
    }

    // ✅ 2. CANCELAR NA STRIPE
    let stripeSuccess = false
    try {
      if (subscription.stripe_subscription_id) {
        await cancelSubscription(subscription.stripe_subscription_id, 'customer_request')
        console.log('✅ Assinatura cancelada na Stripe:', subscription.stripe_subscription_id)
        stripeSuccess = true
      } else {
        console.warn('⚠️ Assinatura sem stripe_subscription_id')
      }
    } catch (stripeError) {
      console.error('❌ Erro ao cancelar na Stripe:', stripeError)
      // Continua mesmo com erro na Stripe para desconectar WhatsApp
    }

    // ✅ 3. DESCONECTAR WHATSAPP IMEDIATAMENTE
    await disconnectUserWhatsApp(userId)

    // ✅ 4. ATUALIZAR STATUS NO BANCO LOCAL
    const now = new Date().toISOString()
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: now,
        updated_at: now
      })
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar status da assinatura:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao cancelar assinatura no sistema'
      }, { status: 500 })
    }

    // ✅ 5. LOG DO CANCELAMENTO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: 'subscription_canceled_manual',
        amount: 0,
        payment_method: 'credit_card',
        stripe_transaction_id: subscription.stripe_subscription_id,
        status: 'canceled',
        metadata: {
          reason: 'manual_cancellation',
          canceled_by: 'user',
          stripe_success: stripeSuccess,
          whatsapp_disconnected: true,
          canceled_at: now,
          gateway: 'stripe'
        },
        created_at: now
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log de cancelamento:', logError)
    }

    console.log('✅ Assinatura cancelada e WhatsApp desconectado')

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso. WhatsApp foi desconectado.',
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('❌ Erro geral ao cancelar assinatura:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}

// ============================================================================
// FUNÇÃO AUXILIAR PARA DESCONECTAR WHATSAPP
// ============================================================================
async function disconnectUserWhatsApp(userId) {
  try {
    console.log('🔌 Desconectando WhatsApp do usuário:', userId)

    // Buscar todas as conexões do usuário
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
      return true // Não é erro se não tem conexão
    }

    // Desconectar cada conexão
    for (const connection of connections) {
      if (connection.evolution_instance_name) {
        try {
          const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution.swiftbot.com.br'
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || connection.evolution_api_key

          const evolutionResponse = await fetch(
            `${evolutionUrl}/instance/logout/${connection.evolution_instance_name}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': evolutionApiKey,
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
      } else {
        console.log('✅ Conexão removida do banco:', connection.id)
      }
    }

    console.log('✅ Todas as conexões WhatsApp desconectadas')
    return true

  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp:', error)
    return false
  }
}