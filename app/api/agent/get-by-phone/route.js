import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Buscando agente para número:', phoneNumber)

    // 1. Buscar user_id através do número na tabela whatsapp_connections
    // 🎯 ADICIONANDO api_credentials e waba_id na consulta
    const { data: connectionData, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('user_id, phone_number_id, api_credentials, waba_id')
      .eq('phone_number_id', phoneNumber)
      .single()

    if (connectionError || !connectionData) {
      console.log('Conexão não encontrada:', connectionError)
      return NextResponse.json({
        success: false,
        error: 'Número WhatsApp não está registrado na plataforma',
        phoneNumber: phoneNumber
      }, { status: 404 })
    }

    console.log('Conexão encontrada:', connectionData)

    // 🎯 VERIFICAR SE API KEY EXISTE
    if (!connectionData.api_credentials) {
      console.log('API Key não encontrada para este usuário')
      return NextResponse.json({
        success: false,
        error: 'API Key da instância não está configurada. Reconecte o WhatsApp.',
        phoneNumber: phoneNumber,
        userId: connectionData.user_id
      }, { status: 400 })
    }

    // 2. Buscar configuração do agente com o user_id encontrado
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', connectionData.user_id)
      .single()

    if (agentError || !agentData) {
      console.log('Agente não encontrado:', agentError)
      return NextResponse.json({
        success: false,
        error: 'Agente não configurado para este usuário',
        userId: connectionData.user_id,
        phoneNumber: phoneNumber
      }, { status: 404 })
    }

    console.log('Agente encontrado:', agentData.company_name)

    // 3. Retornar dados completos para o N8N
    return NextResponse.json({
      success: true,
      phoneNumber: phoneNumber,
      userId: connectionData.user_id,
      
      // 🎯 ADICIONANDO DADOS DE CONEXÃO EVOLUTION
      evolution: {
        instanceName: connectionData.waba_id,
        apiKey: connectionData.api_credentials,
        baseUrl: process.env.EVOLUTION_API_URL || 'https://evolution.swiftbot.com.br'
      },
      
      agent: {
        // Informações básicas
        company_name: agentData.company_name || 'Assistente Virtual',
        business_sector: agentData.business_sector || 'Geral',
        personality: agentData.personality || 'amigavel',
        bot_objective: agentData.bot_objective || 'suporte',
        
        // Mensagens
        welcome_message: agentData.welcome_message || `Olá! Sou o assistente virtual. Como posso ajudá-lo?`,
        default_response: agentData.default_response || 'Desculpe, não entendi. Pode reformular?',
        
        // Produto/Serviço
        product_description: agentData.product_description || '',
        product_url: agentData.product_url || '',
        price_range: agentData.price_range || '',
        objections_qa: agentData.objections_qa || [], // 🎯 NOVO: Sistema de objeções estruturadas
        
        // Horários
        business_hours: agentData.business_hours || '24h',
        start_time: agentData.start_time || '08:00',
        end_time: agentData.end_time || '18:00',
        off_hours_message: agentData.off_hours_message || '',
        
        // Instruções comportamentais
        behavior_instructions: agentData.behavior_instructions || '',
        
        // Status
        is_active: agentData.is_active || false
      }
    })

  } catch (error) {
    console.error('Erro na API get-by-phone:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// Método GET para testes
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const phoneNumber = searchParams.get('phone')
  
  if (!phoneNumber) {
    return NextResponse.json({
      success: false,
      message: 'Use: /api/agent/get-by-phone?phone=5511999999999',
      example: 'Substitua pelo número com código do país'
    })
  }
  
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  }))
}