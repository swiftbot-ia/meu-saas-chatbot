// app/api/subscription/upgrade/route.js
// VERSÃO CORRIGIDA - Apenas chama Stripe, Webhook atualiza DB

import { NextResponse } from 'next/server'
import {
  processUpgrade,
  determineChangeType
} from '@/lib/stripe-plan-changes'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization with dynamic import to avoid build-time errors
let supabase = null
async function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(url, key)
    }
  }
  return supabase
}

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

    const { data: subscription, error: subError } = await getSupabase()
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
    // 6. PROCESSAR UPGRADE NA STRIPE (SEM ATUALIZAR DB!)
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

    console.log('✅ Upgrade processado na Stripe (aguardando webhook para atualizar DB)')

    // ============================================
    // 7. MARCAR DATA DA ÚLTIMA MUDANÇA (apenas para validação de 1x/mês)
    // ============================================

    const now = new Date().toISOString()

    await getSupabase()
      .from('user_subscriptions')
      .update({
        last_plan_change_date: now,
        updated_at: now
      })
      .eq('id', subscription.id)

    console.log('✅ Data de última mudança atualizada (validação 1x/mês)')

    // ============================================
    // 8. REGISTRAR LOG DE TENTATIVA (não de conclusão)
    // ============================================

    await getSupabase()
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: 'plan_upgrade_requested',
        amount: 0, // Valor real virá do webhook
        payment_method: 'credit_card',
        stripe_transaction_id: subscription.stripe_subscription_id,
        status: 'processing',
        metadata: {
          from: currentPlan,
          to: newPlan,
          message: 'Upgrade solicitado, aguardando confirmação via webhook',
          gateway: 'stripe'
        },
        created_at: now
      }])

    console.log('✅ Log de solicitação registrado')

    // ============================================
    // 9. RETORNAR SUCESSO (PROCESSANDO)
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Upgrade sendo processado! A atualização será refletida em alguns segundos.',
      data: {
        new_plan: newPlan,
        status: 'processing',
        estimated_charge: upgradeResult.charged_amount || 0,
        invoice_id: upgradeResult.invoice?.id
      },
      warning: 'A mudança será confirmada via webhook. Atualize a página em alguns segundos.'
    })

  } catch (error) {
    console.error('❌ Erro fatal no upgrade:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}