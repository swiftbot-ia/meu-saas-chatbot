// app/api/whatsapp/stats/route.js
// ============================================================================
// ROTA: Obter Estatísticas de uma Conexão WhatsApp
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'
import { createChatSupabaseClient } from '../../../../lib/supabase/chat-client.js'

// ============================================================================
// POST: Obter estatísticas de uma conexão específica
// ============================================================================
// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId é obrigatório' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 1. BUSCAR CONEXÃO NO SUPABASE
    // ========================================================================
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada' },
        { status: 404 }
      )
    }

    // ========================================================================
    // 2. BUSCAR ESTATÍSTICAS REAIS DO BANCO DE CHAT
    // ========================================================================
    const chatSupabase = createChatSupabaseClient()
    const instanceName = connection.instance_name

    // Data de início do dia atual (meia-noite)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()

    // 2.1 Conversas de Hoje: contatos que enviaram mensagem hoje
    const { count: conversationsToday, error: todayError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName)
      .gte('last_message_at', todayStartISO)

    if (todayError) {
      console.error('❌ [Stats] Erro ao buscar conversas de hoje:', todayError)
    }

    // 2.2 Contagem por etapa do funil (CRM)
    const { count: apresentacaoCount, error: apresentacaoError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName)
      .eq('funnel_stage', 'apresentacao')

    if (apresentacaoError) {
      console.error('❌ [Stats] Erro ao buscar apresentacao:', apresentacaoError)
    }

    const { count: negociacaoCount, error: negociacaoError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName)
      .eq('funnel_stage', 'negociacao')

    if (negociacaoError) {
      console.error('❌ [Stats] Erro ao buscar negociacao:', negociacaoError)
    }

    const { count: fechamentoCount, error: fechamentoError } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName)
      .eq('funnel_stage', 'fechamento')

    if (fechamentoError) {
      console.error('❌ [Stats] Erro ao buscar fechamento:', fechamentoError)
    }

    // ========================================================================
    // 3. MONTAR RESPOSTA COM ESTATÍSTICAS REAIS
    // ========================================================================
    const stats = {
      connectionId: connection.id,
      instanceName: connection.instance_name,
      status: connection.status,
      isConnected: connection.is_connected,
      profileName: connection.profile_name,
      phoneNumber: connection.phone_number,

      // Estatísticas reais do dashboard
      conversations_today: conversationsToday || 0,
      apresentacao_count: apresentacaoCount || 0,
      negociacao_count: negociacaoCount || 0,
      fechamento_count: fechamentoCount || 0
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ [Stats] Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno: ' + error.message },
      { status: 500 }
    )
  }
}
