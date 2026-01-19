// app/api/checkout/plans/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Buscar planos ativos do banco
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('connections_limit', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar planos:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar planos'
      }, { status: 500 })
    }

    // Se não há planos no banco, retornar planos padrão
    if (!plans || plans.length === 0) {
      const defaultPlans = getDefaultPlans()

      return NextResponse.json({
        success: true,
        plans: defaultPlans,
        message: 'Planos padrão carregados'
      })
    }

    return NextResponse.json({
      success: true,
      plans: plans
    })

  } catch (error) {
    console.error('❌ Erro ao carregar planos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json()

    if (action === 'seed') {
      // Inserir planos padrão no banco de dados
      const defaultPlans = getDefaultPlans()

      const { data, error } = await supabase
        .from('subscription_plans')
        .upsert(defaultPlans, {
          onConflict: 'connections_limit',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('❌ Erro ao inserir planos:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao inserir planos'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Planos padrão inseridos com sucesso',
        plans: data
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Erro no POST de planos:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Função para retornar planos padrão
function getDefaultPlans() {
  return [
    {
      name: 'Starter',
      connections_limit: 1,
      monthly_price: 288.75,
      annual_price: 214.60,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true
      },
      is_active: true
    },
    {
      name: 'Business',
      connections_limit: 2,
      monthly_price: 533.75,
      annual_price: 398.02,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true
      },
      is_active: true
    },
    {
      name: 'Professional',
      connections_limit: 3,
      monthly_price: 778.75,
      annual_price: 580.72,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true,
        custom_integrations: true
      },
      is_active: true
    },
    {
      name: 'Enterprise',
      connections_limit: 4,
      monthly_price: 1023.75,
      annual_price: 763.42,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true,
        custom_integrations: true,
        dedicated_support: true
      },
      is_active: true
    },
    {
      name: 'Scale',
      connections_limit: 5,
      monthly_price: 1093.75,
      annual_price: 815.62,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true,
        custom_integrations: true,
        dedicated_support: true,
        volume_discount: true
      },
      is_active: true
    },
    {
      name: 'Growth',
      connections_limit: 6,
      monthly_price: 1312.50,
      annual_price: 978.75,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true,
        custom_integrations: true,
        dedicated_support: true,
        volume_discount: true
      },
      is_active: true
    },
    {
      name: 'Enterprise Max',
      connections_limit: 7,
      monthly_price: 1531.25,
      annual_price: 1141.87,
      features: {
        ai_powered: true,
        dashboard: true,
        support: true,
        analytics: true,
        webhooks: true,
        priority_support: true,
        custom_integrations: true,
        dedicated_support: true,
        volume_discount: true,
        white_label: true
      },
      is_active: true
    }
  ]
}