// app/api/whatsapp/connections/route.js
// ============================================================================
// ROTA: Criar Registro Inicial de Conexão WhatsApp
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'

// ============================================================================
// POST: Criar registro inicial de conexão no Supabase
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📥 [CreateConnection] Request body recebido:', JSON.stringify(body, null, 2))

    const { userId, instanceName } = body

    if (!userId) {
      console.error('❌ [CreateConnection] userId não fornecido')
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('❌ [CreateConnection] supabaseAdmin não configurado')
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    console.log('📝 [CreateConnection] Criando registro para userId:', userId)
    console.log('📝 [CreateConnection] instanceName recebido:', instanceName || 'undefined (será gerado)')

    // ========================================================================
    // 1. VERIFICAR SE JÁ EXISTE CONEXÃO PARA ESTE USUÁRIO
    // ========================================================================
    const { data: existingConnections } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id, instance_name, instance_token, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Se já existe, retornar a conexão existente
    if (existingConnections && existingConnections.length > 0) {
      const existing = existingConnections[0]
      console.log('✅ [CreateConnection] Conexão existente encontrada:', existing.id)

      return NextResponse.json({
        success: true,
        connectionId: existing.id,
        instanceName: existing.instance_name,
        message: 'Conexão existente reutilizada'
      })
    }

    // ========================================================================
    // 2. CRIAR NOVO REGISTRO
    // ========================================================================
    const finalInstanceName = instanceName || `swiftbot_${userId.replace(/-/g, '_')}`

    console.log('🆕 [CreateConnection] Dados recebidos:', { userId, instanceName })
    console.log('🆕 [CreateConnection] Criando novo registro:', finalInstanceName)

    // VALIDAÇÃO CRÍTICA: Garantir que instance_name nunca seja null/undefined
    if (!finalInstanceName || finalInstanceName.trim() === '') {
      console.error('❌ [CreateConnection] ERRO CRÍTICO: finalInstanceName está vazio!')
      console.error('Debug info:', { userId, instanceName, finalInstanceName })
      return NextResponse.json({
        success: false,
        error: 'Erro ao gerar nome da instância'
      }, { status: 500 })
    }

    const insertData = {
      user_id: userId,
      instance_name: finalInstanceName,
      status: 'disconnected',
      is_connected: false
      // created_at e updated_at são gerados automaticamente pelo banco
    }

    console.log('📝 [CreateConnection] Dados para inserir:', JSON.stringify(insertData, null, 2))

    const { data: newConnection, error: insertError } = await supabaseAdmin
      .from('whatsapp_connections')
      .insert([insertData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ [CreateConnection] Erro ao criar registro:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar registro no banco de dados'
      }, { status: 500 })
    }

    console.log('✅ [CreateConnection] Registro criado com sucesso:', newConnection.id)

    return NextResponse.json({
      success: true,
      connectionId: newConnection.id,
      instanceName: newConnection.instance_name,
      message: 'Conexão criada com sucesso'
    })

  } catch (error) {
    console.error('❌ [CreateConnection] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar conexão: ' + error.message
    }, { status: 500 })
  }
}
