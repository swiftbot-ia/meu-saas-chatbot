// app/api/subscription/sync-status/route.js
// CRIE ESTE ARQUIVO EM: app/api/subscription/sync-status/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const PAGARME_API_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_908d35ab3a724f368bd986d858324ed5'
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

export async function POST(request) {
  try {
    const { userId, subscriptionId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId é obrigatório'
      }, { status: 400 })
    }

    console.log(`🔄 Sincronizando status para usuário: ${userId}`)

    // Buscar assinatura no banco local
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

    // Se não tem ID do Pagar.me, não pode sincronizar
    if (!localSubscription.pagarme_subscription_id) {
      console.log('⚠️ Assinatura sem ID do Pagar.me - assumindo status local')
      return NextResponse.json({
        success: true,
        message: 'Assinatura local sem ID do Pagar.me',
        local_status: localSubscription.status
      })
    }

    // Buscar status atual no Pagar.me
    const pagarmeResponse = await fetch(
      `${PAGARME_API_URL}/subscriptions/${localSubscription.pagarme_subscription_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${PAGARME_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!pagarmeResponse.ok) {
      console.error('❌ Erro ao consultar Pagar.me:', pagarmeResponse.status)
      return NextResponse.json({
        success: false,
        error: 'Erro ao consultar status no Pagar.me'
      }, { status: 500 })
    }

    const pagarmeData = await pagarmeResponse.json()
    console.log('📥 Status do Pagar.me:', pagarmeData.status)

    // Mapear status do Pagar.me para nosso sistema
    const statusMapping = {
      'active': 'active',
      'trialing': 'trial', 
      'canceled': 'canceled',
      'past_due': 'expired',
      'unpaid': 'expired'
    }

    const newStatus = statusMapping[pagarmeData.status] || 'expired'
    
    // Atualizar status no banco se diferente
    if (localSubscription.status !== newStatus) {
      console.log(`🔄 Atualizando status: ${localSubscription.status} → ${newStatus}`)
      
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Se tornou ativo, definir próxima cobrança
      if (newStatus === 'active' && pagarmeData.next_billing_at) {
        updateData.next_billing_date = pagarmeData.next_billing_at
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
      pagarme_status: pagarmeData.status,
      new_status: newStatus,
      updated: localSubscription.status !== newStatus,
      next_billing: pagarmeData.next_billing_at || null
    })

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Endpoint GET para sincronizar todas as assinaturas (cron job)
export async function GET(request) {
  try {
    console.log('🔄 Sincronização automática de todas as assinaturas...')

    // Buscar todas as assinaturas ativas ou em trial com ID do Pagar.me
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .in('status', ['active', 'trial'])
      .not('pagarme_subscription_id', 'is', null)

    if (error) {
      console.error('❌ Erro ao buscar assinaturas:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar assinaturas'
      }, { status: 500 })
    }

    const results = []
    for (const subscription of subscriptions) {
      try {
        // Fazer request POST para si mesmo para sincronizar cada uma
        const syncResult = await POST(new Request('http://localhost', {
          method: 'POST',
          body: JSON.stringify({ userId: subscription.user_id })
        }))
        
        const syncData = await syncResult.json()
        results.push({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          result: syncData
        })
      } catch (syncError) {
        console.error(`❌ Erro ao sincronizar ${subscription.user_id}:`, syncError)
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
      results: results
    })

  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}