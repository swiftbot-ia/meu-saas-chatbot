import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { userId, phoneNumber } = await request.json()
    
    if (!userId && !phoneNumber) {
      return NextResponse.json(
        { error: 'User ID ou Phone Number é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('ai_agents')
      .select('*')

    // Se tiver userId, buscar por ele, senão buscar por phoneNumber via whatsapp_connections
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      // Buscar user_id através do phoneNumber na tabela whatsapp_connections
      const { data: connectionData } = await supabase
        .from('whatsapp_connections')
        .select('user_id')
        .eq('phone_number', phoneNumber)
        .single()
      
      if (!connectionData) {
        return NextResponse.json(
          { error: 'Conexão WhatsApp não encontrada' },
          { status: 404 }
        )
      }
      
      query = query.eq('user_id', connectionData.user_id)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Configuração do agente não encontrada' },
        { status: 404 }
      )
    }

    // Retornar dados formatados para o N8N
    return NextResponse.json({
      success: true,
      agent: {
        // Informações básicas
        company_name: data.company_name || 'Empresa',
        business_sector: data.business_sector || 'Geral',
        personality: data.personality || 'amigavel',
        bot_objective: data.bot_objective || 'suporte',
        
        // Mensagens
        welcome_message: data.welcome_message || `Olá! Sou o assistente virtual. Como posso ajudá-lo?`,
        default_response: data.default_response || 'Desculpe, não entendi. Pode reformular?',
        
        // Produto/Serviço
        product_description: data.product_description || '',
        product_url: data.product_url || '',
        price_range: data.price_range || '',
        objection_handling: data.objection_handling || '',
        
        // Horários
        business_hours: data.business_hours || '24h',
        start_time: data.start_time || '08:00',
        end_time: data.end_time || '18:00',
        off_hours_message: data.off_hours_message || '',
        
        // Instruções comportamentais
        behavior_instructions: data.behavior_instructions || '',
        
        // Status
        is_active: data.is_active || false,
        
        // Timestamps
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    })

  } catch (error) {
    console.error('Erro na API get-config:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET method para teste direto na URL
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const phoneNumber = searchParams.get('phoneNumber')
  
  // Reutilizar a lógica do POST
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, phoneNumber })
  }))
}