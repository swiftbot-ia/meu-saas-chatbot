// app/api/whatsapp/connect/route.js
// ============================================================================
// ROTA: Conectar/Gerar QR Code na UAZAPI (Corrigido: Importação Admin)
// ============================================================================

import { NextResponse } from 'next/server'
// CORREÇÃO AQUI: Usando o mesmo import do arquivo do seu sócio
import { supabaseAdmin } from '../../../../lib/supabase/server.js'

export const dynamic = 'force-dynamic' // Garante que a rota não faça cache

// Configurações da UAZAPI
const UAZAPI_URL = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN

// Helper: Delay para esperar a API processar
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// ----------------------------------------------------------------------------
// 1. Criar Instância na UAZAPI
// ----------------------------------------------------------------------------
async function createUazapiInstance(instanceName, userId, connectionId) {
  try {
    console.log(`🔌 [Uazapi] Criando instância: ${instanceName}`)
    console.log(`   instanceName tem hífens? ${instanceName.includes('-')}`)
    console.log(`   adminField01 (user_id): ${userId}`)
    console.log(`   adminField02 (connection_id): ${connectionId}`)

    const bodyPayload = {
      name: instanceName,
      systemName: 'Swiftbot 1.0',
      adminField01: userId,
      adminField02: connectionId
    }

    console.log(`📤 [Uazapi] Payload sendo enviado:`, JSON.stringify(bodyPayload, null, 2))

    const response = await fetch(`${UAZAPI_URL}/instance/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': UAZAPI_ADMIN_TOKEN
      },
      body: JSON.stringify({
        name: instanceName,
        systemName: 'Swiftbot 1.0',
        adminField01: userId,
        adminField02: connectionId
      })
    })

    const data = await response.json()

    // Log completo da resposta para debug
    console.log('📊 [Uazapi] Status HTTP:', response.status)
    console.log('📊 [Uazapi] Resposta completa:', JSON.stringify(data, null, 2))

    // Se já existe (403), consideramos sucesso para tentar conectar depois
    if (response.status === 403) {
      console.log('⚠️ [Uazapi] Instância já existe, prosseguindo...')
      return { exists: true, data }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || JSON.stringify(data) || 'Falha ao criar instância'
      console.error('❌ [Uazapi] Erro detalhado:', errorMsg)
      throw new Error(errorMsg)
    }

    // Extrair o token gerado pela API
    const instanceToken = data.token || data.hash
    console.log('✅ [Uazapi] Token gerado pela API:', instanceToken ? 'SIM' : 'NÃO')

    return { success: true, data, token: instanceToken }
  } catch (error) {
    console.error('❌ [Uazapi] Erro de criação:', error)
    throw error
  }
}

// ----------------------------------------------------------------------------
// 2. Conectar e Buscar QR Code / Status
// ----------------------------------------------------------------------------
async function connectUazapiInstance(instanceName, token) {
  try {
    console.log(`🔄 [Uazapi] Conectando instância: ${instanceName}`)

    // Passo 1: Iniciar conexão (POST /instance/connect)
    const connectResponse = await fetch(`${UAZAPI_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({})
    })

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text()
      console.error('❌ [Uazapi] Erro ao conectar:', errorText)
      return { ok: false, error: errorText }
    }

    const connectData = await connectResponse.json()
    console.log('✅ [Uazapi] Conexão iniciada')

    // Passo 2: Buscar status e QR Code (GET /instance/status)
    const statusResponse = await fetch(`${UAZAPI_URL}/instance/status`, {
      method: 'GET',
      headers: { 'token': token }
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('❌ [Uazapi] Erro ao buscar status:', errorText)
      return { ok: false, error: errorText }
    }

    const statusData = await statusResponse.json()
    console.log('📊 [Uazapi] Status recebido:', JSON.stringify(statusData, null, 2))

    return { ok: true, data: statusData }
  } catch (error) {
    console.error('❌ [Uazapi] Erro na conexão:', error)
    return { ok: false, error: error.message }
  }
}

