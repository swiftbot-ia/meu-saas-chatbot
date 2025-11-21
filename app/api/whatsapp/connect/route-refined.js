// app/api/whatsapp/connect/route-refined.js
// ============================================================================
// VERSÃO REFINADA: Tratamento Completo de Token Inválido
// ============================================================================

import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

/**
 * ============================================================================
 * HELPER: Atualizar Conexão no Supabase
 * ============================================================================
 */
async function updateSupabaseConnection(connectionId, updateData) {
  console.log('💾 Atualizando Supabase:', { connectionId, keys: Object.keys(updateData) })

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', connectionId)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao atualizar Supabase:', error)
    throw new Error('Falha ao atualizar banco de dados')
  }

  console.log('✅ Supabase atualizado com sucesso')
  return data
}

/**
 * ============================================================================
 * HELPER: Criar Nova Instância UAZAPI
 * ============================================================================
 */
async function createNewUAZAPIInstance(instanceName) {
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

  console.log('✅ Nova instância criada:', {
    id: instanceData.id,
    hasToken: !!instanceToken
  })

  return {
    token: instanceToken,
    id: instanceData.id,
    data: instanceData
  }
}

/**
 * ============================================================================
 * HELPER: Verificar Status na UAZAPI
 * ============================================================================
 */
async function checkUAZAPIStatus(instanceToken) {
  console.log('🔍 Verificando status na UAZAPI...')

  const response = await fetch(
    `${EVOLUTION_API_URL}/instance/status`,
    {
      method: 'GET',
      headers: { 'token': instanceToken }
    }
  )

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? await response.json() : null
  }
}

/**
 * ============================================================================
 * HELPER: Iniciar Conexão UAZAPI
 * ============================================================================
 */
async function connectUAZAPIInstance(instanceToken) {
  console.log('🔌 Iniciando conexão UAZAPI...')

  const response = await fetch(
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

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Erro ao conectar:', errorText)
    throw new Error('Erro ao iniciar conexão WhatsApp')
  }

  const connectData = await response.json()
  console.log('✅ Conexão iniciada')
  return connectData
}

