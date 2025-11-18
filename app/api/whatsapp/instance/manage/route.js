// app/api/whatsapp/instance/manage/route.js
/**
 * ============================================================================
 * API Route: Gerenciamento Completo de Instâncias WhatsApp
 * ============================================================================
 * Esta API centraliza todas as operações de gerenciamento de instâncias:
 * - Criar instância
 * - Conectar/Gerar QR Code
 * - Verificar status
 * - Atualizar campos administrativos
 * - Desconectar
 * - Deletar
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'
import { uazapi } from '../../../../../lib/uazapi-client'

/**
 * POST - Criar e conectar uma nova instância
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

    console.log('🔄 Iniciando criação de instância WhatsApp:', { userId, connectionId })

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
    // 3. CRIAR INSTÂNCIA NA EVOLUTION API
    // ========================================================================
    const instanceName = uazapi.generateInstanceName(userId)
    console.log(`📱 Criando instância: ${instanceName}`)

    // Verificar se instância já existe e deletar
    const isConnected = await uazapi.isInstanceConnected(instanceName)
    if (isConnected) {
      console.log('⚠️ Instância já existe, deletando...')
      await uazapi.deleteInstance(instanceName)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Criar nova instância
    const instanceData = await uazapi.createInstance(instanceName, {
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    })

    const instanceToken = instanceData.hash

    if (!instanceToken) {
      return NextResponse.json({
        success: false,
        error: 'Token da instância não foi gerado'
      }, { status: 500 })
    }

    console.log('✅ Instância criada com token:', instanceToken.substring(0, 20) + '...')

    // ========================================================================
    // 4. SALVAR/ATUALIZAR NO SUPABASE
    // ========================================================================
    const connectionData = {
      user_id: userId,
      instance_name: instanceName,
      instance_token: instanceToken,
      api_credentials: instanceToken,
      waba_id: instanceName,
      status: 'connecting',
      is_connected: false,
      updated_at: new Date().toISOString()
    }

    // Atualizar campos administrativos se fornecidos
    if (adminFields) {
      if (adminFields.adminField01) connectionData.admin_field_01 = adminFields.adminField01
      if (adminFields.adminField02) connectionData.admin_field_02 = adminFields.adminField02
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

      if (error) throw error
      dbConnection = data
    } else {
      // Criar nova conexão
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert(connectionData)
        .select()
        .single()

      if (error) throw error
      dbConnection = data
    }

    console.log('✅ Conexão salva no banco:', dbConnection.id)

    // ========================================================================
    // 5. ATUALIZAR CAMPOS ADMINISTRATIVOS NA EVOLUTION API
    // ========================================================================
    if (adminFields && (adminFields.adminField01 || adminFields.adminField02)) {
      try {
        await uazapi.updateAdminFields(instanceName, {
          adminField01: adminFields.adminField01 || userId,
          adminField02: adminFields.adminField02 || dbConnection.id
        })
        console.log('✅ Campos administrativos atualizados na Evolution API')
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar campos admin:', error.message)
      }
    }

    // ========================================================================
    // 6. CONFIGURAR WEBHOOK (opcional)
    // ========================================================================
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await uazapi.setInstanceWebhook(instanceName, {
          url: process.env.N8N_WEBHOOK_URL,
          enabled: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
        })
        console.log('✅ Webhook configurado')
      } catch (error) {
        console.warn('⚠️ Erro ao configurar webhook:', error.message)
      }
    }

    // ========================================================================
    // 7. CONECTAR E GERAR QR CODE
    // ========================================================================
    console.log('📲 Gerando QR Code...')
    const connectData = await uazapi.connectInstance(instanceName)
    const qrCode = uazapi.extractQRCode(connectData)

    console.log('✅ QR Code gerado:', qrCode ? 'SIM' : 'NÃO')

    return NextResponse.json({
      success: true,
      data: {
        connectionId: dbConnection.id,
        instanceName,
        instanceToken,
        qrCode,
        status: 'connecting',
        message: qrCode
          ? 'QR Code gerado com sucesso. Escaneie com seu WhatsApp.'
          : 'Instância criada, mas QR Code não disponível'
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
 * GET - Verificar status da instância
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
      query = query.eq('user_id', userId)
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

    // Verificar status na Evolution API
    try {
      const statusData = await uazapi.getInstanceStatus(connection.instance_name)
      const isConnected = statusData.instance?.state === 'open'

      // Buscar informações adicionais se conectado
      let phoneNumber = connection.phone_number_id
      if (isConnected && !phoneNumber) {
        const instanceInfo = await uazapi.fetchInstanceInfo(connection.instance_name)
        if (instanceInfo?.ownerJid) {
          phoneNumber = instanceInfo.ownerJid.replace('@s.whatsapp.net', '')

          // Atualizar no banco
          await supabase
            .from('whatsapp_connections')
            .update({
              phone_number_id: phoneNumber,
              status: 'connected',
              is_connected: true,
              last_connected_at: new Date().toISOString()
            })
            .eq('id', connection.id)
        }
      }

      return NextResponse.json({
        success: true,
        connected: isConnected,
        status: statusData.instance?.state || 'disconnected',
        data: {
          instanceName: connection.instance_name,
          phoneNumber,
          lastConnected: connection.last_connected_at
        }
      })

    } catch (apiError) {
      // Instância não existe na API
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
 * PUT - Atualizar campos administrativos
 */
export async function PUT(request) {
  try {
    const { connectionId, adminFields } = await request.json()

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

    // Atualizar no Supabase
    const updates = {}
    if (adminFields?.adminField01) updates.admin_field_01 = adminFields.adminField01
    if (adminFields?.adminField02) updates.admin_field_02 = adminFields.adminField02

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()

      await supabase
        .from('whatsapp_connections')
        .update(updates)
        .eq('id', connectionId)
    }

    // Atualizar na Evolution API
    await uazapi.updateAdminFields(connection.instance_name, adminFields)

    return NextResponse.json({
      success: true,
      message: 'Campos administrativos atualizados com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar campos:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE - Desconectar/Deletar instância
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')
    const deleteCompletely = searchParams.get('delete') === 'true'

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

    // Desconectar/Deletar na Evolution API
    try {
      if (deleteCompletely) {
        await uazapi.deleteInstance(connection.instance_name)
        console.log('✅ Instância deletada da Evolution API')
      } else {
        await uazapi.disconnectInstance(connection.instance_name)
        console.log('✅ Instância desconectada da Evolution API')
      }
    } catch (apiError) {
      console.warn('⚠️ Erro na Evolution API:', apiError.message)
    }

    // Atualizar/Deletar no banco
    if (deleteCompletely) {
      await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', connectionId)
    } else {
      await supabase
        .from('whatsapp_connections')
        .update({
          status: 'disconnected',
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
    }

    return NextResponse.json({
      success: true,
      message: deleteCompletely
        ? 'Instância deletada com sucesso'
        : 'Instância desconectada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao desconectar/deletar:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
