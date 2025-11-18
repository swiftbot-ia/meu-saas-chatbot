import { NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    const instanceName = `swiftbot_${userId.replace(/-/g, '_')}`

    console.log(`Deletando instância: ${instanceName}`)

    // Deletar instância
    const deleteResponse = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text()
      console.log('Erro ao deletar instância:', errorData)
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar instância'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Instância deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro na API delete-instance:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}