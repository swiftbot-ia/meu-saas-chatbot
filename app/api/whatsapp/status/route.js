// app/api/whatsapp/status/route.js
// ============================================================================
// ROTA: Verificar Status de uma Conexão WhatsApp (UAZAPI)
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server.js'

// Configurações da UAZAPI
const UAZAPI_URL = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'

// ============================================================================
// POST: Verificar status de uma conexão específica
// ============================================================================
// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { connectionId, userId } = await request.json()

    // Aceitar tanto connectionId quanto userId (para compatibilidade com frontend antigo)
    if (!connectionId && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId ou userId é obrigatório',
          connected: false,
          status: 'disconnected'
        },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 1. BUSCAR CONEXÃO NO SUPABASE
    // ========================================================================
    let query = supabaseAdmin.from('whatsapp_connections').select('*')

    if (connectionId) {
      query = query.eq('id', connectionId)
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
    }

    const { data: connections, error: fetchError } = await query

    if (fetchError || !connections || connections.length === 0) {
      return NextResponse.json({
        success: false,
        connected: false,
        status: 'disconnected',
        message: 'Conexão não encontrada'
      })
    }

    const connection = Array.isArray(connections) ? connections[0] : connections

    // ========================================================================
    // 2. VERIFICAR STATUS NA UAZAPI (se tiver token)
    // ========================================================================
    if (connection.instance_token) {
      try {
        const statusRes = await fetch(`${UAZAPI_URL}/instance/status`, {
          method: 'GET',
          headers: {
            'token': connection.instance_token,
            'Content-Type': 'application/json'
          }
        })

        if (statusRes.ok) {
          const uazapiData = await statusRes.json()
          const instanceStatus = uazapiData?.instance?.status || 'disconnected'
          const isConnected = instanceStatus === 'open' || instanceStatus === 'connected'

          // Preparar dados para actualização
          const updateData = {
            status: isConnected ? 'connected' : 'disconnected',
            is_connected: isConnected,
            updated_at: new Date().toISOString()
          }

          // Se conectado, guardar dados de perfil da UAZAPI
          if (isConnected && uazapiData?.instance) {
            const instance = uazapiData.instance

            if (instance.profileName) {
              updateData.profile_name = instance.profileName
            }
            if (instance.profilePicUrl) {
              updateData.profile_pic_url = instance.profilePicUrl
            }
            if (instance.owner) {
              // Limpar o número (remover @s.whatsapp.net se existir)
              updateData.phone_number = instance.owner.replace('@s.whatsapp.net', '')
            }

            console.log('👤 [Status] Perfil actualizado:', {
              name: updateData.profile_name,
              phone: updateData.phone_number
            })
          }

          // Atualizar Supabase com status real e dados de perfil
          await supabaseAdmin
            .from('whatsapp_connections')
            .update(updateData)
            .eq('id', connection.id)

          return NextResponse.json({
            success: true,
            connected: isConnected,
            status: instanceStatus,
            instanceName: connection.instance_name,
            profileName: uazapiData?.instance?.profileName || connection.profile_name,
            profilePicUrl: uazapiData?.instance?.profilePicUrl || connection.profile_pic_url,
            phoneNumber: uazapiData?.instance?.owner?.replace('@s.whatsapp.net', '') || connection.phone_number,
            message: 'Status verificado com sucesso'
          })
        }
      } catch (error) {
        console.error('❌ [Status] Erro ao verificar UAZAPI:', error.message)
      }
    }

    // ========================================================================
    // 3. RETORNAR STATUS DO SUPABASE (se UAZAPI falhou)
    // ========================================================================
    return NextResponse.json({
      success: true,
      connected: connection.is_connected || false,
      status: connection.status || 'disconnected',
      instanceName: connection.instance_name,
      profileName: connection.profile_name,
      phoneNumber: connection.phone_number,
      message: 'Status do banco de dados'
    })

  } catch (error) {
    console.error('❌ [Status] Erro interno:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      status: 'error',
      message: 'Erro ao verificar status: ' + error.message
    })
  }
}
