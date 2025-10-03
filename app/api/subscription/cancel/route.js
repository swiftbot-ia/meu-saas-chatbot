// /app/api/subscription/cancel/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { cancelSubscription } from '../../../../lib/pagarme'

export async function POST(request) {
  try {
    const { userId, confirmPassword } = await request.json()
    
    console.log('🚨 Cancelamento de assinatura solicitado:', { userId })

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

    // ✅ 2. CANCELAR NO PAGAR.ME
    let pagarmeSuccess = false
    try {
      await cancelSubscription(subscription.pagarme_subscription_id)
      console.log('✅ Assinatura cancelada no Pagar.me:', subscription.pagarme_subscription_id)
      pagarmeSuccess = true
    } catch (pagarmeError) {
      console.error('❌ Erro ao cancelar no Pagar.me:', pagarmeError)
      // Continua mesmo com erro no Pagar.me para desconectar WhatsApp
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
        pagarme_transaction_id: subscription.pagarme_subscription_id,
        status: 'canceled',
        metadata: {
          reason: 'manual_cancellation',
          canceled_by: 'user',
          pagarme_success: pagarmeSuccess,
          whatsapp_disconnected: true,
          canceled_at: now
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

// ✅ FUNÇÃO AUXILIAR PARA DESCONECTAR WHATSAPP
async function disconnectUserWhatsApp(userId) {
  try {
    console.log('🔌 Desconectando WhatsApp do usuário:', userId)

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
      return true // Não é erro se não tem conexão
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

    console.log('✅ WhatsApp desconectado com sucesso')
    return true

  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp:', error)
    return false
  }
}