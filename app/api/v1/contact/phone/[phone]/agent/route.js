/**
 * API v1: AI Agent Control for Contact by Phone
 * 
 * POST /api/v1/contact/phone/{phone}/agent - Enable/disable AI agent for contact
 * 
 * Authentication: X-API-KEY header
 */

import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const chatSupabaseUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const chatSupabaseServiceKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY
const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const mainSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getChatDb() {
    return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
        auth: { persistSession: false }
    })
}

function getMainDb() {
    return createClient(mainSupabaseUrl, mainSupabaseServiceKey, {
        auth: { persistSession: false }
    })
}

/**
 * POST /api/v1/contact/phone/{phone}/agent
 * Enable or disable AI agent for a contact by phone number
 * 
 * Body: {
 *   enabled: boolean,     // true to enable, false to disable
 *   reason?: string       // Optional reason for disabling
 * }
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

        const { phone } = await params

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'phone is required' },
                { status: 400 }
            )
        }

        // Parse body
        let body = {}
        try {
            body = await request.json()
        } catch (e) {
            // Body is optional if using query params
        }

        const { enabled, reason } = body

        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'enabled (boolean) is required in request body' },
                { status: 400 }
            )
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        const chatDb = getChatDb()
        const mainDb = getMainDb()

        // Find contact by phone
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found with this phone number' },
                { status: 404 }
            )
        }

        // Check if settings exist
        const { data: existingSettings } = await mainDb
            .from('contact_agent_settings')
            .select('id, agent_enabled')
            .eq('contact_id', contact.id)
            .eq('instance_name', auth.instanceName)
            .single()

        const disabledReason = reason || (enabled ? null : 'Disabled via API')

        if (existingSettings) {
            // Update existing
            const { error: updateError } = await mainDb
                .from('contact_agent_settings')
                .update({
                    agent_enabled: enabled,
                    disabled_at: enabled ? null : new Date().toISOString(),
                    disabled_reason: enabled ? null : disabledReason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingSettings.id)

            if (updateError) {
                console.error('[API v1] Error updating agent settings:', updateError)
                return NextResponse.json(
                    { success: false, error: 'Failed to update agent settings' },
                    { status: 500 }
                )
            }
        } else {
            // Insert new
            const { error: insertError } = await mainDb
                .from('contact_agent_settings')
                .insert({
                    contact_id: contact.id,
                    instance_name: auth.instanceName,
                    user_id: auth.userId,
                    agent_enabled: enabled,
                    disabled_at: enabled ? null : new Date().toISOString(),
                    disabled_reason: enabled ? null : disabledReason
                })

            if (insertError) {
                console.error('[API v1] Error creating agent settings:', insertError)
                return NextResponse.json(
                    { success: false, error: 'Failed to create agent settings' },
                    { status: 500 }
                )
            }
        }

        const action = enabled ? 'enabled' : 'disabled'
        console.log(`🤖 [API v1] AI Agent ${action} for contact: ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            message: `AI Agent ${action} for contact`,
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number
            },
            agentEnabled: enabled,
            reason: enabled ? null : disabledReason
        })

    } catch (error) {
        console.error('[API v1] Agent control error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
