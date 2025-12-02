import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { userId, phoneNumber } = await request.json()
    
    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: 'userId e phoneNumber são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Salvando número:', phoneNumber, 'para usuário:', userId)

    // Salvar número no Supabase
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .upsert({
        user_id: userId,
        phone_number_id: phoneNumber, // Campo correto
        status: 'connected',
        is_connected: true
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Erro ao salvar:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar número: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Número salvo com sucesso',
      data: data
    })

  } catch (error) {
    console.error('Erro na API save-phone:', error)
    return NextResponse.json(
      { error: 'Erro interno: ' + error.message },
      { status: 500 }
    )
  }
}