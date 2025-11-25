import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    // Nome da instância (único para cada usuário)
    const instanceName = `swiftbot_${userId}`
    console.log(`Verificando instância: ${instanceName}`)

    // Primeiro, verificar se a instância já existe
    try {
      const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      })

      if (checkResponse.ok) {
        // Instância existe, vamos deletá-la primeiro
        console.log('Instância existe, deletando...')
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        })
        // Aguardar um pouco para a exclusão completar
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.log('Instância não existe ou erro ao verificar:', error.message)
    }

    console.log(`Criando nova instância: ${instanceName}`)
    console.log('N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL)

    // 1. Criar instância na Evolution API
    const createInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }),
    })

    if (!createInstanceResponse.ok) {
      const errorData = await createInstanceResponse.text()
      console.error('Erro ao criar instância:', errorData)
      return NextResponse.json(
        { error: 'Erro ao criar instância do WhatsApp' },
        { status: 500 }
      )
    }

    const instanceData = await createInstanceResponse.json()
    console.log('Instância criada:', instanceData)

    // 🎯 NOVA FUNCIONALIDADE: Capturar e salvar API Key da instância
    // A Evolution API retorna a API Key diretamente em "hash" (string)
    const instanceApiKey = instanceData.hash
    console.log('API Key da instância capturada:', instanceApiKey)

    if (!instanceApiKey) {
      console.error('API Key não foi retornada pela Evolution API')
      return NextResponse.json(
        { error: 'Erro: API Key da instância não foi gerada' },
        { status: 500 }
      )
    }

    // 🎯 SALVAR API Key no Supabase
    try {
      const { data: existingConnection, error: checkError } = await supabase
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingConnection) {
        // Atualizar conexão existente
        const { error: updateError } = await supabase
          .from('whatsapp_connections')
          .update({
            api_credentials: instanceApiKey,
            waba_id: instanceName,
            status: 'connecting',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Erro ao atualizar API Key no Supabase:', updateError)
        } else {
          console.log('API Key atualizada no Supabase com sucesso')
        }
      } else {
        // Criar nova conexão
        const { error: insertError } = await supabase
          .from('whatsapp_connections')
          .insert({
            user_id: userId,
            instance_name: instanceName,  // ✅ CAMPO OBRIGATÓRIO ADICIONADO
            api_credentials: instanceApiKey,
            waba_id: instanceName,
            status: 'connecting',
            is_connected: false
          })

        if (insertError) {
          console.error('Erro ao salvar API Key no Supabase:', insertError)
        } else {
          console.log('API Key salva no Supabase com sucesso')
        }
      }
    } catch (supabaseError) {
      console.error('Erro geral do Supabase:', supabaseError)
    }

    // 2. Conectar e gerar QR Code
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text()
      console.error('Erro ao conectar:', errorData)
      return NextResponse.json(
        { error: 'Erro ao iniciar conexão WhatsApp' },
        { status: 500 }
      )
    }

    const connectData = await connectResponse.json()
    
    console.log('Dados recebidos da Evolution:', JSON.stringify(connectData, null, 2))

    // Buscar QR code de diferentes formas possíveis
    let qrCode = null
    
    // Tentar várias formas de acessar o QR Code
    if (connectData.qrcode?.base64) {
      qrCode = connectData.qrcode.base64
      console.log('QR Code encontrado em: connectData.qrcode.base64')
    } else if (connectData.qrcode) {
      qrCode = connectData.qrcode
      console.log('QR Code encontrado em: connectData.qrcode')
    } else if (connectData.qr) {
      qrCode = connectData.qr
      console.log('QR Code encontrado em: connectData.qr')
    } else if (connectData.base64) {
      qrCode = connectData.base64
      console.log('QR Code encontrado em: connectData.base64')
    }

    console.log('QR Code final:', qrCode ? 'ENCONTRADO' : 'NÃO ENCONTRADO')
    console.log('Primeiro caractere do QR:', qrCode ? qrCode.substring(0, 50) : 'N/A')

    return NextResponse.json({
      success: true,
      instanceName,
      instanceApiKey, // 🎯 RETORNANDO API KEY PARA DEBUG
      qrCode: qrCode,
      message: qrCode ? 'QR Code gerado com sucesso' : 'Instância criada, mas QR Code não disponível',
      debug: {
        hasQrcode: !!connectData.qrcode,
        hasQrcodeBase64: !!connectData.qrcode?.base64,
        hasQr: !!connectData.qr,
        keys: Object.keys(connectData),
        apiKeySaved: !!instanceApiKey
      }
    })

  } catch (error) {
    console.error('Erro na API generate-qr:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}