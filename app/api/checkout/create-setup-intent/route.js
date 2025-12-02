// app/api/checkout/create-setup-intent/route.js
// ✅ ETAPA 1: Apenas validar cartão (SEM CRIAR CUSTOMER)
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { userId, userEmail } = await request.json()
    
    console.log('🎯 [STEP 1] Criando Setup Intent (sem customer):', { userId, userEmail })

    if (!userId || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 })
    }

    // ✅ VERIFICAR SE JÁ TEM ASSINATURA ATIVA
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .single()

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Você já possui uma assinatura ativa.'
      }, { status: 400 })
    }

    // ✅ CRIAR SETUP INTENT SEM CUSTOMER (só para validar cartão)
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: userId,
        user_email: userEmail,
        step: 'card_validation'
      }
    })

    console.log('✅ SetupIntent criado:', setupIntent.id)
    console.log('✅ NENHUM customer foi criado ainda')

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    })

  } catch (error) {
    console.error('❌ Erro ao criar Setup Intent:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar solicitação: ' + error.message
    }, { status: 500 })
  }
}