// app/api/subscription/cancel/route.js
// ✅ CANCELAMENTO COM REGRA DOS 7 DIAS (LEI DO ARREPENDIMENTO)
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { 
  cancelSubscriptionImmediately, 
  cancelSubscriptionAtPeriodEnd,
  getLastChargeFromSubscription,
  createRefund 
} from '../../../../lib/stripe'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    console.log('🚨 Cancelamento de assinatura solicitado:', { userId })

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID obrigatório'
      }, { status: 400 })
    }

    // ============================================================================
    // 1. BUSCAR ASSINATURA ATIVA DO USUÁRIO
    // ============================================================================
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

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'Assinatura sem ID da Stripe'
      }, { status: 400 })
    }

    // ============================================================================
    // 2. VERIFICAR SE É A PRIMEIRA ASSINATURA DO USUÁRIO
    // ============================================================================
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('user_subscriptions')
      .select('id, created_at')
      .eq('user_id', userId)
      .not('trial_start_date', 'is', null) // Só assinaturas que iniciaram trial (ou pagaram)
      .order('created_at', { ascending: true })

    if (allSubsError) {
      console.error('❌ Erro ao verificar histórico:', allSubsError)
    }

    const isFirstSubscription = !allSubscriptions || allSubscriptions.length === 0 || 
                                allSubscriptions[0].id === subscription.id

    // ============================================================================
    // 3. CALCULAR DIAS DESDE A CRIAÇÃO DA ASSINATURA
    // ============================================================================
    const createdAt = new Date(subscription.created_at)
    const now = new Date()
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

    console.log('📊 Análise de cancelamento:', {
      subscription_id: subscription.id,
      stripe_subscription_id: subscription.stripe_subscription_id,
      status: subscription.status,
      created_at: subscription.created_at,
      days_since_creation: daysSinceCreation,
      is_first_subscription: isFirstSubscription
    })

    // ============================================================================
    // 4. DETERMINAR TIPO DE CANCELAMENTO
    // ============================================================================
    const shouldRefund = isFirstSubscription && daysSinceCreation <= 7
    
    let cancellationType = ''
    let cancelResult = null
    let refundResult = null
    let accessUntil = null
    let message = ''

    if (shouldRefund) {
      // ============================================================
      // CENÁRIO 1: CANCELAMENTO IMEDIATO COM REEMBOLSO (7 DIAS)
      // ============================================================
      console.log('💰 CANCELAMENTO COM REEMBOLSO - Primeiros 7 dias da primeira assinatura')
      cancellationType = 'immediate_with_refund'

      try {
        // 4.1. Buscar charge para reembolsar
        const chargeInfo = await getLastChargeFromSubscription(subscription.stripe_subscription_id)
        
        if (chargeInfo && chargeInfo.charge_id) {
          console.log('💳 Charge encontrado para reembolso:', chargeInfo.charge_id)
          
          // 4.2. Criar reembolso
          try {
            refundResult = await createRefund(
              chargeInfo.charge_id, 
              null, // null = reembolsa valor total
              'requested_by_customer'
            )
            console.log('✅ Reembolso criado:', refundResult.id)
          } catch (refundError) {
            console.error('⚠️ Erro ao criar reembolso:', refundError)
            // Continua com cancelamento mesmo se reembolso falhar
          }
        } else {
          console.warn('⚠️ Nenhum charge pago encontrado para reembolso')
        }

        // 4.3. Cancelar assinatura IMEDIATAMENTE na Stripe
        cancelResult = await cancelSubscriptionImmediately(
          subscription.stripe_subscription_id,
          '7_day_refund_policy'
        )

        // 4.4. Desconectar WhatsApp imediatamente
        await disconnectUserWhatsApp(userId)

        message = refundResult 
          ? '✅ Assinatura cancelada e reembolso processado. O valor será estornado em até 7 dias úteis.'
          : '✅ Assinatura cancelada (sem cobrança a reembolsar).'

      } catch (error) {
        console.error('❌ Erro no cancelamento imediato:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar cancelamento: ' + error.message
        }, { status: 500 })
      }

    } else {
      // ============================================================
      // CENÁRIO 2: CANCELAMENTO NO FIM DO PERÍODO (APÓS 7 DIAS)
      // ============================================================
      console.log('🔄 CANCELAMENTO NO FIM DO PERÍODO - Sem reembolso')
      cancellationType = 'end_of_period'

      try {
        // 4.5. Marcar para cancelar no fim do período
        cancelResult = await cancelSubscriptionAtPeriodEnd(
          subscription.stripe_subscription_id,
          'customer_request_after_7_days'
        )

        accessUntil = cancelResult.access_until

        // Trial: se cancelar no último dia, perde acesso imediato
        if (subscription.status === 'trial') {
          const trialEndDate = new Date(subscription.trial_end_date)
          const daysUntilTrialEnd = Math.floor((trialEndDate - now) / (1000 * 60 * 60 * 24))
          
          if (daysUntilTrialEnd <= 0) {
            console.log('⚠️ Trial no último dia - desconectando imediatamente')
            await disconnectUserWhatsApp(userId)
            message = '✅ Trial cancelado. Acesso encerrado.'
          } else {
            message = `✅ Renovação cancelada. Você pode usar até ${new Date(trialEndDate).toLocaleDateString('pt-BR')}.`
          }
        } else {
          // Plano pago: mantém acesso até next_billing_date
          const nextBillingDate = subscription.next_billing_date 
            ? new Date(subscription.next_billing_date)
            : new Date(cancelResult.current_period_end * 1000)
          
          message = `✅ Renovação cancelada. Você pode usar até ${nextBillingDate.toLocaleDateString('pt-BR')}.`
        }

      } catch (error) {
        console.error('❌ Erro no cancelamento de período:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar cancelamento: ' + error.message
        }, { status: 500 })
      }
    }

    // ============================================================================
    // 5. ATUALIZAR STATUS NO BANCO LOCAL
    // ============================================================================
    const now_iso = new Date().toISOString()
    const updateData = {
      updated_at: now_iso
    }

    if (cancellationType === 'immediate_with_refund') {
      // Cancelamento imediato: muda status para canceled
      updateData.status = 'canceled'
      updateData.canceled_at = now_iso
    } else {
      // Cancelamento no fim do período: mantém status atual mas marca como "will_cancel"
      // Stripe vai mudar para 'canceled' automaticamente no fim do período
      updateData.canceled_at = now_iso
      // Status permanece 'active' ou 'trial' até o fim
    }

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError)
    }

    // ============================================================================
    // 6. LOG DA TRANSAÇÃO
    // ============================================================================
    const logData = {
      user_id: userId,
      subscription_id: subscription.id,
      event_type: shouldRefund ? 'subscription_canceled_with_refund' : 'subscription_canceled_at_period_end',
      amount: 0,
      payment_method: 'credit_card',
      stripe_transaction_id: subscription.stripe_subscription_id,
      status: shouldRefund ? 'canceled' : 'active_until_period_end',
      metadata: {
        cancellation_type: cancellationType,
        days_since_creation: daysSinceCreation,
        is_first_subscription: isFirstSubscription,
        refund_processed: !!refundResult,
        refund_id: refundResult?.id || null,
        access_until: accessUntil || null,
        canceled_by: 'user',
        gateway: 'stripe'
      },
      created_at: now_iso
    }

    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([logData])

    if (logError) {
      console.warn('⚠️ Erro ao criar log:', logError)
    }

    // ============================================================================
    // 7. RETORNAR RESPOSTA
    // ============================================================================
    console.log('✅ CANCELAMENTO PROCESSADO COM SUCESSO')

    return NextResponse.json({
      success: true,
      message: message,
      cancellation_type: cancellationType,
      refund_processed: !!refundResult,
      access_until: accessUntil,
      subscription: updatedSubscription,
      details: {
        days_since_creation: daysSinceCreation,
        is_first_subscription: isFirstSubscription,
        should_refund: shouldRefund
      }
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
    console.log('📌 Desconectando WhatsApp do usuário:', userId)

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
      return true
    }

    // Desconectar cada conexão
    for (const connection of connections) {
      if (connection.instance_name) {
        try {
          const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution.swiftbot.com.br'
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || connection.api_key

          const evolutionResponse = await fetch(
            `${evolutionUrl}/instance/logout/${connection.instance_name}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': evolutionApiKey,
                'Content-Type': 'application/json'
              }
            }
          )

          if (evolutionResponse.ok) {
            console.log('✅ WhatsApp desconectado na Evolution API:', connection.instance_name)
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