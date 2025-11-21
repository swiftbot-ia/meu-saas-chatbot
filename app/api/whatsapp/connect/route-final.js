// app/api/whatsapp/connect/route.js
// ============================================================================
// VERSÃO FINAL: Sincronização Completa UAZAPI ↔ Supabase
// ============================================================================

import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

/**
 * ============================================================================
 * HELPER: Sincronizar Status UAZAPI → Supabase
 * ============================================================================
 */
async function syncStatusToSupabase(connectionId, uazapiStatus, instanceData = {}) {
  console.log('🔄 Sincronizando status UAZAPI → Supabase:', {
    connectionId,
    uazapiStatus,
    hasInstanceData: !!instanceData
  })

  const instanceInfo = instanceData.instance || instanceData || {}

  // Mapear status UAZAPI para Supabase
  let supabaseStatus = 'connecting'
  let isConnected = false

  if (uazapiStatus === 'open') {
    supabaseStatus = 'connected'
    isConnected = true
  } else if (uazapiStatus === 'close' || uazapiStatus === 'disconnected') {
    supabaseStatus = 'disconnected'
    isConnected = false
  } else if (uazapiStatus === 'connecting') {
    supabaseStatus = 'pending_qr'
    isConnected = false
  }

  const updateData = {
    status: supabaseStatus,
    is_connected: isConnected,
    updated_at: new Date().toISOString()
  }

  // Se conectado, salvar dados do perfil
  if (isConnected && instanceInfo.profileName) {
    updateData.profile_name = instanceInfo.profileName
    updateData.profile_pic_url = instanceInfo.profilePicUrl || null
    updateData.phone_number = instanceInfo.owner || null
    updateData.last_connected_at = new Date().toISOString()

    // Salvar dados completos em JSON
    updateData.api_credentials = JSON.stringify({
      token: instanceInfo.token || null,
      profileName: instanceInfo.profileName,
      profilePicUrl: instanceInfo.profilePicUrl,
      owner: instanceInfo.owner,
      status: uazapiStatus,
      lastUpdated: new Date().toISOString()
    })

    console.log('✅ Perfil WhatsApp:', {
      name: instanceInfo.profileName,
      phone: instanceInfo.owner
    })
  }

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .update(updateData)
    .eq('id', connectionId)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao sincronizar Supabase:', error)
    throw new Error('Falha ao sincronizar banco de dados')
  }

  console.log('✅ Supabase sincronizado:', {
    status: supabaseStatus,
    is_connected: isConnected
  })

  return data
}

/**
 * ============================================================================
 * HELPER: Obter Status Real da UAZAPI
 * ============================================================================
 */
async function getUAZAPIStatus(instanceToken) {
  console.log('📡 Consultando status na UAZAPI...')

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/status`,
      {
        method: 'GET',
        headers: { 'token': instanceToken }
      }
    )

    if (!response.ok) {
      console.log('⚠️ Token inválido ou instância não encontrada (HTTP', response.status, ')')
      return {
        ok: false,
        status: response.status,
        data: null
      }
    }

    const data = await response.json()
    const instanceStatus = data.instance?.status || data.status || 'disconnected'

    console.log('✅ Status UAZAPI:', instanceStatus)

    return {
      ok: true,
      status: response.status,
      data: data,
      instanceStatus: instanceStatus
    }
  } catch (error) {
    console.error('❌ Erro ao consultar UAZAPI:', error.message)
    return {
      ok: false,
      status: 500,
      data: null,
      error: error.message
    }
  }
}

/**
 * ============================================================================
 * HELPER: Criar Nova Instância UAZAPI
 * ============================================================================
 */
async function createNewInstance(instanceName) {
  console.log('📝 Criando nova instância UAZAPI:', instanceName)

  const response = await fetch(`${EVOLUTION_API_URL}/instance/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'admintoken': EVOLUTION_API_KEY
    },
    body: JSON.stringify({
      name: instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      systemName: 'Swiftbot 1.0'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Erro ao criar instância:', errorText)
    throw new Error('Erro ao criar instância do WhatsApp')
  }

  const instanceData = await response.json()
  const instanceToken = instanceData.token || instanceData.hash

  if (!instanceToken) {
    throw new Error('Token da instância não foi gerado')
  }

  console.log('✅ Nova instância criada:', instanceData.id)

  return {
    token: instanceToken,
    id: instanceData.id,
    data: instanceData
  }
}

