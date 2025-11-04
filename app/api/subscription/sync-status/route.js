// app/api/subscription/sync-status/route.js
// MIGRADO PARA STRIPE - Sincroniza status entre banco local e Stripe
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getSubscriptionStatus, mapStripeStatus } from '../../../../lib/stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_API_URL = 'https://api.stripe.com/v1'

export async function POST(request) {
  try {
    const { userId, subscriptionId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId é obrigatório'
      }, { status: 400 })
    }

    console.log(`🔄 Sincronizando status Stripe para usuário: ${userId}`)

    // ✅ 1. BUSCAR ASSINATURA NO BANCO LOCAL
    const { data: localSubscription, error: localError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (localError || !localSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Assinatura não encontrada no banco local'
      }, { status: 404 })
    }

    // ✅ 2. VERIFICAR SE TEM ID DA STRIPE
    if (!localSubscription.stripe_subscription_id) {
      console.log('⚠️ Assinatura sem stripe_subscription_id - assumindo status local')
      return NextResponse.json({
        success: true,
        message: 'Assinatura local sem ID da Stripe',
        local_status: localSubscription.status
      })
    }

    // ✅ 3. BUSCAR STATUS ATUAL NA STRIPE
    try {
      const stripeSubscription = await getSubscriptionStatus(localSubscription.stripe_subscription_id)
      
      console.log('📥 Status da Stripe:', stripeSubscription.status)
      console.log('📊 Detalhes:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_end: stripeSubscription.current_period_end,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      })

      // ✅ 4. MAPEAR STATUS DA STRIPE PARA NOSSO SISTEMA
      const newStatus = mapStripeStatus(stripeSubscription.status)
      
      // ✅ 5. ATUALIZAR STATUS NO BANCO SE DIFERENTE
      if (localSubscription.status !== newStatus) {
        console.log(`🔄 Atualizando status: ${localSubscription.status} → ${newStatus}`)
        
        const updateData = {
          status: newStatus,
          updated_at: new Date().toISOString()
        }

        // Se tornou ativo, definir próxima cobrança
        if (newStatus === 'active' && stripeSubscription.current_period_end) {
          updateData.next_billing_date = new Date(stripeSubscription.current_period_end * 1000).toISOString()
        }

        // Se está em trial, atualizar data de fim do trial
        if (newStatus === 'trial' && stripeSubscription.trial_end) {
          updateData.trial_end_date = new Date(stripeSubscription.trial_end * 1000).toISOString()
        }

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update(updateData)
          .eq('id', localSubscription.id)

        if (updateError) {
          console.error('❌ Erro ao atualizar status:', updateError)
          return NextResponse.json({
            success: false,
            error: 'Erro ao atualizar status no banco'
          }, { status: 500 })
        }

        console.log('✅ Status sincronizado com sucesso!')
      } else {
        console.log('ℹ️ Status já está sincronizado')
      }

      return NextResponse.json({
        success: true,
        local_status: localSubscription.status,
        stripe_status: stripeSubscription.status,
        new_status: newStatus,
        updated: localSubscription.status !== newStatus,
        next_billing: stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
          : null,
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
      })

    } catch (stripeError) {
      console.error('❌ Erro ao consultar Stripe:', stripeError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao consultar status na Stripe: ' + stripeError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}

// ============================================================================
// ENDPOINT GET - SINCRONIZAR TODAS AS ASSINATURAS (Cron Job)
// ============================================================================
export async function GET(request) {
  try {
    console.log('🔄 Sincronização automática de todas as assinaturas (STRIPE)...')

    // Buscar todas as assinaturas ativas ou em trial com ID da Stripe
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .in('status', ['active', 'trial'])
      .not('stripe_subscription_id', 'is', null)

    if (error) {
      console.error('❌ Erro ao buscar assinaturas:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar assinaturas'
      }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura para sincronizar',
        synced: 0
      })
    }

    console.log(`📋 Encontradas ${subscriptions.length} assinaturas para sincronizar`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const subscription of subscriptions) {
      try {
        // Fazer request POST para si mesmo para sincronizar cada uma
        const syncResult = await POST(new Request('http://localhost', {
          method: 'POST',
          body: JSON.stringify({ userId: subscription.user_id })
        }))
        
        const syncData = await syncResult.json()
        
        if (syncData.success) {
          successCount++
        } else {
          errorCount++
        }
        
        results.push({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          result: syncData
        })
      } catch (syncError) {
        console.error(`❌ Erro ao sincronizar ${subscription.user_id}:`, syncError)
        errorCount++
        results.push({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          error: syncError.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída para ${subscriptions.length} assinaturas`,
      summary: {
        total: subscriptions.length,
        success: successCount,
        errors: errorCount
      },
      results: results
    })

  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}