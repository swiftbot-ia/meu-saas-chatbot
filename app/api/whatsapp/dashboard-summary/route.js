// app/api/whatsapp/dashboard-summary/route.js
// ============================================================================
// ROTA: Dashboard Summary - Agregação de Dados
// ============================================================================

import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

/**
 * ============================================================================
 * GET: Obter Resumo do Dashboard
 * ============================================================================
 *
 * Retorna dados agregados para exibir no dashboard:
 * - Limite de conexões compradas (user_subscriptions.connections_purchased)
 * - Conexões ativas atuais (whatsapp_connections onde status != 'disconnected')
 * - Status principal de exibição
 *
 * Query params:
 * - userId: ID do usuário (obrigatório)
 *
 * Resposta:
 * {
 *   totalConnectionsPurchased: number,
 *   currentActiveConnections: number,
 *   displayStatus: 'Conectado' | 'Desconectado' | 'Conexão indefinida' | 'Aguardando QR',
 *   connections: Array<Connection>
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('📊 [Dashboard] Carregando resumo para user_id:', userId)

    // ========================================================================
    // 1. BUSCAR LIMITE DE CONEXÕES (connections_purchased)
    // ========================================================================
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('connections_purchased, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Limite padrão se não houver assinatura
    let totalConnectionsPurchased = 1

    if (subscription && !subError) {
      // Usar connections_purchased do plano
      totalConnectionsPurchased = subscription.connections_purchased || 1
      console.log('✅ Limite de conexões:', totalConnectionsPurchased)
      console.log('📋 Status da assinatura:', subscription.status)
    } else {
      console.warn('⚠️ Nenhuma assinatura encontrada, usando limite padrão: 1')
    }

    // ========================================================================
    // 2. BUSCAR TODAS AS CONEXÕES DO USUÁRIO
    // ========================================================================
    const { data: connections, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (connError) {
      console.error('❌ Erro ao buscar conexões:', connError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar conexões'
      }, { status: 500 })
    }

    console.log(`📊 Total de conexões no banco: ${connections?.length || 0}`)

    // ========================================================================
    // 3. CALCULAR CONEXÕES ATIVAS (X)
    // ========================================================================
    let currentActiveConnections = 0
    let hasDisconnected = false
    let hasPendingQR = false
    let hasConnected = false

    if (connections && connections.length > 0) {
      connections.forEach(conn => {
        // Contar como ativa se:
        // - Tem instance_token
        // - Status NÃO é 'disconnected'
        const hasToken = !!conn.instance_token
        const isNotDisconnected = conn.status !== 'disconnected'

        if (hasToken && isNotDisconnected) {
          currentActiveConnections++
        }

        // Rastrear estados para definir displayStatus
        if (conn.status === 'connected' || conn.status === 'open') {
          hasConnected = true
        } else if (conn.status === 'pending_qr' || conn.status === 'connecting') {
          hasPendingQR = true
        } else if (conn.status === 'disconnected') {
          hasDisconnected = true
        }
      })

      console.log('📊 Conexões ativas calculadas:', currentActiveConnections)
    }

    // ========================================================================
    // 4. DETERMINAR STATUS PRINCIPAL DE EXIBIÇÃO
    // ========================================================================
    let displayStatus = 'Conexão indefinida'

    if (hasConnected) {
      // Se pelo menos uma está conectada
      displayStatus = 'Conectado'
    } else if (hasPendingQR) {
      // Se não tem conectada mas tem aguardando QR
      displayStatus = 'Aguardando QR'
    } else if (hasDisconnected) {
      // Se não tem conectada nem aguardando QR, mas tem desconectada
      displayStatus = 'Desconectado'
    } else if (connections && connections.length === 0) {
      // Se não tem nenhuma conexão
      displayStatus = 'Conexão indefinida'
    }

    console.log('✅ Status principal:', displayStatus)

    // ========================================================================
    // 5. PREPARAR CONEXÕES PARA O FRONTEND
    // ========================================================================
    const connectionsFormatted = connections ? connections.map(conn => ({
      id: conn.id,
      instanceName: conn.instance_name,
      status: conn.status,
      isConnected: conn.is_connected,
      profileName: conn.profile_name,
      profilePicUrl: conn.profile_pic_url,
      phoneNumber: conn.phone_number,
      lastConnectedAt: conn.last_connected_at,
      createdAt: conn.created_at
    })) : []

    // ========================================================================
    // 6. RETORNAR RESPOSTA AGREGADA
    // ========================================================================
    return NextResponse.json({
      success: true,
      totalConnectionsPurchased,
      currentActiveConnections,
      displayStatus,
      connections: connectionsFormatted,
      canAddNew: currentActiveConnections < totalConnectionsPurchased,
      subscription: {
        status: subscription?.status || 'inactive',
        connectionLimit: totalConnectionsPurchased
      }
    })

  } catch (error) {
    console.error('❌ Erro no dashboard-summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar resumo do dashboard'
    }, { status: 500 })
  }
}
