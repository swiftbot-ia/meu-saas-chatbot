// app/api/whatsapp/connect/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'
import { syncUazapiToSupabase, extractInstanceData } from '../helpers/syncUazapiToSupabase.js'

// Configurações da UAZAPI (devem estar em .env.local)
const UAZAPI_URL = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN

// ============================================================================
// FUNÇÃO AUXILIAR: Delay (para aguardar propagação do token na UAZAPI)
// ============================================================================

/**
 * Aguarda um tempo específico (em milissegundos)
 * @param {number} ms - Tempo em milissegundos
 * @returns {Promise<void>}
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================================
// FUNÇÃO AUXILIAR: Chamada à UAZAPI (Com tratamento de erro 401/404)
// ============================================================================

/**
 * Tenta obter o status de uma instância
 * @param {string} token - Token da instância
 * @returns {Promise<object | null>} - Dados da UAZAPI ou null em caso de falha
 */
async function fetchUazapiStatus(token) {
  if (!token) return null

  try {
    const url = `${UAZAPI_URL}/instance/status`
    console.log('🔍 [UAZAPI] Buscando status:', { url })

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'token': token,
        'Content-Type': 'application/json'
      }
    })

    if (res.status === 401 || res.status === 404) {
      console.warn(`⚠️ [UAZAPI] Status ${res.status}: Token inválido ou instância não encontrada`)
      return null
    }

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`❌ [UAZAPI] Erro ${res.status}:`, errorText)
      return null
    }

    const data = await res.json()
    console.log('✅ [UAZAPI] Status obtido:', {
      status: data?.instance?.status,
      hasQR: !!data?.instance?.qrcode
    })
    return data

  } catch (error) {
    console.error('❌ [UAZAPI] Erro ao buscar status:', error.message)
    return null
  }
}

