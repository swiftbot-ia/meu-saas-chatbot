// app/api/whatsapp/helpers/updateSupabaseConnection.js

import { supabase } from '../../../../lib/supabase'

/**
 * ============================================================================
 * FUNÇÃO DE PERSISTÊNCIA: updateSupabaseConnection
 * ============================================================================
 *
 * Atualiza a tabela whatsapp_connections com os dados da UAZAPI
 *
 * @param {string} connectionId - ID da conexão no Supabase
 * @param {Object} instanceData - Dados da instância retornados pela UAZAPI
 * @param {string} instanceToken - Token da instância UAZAPI
 * @returns {Promise<Object>} - Resultado da operação
 *
 * @example
 * const result = await updateSupabaseConnection(
 *   'uuid-connection-id',
 *   {
 *     status: 'open',
 *     profileName: 'João Silva',
 *     profilePicUrl: 'https://...',
 *     owner: '5511999999999'
 *   },
 *   'token-from-uazapi'
 * )
 */
export async function updateSupabaseConnection(
  connectionId,
  instanceData,
  instanceToken = null
) {
  try {
    console.log('💾 Atualizando Supabase:', { connectionId, hasToken: !!instanceToken })

    // ============================================================================
    // 1. PREPARAR DADOS PARA ATUALIZAÇÃO
    // ============================================================================

    // Extrair informações da UAZAPI
    const instanceInfo = instanceData.instance || instanceData || {}
    const instanceStatus = instanceInfo.status || instanceData.status || 'connecting'

    // Objeto de atualização base
    const updateData = {
      updated_at: new Date().toISOString()
    }

    // ============================================================================
    // 2. ATUALIZAR STATUS E CONEXÃO
    // ============================================================================

    // Status mapeado para o banco
    if (instanceStatus === 'open') {
      updateData.status = 'connected'
      updateData.is_connected = true
      updateData.last_connected_at = new Date().toISOString()
    } else if (instanceStatus === 'connecting' || instanceStatus === 'close') {
      updateData.status = 'connecting'
      updateData.is_connected = false
    } else {
      updateData.status = instanceStatus
      updateData.is_connected = instanceStatus === 'connected'
    }

    // ============================================================================
    // 3. SALVAR TOKEN (se fornecido)
    // ============================================================================

    if (instanceToken) {
      updateData.instance_token = instanceToken
      console.log('✅ Token incluído na atualização')
    }

    // ============================================================================
    // 4. SALVAR DADOS COMPLETOS EM api_credentials (JSON)
    // ============================================================================

    // Criar objeto JSON com todas as informações da UAZAPI
    const credentialsData = {
      token: instanceToken,
      status: instanceStatus,
      lastUpdated: new Date().toISOString()
    }

    // Adicionar dados de perfil se disponíveis
    if (instanceInfo.profileName) {
      credentialsData.profileName = instanceInfo.profileName
      credentialsData.profilePicUrl = instanceInfo.profilePicUrl || null
      credentialsData.owner = instanceInfo.owner || null
    }

    // Adicionar QR Code se disponível (temporário)
    if (instanceInfo.qrcode) {
      credentialsData.qrcode = instanceInfo.qrcode
      credentialsData.qrcodeGeneratedAt = new Date().toISOString()
    }

    // Salvar como JSON string
    updateData.api_credentials = JSON.stringify(credentialsData)

    console.log('📦 JSON preparado para api_credentials:', Object.keys(credentialsData))

    // ============================================================================
    // 5. SALVAR DADOS DE PERFIL EM COLUNAS ESPECÍFICAS
    // ============================================================================

    // Se a instância está conectada, salvar dados de perfil
    if (instanceStatus === 'open' && instanceInfo.profileName) {
      updateData.profile_name = instanceInfo.profileName
      updateData.profile_pic_url = instanceInfo.profilePicUrl || null
      // Limpar o número (remover @s.whatsapp.net se existir)
      updateData.phone_number = instanceInfo.owner ? instanceInfo.owner.replace('@s.whatsapp.net', '') : null

      console.log('👤 Perfil WhatsApp:', {
        name: instanceInfo.profileName,
        phone: updateData.phone_number
      })
    }

    // ============================================================================
    // 6. EXECUTAR UPDATE NO SUPABASE
    // ============================================================================

    const { data, error } = await supabase
      .from('whatsapp_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar Supabase:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ Supabase atualizado com sucesso:', {
      connectionId,
      status: updateData.status,
      is_connected: updateData.is_connected,
      has_profile: !!updateData.profile_name
    })

    return {
      success: true,
      data: data
    }

  } catch (error) {
    console.error('❌ Erro na função updateSupabaseConnection:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: extractTokenFromCredentials
 * ============================================================================
 *
 * Extrai o token do campo api_credentials (que é uma string JSON)
 *
 * @param {Object} connection - Registro da tabela whatsapp_connections
 * @returns {string|null} - Token extraído ou null
 *
 * @example
 * const token = extractTokenFromCredentials(existingConnection)
 */
export function extractTokenFromCredentials(connection) {
  if (!connection) return null

  // ✅ EXTRAIR TOKEN de api_credentials (JSON)
  if (connection.api_credentials) {
    try {
      const credentials = JSON.parse(connection.api_credentials)
      const token = credentials.token || credentials.instanceToken

      if (token) {
        console.log('✅ Token extraído de api_credentials (JSON)')
        return token
      }
    } catch (e) {
      console.log('⚠️ api_credentials não é JSON válido')
    }
  }

  // Fallback: usar instance_token diretamente
  if (connection.instance_token) {
    console.log('✅ Token extraído de instance_token (fallback)')
    return connection.instance_token
  }

  console.log('❌ Nenhum token encontrado')
  return null
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: findExistingInstanceByUserId
 * ============================================================================
 *
 * Busca instância existente para um user_id (verificação global)
 *
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} - Conexão encontrada ou null
 *
 * @example
 * const existing = await findExistingInstanceByUserId('user-uuid')
 */
export async function findExistingInstanceByUserId(userId) {
  console.log('🔍 Buscando instância existente para user_id:', userId)

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('user_id', userId)
    .not('instance_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('❌ Erro ao buscar instância:', error)
    return null
  }

  if (data && data.length > 0) {
    console.log('✅ Instância existente encontrada:', {
      id: data[0].id,
      instance_name: data[0].instance_name,
      status: data[0].status
    })
    return data[0]
  }

  console.log('🆕 Nenhuma instância encontrada para este usuário')
  return null
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: removeDuplicateConnection
 * ============================================================================
 *
 * Remove registro duplicado do Supabase
 *
 * @param {string} connectionId - ID da conexão duplicada
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function removeDuplicateConnection(connectionId) {
  console.log('🗑️ Removendo conexão duplicada:', connectionId)

  const { error } = await supabase
    .from('whatsapp_connections')
    .delete()
    .eq('id', connectionId)

  if (error) {
    console.error('❌ Erro ao remover duplicata:', error)
    return false
  }

  console.log('✅ Duplicata removida com sucesso')
  return true
}
