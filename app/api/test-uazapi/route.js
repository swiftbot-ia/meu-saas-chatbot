import { NextResponse } from 'next/server'

export async function GET() {
  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

  console.log('Testing Evolution API connection...')
  console.log('URL:', EVOLUTION_API_URL)
  console.log('Key:', EVOLUTION_API_KEY ? 'PROVIDED' : 'MISSING')

  try {
    // Teste simples - listar instâncias
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Error response:', errorText)
      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorText,
        url: EVOLUTION_API_URL,
      })
    }

    const data = await response.json()
    console.log('Success response:', data)

    return NextResponse.json({
      success: true,
      status: response.status,
      data: data,
      url: EVOLUTION_API_URL,
    })

  } catch (error) {
    console.error('Connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      url: EVOLUTION_API_URL,
    })
  }
}