/**
 * ============================================================================
 * POST: Criar/Conectar Instância WhatsApp
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

    console.log('🔄 Solicitação de conexão WhatsApp:', { connectionId })

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
    // 2. VERIFICAR INSTÂNCIA EXISTENTE POR USER_ID (GLOBAL)
    // ========================================================================
    console.log('🔍 Verificando instâncias existentes para user_id:', userId)

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
    // 3. PROCESSAR INSTÂNCIA EXISTENTE (se houver)
    // ========================================================================
    if (existingInstances && existingInstances.length > 0) {
      const existingConnection = existingInstances[0]
      activeConnectionId = existingConnection.id

      // ✅ EXTRAIR TOKEN de api_credentials (JSON)
      if (existingConnection.api_credentials) {
        try {
          const credentials = JSON.parse(existingConnection.api_credentials)
          instanceToken = credentials.token || credentials.instanceToken
          console.log('✅ Token extraído de api_credentials (JSON)')
        } catch (e) {
          instanceToken = existingConnection.instance_token
          console.log('⚠️ api_credentials não é JSON, usando instance_token')
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

      // ✅ REMOVER DUPLICATA (se connectionId for diferente)
      if (existingConnection.id !== connectionId) {
        console.log('⚠️ Detectado connectionId diferente, removendo duplicata')

        await supabase
          .from('whatsapp_connections')
          .delete()
          .eq('id', connectionId)

        console.log('✅ Registro duplicado removido')
      }

      // ====================================================================
      // 4. 🔴 CRÍTICO: VALIDAR TOKEN NA UAZAPI
      // ====================================================================
      console.log('🔐 Validando token na UAZAPI...')

      const statusCheck = await checkUAZAPIStatus(instanceToken)

      if (statusCheck.ok && statusCheck.data) {
        const currentStatus = statusCheck.data.instance?.status || statusCheck.data.status

        console.log('✅ Token VÁLIDO na UAZAPI, status:', currentStatus)

        // ✅ EARLY RETURN: Se já está conectado
        if (currentStatus === 'open') {
          console.log('✅ Instância já conectada, retornando dados')

          const instanceInfo = statusCheck.data.instance || {}

          // Atualizar dados no Supabase
          await updateSupabaseConnection(activeConnectionId, {
            status: 'connected',
            is_connected: true,
            last_connected_at: new Date().toISOString(),
            api_credentials: JSON.stringify({
              token: instanceToken,
              profileName: instanceInfo.profileName,
              profilePicUrl: instanceInfo.profilePicUrl,
              owner: instanceInfo.owner,
              status: currentStatus,
              lastUpdated: new Date().toISOString()
            }),
            profile_name: instanceInfo.profileName || null,
            profile_pic_url: instanceInfo.profilePicUrl || null,
            phone_number: instanceInfo.owner || null
          })

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

        // Token válido mas não conectado - não precisa criar nova instância
        needsNewInstance = false

      } else {
        // ====================================================================
        // 5. 🔴 TOKEN INVÁLIDO: CRIAR NOVA INSTÂNCIA
        // ====================================================================
        console.log('⚠️ Token INVÁLIDO na UAZAPI (HTTP', statusCheck.status, ')')
        console.log('🔄 Forçando criação de nova instância...')

        needsNewInstance = true
      }

    } else {
      // ====================================================================
      // 6. NENHUMA INSTÂNCIA ENCONTRADA: CRIAR NOVA
      // ====================================================================
      console.log('🆕 Nenhuma instância válida encontrada para este usuário')
      instanceName = `swiftbot_${userId.replace(/-/g, '_')}`
      needsNewInstance = true
    }

    // ========================================================================
    // 7. CRIAR NOVA INSTÂNCIA (se necessário)
    // ========================================================================
    if (needsNewInstance) {
      console.log('📝 Criando nova instância...')

      const newInstance = await createNewUAZAPIInstance(instanceName)
      instanceToken = newInstance.token

      // ✅ ATUALIZAR LINHA EXISTENTE (não criar nova)
      await updateSupabaseConnection(activeConnectionId, {
        instance_name: instanceName,
        instance_token: instanceToken,
        api_credentials: JSON.stringify({
          token: instanceToken,
          instanceId: newInstance.id,
          createdAt: new Date().toISOString()
        }),
        waba_id: newInstance.id || instanceName,
        status: 'connecting',
        is_connected: false
      })

      console.log('✅ Token atualizado no Supabase (connectionId:', activeConnectionId, ')')
    }

    // ========================================================================
    // 8. INICIAR CONEXÃO
    // ========================================================================
    await connectUAZAPIInstance(instanceToken)

    // ========================================================================
    // 9. OBTER QR CODE
    // ========================================================================
    console.log('📱 Obtendo QR Code...')

    const statusCheck = await checkUAZAPIStatus(instanceToken)

    let qrCode = null
    let instanceStatus = 'connecting'
    let instanceInfo = {}

    if (statusCheck.ok && statusCheck.data) {
      const statusData = statusCheck.data
      instanceInfo = statusData.instance || {}
      instanceStatus = instanceInfo.status || statusData.status || 'connecting'

      // ✅ EXTRAÇÃO CORRETA: QR Code
      if (instanceInfo.qrcode) {
        qrCode = instanceInfo.qrcode
        console.log('✅ QR Code encontrado em instance.qrcode')
      } else if (statusData.qrcode?.base64) {
        qrCode = statusData.qrcode.base64
        console.log('✅ QR Code encontrado em qrcode.base64')
      } else if (statusData.qrcode) {
        qrCode = statusData.qrcode
        console.log('✅ QR Code encontrado em qrcode')
      }

      // ✅ ATUALIZAR SUPABASE com dados completos
      const updateData = {
        status: instanceStatus === 'open' ? 'connected' : 'connecting',
        is_connected: instanceStatus === 'open'
      }

      // Salvar dados completos em api_credentials (JSON)
      if (instanceStatus === 'open') {
        updateData.api_credentials = JSON.stringify({
          token: instanceToken,
          profileName: instanceInfo.profileName || null,
          profilePicUrl: instanceInfo.profilePicUrl || null,
          owner: instanceInfo.owner || null,
          status: instanceStatus,
          lastUpdated: new Date().toISOString()
        })

        updateData.last_connected_at = new Date().toISOString()

        // Também salvar em colunas específicas
        if (instanceInfo.profileName) {
          updateData.profile_name = instanceInfo.profileName
          updateData.profile_pic_url = instanceInfo.profilePicUrl || null
          updateData.phone_number = instanceInfo.owner || null

          console.log('✅ Perfil WhatsApp detectado:', {
            name: instanceInfo.profileName,
            phone: instanceInfo.owner
          })
        }
      }

      await updateSupabaseConnection(activeConnectionId, updateData)
    }

    console.log('✅ QR Code disponível:', qrCode ? 'SIM' : 'NÃO')

    // ========================================================================
    // 10. RESPOSTA FINAL
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
          : 'Aguardando QR Code...'
    })

  } catch (error) {
    console.error('❌ Erro na API connect:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

/**
 * ============================================================================
 * GET: Verificar Status (Polling)
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

    console.log('🔍 Verificando status da conexão:', connectionId)

    // Buscar conexão no banco
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

    // Se não tiver token, retornar status do banco
    if (!connection.instance_token) {
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Instância ainda não criada'
      })
    }

    // Verificar status na UAZAPI
    const statusCheck = await checkUAZAPIStatus(connection.instance_token)

    if (!statusCheck.ok || !statusCheck.data) {
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Não foi possível verificar status na UAZAPI'
      })
    }

    const statusData = statusCheck.data
    const instanceInfo = statusData.instance || {}
    const instanceStatus = instanceInfo.status || 'disconnected'

    // ✅ ATUALIZAR SUPABASE
    const updateData = {
      status: instanceStatus === 'open' ? 'connected' : 'connecting',
      is_connected: instanceStatus === 'open'
    }

    // Salvar dados completos em api_credentials (JSON)
    if (instanceStatus === 'open') {
      updateData.api_credentials = JSON.stringify({
        token: connection.instance_token,
        profileName: instanceInfo.profileName || null,
        profilePicUrl: instanceInfo.profilePicUrl || null,
        owner: instanceInfo.owner || null,
        status: instanceStatus,
        lastUpdated: new Date().toISOString()
      })

      updateData.last_connected_at = new Date().toISOString()

      // Também salvar em colunas específicas
      if (instanceInfo.profileName) {
        updateData.profile_name = instanceInfo.profileName
        updateData.profile_pic_url = instanceInfo.profilePicUrl || null
        updateData.phone_number = instanceInfo.owner || null

        console.log('✅ Perfil WhatsApp detectado:', {
          name: instanceInfo.profileName,
          phone: instanceInfo.owner
        })
      }
    }

    await updateSupabaseConnection(connectionId, updateData)

    return NextResponse.json({
      success: true,
      status: instanceStatus,
      connected: instanceStatus === 'open',
      profileName: instanceInfo.profileName || null,
      profilePicUrl: instanceInfo.profilePicUrl || null,
      owner: instanceInfo.owner || null,
      instanceName: connection.instance_name,
      message: instanceStatus === 'open' ? 'Conectado' : 'Aguardando conexão'
    })

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status'
    }, { status: 500 })
  }
}