/**
 * ============================================================================
 * GET: Polling - Verificar Status e Sincronizar
 * ============================================================================
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 [GET] Polling - Verificando status:', connectionId)

    // ========================================================================
    // 1. BUSCAR CONEXÃO NO SUPABASE
    // ========================================================================
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

    // ========================================================================
    // 2. EXTRAIR TOKEN
    // ========================================================================
    let instanceToken = null

    if (connection.api_credentials) {
      try {
        const credentials = JSON.parse(connection.api_credentials)
        instanceToken = credentials.token || credentials.instanceToken
        console.log('✅ Token extraído de api_credentials')
      } catch (e) {
        instanceToken = connection.instance_token
        console.log('⚠️ Usando instance_token (fallback)')
      }
    } else {
      instanceToken = connection.instance_token
    }

    if (!instanceToken) {
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Token não encontrado'
      })
    }

    // ========================================================================
    // 3. CONSULTAR STATUS REAL NA UAZAPI
    // ========================================================================
    const statusCheck = await getUAZAPIStatus(instanceToken)

    if (!statusCheck.ok || !statusCheck.data) {
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Não foi possível verificar status na UAZAPI'
      })
    }

    const instanceStatus = statusCheck.instanceStatus
    const instanceInfo = statusCheck.data.instance || {}

    // ========================================================================
    // 4. 🔴 SINCRONIZAR SUPABASE COM STATUS REAL DA UAZAPI
    // ========================================================================
    await syncStatusToSupabase(connectionId, instanceStatus, {
      instance: {
        ...instanceInfo,
        token: instanceToken
      }
    })

    // ========================================================================
    // 5. RETORNAR RESPOSTA PARA FRONTEND
    // ========================================================================
    return NextResponse.json({
      success: true,
      status: instanceStatus,
      connected: instanceStatus === 'open',
      profileName: instanceInfo.profileName || null,
      profilePicUrl: instanceInfo.profilePicUrl || null,
      owner: instanceInfo.owner || null,
      instanceName: connection.instance_name,
      qrCode: instanceInfo.qrcode || null,
      message: instanceStatus === 'open' ? 'Conectado' : 'Aguardando conexão'
    })

  } catch (error) {
    console.error('❌ Erro no GET /api/whatsapp/connect:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status'
    }, { status: 500 })
  }
}

/**
 * ============================================================================
 * POST: Criar/Conectar Instância
 * ============================================================================
 */