// ============================================================================
// ROTA POST: Conexão Inicial (Cria/Reutiliza/Sincroniza)
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

    console.log('🔄 [Connect-POST] Iniciando conexão para:', connectionId)

    // ========================================================================
    // 1. BUSCAR REGISTRO EXISTENTE NO SUPABASE (DEVE EXISTIR)
    // ========================================================================
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      console.error('❌ [Connect-POST] Conexão não encontrada:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada no Supabase' },
        { status: 404 }
      )
    }

    if (!connection.user_id) {
      console.error('❌ [Connect-POST] Registro incompleto: userId ausente')
      return NextResponse.json(
        { success: false, error: 'Registro de conexão está incompleto' },
        { status: 400 }
      )
    }

    // ✅ REGRA: Usar instanceName do banco (se válido), ou gerar baseado em connectionId
    let instanceName = connection.instance_name

    // Se instanceName não existe ou é temporário, gerar baseado no connectionId
    if (!instanceName || instanceName === 'temp_pending') {
      instanceName = `swiftbot_${connectionId.replace(/-/g, '_')}`
      console.log('🔄 [Connect-POST] instanceName não encontrado no banco, gerando:', instanceName)
    } else {
      console.log('✅ [Connect-POST] instanceName do banco:', instanceName)
    }

    const userId = connection.user_id
    let currentToken = connection.instance_token
    let uazapiData = null

    // ========================================================================
    // 2. TENTAR USAR TOKEN EXISTENTE
    // ========================================================================
    if (currentToken) {
      console.log('🔍 [Connect-POST] Testando token existente...')
      uazapiData = await fetchUazapiStatus(currentToken)

      if (uazapiData) {
        const currentStatus = uazapiData?.instance?.status
        console.log('✅ [Connect-POST] Token válido! Status:', currentStatus)

        // Se já está conectado, sincronizar e retornar
        if (currentStatus === 'open') {
          await syncUazapiToSupabase(connectionId, uazapiData)
          const finalData = extractInstanceData(uazapiData)

          return NextResponse.json({
            success: true,
            status: finalData.status,
            connected: finalData.connected,
            qrCode: finalData.qrCode,
            instanceToken: currentToken,
            connectionId,
            profileName: finalData.profileName,
            profilePicUrl: finalData.profilePicUrl,
            phoneNumber: finalData.phoneNumber,
            message: 'WhatsApp já está conectado'
          })
        }
      } else {
        console.warn('⚠️ [Connect-POST] Token inválido - Criando nova instância')
      }
    }

    // ========================================================================
    // 3. CRIAR NOVA INSTÂNCIA NA UAZAPI (se necessário)
    // ========================================================================
    if (!currentToken || !uazapiData) {
      console.log('🆕 [Connect-POST] Criando nova instância:', instanceName)

      // Payload ideal conforme documentação UAZAPI
      const payload = {
        name: instanceName,                    // Nome único da instância
        systemName: "Swiftbot SaaS",          // Nome do sistema
        adminField01: userId,                  // Rastreabilidade: userId do Supabase
        adminField02: connectionId             // Vinculação: connectionId em whatsapp_connections
      }

      console.log('📝 [Connect-POST] Payload UAZAPI:', payload)

      const createRes = await fetch(`${UAZAPI_URL}/instance/init`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'admintoken': UAZAPI_ADMIN_TOKEN   // ⚠️ Usado APENAS aqui para criar instância
        },
        body: JSON.stringify(payload)
      })

      if (!createRes.ok) {
        const errorBody = await createRes.text()
        console.error('❌ [Connect-POST] Erro ao criar instância:', errorBody)
        return NextResponse.json(
          { success: false, error: 'Falha ao criar instância UAZAPI' },
          { status: createRes.status }
        )
      }

      const newInstanceData = await createRes.json()

      // 🔍 LOG COMPLETO DA RESPOSTA UAZAPI
      console.log('📦 [Connect-POST] Resposta completa da UAZAPI:', JSON.stringify(newInstanceData, null, 2))

      currentToken = newInstanceData.token || newInstanceData.hash

      if (!currentToken) {
        console.error('❌ [Connect-POST] Token não foi gerado')
        return NextResponse.json(
          { success: false, error: 'Token não foi gerado pela UAZAPI' },
          { status: 500 }
        )
      }

      console.log('✅ [Connect-POST] Nova instância criada com token:', currentToken?.substring(0, 20) + '...')

      // UPDATE do token E instance_name no Supabase (nunca INSERT)
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_connections')
        .update({
          instance_name: instanceName,         // ✅ CRÍTICO: Atualizar com nome baseado em connectionId
          instance_token: currentToken,
          admin_field_01: userId,              // ✅ Rastreabilidade
          admin_field_02: connectionId,        // ✅ Vinculação
          api_credentials: JSON.stringify({
            token: currentToken,
            createdAt: new Date().toISOString(),
            uazapiResponse: newInstanceData    // Salvar resposta completa
          }),
          status: 'connecting',
          is_connected: false
          // updated_at é gerenciado automaticamente pelo trigger
        })
        .eq('id', connectionId)

      if (updateError) {
        console.error('❌ [Connect-POST] Erro ao atualizar token:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar token no Supabase' },
          { status: 500 }
        )
      }

      console.log('✅ [Connect-POST] Token salvo no Supabase (UPDATE)')

      // ⏱️ CRÍTICO: Aguardar 2 segundos para a UAZAPI processar o token recém-criado
      console.log('⏱️ [Connect-POST] Aguardando 2s para propagação do token na UAZAPI...')
      await delay(2000)
      console.log('✅ [Connect-POST] Delay concluído - token deve estar ativo agora')
    }

    // ========================================================================
    // 4. INICIAR CONEXÃO (se não estiver conectado)
    // ========================================================================
    console.log('🔌 [Connect-POST] Iniciando conexão WhatsApp...')

    const connectRes = await fetch(`${UAZAPI_URL}/instance/connect`, {
      method: 'POST',
      headers: {
        'token': currentToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!connectRes.ok) {
      const errorText = await connectRes.text()
      console.error('❌ [Connect-POST] Erro ao conectar:', errorText)
      // Não retornar erro fatal - continuar para obter status
    } else {
      console.log('✅ [Connect-POST] Conexão iniciada')
    }

    // ========================================================================
    // 5. OBTER STATUS FINAL E QR CODE
    // ========================================================================
    console.log('📱 [Connect-POST] Obtendo QR Code...')

    uazapiData = await fetchUazapiStatus(currentToken)

    if (!uazapiData) {
      console.warn('⚠️ [Connect-POST] Não foi possível obter status da UAZAPI')
      return NextResponse.json({
        success: true,
        status: 'connecting',
        connected: false,
        qrCode: null,
        instanceToken: currentToken,
        connectionId,
        message: 'Aguardando resposta da UAZAPI'
      })
    }

    // ========================================================================
    // 6. SINCRONIZAR COM SUPABASE
    // ========================================================================
    await syncUazapiToSupabase(connectionId, uazapiData)

    // ========================================================================
    // 7. EXTRAIR E RETORNAR DADOS
    // ========================================================================
    const finalData = extractInstanceData(uazapiData)

    console.log('📊 [Connect-POST] Status final:', {
      status: finalData.status,
      connected: finalData.connected,
      hasQR: !!finalData.qrCode
    })

    return NextResponse.json({
      success: true,
      status: finalData.status,
      connected: finalData.connected,
      qrCode: finalData.qrCode,
      instanceToken: currentToken,
      connectionId,
      profileName: finalData.profileName,
      profilePicUrl: finalData.profilePicUrl,
      phoneNumber: finalData.phoneNumber,
      message: finalData.qrCode
        ? 'QR Code gerado. Leia com seu WhatsApp.'
        : finalData.connected
          ? 'WhatsApp conectado!'
          : 'Aguardando QR Code...'
    })

  } catch (error) {
    console.error('❌ [Connect-POST] Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno: ' + error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// ROTA GET: Polling (Sincroniza Status)
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

    console.log('🔍 [Polling] Verificando status:', connectionId)

    // ========================================================================
    // 1. BUSCAR REGISTRO E TOKEN NO SUPABASE
    // ========================================================================
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      console.error('❌ [Polling] Conexão não encontrada:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada' },
        { status: 404 }
      )
    }

    if (!connection.instance_token || !connection.instance_name) {
      console.warn('⚠️ [Polling] Conexão sem token ou instance_name')
      return NextResponse.json({
        success: true,
        status: 'disconnected',
        connected: false,
        qrCode: null,
        message: 'Instância não criada'
      })
    }

    // ========================================================================
    // 2. BUSCAR STATUS REAL NA UAZAPI
    // ========================================================================
    const uazapiData = await fetchUazapiStatus(connection.instance_token)

    if (!uazapiData) {
      console.warn('⚠️ [Polling] Token inválido ou instância não encontrada')
      return NextResponse.json({
        success: true,
        status: connection.status || 'disconnected',
        connected: false,
        qrCode: null,
        profileName: connection.profile_name,
        message: 'Erro ao verificar status na UAZAPI'
      })
    }

    console.log('📥 [Polling] Dados da UAZAPI:', {
      status: uazapiData?.instance?.status,
      hasProfile: !!uazapiData?.instance?.profileName
    })

    // ========================================================================
    // 3. SINCRONIZAR SUPABASE COM STATUS DA UAZAPI
    // ========================================================================
    const syncResult = await syncUazapiToSupabase(connectionId, uazapiData)

    if (!syncResult.success) {
      console.error('❌ [Polling] Erro na sincronização:', syncResult.error)
    }

    // ========================================================================
    // 4. EXTRAIR E RETORNAR DADOS ATUALIZADOS
    // ========================================================================
    const finalData = extractInstanceData(uazapiData)

    console.log('✅ [Polling] Status sincronizado:', {
      status: finalData.status,
      connected: finalData.connected
    })

    return NextResponse.json({
      success: true,
      status: finalData.status,
      connected: finalData.connected,
      qrCode: finalData.qrCode,
      instanceToken: connection.instance_token,
      connectionId,
      profileName: finalData.profileName,
      profilePicUrl: finalData.profilePicUrl,
      phoneNumber: finalData.phoneNumber,
      message: finalData.connected ? 'Conectado' : 'Aguardando conexão'
    })

  } catch (error) {
    console.error('❌ [Polling] Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno: ' + error.message },
      { status: 500 }
    )
  }
}
