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
    // 4. ✅ VALIDAÇÃO PASSOU - PROSSEGUIR COM CONEXÃO
    // ============================================================================
    const instanceName = `swiftbot_${userId.replace(/-/g, '_')}`

    console.log(`✅ Iniciando conexão para instância: ${instanceName}`)

    // Verificar se instância já existe
    let instanceExists = false
    try {
      const checkResponse = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
        {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY }
        }
      )
      instanceExists = checkResponse.ok
    } catch (error) {
      console.log('Instância não existe ainda')
    }

    // Se instância existe, deletar para criar nova
    if (instanceExists) {
      console.log('Deletando instância existente...')
      await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Criar nova instância
    console.log('Criando nova instância...')
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Erro ao criar instância:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar instância do WhatsApp'
      }, { status: 500 })
    }

    const instanceData = await createResponse.json()
    const instanceApiKey = instanceData.hash

    if (!instanceApiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key da instância não foi gerada'
      }, { status: 500 })
    }

    // Salvar API Key no banco
    await supabase
      .from('whatsapp_connections')
      .update({
        api_credentials: instanceApiKey,
        waba_id: instanceName,
        status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    // Conectar e gerar QR Code
    console.log('Gerando QR Code...')
    const connectResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      }
    )

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text()
      console.error('Erro ao conectar:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erro ao iniciar conexão WhatsApp'
      }, { status: 500 })
    }

    const connectData = await connectResponse.json()

    // Extrair QR Code
    let qrCode = null
    if (connectData.qrcode?.base64) {
      qrCode = connectData.qrcode.base64
    } else if (connectData.qrcode) {
      qrCode = connectData.qrcode
    } else if (connectData.qr) {
      qrCode = connectData.qr
    } else if (connectData.base64) {
      qrCode = connectData.base64
    }

    console.log('✅ QR Code gerado:', qrCode ? 'SIM' : 'NÃO')

    return NextResponse.json({
      success: true,
      instanceName,
      instanceApiKey,
      qrCode: qrCode,
      message: qrCode 
        ? 'QR Code gerado com sucesso' 
        : 'Instância criada, mas QR Code não disponível'
    })

  } catch (error) {
    console.error('❌ Erro na API connect:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}