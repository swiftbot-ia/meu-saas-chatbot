// app/api/subscription/cancel-change/route.js
// VERSÃO CORRIGIDA - Apenas chama Stripe, Webhook atualiza DB

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelScheduledChange } from '@/lib/stripe-plan-changes'

// Lazy initialization to avoid build-time errors
let supabase = null
function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    console.log('🔄 [CANCEL CHANGE] Cancelando mudança agendada...')

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

    // ============================================
    // 4. CANCELAR NA STRIPE (release schedule)
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

    console.log('✅ Mudança cancelada na Stripe (aguardando webhook para limpar DB)')

    // ============================================
    // 5. LIMPAR FLAGS NO DB (webhook confirma, mas limpamos flag temporária)
    // ============================================

    const now = new Date().toISOString()

    await getSupabase()
      .from('user_subscriptions')
      .update({
        pending_change_type: null,
        pending_connections: null,
        pending_billing_period: null,
        updated_at: now
      })
      .eq('id', subscription.id)

    console.log('✅ Flags de mudança pendente limpas')

    // ============================================
    // 6. REGISTRAR LOG
    // ============================================

    await getSupabase()
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