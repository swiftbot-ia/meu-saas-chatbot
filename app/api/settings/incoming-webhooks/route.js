/**
 * Incoming Webhooks CRUD API
 * 
 * GET /api/settings/incoming-webhooks - List webhooks
 * POST /api/settings/incoming-webhooks - Create webhook
 * 
 * Authentication: Supabase session
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const mainSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getMainDb() {
    return createClient(mainSupabaseUrl, mainSupabaseServiceKey, {
        auth: { persistSession: false }
    })
}

async function getAuthUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

/**
 * GET /api/settings/incoming-webhooks
 * List all incoming webhooks for the user's connection
 */
export async function GET(request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json(
                { success: false, error: 'connectionId is required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()

        // Verify connection belongs to user
        const { data: connection } = await mainDb
            .from('whatsapp_connections')
            .select('id')
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .single()

        if (!connection) {
            return NextResponse.json(
                { success: false, error: 'Connection not found' },
                { status: 404 }
            )
        }

        // Fetch webhooks
        const { data: webhooks, error } = await mainDb
            .from('incoming_webhooks')
            .select('*')
            .eq('connection_id', connectionId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Incoming Webhooks] Error fetching:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch webhooks' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            webhooks: webhooks || []
        })

    } catch (error) {
        console.error('[Incoming Webhooks] GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/settings/incoming-webhooks
 * Create a new incoming webhook
 */
export async function POST(request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { connectionId, name, fieldMapping, actions } = body

        if (!connectionId || !name) {
            return NextResponse.json(
                { success: false, error: 'connectionId and name are required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()

        // Verify connection belongs to user
        const { data: connection } = await mainDb
            .from('whatsapp_connections')
            .select('id')
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .single()

        if (!connection) {
            return NextResponse.json(
                { success: false, error: 'Connection not found' },
                { status: 404 }
            )
        }

        // Create webhook
        const { data: webhook, error } = await mainDb
            .from('incoming_webhooks')
            .insert({
                connection_id: connectionId,
                user_id: user.id,
                name,
                field_mapping: fieldMapping || { phone: '$.phone', name: '$.name' },
                actions: actions || ['create_contact'],
                secret: crypto.randomUUID().replace(/-/g, '') // Generate random secret
            })
            .select()
            .single()

        if (error) {
            console.error('[Incoming Webhooks] Error creating:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create webhook' },
                { status: 500 }
            )
        }

        console.log(`📥 [Incoming Webhooks] Created webhook "${name}" for connection ${connectionId}`)

        return NextResponse.json({
            success: true,
            webhook
        })

    } catch (error) {
        console.error('[Incoming Webhooks] POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/settings/incoming-webhooks
 * Update an existing webhook
 */
export async function PUT(request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { webhookId, name, fieldMapping, actions, isActive } = body

        if (!webhookId) {
            return NextResponse.json(
                { success: false, error: 'webhookId is required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()

        // Verify webhook belongs to user
        const { data: existingWebhook } = await mainDb
            .from('incoming_webhooks')
            .select('id')
            .eq('id', webhookId)
            .eq('user_id', user.id)
            .single()

        if (!existingWebhook) {
            return NextResponse.json(
                { success: false, error: 'Webhook not found' },
                { status: 404 }
            )
        }

        // Build update object
        const updateData = { updated_at: new Date().toISOString() }
        if (name !== undefined) updateData.name = name
        if (fieldMapping !== undefined) updateData.field_mapping = fieldMapping
        if (actions !== undefined) updateData.actions = actions
        if (isActive !== undefined) updateData.is_active = isActive

        // Update webhook
        const { data: webhook, error } = await mainDb
            .from('incoming_webhooks')
            .update(updateData)
            .eq('id', webhookId)
            .select()
            .single()

        if (error) {
            console.error('[Incoming Webhooks] Error updating:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to update webhook' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            webhook
        })

    } catch (error) {
        console.error('[Incoming Webhooks] PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/settings/incoming-webhooks
 * Delete a webhook
 */
export async function DELETE(request) {
    try {
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const webhookId = searchParams.get('webhookId')

        if (!webhookId) {
            return NextResponse.json(
                { success: false, error: 'webhookId is required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()

        // Verify webhook belongs to user
        const { data: existingWebhook } = await mainDb
            .from('incoming_webhooks')
            .select('id, name')
            .eq('id', webhookId)
            .eq('user_id', user.id)
            .single()

        if (!existingWebhook) {
            return NextResponse.json(
                { success: false, error: 'Webhook not found' },
                { status: 404 }
            )
        }

        // Delete webhook
        const { error } = await mainDb
            .from('incoming_webhooks')
            .delete()
            .eq('id', webhookId)

        if (error) {
            console.error('[Incoming Webhooks] Error deleting:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to delete webhook' },
                { status: 500 }
            )
        }

        console.log(`📥 [Incoming Webhooks] Deleted webhook "${existingWebhook.name}"`)

        return NextResponse.json({
            success: true,
            message: 'Webhook deleted successfully'
        })

    } catch (error) {
        console.error('[Incoming Webhooks] DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