// ----------------------------------------------------------------------------
// ROTA PRINCIPAL (POST)
// ----------------------------------------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json()
    const { connectionId } = body

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'ID da conexão faltando' }, { status: 400 })
    }

    console.log('🚀 [Connect] Iniciando fluxo para connectionId:', connectionId)

    // 1. Buscar Conexão completa no Banco (Usando supabaseAdmin para ter permissão total)
    const { data: connection, error: dbError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (dbError || !connection) {
      console.error('❌ Erro Supabase:', dbError)
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 })
    }

    // 2. Gerar/obter instance_name
    let instanceName = connection.instance_name
    if (!instanceName) {
      // Gerar nome baseado no ID da conexão
      instanceName = `swiftbot_${connection.id}`
      console.log('📝 [Connect] ConnectionID:', connection.id)
      console.log('📝 [Connect] Gerando instance_name:', instanceName)
      console.log('📝 [Connect] Tem hífens?', instanceName.includes('-'))
    } else {
      console.log('📝 [Connect] Usando instance_name existente:', instanceName)
      console.log('📝 [Connect] Tem hífens?', instanceName.includes('-'))
    }

    // 3. Verificar se precisa criar nova instância ou usar existente
    let instanceToken = connection.instance_token
    let needsCreation = !instanceToken

    // Se o instance_name for diferente do esperado (formato antigo), forçar recriação
    if (connection.instance_name && connection.instance_name !== instanceName) {
      console.log('⚠️ [Connect] instance_name com formato antigo, forçando recriação')
      console.log(`   Antigo: ${connection.instance_name}`)
      console.log(`   Novo: ${instanceName}`)
      needsCreation = true
      instanceToken = null

      // Deletar instância antiga se existir
      if (connection.instance_name) {
        try {
          console.log('🗑️ [Connect] Deletando instância antiga:', connection.instance_name)
          await fetch(`${UAZAPI_URL}/instance/delete/${connection.instance_name}`, {
            method: 'DELETE',
            headers: { 'admintoken': UAZAPI_ADMIN_TOKEN }
          })
        } catch (e) {
          console.log('⚠️ [Connect] Instância antiga não existe ou já foi deletada')
        }
      }
    }

    if (needsCreation) {
      console.log('🆕 [Connect] Criando nova instância na Uazapi')

      // Criar instância na Uazapi (retorna o token gerado pela API)
      const createResult = await createUazapiInstance(
        instanceName,
        connection.user_id,
        connection.id
      )
      instanceToken = createResult.token

      if (!instanceToken) {
        throw new Error('Token não foi retornado pela API da Uazapi')
      }

      console.log('✅ [Connect] Token recebido da Uazapi')

      // Salvar instance_name, token e adminFields no banco
      await supabaseAdmin
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,
          instance_token: instanceToken,
          admin_field_01: connection.user_id,
          admin_field_02: connection.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

      console.log('💾 [Connect] instance_name, token e adminFields salvos no banco')

      // Pequena pausa para garantir que a UAZAPI registrou a criação
      await delay(1500)
    } else {
      console.log('♻️ [Connect] Usando instância existente')
    }

    // 4. Chamar UAZAPI (Conexão/QR)
    const connectResult = await connectUazapiInstance(instanceName, instanceToken)

    // Se receber erro 401 (token inválido), deletar instância e recriar
    if (!connectResult.ok && connectResult.error && connectResult.error.includes('401')) {
      console.log('⚠️ [Connect] Token inválido detectado, recriando instância...')

      // Deletar instância antiga
      try {
        await fetch(`${UAZAPI_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: { 'admintoken': UAZAPI_ADMIN_TOKEN }
        })
        console.log('🗑️ [Connect] Instância com token inválido deletada')
      } catch (e) {
        console.log('⚠️ [Connect] Erro ao deletar instância antiga:', e.message)
      }

      // Criar nova instância
      const createResult = await createUazapiInstance(
        instanceName,
        connection.user_id,
        connection.id
      )
      instanceToken = createResult.token

      // Salvar novo token e adminFields no banco
      await supabaseAdmin
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,
          instance_token: instanceToken,
          admin_field_01: connection.user_id,
          admin_field_02: connection.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

      console.log('✅ [Connect] Nova instância criada com novo token e adminFields')

      // Aguardar e tentar conectar novamente
      await delay(1500)
      const retryConnect = await connectUazapiInstance(instanceName, instanceToken)
      return await processConnectionResult(retryConnect, connectionId, instanceName, instanceToken)
    }

    return await processConnectionResult(connectResult, connectionId, instanceName, instanceToken)
  } catch (error) {
    console.error('❌ Erro Fatal na Rota:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Helper function para processar resultado da conexão
async function processConnectionResult(connectResult, connectionId, instanceName, instanceToken) {
  try {

    let qrCode = null
    let status = 'connecting'
    let instanceInfo = {}

    if (connectResult.ok && connectResult.data) {
      const statusData = connectResult.data

      // Extrair informações da instância
      instanceInfo = statusData.instance || {}
      status = instanceInfo.status || statusData.status || 'connecting'

      console.log('📊 [Connect] Status da instância:', status)

      // Extrair QR Code (múltiplos formatos possíveis)
      if (instanceInfo.qrcode) {
        qrCode = instanceInfo.qrcode
        console.log('✅ [Connect] QR Code encontrado em instance.qrcode')
      } else if (statusData.qrcode?.base64) {
        qrCode = statusData.qrcode.base64
        console.log('✅ [Connect] QR Code encontrado em qrcode.base64')
      } else if (statusData.qrcode) {
        qrCode = statusData.qrcode
        console.log('✅ [Connect] QR Code encontrado em qrcode')
      } else if (statusData.qr) {
        qrCode = statusData.qr
        console.log('✅ [Connect] QR Code encontrado em qr')
      } else if (statusData.base64) {
        qrCode = statusData.base64
        console.log('✅ [Connect] QR Code encontrado em base64')
      }

      // Se já está conectado, limpar QR Code
      if (status === 'open') {
        qrCode = null
        status = 'connected'
        console.log('✅ [Connect] Instância já conectada!')
      }
    }

    // 5. Atualizar Status no Banco
    const updateData = {
      status: status === 'connected' || status === 'open' ? 'connected' : 'connecting',
      is_connected: status === 'connected' || status === 'open',
      updated_at: new Date().toISOString()
    }

    // Se já conectou, salvar informações do perfil
    if (status === 'connected' || status === 'open') {
      if (instanceInfo.profileName) {
        updateData.profile_name = instanceInfo.profileName
        updateData.profile_pic_url = instanceInfo.profilePicUrl || null
        updateData.phone_number = instanceInfo.owner || null
        console.log('✅ [Connect] Perfil detectado:', {
          name: instanceInfo.profileName,
          phone: instanceInfo.owner
        })
      }
    }

    await supabaseAdmin
      .from('whatsapp_connections')
      .update(updateData)
      .eq('id', connectionId)

    console.log('💾 [Connect] Banco atualizado:', updateData)

    return NextResponse.json({
      success: true,
      qrCode: qrCode,
      status: status,
      instanceName: instanceName,
      profileName: instanceInfo.profileName || null,
      profilePicUrl: instanceInfo.profilePicUrl || null,
      owner: instanceInfo.owner || null,
      connected: status === 'connected' || status === 'open',
      message: qrCode
        ? 'QR Code gerado com sucesso'
        : status === 'connected' || status === 'open'
          ? 'Instância já conectada'
          : 'Aguardando QR Code...'
    })

  } catch (error) {
    console.error('❌ Erro Fatal na Rota:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}