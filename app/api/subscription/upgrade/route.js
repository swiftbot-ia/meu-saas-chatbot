// app/api/subscription/upgrade/route.js
// Rota para processar UPGRADE (cobra imediato com proration)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  processUpgrade, 
  determineChangeType,
  PLAN_PRICES 
} from '@/lib/stripe-plan-changes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('🚀 Iniciando processo de UPGRADE...')

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

    const currentPlan = {
      connections: subscription.connections_purchased,
      billing_period: subscription.billing_period
    }

    let changeType
    try {
      changeType = determineChangeType(currentPlan, newPlan)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    if (changeType !== 'upgrade') {
      return NextResponse.json({
        success: false,
        error: 'Este plano não é um upgrade. Use a rota /api/subscription/downgrade'
      }, { status: 400 })
    }

    console.log('✅ Confirmado como UPGRADE')

    // ============================================
    // 6. PROCESSAR UPGRADE NA STRIPE
    // ============================================

    const upgradeResult = await processUpgrade(
      subscription.stripe_subscription_id,
      newPlan
    )

    if (!upgradeResult.success) {
      console.error('❌ Erro no upgrade Stripe:', upgradeResult.error)
      
      return NextResponse.json({
        success: false,
        error: `Erro ao processar upgrade: ${upgradeResult.error}`,
        stripe_error: upgradeResult.code
      }, { status: 500 })
    }

    console.log('✅ Upgrade processado na Stripe:', upgradeResult)

    // ============================================
    // 7. ATUALIZAR BANCO DE DADOS
    // ============================================

    const now = new Date().toISOString()
    
    const updateData = {
      connections_purchased: newPlan.connections,
      billing_period: newPlan.billing_period,
      last_plan_change_date: now,
      updated_at: now,
      // Limpar campos de mudança pendente (se houver)
      pending_change_type: null,
      pending_connections: null,
      pending_billing_period: null
    }

    // Se estava em trial, atualizar para active
    if (subscription.status === 'trial') {
      updateData.status = 'active'
      updateData.trial_end_date = null
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      console.error('⚠️ Erro ao atualizar banco (mas upgrade na Stripe OK):', updateError)
    } else {
      console.log('✅ Banco de dados atualizado')
    }

    // ============================================
    // 8. REGISTRAR LOG
    // ============================================

    await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: 'plan_upgrade',
        amount: upgradeResult.charged_amount || 0,
        payment_method: 'credit_card',
        stripe_transaction_id: upgradeResult.invoice?.id || null,
        status: 'completed',
        metadata: {
          from: currentPlan,
          to: newPlan,
          charged_amount: upgradeResult.charged_amount,
          next_billing_date: upgradeResult.next_billing_date,
          gateway: 'stripe'
        },
        created_at: now
      }])

    console.log('✅ Log registrado')

    // ============================================
    // 9. RETORNAR SUCESSO
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Upgrade realizado com sucesso!',
      data: {
        new_plan: newPlan,
        charged_amount: upgradeResult.charged_amount,
        next_billing_date: upgradeResult.next_billing_date,
        invoice_id: upgradeResult.invoice?.id
      }
    })

  } catch (error) {
    console.error('❌ Erro fatal no upgrade:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}