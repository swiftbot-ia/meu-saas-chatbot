import { NextResponse } from 'next/server'

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