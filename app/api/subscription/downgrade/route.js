// app/api/subscription/downgrade/route.js
// Rota para processar DOWNGRADE (agenda para próximo ciclo)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  processDowngrade, 
  determineChangeType 
} from '@/lib/stripe-plan-changes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('📅 Iniciando processo de DOWNGRADE...')

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
        error: 'Não é possível fazer downgrade de uma assinatura cancelada ou expirada'
      }, { status: 400 })
    }

    // Permitir downgrade mesmo com past_due (diferente do upgrade)
    // O cliente pode querer downgrade justamente porque não consegue pagar o plano atual

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
    // 5. VERIFICAR SE JÁ TEM MUDANÇA PENDENTE
    // ============================================

    if (subscription.pending_change_type) {
      return NextResponse.json({
        success: false,
        error: 'Você já tem uma mudança de plano agendada. Cancele-a primeiro antes de fazer outra alteração.'
      }, { status: 400 })
    }

    // ============================================
    // 6. VERIFICAR SE REALMENTE É DOWNGRADE
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

    if (changeType !== 'downgrade') {
      return NextResponse.json({
        success: false,
        error: 'Este plano não é um downgrade. Use a rota /api/subscription/upgrade'
      }, { status: 400 })
    }

    console.log('✅ Confirmado como DOWNGRADE')

    // ============================================
    // 7. PROCESSAR DOWNGRADE NA STRIPE (SCHEDULE)
    // ============================================

    const downgradeResult = await processDowngrade(
      subscription.stripe_subscription_id,
      newPlan,
      subscription.next_billing_date
    )

    if (!downgradeResult.success) {
      console.error('❌ Erro no downgrade Stripe:', downgradeResult.error)
      
      return NextResponse.json({
        success: false,
        error: `Erro ao processar downgrade: ${downgradeResult.error}`,
        stripe_error: downgradeResult.code
      }, { status: 500 })
    }

    console.log('✅ Downgrade agendado na Stripe:', downgradeResult)

    // ============================================
    // 8. ATUALIZAR BANCO DE DADOS
    // ============================================

    const now = new Date().toISOString()
    
    const updateData = {
      pending_change_type: 'downgrade',
      pending_connections: newPlan.connections,
      pending_billing_period: newPlan.billing_period,
      last_plan_change_date: now,
      updated_at: now
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      console.error('⚠️ Erro ao atualizar banco (mas schedule na Stripe OK):', updateError)
    } else {
      console.log('✅ Banco de dados atualizado com mudança pendente')
    }

    // ============================================
    // 9. REGISTRAR LOG
    // ============================================

    await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: 'plan_downgrade_scheduled',
        amount: 0, // Sem cobrança imediata
        payment_method: 'credit_card',
        stripe_transaction_id: downgradeResult.schedule?.id || null,
        status: 'scheduled',
        metadata: {
          from: currentPlan,
          to: newPlan,
          effective_date: downgradeResult.effective_date,
          current_period_end: downgradeResult.current_period_end,
          gateway: 'stripe'
        },
        created_at: now
      }])

    console.log('✅ Log registrado')

    // ============================================
    // 10. RETORNAR SUCESSO
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Downgrade agendado com sucesso!',
      data: {
        new_plan: newPlan,
        effective_date: downgradeResult.effective_date,
        current_period_end: downgradeResult.current_period_end,
        schedule_id: downgradeResult.schedule?.id
      }
    })

  } catch (error) {
    console.error('❌ Erro fatal no downgrade:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}