import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Buscar o primeiro agente configurado
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum agente configurado encontrado. Configure um agente primeiro!',
        error: error?.message
      })
    }

    // Simular o que o N8N vai receber
    const agentConfig = {
      company_name: data.company_name,
      business_sector: data.business_sector,
      personality: data.personality,
      bot_objective: data.bot_objective,
      welcome_message: data.welcome_message,
      default_response: data.default_response,
      product_description: data.product_description,
      behavior_instructions: data.behavior_instructions,
      business_hours: data.business_hours
    }

    // Simular como ficaria o XML dinâmico
    const xmlPreview = `
<Agente>
    <Nome>${agentConfig.company_name} Assistant</Nome>
    <Personalidade>${agentConfig.personality}</Personalidade>
    <Empresa>${agentConfig.company_name}</Empresa>
    <Setor>${agentConfig.business_sector}</Setor>
</Agente>
<FluxoDeAtendimento>
    <Etapa>
        <Nome>Saudação Inicial</Nome>
        <Mensagem>${agentConfig.welcome_message}</Mensagem>
    </Etapa>
</FluxoDeAtendimento>
<RespostaPadrao>
    <MensagemNaoEntendi>${agentConfig.default_response}</MensagemNaoEntendi>
</RespostaPadrao>
    `.trim()

    return NextResponse.json({
      success: true,
      message: '✅ Agente encontrado! Dados prontos para o N8N.',
      agentConfig,
      xmlPreview,
      instructions: {
        n8n_setup: [
          "1. No N8N, crie um node 'Supabase' após receber webhook",
          "2. Configure: Table = 'ai_agents', Operation = 'Select'", 
          "3. Filter: user_id = {{ $json.user_id }}",
          "4. Use os dados retornados no prompt da IA",
          "5. Substitua valores fixos pelas variáveis: {{ $json.company_name }}"
        ],
        webhook_url: process.env.N8N_WEBHOOK_URL || "Configure N8N_WEBHOOK_URL no .env.local"
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar configuração do agente',
      error: error.message
    })
  }
}