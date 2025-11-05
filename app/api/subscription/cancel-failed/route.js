// /app/api/subscription/cancel-failed/route.js
import { NextResponse } from 'next/server'


export async function POST(request) {
  try {
    const { subscriptionId, userId } = await request.json()
    
    console.log('🚨 Cancelando assinatura por falha no pagamento:', { subscriptionId, userId })

    if (!subscriptionId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 })
    }

    // 1. ✅ CANCELAR NO PAGAR.ME
    try {
      await cancelSubscription(subscriptionId)
      console.log('✅ Assinatura cancelada no Pagar.me:', subscriptionId)
    } catch (pagarmeError) {
      console.error('❌ Erro ao cancelar no Pagar.me:', pagarmeError)
      // Continua mesmo com erro no Pagar.me para limpar banco local
    }

    // 2. ✅ ATUALIZAR STATUS NO BANCO LOCAL
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('pagarme_subscription_id', subscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar status da assinatura:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao cancelar assinatura no banco local'
      }, { status: 500 })
    }

    // 3. ✅ LOG DO CANCELAMENTO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: updatedSubscription.id,
        event_type: 'subscription_canceled_failed_payment',
        amount: 0,
        payment_method: 'credit_card',
        pagarme_transaction_id: subscriptionId,
        status: 'canceled',
        metadata: {
          reason: 'failed_payment',
          canceled_by: 'system',
          canceled_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log de cancelamento:', logError)
    }

    console.log('✅ Assinatura cancelada por falha no pagamento')

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada devido à falha no pagamento',
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