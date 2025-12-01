import { NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { instanceName } = await request.json()
    
    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name é obrigatório' },
        { status: 400 }
      )
    }

    if (!process.env.N8N_WEBHOOK_URL) {
      return NextResponse.json({
        success: false,
        message: 'N8N_WEBHOOK_URL não configurado'
      })
    }

    console.log(`Configurando webhook para instância: ${instanceName}`)

    // Configurar webhook na instância
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        webhook: {
          url: process.env.N8N_WEBHOOK_URL,
          enabled: true,
          webhookByEvents: false,
          events: [
            "MESSAGES_UPSERT",
            "CONNECTION_UPDATE"
          ]
        }
      }),
    })

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text()
      console.error('Erro ao configurar webhook:', errorData)
      return NextResponse.json({
        success: false,
        error: 'Erro ao configurar webhook',
        details: errorData
      })
    }

    const webhookData = await webhookResponse.json()
    console.log('Webhook configurado com sucesso:', webhookData)

    return NextResponse.json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhook: webhookData
    })

  } catch (error) {
    console.error('Erro na API set-webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}