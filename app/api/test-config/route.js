import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    evolution_url: process.env.EVOLUTION_API_URL || 'NÃO DEFINIDO',
    evolution_key: process.env.EVOLUTION_API_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO',
    nextauth_url: process.env.NEXTAUTH_URL || 'NÃO DEFINIDO',
  })
}