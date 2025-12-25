/**
 * API Authentication Helper
 * 
 * Validates API keys for public webhook endpoints
 * Used by /api/v1/* routes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Get Supabase admin client
 */
function getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    })
}

/**
 * Validate API Key from request headers
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<{valid: boolean, userId?: string, connectionId?: string, error?: string}>}
 */
export async function validateApiKey(request) {
    try {
        // Get API key from header
        const apiKey = request.headers.get('X-API-KEY') || request.headers.get('x-api-key')

        if (!apiKey) {
            return {
                valid: false,
                error: 'API key is required. Use header: X-API-KEY'
            }
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(apiKey)) {
            return {
                valid: false,
                error: 'Invalid API key format'
            }
        }

        const supabase = getSupabaseAdmin()

        // Fetch API key from database
        const { data: keyData, error: keyError } = await supabase
            .from('api_keys')
            .select(`
                id,
                user_id,
                connection_id,
                is_active,
                revoked_at,
                connection:whatsapp_connections (
                    id,
                    instance_name,
                    user_id,
                    is_connected
                )
            `)
            .eq('api_key', apiKey)
            .single()

        if (keyError || !keyData) {
            return {
                valid: false,
                error: 'Invalid API key'
            }
        }

        // Check if key is active
        if (!keyData.is_active || keyData.revoked_at) {
            return {
                valid: false,
                error: 'API key has been revoked'
            }
        }

        // Check if connection is still valid
        if (!keyData.connection) {
            return {
                valid: false,
                error: 'Associated WhatsApp connection not found'
            }
        }

        // Update last_used_at (fire and forget)
        supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyData.id)
            .then(() => { })
            .catch(() => { })

        return {
            valid: true,
            userId: keyData.user_id,
            connectionId: keyData.connection_id,
            instanceName: keyData.connection.instance_name,
            connection: keyData.connection
        }

    } catch (error) {
        console.error('[API Auth] Error validating API key:', error)
        return {
            valid: false,
            error: 'Internal authentication error'
        }
    }
}

/**
 * Generate a new API key for a connection
 * 
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection ID
 * @param {string} name - Friendly name for the key
 * @returns {Promise<{success: boolean, apiKey?: string, error?: string}>}
 */
export async function generateApiKey(userId, connectionId, name = 'Default API Key') {
    try {
        const supabase = getSupabaseAdmin()

        // Check if key already exists for this connection
        const { data: existing } = await supabase
            .from('api_keys')
            .select('id, api_key')
            .eq('connection_id', connectionId)
            .single()

        if (existing) {
            // Regenerate the existing key
            const newApiKey = crypto.randomUUID()

            const { data: updated, error: updateError } = await supabase
                .from('api_keys')
                .update({
                    api_key: newApiKey,
                    name,
                    is_active: true,
                    revoked_at: null,
                    created_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select('api_key')
                .single()

            if (updateError) {
                throw updateError
            }

            return {
                success: true,
                apiKey: updated.api_key,
                regenerated: true
            }
        }

        // Create new API key
        const { data: newKey, error: insertError } = await supabase
            .from('api_keys')
            .insert({
                user_id: userId,
                connection_id: connectionId,
                name
            })
            .select('api_key')
            .single()

        if (insertError) {
            throw insertError
        }

        return {
            success: true,
            apiKey: newKey.api_key,
            regenerated: false
        }

    } catch (error) {
        console.error('[API Auth] Error generating API key:', error)
        return {
            success: false,
            error: error.message || 'Failed to generate API key'
        }
    }
}

/**
 * Revoke an API key
 * 
 * @param {string} connectionId - Connection ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeApiKey(connectionId, userId) {
    try {
        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('api_keys')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString()
            })
            .eq('connection_id', connectionId)
            .eq('user_id', userId)

        if (error) {
            throw error
        }

        return { success: true }

    } catch (error) {
        console.error('[API Auth] Error revoking API key:', error)
        return {
            success: false,
            error: error.message || 'Failed to revoke API key'
        }
    }
}

/**
 * Get API key info for a connection (masked)
 * 
 * @param {string} connectionId - Connection ID
 * @returns {Promise<{exists: boolean, key?: object}>}
 */
export async function getApiKeyInfo(connectionId) {
    try {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('api_keys')
            .select('id, api_key, name, is_active, created_at, last_used_at, revoked_at')
            .eq('connection_id', connectionId)
            .single()

        if (error || !data) {
            return { exists: false }
        }

        // Mask the API key (show first 8 and last 4 chars)
        const maskedKey = data.api_key
            ? `${data.api_key.substring(0, 8)}...${data.api_key.substring(data.api_key.length - 4)}`
            : null

        return {
            exists: true,
            key: {
                id: data.id,
                name: data.name,
                maskedKey,
                isActive: data.is_active,
                createdAt: data.created_at,
                lastUsedAt: data.last_used_at,
                revokedAt: data.revoked_at
            }
        }

    } catch (error) {
        console.error('[API Auth] Error getting API key info:', error)
        return { exists: false }
    }
}
