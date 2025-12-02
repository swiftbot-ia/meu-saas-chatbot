// app/api/whatsapp/stats/route.js
// ============================================================================
// ROTA: Obter Estatísticas de uma Conexão WhatsApp
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'

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
    // 2. RETORNAR ESTATÍSTICAS BÁSICAS
    // ========================================================================
    // Por enquanto, retornamos dados básicos da conexão
    // Futuramente, podemos integrar com endpoints da UAZAPI para obter
    // estatísticas mais detalhadas (mensagens enviadas, recebidas, etc.)

    const stats = {
      connectionId: connection.id,
      instanceName: connection.instance_name,
      status: connection.status,
      isConnected: connection.is_connected,
      profileName: connection.profile_name,
      phoneNumber: connection.phone_number,
      lastConnectedAt: connection.last_connected_at,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,

      // Estatísticas simuladas (a serem implementadas com dados reais futuramente)
      totalMessages: 0,
      totalContacts: 0,
      messagesLastDay: 0,
      messagesLastWeek: 0,
      messagesLastMonth: 0
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
