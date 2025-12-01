import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint funcionando!',
    timestamp: new Date().toISOString(),
    url: process.env.WEBHOOK_URL
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST recebido com sucesso!',
    timestamp: new Date().toISOString()
  })
}