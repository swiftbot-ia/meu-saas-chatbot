// app/api/checkout/capture-payments/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const PAGARME_API_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_908d35ab3a724f368bd986d858324ed5'
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

export async function POST(request) {
  try {
    console.log('🔄 Verificando trials expirados para captura...')

    // Buscar assinaturas em trial que expiraram
    const now = new Date()
    const { data: expiredTrials, error: trialsError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        payment_transactions (
          id,
          pagarme_charge_id,
          status,
          amount,
          is_trial_transaction
        )
      `)
      .eq('status', 'trial')
      .lt('trial_end_date', now.toISOString())

    if (trialsError) {
      console.error('❌ Erro ao buscar trials expirados:', trialsError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar trials'
      }, { status: 500 })
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      console.log('ℹ️ Nenhum trial expirado encontrado')
      return NextResponse.json({
        success: true,
        message: 'Nenhum trial para capturar',
        processed: 0
      })
    }

    console.log(`📋 Encontrados ${expiredTrials.length} trials expirados`)

    const results = []

    for (const subscription of expiredTrials) {
      try {
        // Encontrar a transação de trial para este subscription
        const trialTransaction = subscription.payment_transactions?.find(t => 
          t.is_trial_transaction && t.status === 'authorized'
        )

        if (!trialTransaction) {
          console.log(`⚠️ Transação de trial não encontrada para subscription ${subscription.id}`)
          continue
        }

        console.log(`🔄 Processando captura para subscription ${subscription.id}`)

        // Capturar pagamento no Pagar.me
        const captureResponse = await fetch(
          `${PAGARME_API_URL}/charges/${trialTransaction.pagarme_charge_id}/capture`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: Math.round(trialTransaction.amount * 100) // Converter para centavos
            })
          }
        )

        const captureResult = await captureResponse.json()
        console.log(`📥 Resposta captura ${trialTransaction.pagarme_charge_id}:`, captureResult)

        if (captureResponse.ok && captureResult.status === 'paid') {
          // ✅ Captura bem-sucedida
          
          // Atualizar status da assinatura
          const { error: updateSubError } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              next_billing_date: calculateNextBillingDate(subscription.billing_period),
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          if (updateSubError) {
            console.error(`❌ Erro ao atualizar subscription ${subscription.id}:`, updateSubError)
          }

          // Atualizar status da transação
          const { error: updateTransError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'captured',
              captured_at: new Date().toISOString()
            })
            .eq('id', trialTransaction.id)

          if (updateTransError) {
            console.error(`❌ Erro ao atualizar transação ${trialTransaction.id}:`, updateTransError)
          }

          results.push({
            subscription_id: subscription.id,
            charge_id: trialTransaction.pagarme_charge_id,
            status: 'success',
            amount: trialTransaction.amount
          })

          console.log(`✅ Captura bem-sucedida para subscription ${subscription.id}`)

        } else {
          // ❌ Falha na captura
          
          // Atualizar status da assinatura para expirada
          const { error: expireSubError } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          if (expireSubError) {
            console.error(`❌ Erro ao expirar subscription ${subscription.id}:`, expireSubError)
          }

          // Atualizar status da transação
          const { error: failTransError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'failed'
            })
            .eq('id', trialTransaction.id)

          if (failTransError) {
            console.error(`❌ Erro ao marcar transação como falha ${trialTransaction.id}:`, failTransError)
          }

          results.push({
            subscription_id: subscription.id,
            charge_id: trialTransaction.pagarme_charge_id,
            status: 'failed',
            error: captureResult.message || 'Falha na captura'
          })

          console.log(`❌ Falha na captura para subscription ${subscription.id}:`, captureResult.message)
        }

      } catch (error) {
        console.error(`❌ Erro ao processar subscription ${subscription.id}:`, error)
        results.push({
          subscription_id: subscription.id,
          status: 'error',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const failureCount = results.filter(r => r.status !== 'success').length

    console.log(`📊 Processamento concluído: ${successCount} sucessos, ${failureCount} falhas`)

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful_captures: successCount,
      failed_captures: failureCount,
      results: results
    })

  } catch (error) {
    console.error('❌ Erro no processamento de capturas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Função auxiliar para calcular próxima data de cobrança
function calculateNextBillingDate(billingPeriod) {
  const now = new Date()
  
  if (billingPeriod === 'monthly') {
    // Próximo mês
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
  } else {
    // Próximo ano
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
  }
}

// Função GET para permitir chamadas automáticas (Vercel Cron, etc)
export async function GET(request) {
  // Verificar se tem autorização (opcional - pode usar um token secreto)
  const authHeader = request.headers.get('authorization')
  const cronToken = process.env.CRON_SECRET_TOKEN || 'cron_secret_123'
  
  if (authHeader !== `Bearer ${cronToken}`) {
    console.log('⚠️ Tentativa de acesso não autorizada ao cron de captura')
    return NextResponse.json({
      success: false,
      error: 'Não autorizado'
    }, { status: 401 })
  }

  // Executar a mesma lógica do POST
  return POST(request)
}