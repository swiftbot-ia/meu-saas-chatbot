// /app/api/whatsapp/disconnect/route.js
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase' // ✅ CORREÇÃO: Caminho correto

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    console.log('🚨 Desconectando WhatsApp por falha no pagamento:', { userId })

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID obrigatório'
      }, { status: 400 })
    }

    // 1. ✅ BUSCAR CONEXÃO WHATSAPP DO USUÁRIO
    const { data: whatsappConnection, error: fetchError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar conexão WhatsApp:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar conexão WhatsApp'
      }, { status: 500 })
    }

    if (!whatsappConnection) {
      console.log('⚠️ Nenhuma conexão WhatsApp encontrada para o usuário')
      return NextResponse.json({
        success: true,
        message: 'Nenhuma conexão WhatsApp para desconectar'
      })
    }

    // 2. ✅ DESCONECTAR NA EVOLUTION API
    if (whatsappConnection.instance_name && whatsappConnection.evolution_api_key) {
      try {
        const evolutionResponse = await fetch(`https://evolution.swiftbot.com.br/instance/logout/${whatsappConnection.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': whatsappConnection.evolution_api_key,
            'Content-Type': 'application/json'
          }
        })

        if (evolutionResponse.ok) {
          console.log('✅ WhatsApp desconectado na Evolution API')
        } else {
          console.warn('⚠️ Erro ao desconectar na Evolution API:', evolutionResponse.status)
        }
      } catch (evolutionError) {
        console.warn('⚠️ Erro na Evolution API:', evolutionError)
        // Continua mesmo com erro na Evolution API
      }
    }

    // 3. ✅ REMOVER CONEXÃO DO BANCO LOCAL
    const { error: deleteError } = await supabase
      .from('whatsapp_connections')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Erro ao remover conexão do banco:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao remover conexão WhatsApp'
      }, { status: 500 })
    }

    // 4. ✅ LOG DA DESCONEXÃO
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        user_id: userId,
        subscription_id: null,
        event_type: 'whatsapp_disconnected_failed_payment',
        amount: 0,
        payment_method: null,
        pagarme_transaction_id: null,
        status: 'disconnected',
        metadata: {
          reason: 'failed_payment',
          instance_name: whatsappConnection.instance_name,
          disconnected_by: 'system',
          disconnected_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.warn('⚠️ Erro ao criar log de desconexão:', logError)
    }

    console.log('✅ WhatsApp desconectado por falha no pagamento')

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado devido à falha no pagamento'
    })

  } catch (error) {
    console.error('❌ Erro geral ao desconectar WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    }, { status: 500 })
  }
}