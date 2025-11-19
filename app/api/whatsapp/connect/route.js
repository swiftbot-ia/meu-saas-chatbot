// app/api/whatsapp/connect/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'
import { syncUazapiToSupabase } from '../helpers/syncUazapiToSupabase.js'

const UAZAPI_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

// ============================================================================
// GET: Polling - Verificar status e sincronizar com UAZAPI
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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    console.log('🔍 [Polling] Verificando status da conexão:', connectionId)

    // Buscar conexão no banco
    const { data: connection, error } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      console.error('❌ [Polling] Conexão não encontrada:', error)
      return NextResponse.json({
        success: false,
        error: 'Conexão não encontrada'
      }, { status: 404 })
    }

    // Se não tiver token, retornar status do banco
    if (!connection.instance_token) {
      console.log('⚠️ [Polling] Instância ainda não tem token')
      return NextResponse.json({
        success: true,
        status: connection.status || 'connecting',
        connected: false,
        message: 'Instância ainda não criada'
      })
    }

    // Extrair token
    let instanceToken = connection.instance_token
    if (connection.api_credentials) {
      try {
        const credentials = JSON.parse(connection.api_credentials)
        instanceToken = credentials.token || instanceToken
      } catch (e) {
        // Usar token direto
      }
    }

    console.log('🔍 [Polling] Buscando status na UAZAPI...')

    // Buscar status na UAZAPI
    const statusResponse = await fetch(
      `${UAZAPI_URL}/instance/connectionState/${connection.instance_name}`,
      {
        method: 'GET',
        headers: {
          'apitoken': instanceToken,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!statusResponse.ok) {
      console.error('❌ [Polling] Erro ao buscar status na UAZAPI:', statusResponse.status)
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Erro ao verificar status na UAZAPI'
      })
    }

    const instanceData = await statusResponse.json()
    console.log('📥 [Polling] Dados da UAZAPI:', {
      status: instanceData?.instance?.status,
      hasProfile: !!instanceData?.instance?.profileName
    })

    // Sincronizar com Supabase
    const syncResult = await syncUazapiToSupabase(connectionId, instanceData)

    if (!syncResult.success) {
      console.error('❌ [Polling] Erro na sincronização:', syncResult.error)
      return NextResponse.json({
        success: true,
        status: connection.status,
        connected: false,
        message: 'Erro ao sincronizar dados'
      })
    }

    const updatedData = syncResult.data
    const isConnected = updatedData.status === 'connected'

    console.log('✅ [Polling] Status sincronizado:', {
      status: updatedData.status,
      isConnected,
      hasProfile: !!updatedData.profile_name
    })

    return NextResponse.json({
      success: true,
      status: updatedData.status,
      connected: isConnected,
      profileName: updatedData.profile_name || null,
      profilePicUrl: updatedData.profile_pic_url || null,
      phoneNumber: updatedData.phone_number || null,
      instanceName: connection.instance_name,
      connectionId: connectionId,
      message: isConnected ? 'Conectado' : 'Aguardando conexão'
    })

  } catch (error) {
    console.error('❌ [Polling] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status'
    }, { status: 500 })
  }
}

