// app/api/whatsapp/disconnect-user/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { uazapi } from '../../../../lib/uazapi-client'

/**
 * POST /api/whatsapp/disconnect-user
 *
 * Desconecta uma instância WhatsApp do usuário:
 * - Deleta a instância na Uazapi (usando DELETE /instance/delete/{instanceName})
 * - Limpa instance_name, instance_token e perfil no Supabase
 * - Marca como 'disconnected' mas NÃO deleta o registro
 * - Permite reconectar posteriormente (nova instância será criada)
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

    // 2. Desconectar e deletar instância na Uazapi
    if (connection.instance_name && connection.instance_token) {
      try {
        // Passo 1: Desconectar (POST /instance/disconnect)
        console.log('📡 [Disconnect] Desconectando instância:', connection.instance_name)
        await uazapi.disconnectInstance(connection.instance_token)
        console.log('✅ [Disconnect] Instância desconectada')

        // Passo 2: Aguardar 1 segundo
        console.log('⏳ [Disconnect] Aguardando 1 segundo...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Passo 3: Deletar (DELETE /instance/delete/{instanceName})
        console.log('🗑️ [Disconnect] Deletando instância:', connection.instance_name)
        await uazapi.deleteInstance(connection.instance_name)
        console.log('✅ [Disconnect] Instância deletada')

      } catch (uazapiError) {
        console.error('⚠️ [Disconnect] Erro:', uazapiError.message)
        // Continua mesmo com erro na Uazapi
      }
    }

    // 3. Limpar dados no Supabase (NÃO deleta o registro)
    const { error: updateError } = await supabase
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        is_connected: false,
        instance_name: null,        // Limpar instance_name
        instance_token: null,        // Limpar instance_token
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
