// app/api/whatsapp/instance/manage/route.js
/**
 * ============================================================================
 * API Route: Gerenciamento Completo de Instâncias WhatsApp (UAZAPI)
 * ============================================================================
 * Esta API centraliza todas as operações de gerenciamento de instâncias UAZAPI:
 * - POST: Criar instância e iniciar conexão
 * - GET: Verificar status e obter QR Code/Pairing Code
 * - DELETE: Desconectar instância
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'
import { uazapi } from '../../../../../lib/uazapi-client'

/**
 * POST - Criar e conectar uma nova instância
 *
 * Request Body:
 * {
 *   "userId": "uuid-do-usuario",
 *   "connectionId": "uuid-conexao-existente" (opcional),
 *   "adminFields": {
 *     "adminField01": "client_id",
 *     "adminField02": "metadata"
 *   }
 * }
 */
export async function POST(request) {
  try {
    const { userId, connectionId, adminFields } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔄 Iniciando criação de instância WhatsApp (UAZAPI):', { userId, connectionId })

    // ========================================================================
    // 1. VALIDAR ASSINATURA DO USUÁRIO
    // ========================================================================
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({
        success: false,
        error: 'Você precisa ter uma assinatura ativa para conectar o WhatsApp'
      }, { status: 403 })
    }

    // Verificar status da assinatura
    const blockedStatuses = ['canceled', 'cancelled', 'expired', 'incomplete', 'incomplete_expired', 'unpaid']
    if (blockedStatuses.includes(subscription.status)) {
      return NextResponse.json({
        success: false,
        error: `Não é possível conectar. Status da assinatura: ${subscription.status}`
      }, { status: 403 })
    }

    // ========================================================================
    // 2. VERIFICAR LIMITE DE CONEXÕES
    // ========================================================================
    const { data: connections } = await supabase
      .from('whatsapp_connections')
      .select('id, status')
      .eq('user_id', userId)

    const connectedCount = connections?.filter(c => c.status === 'connected').length || 0
    const planLimit = subscription.connection_limit || 1

    if (connectedCount >= planLimit) {
      return NextResponse.json({
        success: false,
        error: `Você atingiu o limite de ${planLimit} conexão(ões) do seu plano`
      }, { status: 403 })
    }

    // ========================================================================
    // 3. CRIAR INSTÂNCIA NA UAZAPI (Endpoint: POST /instance/init)
    // ========================================================================
    const instanceName = uazapi.generateInstanceName(userId)
    console.log(`📱 Criando instância: ${instanceName}`)

    // Criar nova instância com campos administrativos
    const instanceData = await uazapi.createInstance(
      instanceName,
      adminFields?.adminField01 || userId,
      adminFields?.adminField02 || 'nextjs_app'
    )

    // UAZAPI retorna { id, name, token, adminField01, adminField02, status }
    const instanceId = instanceData.id
    const instanceToken = instanceData.token

    if (!instanceId || !instanceToken) {
      return NextResponse.json({
        success: false,
        error: 'ID ou Token da instância não foi gerado pela UAZAPI'
      }, { status: 500 })
    }

    console.log('✅ Instância criada:', {
      id: instanceId,
      name: instanceName,
      token: instanceToken.substring(0, 20) + '...'
    })

    // ========================================================================
    // 4. SALVAR/ATUALIZAR NO SUPABASE
    // ========================================================================
    const connectionData = {
      user_id: userId,
      instance_name: instanceName,
      instance_token: instanceToken,
      api_credentials: instanceToken,
      waba_id: instanceId, // Salvar o ID da instância UAZAPI
      status: 'connecting',
      is_connected: false,
      admin_field_01: adminFields?.adminField01 || userId,
      admin_field_02: adminFields?.adminField02 || 'nextjs_app',
      updated_at: new Date().toISOString()
    }

    let dbConnection
    if (connectionId) {
      // Atualizar conexão existente
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .update(connectionData)
        .eq('id', connectionId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar conexão:', error)
        throw error
      }
      dbConnection = data
    } else {
      // Criar nova conexão
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert(connectionData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar conexão:', error)
        throw error
      }
      dbConnection = data
    }

    console.log('✅ Conexão salva no banco:', dbConnection.id)

    // ========================================================================
    // 5. INICIAR PROCESSO DE CONEXÃO (Endpoint: POST /instance/connect)
    // ========================================================================
    console.log('📲 Iniciando processo de conexão...')
    await uazapi.connectInstance(instanceToken) // Sem phoneNumber = QR Code mode

    // ========================================================================
    // 6. OBTER QR CODE (Endpoint: GET /instance/status)
    // ========================================================================
    console.log('📲 Obtendo QR Code...')
    const statusData = await uazapi.getInstanceStatus(instanceToken)

    const qrCode = uazapi.extractQRCode(statusData)
    const pairCode = uazapi.extractPairingCode(statusData)

    console.log('✅ Status:', {
      status: statusData.status,
      hasQRCode: !!qrCode,
      hasPairCode: !!pairCode
    })

    // ========================================================================
    // 7. CONFIGURAR WEBHOOK GLOBAL (Uma vez, se não configurado)
    // ========================================================================
    if (process.env.UAZAPI_WEBHOOK_URL) {
      try {
        await uazapi.configureGlobalWebhook(
          process.env.UAZAPI_WEBHOOK_URL,
          ['messages', 'connection'],
          ['wasSentByApi']
        )
        console.log('✅ Webhook global configurado')
      } catch (error) {
        console.warn('⚠️ Erro ao configurar webhook (pode já estar configurado):', error.message)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionId: dbConnection.id,
        instanceId,
        instanceName,
        instanceToken, // Retornar para o frontend poder fazer polling
        qrCode,
        pairCode,
        status: statusData.status,
        message: qrCode
          ? 'QR Code gerado com sucesso. Escaneie com seu WhatsApp.'
          : 'Instância criada. Aguardando conexão...'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao criar instância:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

/**
 * GET - Verificar status da instância e obter QR Code/Pairing Code
 *
 * Query Params:
 * - userId=uuid (buscar por user_id)
 * - connectionId=uuid (buscar por connection_id)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const connectionId = searchParams.get('connectionId')

    if (!userId && !connectionId) {
      return NextResponse.json(
        { success: false, error: 'userId ou connectionId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar conexão no banco
    let query = supabase.from('whatsapp_connections').select('*')

    if (connectionId) {
      query = query.eq('id', connectionId)
    } else {
      query = query.eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
    }

    const { data: connection, error } = await query.single()

    if (error || !connection) {
      return NextResponse.json({
        success: false,
        connected: false,
        status: 'not_found',
        message: 'Nenhuma conexão encontrada'
      })
    }

    // Verificar status na UAZAPI
    try {
      const statusData = await uazapi.getInstanceStatus(connection.instance_token)

      const isConnected = uazapi.isConnected(statusData)
      const isConnecting = uazapi.isConnecting(statusData)
      const qrCode = uazapi.extractQRCode(statusData)
      const pairCode = uazapi.extractPairingCode(statusData)

      // Atualizar banco se status mudou
      if (isConnected && connection.status !== 'connected') {
        await supabase
          .from('whatsapp_connections')
          .update({
            phone_number_id: statusData.phoneNumber || null,
            status: 'connected',
            is_connected: true,
            last_connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id)
      }

      return NextResponse.json({
        success: true,
        connected: isConnected,
        connecting: isConnecting,
        status: statusData.status,
        qrCode,
        pairCode,
        data: {
          instanceName: connection.instance_name,
          phoneNumber: statusData.phoneNumber || connection.phone_number_id,
          lastConnected: connection.last_connected_at
        }
      })

    } catch (apiError) {
      // Instância não existe ou erro na API
      console.warn('⚠️ Erro ao buscar status na UAZAPI:', apiError.message)

      return NextResponse.json({
        success: true,
        connected: false,
        status: 'disconnected',
        data: {
          instanceName: connection.instance_name,
          phoneNumber: connection.phone_number_id
        }
      })
    }

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE - Desconectar instância
 *
 * Query Params:
 * - connectionId=uuid
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar conexão
    const { data: connection, error } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      return NextResponse.json({
        success: false,
        error: 'Conexão não encontrada'
      }, { status: 404 })
    }

    // Desconectar na UAZAPI (Endpoint: POST /instance/disconnect)
    try {
      await uazapi.disconnectInstance(connection.instance_token)
      console.log('✅ Instância desconectada na UAZAPI')
    } catch (apiError) {
      console.warn('⚠️ Erro ao desconectar na UAZAPI:', apiError.message)
    }

    // Atualizar no banco
    await supabase
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        is_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao desconectar:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