// ============================================================================
// POST: Criar/Conectar instância WhatsApp (Idempotente)
// ============================================================================
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

    console.log('🔄 [Connect] Iniciando conexão para connectionId:', connectionId)

    // ========================================================================
    // 1. BUSCAR CONEXÃO NO BANCO
    // ========================================================================
    const { data: connection, error: connError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*, user_id')
      .eq('id', connectionId)
      .single()

    if (connError || !connection) {
      console.error('❌ [Connect] Conexão não encontrada:', connError)
      return NextResponse.json({
        success: false,
        error: 'Conexão não encontrada'
      }, { status: 404 })
    }

    const userId = connection.user_id
    const instanceName = connection.instance_name || `swiftbot_${userId.replace(/-/g, '_')}`

    // ========================================================================
    // 2. VALIDAR ASSINATURA
    // ========================================================================
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      console.error('❌ [Connect] Assinatura não encontrada')
      return NextResponse.json({
        success: false,
        error: 'Você precisa ter uma assinatura ativa'
      }, { status: 403 })
    }

    // Verificar status da assinatura
    const blockedStatuses = ['canceled', 'cancelled', 'expired', 'incomplete', 'incomplete_expired', 'unpaid']
    if (blockedStatuses.includes(subscription.status)) {
      console.error('❌ [Connect] Assinatura bloqueada:', subscription.status)
      return NextResponse.json({
        success: false,
        error: `Assinatura ${subscription.status}. Por favor, atualize seu plano.`
      }, { status: 403 })
    }

    console.log('✅ [Connect] Assinatura válida:', subscription.status)

    // ========================================================================
    // 3. VERIFICAR LIMITE DE CONEXÕES
    // ========================================================================
    const { data: allConnections } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('id, status, instance_token')
      .eq('user_id', userId)

    const activeCount = allConnections?.filter(c =>
      c.instance_token && c.status === 'connected'
    ).length || 0

    const planLimit = subscription.connections_purchased || 1

    if (activeCount >= planLimit) {
      console.error('❌ [Connect] Limite atingido:', { activeCount, planLimit })
      return NextResponse.json({
        success: false,
        error: `Limite de ${planLimit} conexão(ões) atingido`
      }, { status: 403 })
    }

    // ========================================================================
    // 4. TENTAR REUSAR TOKEN EXISTENTE
    // ========================================================================
    let instanceToken = null
    let needsNewInstance = true

    if (connection.instance_token) {
      console.log('🔍 [Connect] Testando token existente...')

      // Extrair token
      let testToken = connection.instance_token
      if (connection.api_credentials) {
        try {
          const credentials = JSON.parse(connection.api_credentials)
          testToken = credentials.token || testToken
        } catch (e) {
          // Usar direto
        }
      }

      // Testar token na UAZAPI
      const testResponse = await fetch(
        `${UAZAPI_URL}/instance/connectionState/${instanceName}`,
        {
          method: 'GET',
          headers: {
            'apitoken': testToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (testResponse.ok) {
        const statusData = await testResponse.json()
        const currentStatus = statusData?.instance?.status

        console.log('✅ [Connect] Token válido! Status atual:', currentStatus)

        instanceToken = testToken
        needsNewInstance = false

        // Se já está conectado, retornar imediatamente
        if (currentStatus === 'open') {
          // Sincronizar dados
          await syncUazapiToSupabase(connectionId, statusData)

          return NextResponse.json({
            success: true,
            status: 'connected',
            connected: true,
            instanceToken,
            connectionId,
            instanceName,
            profileName: statusData?.instance?.profileName || null,
            profilePicUrl: statusData?.instance?.profilePicUrl || null,
            phoneNumber: statusData?.instance?.owner || null,
            message: 'WhatsApp já conectado'
          })
        }
      } else {
        console.warn('⚠️ [Connect] Token inválido (status:', testResponse.status, ') - Criando nova instância')
      }
    }

    // ========================================================================
    // 5. CRIAR NOVA INSTÂNCIA (se necessário)
    // ========================================================================
    if (needsNewInstance) {
      console.log('🆕 [Connect] Criando nova instância na UAZAPI...')

      const createResponse = await fetch(`${UAZAPI_URL}/instance/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admintoken': UAZAPI_ADMIN_TOKEN
        },
        body: JSON.stringify({
          name: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('❌ [Connect] Erro ao criar instância:', errorText)
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar instância WhatsApp'
        }, { status: 500 })
      }

      const instanceData = await createResponse.json()
      instanceToken = instanceData.token || instanceData.hash

      if (!instanceToken) {
        console.error('❌ [Connect] Token não gerado')
        return NextResponse.json({
          success: false,
          error: 'Token não foi gerado'
        }, { status: 500 })
      }

      console.log('✅ [Connect] Nova instância criada com token')

      // Atualizar banco com novo token (REUSA connectionId existente)
      await supabaseAdmin
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,
          instance_token: instanceToken,
          api_credentials: JSON.stringify({
            token: instanceToken,
            createdAt: new Date().toISOString()
          }),
          status: 'connecting',
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

      console.log('✅ [Connect] Token salvo no Supabase')
    }

    // ========================================================================
    // 6. INICIAR CONEXÃO
    // ========================================================================
    console.log('🔌 [Connect] Iniciando conexão WhatsApp...')

    const connectResponse = await fetch(
      `${UAZAPI_URL}/instance/connect`,
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
      console.error('❌ [Connect] Erro ao conectar:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erro ao iniciar conexão'
      }, { status: 500 })
    }

    console.log('✅ [Connect] Conexão iniciada')

    // ========================================================================
    // 7. OBTER QR CODE E STATUS
    // ========================================================================
    console.log('📱 [Connect] Obtendo QR Code...')

    const statusResponse = await fetch(
      `${UAZAPI_URL}/instance/connectionState/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'apitoken': instanceToken,
          'Content-Type': 'application/json'
        }
      }
    )

    let qrCode = null
    let finalStatus = 'connecting'
    let profileData = {}

    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      const instance = statusData?.instance || {}

      finalStatus = instance.status === 'open' ? 'connected' : 'connecting'
      qrCode = instance.qrcode || null
      profileData = {
        profileName: instance.profileName || null,
        profilePicUrl: instance.profilePicUrl || null,
        phoneNumber: instance.owner || null
      }

      console.log('📊 [Connect] Status obtido:', {
        status: finalStatus,
        hasQR: !!qrCode,
        hasProfile: !!profileData.profileName
      })

      // Sincronizar com Supabase
      await syncUazapiToSupabase(connectionId, statusData)
    } else {
      console.warn('⚠️ [Connect] Não foi possível obter status')
    }

    // ========================================================================
    // 8. RETORNAR RESPOSTA
    // ========================================================================
    return NextResponse.json({
      success: true,
      status: finalStatus,
      connected: finalStatus === 'connected',
      qrCode,
      instanceToken,
      connectionId,
      instanceName,
      ...profileData,
      message: qrCode
        ? 'QR Code gerado. Leia com seu WhatsApp.'
        : finalStatus === 'connected'
          ? 'WhatsApp conectado!'
          : 'Aguardando QR Code...'
    })

  } catch (error) {
    console.error('❌ [Connect] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + error.message
    }, { status: 500 })
  }
}
