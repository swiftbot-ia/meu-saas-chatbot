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
    // REGRA DE NEGÓCIO: instanceName SEMPRE baseado no ID do registro (UUID)
    // Padrão: swiftbot_{connectionId}

    console.log('🆕 [CreateConnection] Criando novo registro para userId:', userId)

    // Passo 2.1: Criar registro inicial (sem instance_name ainda)
    const insertData = {
      user_id: userId,
      instance_name: 'temp_pending', // Temporário - será atualizado imediatamente
      status: 'disconnected',
      is_connected: false
      // created_at e updated_at são gerados automaticamente pelo banco
    }

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

    // Passo 2.2: Gerar instanceName baseado no ID do registro
    const connectionId = newConnection.id
    const instanceName = `swiftbot_${connectionId.replace(/-/g, '_')}`

    console.log('🔄 [CreateConnection] Gerando instanceName:', instanceName)

    // Passo 2.3: Atualizar registro com instanceName correto
    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_connections')
      .update({ instance_name: instanceName })
      .eq('id', connectionId)

    if (updateError) {
      console.error('❌ [CreateConnection] Erro ao atualizar instanceName:', updateError)
      // Não falhar aqui - o /connect vai corrigir depois
    }

    console.log('✅ [CreateConnection] Registro criado com sucesso:', connectionId)
    console.log('✅ [CreateConnection] instanceName definido:', instanceName)

    return NextResponse.json({
      success: true,
      connectionId: connectionId,
      instanceName: instanceName,
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
