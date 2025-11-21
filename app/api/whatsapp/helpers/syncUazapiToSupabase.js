// app/api/whatsapp/helpers/syncUazapiToSupabase.js
// ============================================================================
// FUNÇÃO: Sincronizar Dados UAZAPI → Supabase
// ============================================================================

import { supabaseAdmin } from '../../../../lib/supabase/server.js'

/**
 * Sincroniza os dados da instância UAZAPI com o Supabase
 *
 * @param {string} connectionId - ID da conexão no Supabase
 * @param {object} instanceData - Dados da instância retornados pela UAZAPI
 * @param {object} options - Opções adicionais
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncUazapiToSupabase(connectionId, instanceData, options = {}) {
  try {
    if (!supabaseAdmin) {
      throw new Error('supabaseAdmin não está configurado')
    }

    console.log('🔄 [Sync] Sincronizando dados UAZAPI → Supabase:', {
      connectionId,
      instanceStatus: instanceData?.instance?.status,
      hasProfileData: !!instanceData?.instance?.profileName
    })

    // ========================================================================
    // 1. EXTRAIR DADOS DA UAZAPI
    // ========================================================================
    const instance = instanceData?.instance || {}
    const connectionStatus = instance.status || 'connecting'

    // Extrair token (pode vir em formato JSON)
    let instanceToken = instance.token || null
    if (instanceToken && typeof instanceToken === 'string') {
      try {
        const parsed = JSON.parse(instanceToken)
        instanceToken = parsed.token || instanceToken
      } catch {
        // Se não for JSON, usar o valor direto
      }
    }

    // Dados do perfil
    const profileName = instance.profileName || instance.profile_name || null
    const profilePicUrl = instance.profilePicUrl || instance.profile_pic_url || null
    const phoneNumber = instance.phoneNumber || instance.phone_number || null

    // Determinar status no formato Supabase
    let supabaseStatus = 'connecting'
    let isConnected = false

    if (connectionStatus === 'open' || connectionStatus === 'connected') {
      supabaseStatus = 'connected'
      isConnected = true
    } else if (connectionStatus === 'close' || connectionStatus === 'disconnected') {
      supabaseStatus = 'disconnected'
      isConnected = false
    } else if (connectionStatus === 'connecting') {
      supabaseStatus = 'connecting'
      isConnected = false
    }

    // ========================================================================
    // 2. PREPARAR DADOS PARA UPDATE
    // ========================================================================
    const updateData = {
      status: supabaseStatus,
      is_connected: isConnected,
      updated_at: new Date().toISOString()
    }

    // Adicionar token se existir
    if (instanceToken) {
      updateData.instance_token = instanceToken
    }

    // Adicionar dados do perfil se existirem
    if (profileName) {
      updateData.profile_name = profileName
    }
    if (profilePicUrl) {
      updateData.profile_pic_url = profilePicUrl
    }
    if (phoneNumber) {
      updateData.phone_number = phoneNumber
    }

    // Atualizar last_connected_at se conectado
    if (isConnected) {
      updateData.last_connected_at = new Date().toISOString()
    }

    // ========================================================================
    // 3. ATUALIZAR NO SUPABASE
    // ========================================================================
    console.log('💾 [Sync] Atualizando Supabase com dados:', updateData)

    const { data, error } = await supabaseAdmin
      .from('whatsapp_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single()

    if (error) {
      console.error('❌ [Sync] Erro ao atualizar Supabase:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ [Sync] Sincronização concluída com sucesso:', {
      connectionId,
      status: supabaseStatus,
      isConnected,
      hasProfileData: !!profileName
    })

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('❌ [Sync] Erro na sincronização:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Busca os dados da instância na UAZAPI e sincroniza com Supabase
 *
 * @param {string} connectionId - ID da conexão no Supabase
 * @param {string} instanceName - Nome da instância na UAZAPI
 * @param {string} apiToken - Token da API UAZAPI
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export async function fetchAndSyncInstance(connectionId, instanceName, apiToken) {
  try {
    const UAZAPI_URL = process.env.UAZAPI_BASE_URL || 'https://api.uazapi.com'

    console.log('🔍 [Sync] Buscando dados da instância na UAZAPI:', instanceName)

    // Fazer requisição para buscar status da instância
    const response = await fetch(`${UAZAPI_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apitoken': apiToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Sync] Erro ao buscar instância da UAZAPI:', errorText)
      return {
        success: false,
        error: `Erro ao buscar dados da UAZAPI: ${response.status}`
      }
    }

    const instanceData = await response.json()
    console.log('📥 [Sync] Dados recebidos da UAZAPI:', instanceData)

    // Sincronizar com Supabase
    const syncResult = await syncUazapiToSupabase(connectionId, instanceData)

    if (!syncResult.success) {
      return syncResult
    }

    return {
      success: true,
      status: syncResult.data?.status,
      isConnected: syncResult.data?.is_connected,
      data: syncResult.data
    }

  } catch (error) {
    console.error('❌ [Sync] Erro em fetchAndSyncInstance:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Extrai dados formatados da resposta UAZAPI para uso no frontend
 *
 * @param {object} uazapiData - Resposta da UAZAPI
 * @returns {object} Dados formatados
 */
export function extractInstanceData(uazapiData) {
  if (!uazapiData) {
    return {
      status: 'disconnected',
      connected: false,
      qrCode: null,
      profileName: null,
      profilePicUrl: null,
      phoneNumber: null
    }
  }

  const instance = uazapiData?.instance || {}
  const connectionStatus = instance.status || 'connecting'

  // Determinar status
  let status = 'connecting'
  let connected = false

  if (connectionStatus === 'open' || connectionStatus === 'connected') {
    status = 'connected'
    connected = true
  } else if (connectionStatus === 'close' || connectionStatus === 'disconnected') {
    status = 'disconnected'
    connected = false
  } else if (connectionStatus === 'connecting') {
    status = 'connecting'
    connected = false
  }

  // Extrair QR Code
  const qrCode = instance.qrcode || instance.qr || null

  // Extrair dados do perfil
  const profileName = instance.profileName || instance.profile_name || null
  const profilePicUrl = instance.profilePicUrl || instance.profile_pic_url || null
  const phoneNumber = instance.phoneNumber || instance.phone_number || instance.owner || null

  return {
    status,
    connected,
    qrCode,
    profileName,
    profilePicUrl,
    phoneNumber
  }
}
