/**
 * API: API Keys Management
 * 
 * GET /api/settings/api-keys - List API keys for user's connections
 * POST /api/settings/api-keys - Create/regenerate API key for a connection
 * DELETE /api/settings/api-keys - Revoke an API key
 * 
 * Authentication: Standard Supabase Auth (session-based)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateApiKey, revokeApiKey, getApiKeyInfo } from '@/lib/api-auth'
import { getOwnerUserIdFromMember } from '@/lib/account-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper to create auth client
async function createAuthClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )
}

/**
 * GET /api/settings/api-keys
 * List API keys for all user's connections
 * 
 * Query params:
 * - connectionId: (optional) Get single connection's key
 * - reveal: (optional) If "true", return full API key for the specified connectionId
 */
export async function GET(request) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const userId = session.user.id
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')
        const reveal = searchParams.get('reveal') === 'true'

        // Get owner's user ID for team data sharing
        let ownerUserId = userId
        try {
            const ownerFromService = await getOwnerUserIdFromMember(userId)
            if (ownerFromService) {
                ownerUserId = ownerFromService
            }
        } catch (accountError) {
            console.log('⚠️ [API Keys] Account check failed:', accountError.message)
        }

        // If requesting a specific connection with reveal=true, return full key
        if (connectionId && reveal) {
            // Verify connection belongs to owner
            const { data: connection, error: connError } = await supabaseAdmin
                .from('whatsapp_connections')
                .select('id')
                .eq('id', connectionId)
                .eq('user_id', ownerUserId)
                .single()

            if (connError || !connection) {
                return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
            }

            // Get full API key
            const { data: apiKeyData, error: keyError } = await supabaseAdmin
                .from('api_keys')
                .select('api_key')
                .eq('connection_id', connectionId)
                .eq('is_active', true)
                .single()

            if (keyError || !apiKeyData) {
                return NextResponse.json({ error: 'API key não encontrada' }, { status: 404 })
            }

            return NextResponse.json({
                success: true,
                apiKey: apiKeyData.api_key
            })
        }

        // Get all connections for this owner
        const { data: connections, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name, profile_name, profile_pic_url, phone_number, is_connected')
            .eq('user_id', ownerUserId)

        if (connError) {
            console.error('[API Keys] Error fetching connections:', connError)
            return NextResponse.json({ error: 'Erro ao buscar conexões' }, { status: 500 })
        }

        // Get API key info for each connection
        const apiKeys = await Promise.all(
            (connections || []).map(async (conn, index) => {
                const keyInfo = await getApiKeyInfo(conn.id)
                // Use profile_name se disponível, senão "Conexão X"
                const displayName = conn.profile_name || `Conexão ${index + 1}`
                return {
                    // IDs compatíveis com componente unificado
                    id: conn.id,
                    connectionId: conn.id,
                    connectionName: displayName,
                    profile_name: conn.profile_name,
                    profile_pic_url: conn.profile_pic_url,
                    phone_number: conn.phone_number,
                    instanceName: conn.instance_name,
                    is_connected: conn.is_connected,
                    isConnected: conn.is_connected,
                    hasApiKey: keyInfo.exists,
                    apiKey: keyInfo.key || null
                }
            })
        )

        return NextResponse.json({
            success: true,
            connections: apiKeys
        })

    } catch (error) {
        console.error('[API Keys] GET error:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

/**
 * POST /api/settings/api-keys
 * Create or regenerate API key for a connection
 * 
 * Body: { connectionId: string, name?: string }
 */
export async function POST(request) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await request.json()
        const { connectionId, name } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'connectionId é obrigatório' }, { status: 400 })
        }

        // Get owner's user ID
        let ownerUserId = userId
        try {
            const ownerFromService = await getOwnerUserIdFromMember(userId)
            if (ownerFromService) {
                ownerUserId = ownerFromService
            }
        } catch (accountError) {
            console.log('⚠️ [API Keys] Account check failed:', accountError.message)
        }

        // Verify connection belongs to owner
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, profile_name, instance_name')
            .eq('id', connectionId)
            .eq('user_id', ownerUserId)
            .single()

        if (connError || !connection) {
            return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
        }

        // Generate API key
        const keyName = name || `API Key - ${connection.profile_name || connection.instance_name}`
        const result = await generateApiKey(ownerUserId, connectionId, keyName)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        console.log(`🔑 [API Keys] ${result.regenerated ? 'Regenerated' : 'Created'} API key for connection: ${connectionId}`)

        return NextResponse.json({
            success: true,
            apiKey: result.apiKey,
            regenerated: result.regenerated,
            message: result.regenerated
                ? 'API key regenerada com sucesso'
                : 'API key criada com sucesso'
        })

    } catch (error) {
        console.error('[API Keys] POST error:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

/**
 * DELETE /api/settings/api-keys
 * Revoke an API key
 * 
 * Body: { connectionId: string }
 */
export async function DELETE(request) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await request.json()
        const { connectionId } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'connectionId é obrigatório' }, { status: 400 })
        }

        // Get owner's user ID
        let ownerUserId = userId
        try {
            const ownerFromService = await getOwnerUserIdFromMember(userId)
            if (ownerFromService) {
                ownerUserId = ownerFromService
            }
        } catch (accountError) {
            console.log('⚠️ [API Keys] Account check failed:', accountError.message)
        }

        // Revoke the key
        const result = await revokeApiKey(connectionId, ownerUserId)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        console.log(`🔑 [API Keys] Revoked API key for connection: ${connectionId}`)

        return NextResponse.json({
            success: true,
            message: 'API key revogada com sucesso'
        })

    } catch (error) {
        console.error('[API Keys] DELETE error:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
