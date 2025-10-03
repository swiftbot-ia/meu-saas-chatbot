import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    evolution_url: process.env.EVOLUTION_API_URL || 'NÃO DEFINIDO',
    evolution_key: process.env.EVOLUTION_API_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO',
    nextauth_url: process.env.NEXTAUTH_URL || 'NÃO DEFINIDO',
  })
}