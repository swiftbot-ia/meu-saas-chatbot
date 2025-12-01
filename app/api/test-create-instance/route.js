import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET() {
  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
  
  const testInstanceName = 'test_instance_' + Date.now()

  try {
    console.log('Testando criação de instância:', testInstanceName)

    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: testInstanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS", // Campo obrigatório!
      }),
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response body:', responseText)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText,
      instanceName: testInstanceName,
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}