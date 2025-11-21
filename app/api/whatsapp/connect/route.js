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
async function createUazapiInstance(instanceName, token) {
  try {
    console.log(`🔌 [Uazapi] Criando instância: ${instanceName}`)
    
    const response = await fetch(`${UAZAPI_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': UAZAPI_ADMIN_TOKEN
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: token,
        qrcode: true,
        reconnect: true
      })
    })

    const data = await response.json()
    
    // Se já existe (403), consideramos sucesso para tentar conectar depois
    if (response.status === 403) {
      console.log('⚠️ [Uazapi] Instância já existe, prosseguindo...')
      return { exists: true, data }
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Falha ao criar instância')
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ [Uazapi] Erro de criação:', error)
    throw error
  }
}

// ----------------------------------------------------------------------------
// 2. Buscar QR Code / Status
// ----------------------------------------------------------------------------
async function connectUazapiInstance(instanceName, token) {
  try {
    console.log(`🔄 [Uazapi] Buscando QR Code para: ${instanceName}`)
    
    const response = await fetch(`${UAZAPI_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': UAZAPI_ADMIN_TOKEN,
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    return { ok: response.ok, data }
  } catch (error) {
    return { ok: false, error }
  }
}

// ----------------------------------------------------------------------------
// ROTA PRINCIPAL (POST)
// ----------------------------------------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json()
    const { connectionId, instanceName } = body

    if (!connectionId || !instanceName) {
      return NextResponse.json({ success: false, error: 'ID ou Nome da instância faltando' }, { status: 400 })
    }

    console.log('🚀 [Connect] Iniciando fluxo para:', instanceName)

    // 1. Buscar Token no Banco (Usando supabaseAdmin para ter permissão total)
    const { data: connection, error: dbError } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('instance_token')
      .eq('id', connectionId)
      .single()

    if (dbError || !connection) {
      console.error('❌ Erro Supabase:', dbError)
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 })
    }

    // Gerar token se não existir
    let instanceToken = connection.instance_token
    if (!instanceToken) {
      instanceToken = crypto.randomUUID().replace(/-/g, '')
      await supabaseAdmin
        .from('whatsapp_connections')
        .update({ instance_token: instanceToken })
        .eq('id', connectionId)
    }

    // 2. Chamar UAZAPI (Criação)
    await createUazapiInstance(instanceName, instanceToken)
    
    // Pequena pausa para garantir que a UAZAPI registrou a criação
    await delay(1500)

    // 3. Chamar UAZAPI (Conexão/QR)
    const connectResult = await connectUazapiInstance(instanceName, instanceToken)

    let qrCode = null
    let status = 'connecting'

    if (connectResult.data) {
        // Tenta pegar o QR Code em diferentes formatos possíveis
        if (connectResult.data.base64) qrCode = connectResult.data.base64
        if (connectResult.data.qrcode?.base64) qrCode = connectResult.data.qrcode.base64
        
        // Verifica se já conectou direto (reconexão)
        if (connectResult.data.instance?.state === 'open' || connectResult.data.state === 'open') {
            status = 'connected'
            qrCode = null
        }
    }

    // 4. Atualizar Status no Banco
    await supabaseAdmin
      .from('whatsapp_connections')
      .update({ 
        status: status === 'connected' ? 'connected' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    return NextResponse.json({
      success: true,
      qrCode: qrCode,
      status: status,
      instanceName: instanceName,
      message: status === 'connected' ? 'Conectado!' : 'Escaneie o QR Code'
    })

  } catch (error) {
    console.error('❌ Erro Fatal na Rota:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}