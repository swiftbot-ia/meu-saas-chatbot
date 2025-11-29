// app/api/whatsapp/connections/route.js
// ============================================================================
// ROTA: Gerenciar Conexões WhatsApp
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'
import { createServerSupabaseClient } from '../../../../lib/supabase/client.js'
import { cookies } from 'next/headers'

// ============================================================================
// GET: Buscar todas as conexões do usuário
// ============================================================================
export async function GET(request) {
  try {
    // Obter o cookie de autenticação
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [GetConnections] Usuário não autenticado:', authError)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('📥 [GetConnections] Buscando conexões para usuário:', user.id)

    // Buscar todas as conexões do usuário
    const { data: connections, error: fetchError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ [GetConnections] Erro ao buscar conexões:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar conexões' },
        { status: 500 }
      )
    }

    console.log('✅ [GetConnections] Conexões encontradas:', connections?.length || 0)

    return NextResponse.json({
      success: true,
      connections: connections || []
    })

  } catch (error) {
    console.error('❌ [GetConnections] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar conexões: ' + error.message
    }, { status: 500 })
  }
}

// ============================================================================
// POST: Criar registro inicial de conexão no Supabase
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📥 [CreateConnection] Request body recebido:', JSON.stringify(body, null, 2))

    const { userId } = body  // instanceName será gerado automaticamente baseado no UUID

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

    console.log('📝 [CreateConnection] Iniciando criação de nova conexão para userId:', userId)

    // ========================================================================
    // 1. VERIFICAR LIMITE DE CONEXÕES DO USUÁRIO
    // ========================================================================
    // Passo 1.1: Contar conexões existentes
    const { count: existingCount, error: countError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('❌ [CreateConnection] Erro ao contar conexões:', countError)
    }

    const currentConnectionsCount = existingCount || 0
    console.log('📊 [CreateConnection] Conexões atuais:', currentConnectionsCount)

    // Passo 1.2: Buscar limite de conexões do usuário
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('connections_purchased')
      .eq('user_id', userId)
      .single()

    const connectionLimit = subscription?.connections_purchased || 2 // Padrão: 2 conexões

    console.log('📊 [CreateConnection] Limite de conexões:', connectionLimit)

    // Passo 1.3: Verificar se pode criar nova conexão
    if (currentConnectionsCount >= connectionLimit) {
      console.warn('⚠️ [CreateConnection] Limite de conexões atingido')
      return NextResponse.json({
        success: false,
        error: `Limite de conexões atingido. Você tem ${currentConnectionsCount} de ${connectionLimit} conexões.`,
        currentCount: currentConnectionsCount,
        limit: connectionLimit
      }, { status: 403 })
    }

    console.log('✅ [CreateConnection] Pode criar nova conexão:', `${currentConnectionsCount + 1}/${connectionLimit}`)

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
    // Formato: swiftbot_ + UUID completo (mantendo hífens)
    const connectionId = newConnection.id
    const instanceName = `swiftbot_${connectionId}`

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
