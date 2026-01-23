// app/api/subscription/upgrade/route.js
// VERSÃO CORRIGIDA - Apenas chama Stripe, Webhook atualiza DB

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  processUpgrade,
  determineChangeType
} from '@/lib/stripe-plan-changes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    console.log('🚀 [UPGRADE] Iniciando processo...')

    const body = await request.json()
    const { userId, newPlan } = body

    // ============================================
    // 1. VALIDAÇÕES INICIAIS
    // ============================================

    if (!userId || !newPlan || !newPlan.connections || !newPlan.billing_period) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos. Forneça userId e newPlan {connections, billing_period}'
      }, { status: 400 })
    }

    console.log('📝 Dados recebidos:', { userId, newPlan })

    // ============================================
    // 2. BUSCAR ASSINATURA ATUAL
    // ============================================

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription) {
      console.error('❌ Assinatura não encontrada:', subError)
      return NextResponse.json({
        success: false,
        error: 'Assinatura não encontrada'
      }, { status: 404 })
    }

    console.log('✅ Assinatura encontrada:', {
      id: subscription.id,
      status: subscription.status,
      connections: subscription.connections_purchased,
      period: subscription.billing_period
    })

    // ============================================
    // 3. VALIDAR STATUS DA ASSINATURA
    // ============================================

    if (subscription.status === 'canceled' || subscription.status === 'expired') {
      return NextResponse.json({
        success: false,
        error: 'Não é possível fazer upgrade de uma assinatura cancelada ou expirada'
      }, { status: 400 })
    }

    if (subscription.status === 'past_due') {
      return NextResponse.json({
        success: false,
        error: 'Não é possível fazer upgrade com pagamento pendente. Regularize seu pagamento primeiro.'
      }, { status: 400 })
    }

    // ============================================
    // 4. VALIDAR LIMITE DE 1 MUDANÇA POR MÊS
    // ============================================

    if (subscription.last_plan_change_date) {
      const lastChangeDate = new Date(subscription.last_plan_change_date)
      const daysSinceLastChange = Math.floor((Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastChange < 30) {
        const daysRemaining = 30 - daysSinceLastChange
        return NextResponse.json({
          success: false,
          error: `Você só pode alterar o plano 1 vez por mês. Aguarde ${daysRemaining} dias para fazer uma nova alteração.`,
          days_remaining: daysRemaining
        }, { status: 400 })
      }
    }

    // ============================================
    // 5. VERIFICAR SE REALMENTE É UPGRADE
    // ============================================

    // 5. DETERMINAR TIPO DE MUDANÇA
    // ============================================

    const currentPlan = {
      connections: subscription.connections_purchased,
      billing_period: subscription.billing_period
    }

    let changeType
    try {
      changeType = determineChangeType(currentPlan, newPlan)
    } catch (error) {
      // Se for mesmo valor, permitir re-processar (útil para correção de status)
      changeType = 'same_value'
    }

    console.log(`📊 Tipo de mudança: ${changeType.toUpperCase()}`)

    // ============================================
    // 6. PROCESSAR MUDANÇA (UPGRADE OU DOWNGRADE)
    // ============================================

    let result
    let actionTaken = ''

    // REGRA DE EXCEÇÃO:
    // Se estiver em TRIAL ou PAST_DUE (pagamento pendente),
    // qualquer mudança (mesmo downgrade) deve ser IMEDIATA para corrigir a fatura/trial.
    const isTrial = subscription.status === 'trialing' || (subscription.trial_end && new Date(subscription.trial_end) > new Date());
    const isPastDue = ['past_due', 'expired', 'unpaid', 'incomplete'].includes(subscription.status);

    if (changeType === 'upgrade' || isTrial || isPastDue || changeType === 'same_value') {
      // 🚀 MUDANÇA IMEDIATA
      console.log(`🚀 Processando mudança IMEDIATA (${changeType}) - Status: ${subscription.status}`)

      let trialEnd = null;
      if (isTrial && subscription.trial_end) {
        // Preservar trial original se estivermos em trial
        const trialEndDate = new Date(subscription.trial_end);
        if (trialEndDate > new Date()) {
          trialEnd = Math.floor(trialEndDate.getTime() / 1000);
          console.log('⏳ Preservando trial_end:', trialEnd, `(${trialEndDate.toISOString()})`);
        }
      }

      result = await processUpgrade(subscription.stripe_subscription_id, newPlan, trialEnd)
      actionTaken = 'immediate_update'

    } else {
      // 📅 DOWNGRADE AGENDADO (Apenas para assinaturas ativas e pagas)
      console.log('📅 Processando DOWNGRADE agendado (fim do ciclo)')

      // Precisamos da data do fim do período
      const currentPeriodEnd = subscription.next_billing_date
        ? Math.floor(new Date(subscription.next_billing_date).getTime() / 1000)
        : undefined

      result = await processDowngrade(subscription.stripe_subscription_id, newPlan, currentPeriodEnd)
      actionTaken = 'scheduled_downgrade'
    }

    if (!result.success) {
      console.error('❌ Erro na mudança de plano:', result.error)

      return NextResponse.json({
        success: false,
        error: `Erro ao processar mudança: ${result.error}`,
        stripe_error: result.code
      }, { status: 500 })
    }

    console.log(`✅ Mudança processada com sucesso: ${actionTaken}`)

    // ============================================
    // 7. ATUALIZAÇÕES LOCAIS (LOGS E DB)
    // ============================================

    const now = new Date().toISOString()

    // Atualizar data de última mudança
    await supabase
      .from('user_subscriptions')
      .update({
        last_plan_change_date: now,
        updated_at: now
      })
      .eq('id', subscription.id)

    // Registrar Log
    await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: actionTaken === 'immediate_update' ? 'plan_change_immediate' : 'plan_change_scheduled',
        amount: result.charged_amount || 0,
        payment_method: 'credit_card',
        stripe_transaction_id: subscription.stripe_subscription_id,
        status: actionTaken === 'immediate_update' ? 'processing' : 'scheduled',
        metadata: {
          from: currentPlan,
          to: newPlan,
          change_type: changeType,
          action: actionTaken,
          gateway: 'stripe'
        },
        created_at: now
      }])

    // ============================================
    // 8. RETORNAR SUCESSO
    // ============================================

    if (actionTaken === 'scheduled_downgrade') {
      return NextResponse.json({
        success: true,
        message: 'Downgrade agendado para o fim do ciclo atual!',
        data: {
          new_plan: newPlan,
          status: 'scheduled',
          effective_date: result.effective_date
        },
        action: 'schedule'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Plano atualizado com sucesso! A mudança será refletida em instantes.',
        data: {
          new_plan: newPlan,
          status: 'processing',
          estimated_charge: result.charged_amount || 0,
          invoice_id: result.invoice?.id
        },
        action: 'update'
      })
    }

  } catch (error) {
    console.error('❌ Erro fatal na mudança de plano:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}