export async function POST(request) {
  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔄 [POST] Iniciando conexão WhatsApp:', connectionId)

    // ========================================================================
    // 1. BUSCAR CONEXÃO E USER_ID
    // ========================================================================
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connError || !connection) {
      console.error('❌ Conexão não encontrada:', connError)
      return NextResponse.json({
        success: false,
        error: 'Conexão não encontrada'
      }, { status: 404 })
    }

    const userId = connection.user_id

    // ========================================================================
    // 2. VERIFICAR INSTÂNCIA EXISTENTE (GLOBAL POR USER_ID)
    // ========================================================================
    console.log('🔍 Buscando instância existente para user_id:', userId)

    const { data: existingInstances } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .not('instance_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    let instanceToken = null
    let instanceName = null
    let activeConnectionId = connectionId
    let needsNewInstance = false

    // ========================================================================
    // 3. PROCESSAR INSTÂNCIA EXISTENTE
    // ========================================================================
    if (existingInstances && existingInstances.length > 0) {
      const existingConnection = existingInstances[0]
      activeConnectionId = existingConnection.id

      // Extrair token
      if (existingConnection.api_credentials) {
        try {
          const credentials = JSON.parse(existingConnection.api_credentials)
          instanceToken = credentials.token || credentials.instanceToken
          console.log('✅ Token extraído de api_credentials')
        } catch (e) {
          instanceToken = existingConnection.instance_token
          console.log('⚠️ Usando instance_token (fallback)')
        }
      } else {
        instanceToken = existingConnection.instance_token
      }

      instanceName = existingConnection.instance_name

      console.log('✅ Instância existente encontrada:', {
        connectionId: existingConnection.id,
        instanceName,
        hasToken: !!instanceToken
      })

      // Remover duplicata se necessário
      if (existingConnection.id !== connectionId) {
        console.log('⚠️ Removendo conexão duplicada:', connectionId)
        await supabase
          .from('whatsapp_connections')
          .delete()
          .eq('id', connectionId)
      }

      // ====================================================================
      // 4. VALIDAR TOKEN NA UAZAPI
      // ====================================================================
      const statusCheck = await getUAZAPIStatus(instanceToken)

      if (statusCheck.ok && statusCheck.data) {
        const currentStatus = statusCheck.instanceStatus

        console.log('✅ Token válido, status:', currentStatus)

        // 🔴 SINCRONIZAR SUPABASE COM STATUS ATUAL
        await syncStatusToSupabase(activeConnectionId, currentStatus, statusCheck.data)

        // Se já está conectado, retornar imediatamente
        if (currentStatus === 'open') {
          const instanceInfo = statusCheck.data.instance || {}

          return NextResponse.json({
            success: true,
            connectionId: activeConnectionId,
            instanceName,
            instanceToken,
            status: 'open',
            connected: true,
            profileName: instanceInfo.profileName || null,
            profilePicUrl: instanceInfo.profilePicUrl || null,
            owner: instanceInfo.owner || null,
            message: 'Instância já conectada'
          })
        }

        needsNewInstance = false
      } else {
        // Token inválido - criar nova instância
        console.log('⚠️ Token INVÁLIDO - criando nova instância')
        needsNewInstance = true
      }

    } else {
      // Nenhuma instância encontrada
      console.log('🆕 Nenhuma instância encontrada - criando nova')
      instanceName = `swiftbot_${userId.replace(/-/g, '_')}`
      needsNewInstance = true
    }

    // ========================================================================
    // 5. CRIAR NOVA INSTÂNCIA (se necessário)
    // ========================================================================
    if (needsNewInstance) {
      const newInstance = await createNewInstance(instanceName)
      instanceToken = newInstance.token

      // Atualizar Supabase com novo token
      await supabase
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,
          instance_token: instanceToken,
          api_credentials: JSON.stringify({
            token: instanceToken,
            instanceId: newInstance.id,
            createdAt: new Date().toISOString()
          }),
          waba_id: newInstance.id || instanceName,
          status: 'connecting',
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConnectionId)

      console.log('✅ Novo token salvo no Supabase')
    }

    // ========================================================================
    // 6. INICIAR CONEXÃO
    // ========================================================================
    console.log('🔌 Iniciando conexão UAZAPI...')

    const connectResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instanceToken
        },
        body: JSON.stringify({})
      }
    )

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text()
      console.error('❌ Erro ao conectar:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erro ao iniciar conexão WhatsApp'
      }, { status: 500 })
    }

    console.log('✅ Conexão iniciada')

    // ========================================================================
    // 7. OBTER QR CODE E STATUS
    // ========================================================================
    const statusCheck = await getUAZAPIStatus(instanceToken)

    let qrCode = null
    let instanceStatus = 'connecting'
    let instanceInfo = {}

    if (statusCheck.ok && statusCheck.data) {
      instanceInfo = statusCheck.data.instance || {}
      instanceStatus = statusCheck.instanceStatus

      // Extrair QR Code
      qrCode = instanceInfo.qrcode || statusCheck.data.qrcode || null

      // 🔴 SINCRONIZAR STATUS NO SUPABASE
      await syncStatusToSupabase(activeConnectionId, instanceStatus, statusCheck.data)
    }

    // ========================================================================
    // 8. RESPOSTA FINAL
    // ========================================================================
    return NextResponse.json({
      success: true,
      connectionId: activeConnectionId,
      instanceName,
      instanceToken,
      status: instanceStatus,
      qrCode: qrCode,
      profileName: instanceInfo.profileName || null,
      profilePicUrl: instanceInfo.profilePicUrl || null,
      owner: instanceInfo.owner || null,
      connected: instanceStatus === 'open',
      message: qrCode
        ? 'QR Code gerado com sucesso'
        : instanceStatus === 'open'
          ? 'Instância já conectada'
          : 'Aguardando conexão...'
    })

  } catch (error) {
    console.error('❌ Erro no POST /api/whatsapp/connect:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
