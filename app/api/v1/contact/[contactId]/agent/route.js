/**
 * API v1: Agent Settings for Contact
 * 
 * POST /api/v1/contact/{contactId}/agent
 * Enable/disable AI agent for a specific contact
 * 
 * Authentication: X-API-KEY header
 */

import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let chatDbClient = null
let mainDbClient = null

async function getChatDb() {
    if (!chatDbClient) {
        const url = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
        const key = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY
        if (url && key) {
            const { createClient } = await import('@supabase/supabase-js')
            chatDbClient = createClient(url, key, { auth: { persistSession: false } })
        }
    }
    return chatDbClient
}

async function getMainDb() {
    if (!mainDbClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (url && key) {
            const { createClient } = await import('@supabase/supabase-js')
            mainDbClient = createClient(url, key, { auth: { persistSession: false } })
        }
    }
    return mainDbClient
}

/**
 * POST /api/v1/contact/{contactId}/agent
 * 
 * Body: { enabled: boolean, reason?: string }
 */
export async function POST(request, { params }) {
    try {
        // Validate API Key
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { contactId } = await params

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'contactId is required' },
                { status: 400 }
            )
        }

        // Parse body
        const body = await request.json()
        const { enabled, reason } = body

        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'enabled must be a boolean' },
                { status: 400 }
            )
        }

        const chatDb = await getChatDb()
        const mainDb = await getMainDb()

        // Get contact to verify existence and get phone number
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('id', contactId)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Verify contact belongs to this connection (via conversation)
        const { data: conversation } = await chatDb
            .from('whatsapp_conversations')
            .select('id')
            .eq('contact_id', contactId)
            .eq('connection_id', auth.connectionId)
            .single()

        if (!conversation) {
            return NextResponse.json(
                { success: false, error: 'Contact not found in this connection' },
                { status: 404 }
            )
        }

        // Upsert agent settings
        const settingsData = {
            connection_id: auth.connectionId,
            whatsapp_number: contact.whatsapp_number,
            agent_enabled: enabled,
            disabled_at: enabled ? null : new Date().toISOString(),
            disabled_reason: enabled ? null : (reason || 'Disabled via API'),
            updated_at: new Date().toISOString()
        }

        const { data: updatedSettings, error: upsertError } = await mainDb
            .from('contact_agent_settings')
            .upsert(settingsData, {
                onConflict: 'connection_id,whatsapp_number',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (upsertError) {
            console.error('[API v1] Error upserting agent settings:', upsertError)
            return NextResponse.json(
                { success: false, error: 'Failed to update agent settings' },
                { status: 500 }
            )
        }

        console.log(`🤖 [API v1] Agent ${enabled ? 'ENABLED' : 'DISABLED'} for contact: ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            agentEnabled: updatedSettings.agent_enabled,
            message: enabled
                ? 'AI agent enabled for this contact'
                : 'AI agent disabled for this contact'
        })

    } catch (error) {
        console.error('[API v1] Agent settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
