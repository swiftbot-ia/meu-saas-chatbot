// app/api/whatsapp/disconnect-user/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { uazapi } from '../../../../lib/uazapi-client'

/**
 * POST /api/whatsapp/disconnect-user
 *
 * Desconecta uma instância WhatsApp do usuário:
 * - Desconecta na Uazapi (exclui a instância)
 * - Atualiza o registro no Supabase (marca como desconectado)
 * - NÃO deleta o registro do Supabase
 *
 * Body: { connectionId: string }
 */
export async function POST(request) {
  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔌 Desconectando instância:', connectionId)

    // 1. Buscar conexão no Supabase
    const { data: connection, error: fetchError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      console.error('❌ Conexão não encontrada:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Conexão não encontrada' },
        { status: 404 }
      )
    }

    // 2. Desconectar na Uazapi (se tiver token)
    if (connection.instance_token) {
      try {
        console.log('📡 Desconectando instância na Uazapi...')
        await uazapi.disconnectInstance(connection.instance_token)
        console.log('✅ Instância desconectada na Uazapi')
      } catch (uazapiError) {
        console.error('⚠️ Erro ao desconectar na Uazapi:', uazapiError.message)
        // Continua mesmo com erro na Uazapi
      }
    }

    // 3. Atualizar status no Supabase (NÃO deleta o registro)
    const { error: updateError } = await supabase
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        is_connected: false,
        profile_name: null,
        profile_pic_url: null,
        phone_number: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (updateError) {
      console.error('❌ Erro ao atualizar conexão:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar conexão no banco de dados' },
        { status: 500 }
      )
    }

    console.log('✅ Conexão desconectada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
      connection: {
        id: connection.id,
        instance_name: connection.instance_name,
        status: 'disconnected'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao desconectar instância:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}
