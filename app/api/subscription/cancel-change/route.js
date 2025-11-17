// app/api/subscription/cancel-change/route.js
// Rota para CANCELAR uma mudança de plano agendada

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelScheduledChange } from '@/lib/stripe-plan-changes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('🔄 Cancelando mudança de plano agendada...')

    const body = await request.json()
    const { userId } = body

    // ============================================
    // 1. VALIDAÇÕES INICIAIS
    // ============================================

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId é obrigatório'
      }, { status: 400 })
    }

    console.log('📝 userId:', userId)

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
      pending_change: subscription.pending_change_type
    })

    // ============================================
    // 3. VERIFICAR SE TEM MUDANÇA PENDENTE
    // ============================================

    if (!subscription.pending_change_type) {
      return NextResponse.json({
        success: false,
        error: 'Não há nenhuma mudança de plano agendada para cancelar'
      }, { status: 400 })
    }

    console.log(`📅 Mudança pendente encontrada: ${subscription.pending_change_type}`)
    console.log(`📊 Plano atual: ${subscription.connections_purchased} conexões`)
    console.log(`📊 Plano agendado: ${subscription.pending_connections} conexões`)

    // ============================================
    // 4. CANCELAR NA STRIPE
    // ============================================

    const cancelResult = await cancelScheduledChange(
      subscription.stripe_subscription_id
    )

    if (!cancelResult.success) {
      console.error('❌ Erro ao cancelar na Stripe:', cancelResult.error)
      
      return NextResponse.json({
        success: false,
        error: `Erro ao cancelar mudança: ${cancelResult.error}`
      }, { status: 500 })
    }

    console.log('✅ Mudança cancelada na Stripe')

    // ============================================
    // 5. ATUALIZAR BANCO DE DADOS
    // ============================================

    const now = new Date().toISOString()
    
    const updateData = {
      pending_change_type: null,
      pending_connections: null,
      pending_billing_period: null,
      updated_at: now
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      console.error('⚠️ Erro ao atualizar banco:', updateError)
    } else {
      console.log('✅ Banco de dados atualizado')
    }

    // ============================================
    // 6. REGISTRAR LOG
    // ============================================

    await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        event_type: 'plan_change_canceled',
        amount: 0,
        payment_method: 'credit_card',
        stripe_transaction_id: subscription.stripe_subscription_id,
        status: 'canceled',
        metadata: {
          canceled_change_type: subscription.pending_change_type,
          canceled_connections: subscription.pending_connections,
          canceled_period: subscription.pending_billing_period,
          current_connections: subscription.connections_purchased,
          current_period: subscription.billing_period,
          gateway: 'stripe'
        },
        created_at: now
      }])

    console.log('✅ Log registrado')

    // ============================================
    // 7. RETORNAR SUCESSO
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Mudança de plano cancelada com sucesso!',
      data: {
        current_plan: {
          connections: subscription.connections_purchased,
          billing_period: subscription.billing_period
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro fatal ao cancelar mudança:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}