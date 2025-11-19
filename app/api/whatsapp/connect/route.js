// app/api/whatsapp/connect/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// ⚠️ DEPRECATED: Esta rota usa variáveis antigas
// Migre para: POST /api/whatsapp/instance/manage
const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

// Warning se usar variáveis antigas
if (!process.env.UAZAPI_BASE_URL && process.env.EVOLUTION_API_URL) {
  console.warn('⚠️ USANDO VARIÁVEIS DEPRECADAS! Atualize para UAZAPI_BASE_URL e UAZAPI_ADMIN_TOKEN')
}

// ============================================================================
// GET: Verificar status da conexão (usado para polling do frontend)
// ============================================================================
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
    const statusResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/status`,
      {
        method: 'GET',
        headers: { 'token': connection.instance_token }
      }
    )

    if (!statusResponse.ok) {
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Não foi possível verificar status na UAZAPI'
      })
    }

    const statusData = await statusResponse.json()
    const instanceInfo = statusData.instance || {}
    const instanceStatus = instanceInfo.status || 'disconnected'

    // ✅ ATUALIZAR SUPABASE: Status + Dados Completos em api_credentials
    const updateData = {
      status: instanceStatus === 'open' ? 'connected' : 'connecting',
      is_connected: instanceStatus === 'open',
      updated_at: new Date().toISOString()
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

      // Também salvar em colunas específicas (se existirem)
      if (instanceInfo.profileName) {
        updateData.profile_name = instanceInfo.profileName
        updateData.profile_pic_url = instanceInfo.profilePicUrl || null
        updateData.phone_number = instanceInfo.owner || null
      }

      console.log('✅ Perfil WhatsApp detectado:', {
        name: instanceInfo.profileName,
        phone: instanceInfo.owner
      })
    }

    await supabase
      .from('whatsapp_connections')
      .update(updateData)
      .eq('id', connectionId)

    console.log('✅ Supabase atualizado (GET):', updateData)

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

// ============================================================================
// POST: Criar/conectar instância WhatsApp
// ============================================================================
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

    // ============================================================================
    // 1. BUSCAR CONEXÃO E USER_ID
    // ============================================================================
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('*, user_id')
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

    // ============================================================================
    // 2. 🔴 VALIDAÇÃO CRÍTICA: VERIFICAR STATUS DA ASSINATURA
    // ============================================================================
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      console.log('❌ Nenhuma assinatura encontrada')
      return NextResponse.json({
        success: false,
        error: 'Você precisa ter uma assinatura ativa para conectar o WhatsApp'
      }, { status: 403 })
    }

    // 🔒 VERIFICAR STATUS DA ASSINATURA
    const blockedStatuses = ['canceled', 'cancelled', 'expired', 'incomplete', 'incomplete_expired', 'unpaid']
    
    if (blockedStatuses.includes(subscription.status)) {
      console.log(`❌ Assinatura com status bloqueado: ${subscription.status}`)
      return NextResponse.json({
        success: false,
        error: `Não é possível conectar. Status da assinatura: ${subscription.status}`,
        subscription_status: subscription.status
      }, { status: 403 })
    }

    // 🔒 VERIFICAR SE TRIAL ESTÁ EXPIRADO
    if (subscription.status === 'trial' && subscription.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date)
      const now = new Date()
      
      if (now > trialEndDate) {
        console.log('❌ Trial expirado')
        
        // Atualizar status para expired
        await supabase
          .from('user_subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', subscription.id)

        return NextResponse.json({
          success: false,
          error: 'Seu período de teste expirou. Por favor, assine um plano para continuar.',
          subscription_status: 'expired'
        }, { status: 403 })
      }
    }

    // 🔒 VERIFICAR SE PLANO ATIVO ESTÁ VENCIDO
    if (subscription.status === 'active' && subscription.next_billing_date) {
      const nextBillingDate = new Date(subscription.next_billing_date)
      const now = new Date()
      
      // Se passou 7 dias da data de cobrança sem pagamento, considerar expirado
      const gracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 dias em ms
      if (now > new Date(nextBillingDate.getTime() + gracePeriod)) {
        console.log('❌ Assinatura vencida (sem pagamento)')
        
        await supabase
          .from('user_subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', subscription.id)

        return NextResponse.json({
          success: false,
          error: 'Sua assinatura venceu. Por favor, atualize seu método de pagamento.',
          subscription_status: 'expired'
        }, { status: 403 })
      }
    }

    console.log('✅ Validação de assinatura passou:', {
      status: subscription.status,
      trial_end: subscription.trial_end_date,
      next_billing: subscription.next_billing_date
    })

    // ============================================================================
    // 3. VERIFICAR LIMITE DE CONEXÕES DO PLANO
    // ============================================================================
    const { data: allConnections, error: countError } = await supabase
      .from('whatsapp_connections')
      .select('id, status')
      .eq('user_id', userId)

    if (!countError && allConnections) {
      const connectedCount = allConnections.filter(c => c.status === 'connected').length
      const planLimit = subscription.connection_limit || 1

      if (connectedCount >= planLimit) {
        console.log(`❌ Limite de conexões atingido: ${connectedCount}/${planLimit}`)
        return NextResponse.json({
          success: false,
          error: `Você atingiu o limite de ${planLimit} conexão(ões) do seu plano. Faça upgrade para adicionar mais.`
        }, { status: 403 })
      }
    }

    // ============================================================================
    // 4. ✅ VALIDAÇÃO PASSOU - VERIFICAR INSTÂNCIA EXISTENTE
    // ============================================================================

    // 🔍 IMPORTANTE: Verificar se JÁ EXISTE uma instância para este user_id
    console.log('🔍 Verificando instâncias existentes para user_id:', userId)

    const { data: existingInstances, error: existingError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .not('instance_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    let instanceApiKey = null
    let instanceName = null
    let needsInit = false
    let existingConnection = null

    if (existingInstances && existingInstances.length > 0) {
      existingConnection = existingInstances[0]
      instanceApiKey = existingConnection.instance_token
      instanceName = existingConnection.instance_name

      console.log('✅ Instância existente encontrada:', {
        connectionId: existingConnection.id,
        instanceName,
        hasToken: !!instanceApiKey,
        status: existingConnection.status
      })

      // Atualizar o connectionId atual para apontar para a instância existente
      if (existingConnection.id !== connectionId) {
        console.log('⚠️ Detectado connectionId diferente, atualizando referência')

        // Deletar o registro duplicado (connectionId sem token)
        await supabase
          .from('whatsapp_connections')
          .delete()
          .eq('id', connectionId)

        console.log('✅ Registro duplicado removido')
      }

      // Verificar se token ainda é válido na UAZAPI
      try {
        const statusResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/status`,
          {
            method: 'GET',
            headers: { 'token': instanceApiKey }
          }
        )

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const currentStatus = statusData.instance?.status || statusData.status

          console.log('✅ Token válido na UAZAPI, status:', currentStatus)
          needsInit = false

          // Se já está conectado, retornar imediatamente
          if (currentStatus === 'open') {
            console.log('✅ Instância já conectada, retornando dados')

            return NextResponse.json({
              success: true,
              instanceName,
              instanceToken: instanceApiKey,
              status: 'open',
              connected: true,
              profileName: statusData.instance?.profileName || null,
              profilePicUrl: statusData.instance?.profilePicUrl || null,
              owner: statusData.instance?.owner || null,
              message: 'Instância já conectada'
            })
          }

        } else {
          console.log('⚠️ Token inválido na UAZAPI, será criada nova instância')
          needsInit = true
        }
      } catch (error) {
        console.error('❌ Erro ao verificar token:', error.message)
        needsInit = true
      }

    } else {
      console.log('🆕 Nenhuma instância válida encontrada para este usuário')
      instanceName = `swiftbot_${userId.replace(/-/g, '_')}`
      needsInit = true
    }

    // ============================================================================
    // 4.2 CRIAR NOVA INSTÂNCIA (se necessário)
    // ============================================================================
    // Usar connectionId correto (pode ter sido atualizado se encontrou instância existente)
    const activeConnectionId = existingConnection?.id || connectionId

    if (needsInit) {
      console.log('📝 Criando nova instância na UAZAPI...')

      const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admintoken': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          name: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          systemName: 'Swiftbot 1.0'  // ✅ Identifica o sistema no WhatsApp
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('❌ Erro ao criar instância:', errorText)
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar instância do WhatsApp'
        }, { status: 500 })
      }

      const instanceData = await createResponse.json()
      instanceApiKey = instanceData.token || instanceData.hash
      const instanceId = instanceData.id

      if (!instanceApiKey) {
        return NextResponse.json({
          success: false,
          error: 'Token da instância não foi gerado'
        }, { status: 500 })
      }

      console.log('✅ Nova instância criada:', { instanceId, hasToken: !!instanceApiKey })

      // ✅ Salvar token e dados iniciais no banco
      await supabase
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,
          instance_token: instanceApiKey,
          api_credentials: JSON.stringify({
            token: instanceApiKey,
            instanceId: instanceId,
            createdAt: new Date().toISOString()
          }),
          waba_id: instanceId || instanceName,
          status: 'connecting',
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConnectionId)

      console.log('✅ Token salvo no Supabase (connectionId:', activeConnectionId, ')')
    }

    // ============================================================================
    // 4.3 INICIAR CONEXÃO (para instâncias novas ou desconectadas)
    // ============================================================================
    console.log('🔌 Iniciando processo de conexão...')
    const connectResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instanceApiKey
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

    const connectData = await connectResponse.json()
    console.log('✅ Conexão iniciada:', connectData)

    // ============================================================================
    // 4.4 OBTER QR CODE (endpoint /instance/status)
    // ============================================================================
    console.log('📱 Obtendo QR Code do status da instância...')
    const statusResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/status`,
      {
        method: 'GET',
        headers: { 'token': instanceApiKey }
      }
    )

    let qrCode = null
    let instanceStatus = 'connecting'
    let statusData = null
    let instanceInfo = {}

    if (statusResponse.ok) {
      statusData = await statusResponse.json()

      // Log completo da resposta para debug
      console.log('📦 Resposta completa da UAZAPI:', JSON.stringify(statusData, null, 2))

      // Extrair dados da instância
      instanceInfo = statusData.instance || {}

      // Extrair status do objeto aninhado 'instance'
      instanceStatus = instanceInfo.status || statusData.status || 'connecting'
      console.log('📊 Status da instância:', instanceStatus)

      // ✅ EXTRAÇÃO CORRETA: QR Code está em statusData.instance.qrcode
      if (instanceInfo.qrcode) {
        qrCode = instanceInfo.qrcode
        console.log('✅ QR Code encontrado em instance.qrcode')
      }
      // Fallback: tentar outras localizações possíveis
      else if (statusData.qrcode?.base64) {
        qrCode = statusData.qrcode.base64
        console.log('✅ QR Code encontrado em qrcode.base64')
      } else if (statusData.qrcode) {
        qrCode = statusData.qrcode
        console.log('✅ QR Code encontrado em qrcode')
      } else if (statusData.qr) {
        qrCode = statusData.qr
        console.log('✅ QR Code encontrado em qr')
      } else if (statusData.base64) {
        qrCode = statusData.base64
        console.log('✅ QR Code encontrado em base64')
      }

      // ✅ ATUALIZAR SUPABASE: Status + Dados Completos em api_credentials
      const updateData = {
        status: instanceStatus === 'open' ? 'connected' : 'connecting',
        is_connected: instanceStatus === 'open',
        updated_at: new Date().toISOString()
      }

      // Salvar dados completos em api_credentials (JSON)
      if (instanceStatus === 'open') {
        updateData.api_credentials = JSON.stringify({
          token: instanceApiKey,
          profileName: instanceInfo.profileName || null,
          profilePicUrl: instanceInfo.profilePicUrl || null,
          owner: instanceInfo.owner || null,
          status: instanceStatus,
          lastUpdated: new Date().toISOString()
        })

        // Também salvar em colunas específicas (se existirem)
        if (instanceInfo.profileName) {
          updateData.profile_name = instanceInfo.profileName
          updateData.profile_pic_url = instanceInfo.profilePicUrl || null
          updateData.phone_number = instanceInfo.owner || null
        }

        console.log('✅ Perfil WhatsApp detectado:', {
          name: instanceInfo.profileName,
          phone: instanceInfo.owner
        })
      }

      await supabase
        .from('whatsapp_connections')
        .update(updateData)
        .eq('id', activeConnectionId)

      console.log('✅ Supabase atualizado (POST) - connectionId:', activeConnectionId, updateData)
    } else {
      console.warn('⚠️ Não foi possível obter status da instância')
      const errorText = await statusResponse.text()
      console.error('❌ Erro no status:', errorText)
    }

    console.log('✅ QR Code disponível:', qrCode ? 'SIM' : 'NÃO')

    return NextResponse.json({
      success: true,
      instanceName,
      instanceToken: instanceApiKey,
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
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}