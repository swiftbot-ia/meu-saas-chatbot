/**
 * API v1: Get Contact by Phone
 * 
 * GET /api/v1/contact/phone/{phone}
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
 * Gera variações do número de telefone brasileiro
 * Números brasileiros de celular podem ter 8 ou 9 dígitos após o DDD
 * Ex: 5561995348617 (com 9) ou 556195348617 (sem 9)
 */
function generateBrazilianPhoneVariations(phone) {
    const variations = [phone]

    // Se começa com 55 (Brasil)
    if (phone.startsWith('55') && phone.length >= 12) {
        const countryCode = '55'
        const ddd = phone.slice(2, 4)
        const number = phone.slice(4)

        // Se o número tem 9 dígitos (com o 9° dígito)
        if (number.length === 9 && number.startsWith('9')) {
            // Gerar versão sem o 9° dígito
            const without9 = countryCode + ddd + number.slice(1)
            variations.push(without9)
        }
        // Se o número tem 8 dígitos (sem o 9° dígito)
        else if (number.length === 8) {
            // Gerar versão com o 9° dígito
            const with9 = countryCode + ddd + '9' + number
            variations.push(with9)
        }
    }

    return [...new Set(variations)] // Remove duplicatas
}

/**
 * GET /api/v1/contact/phone/{phone}
 * Find contact by phone number
 */
export async function GET(request, { params }) {
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

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        // Gerar variações do número brasileiro (com/sem 9° dígito)
        const phoneVariations = generateBrazilianPhoneVariations(normalizedPhone)
        console.log('[ContactByPhone] Buscando variações:', phoneVariations)

        const chatDb = getChatDb()
        const mainDb = getMainDb()

        // Find contact with any phone variation
        const { data: contacts, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select(`
                id,
                whatsapp_number,
                name,
                profile_pic_url,
                created_at,
                last_message_at,
                first_message_at,
                metadata,
                origin:contact_origins (
                    id,
                    name
                )
            `)
            .in('whatsapp_number', phoneVariations)
            .limit(1)

        const contact = contacts?.[0]

        if (contactError || !contact) {
            console.log('[ContactByPhone] Não encontrado para:', phoneVariations)
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Get conversation for this contact in this connection
        const { data: conversation } = await chatDb
            .from('whatsapp_conversations')
            .select(`
                id,
                funnel_stage,
                funnel_position,
                last_message_at,
                last_message_preview,
                is_archived,
                agent_paused
            `)
            .eq('contact_id', contact.id)
            .eq('instance_name', auth.instanceName)
            .single()

        // Get tags for this contact
        const { data: tagAssignments } = await chatDb
            .from('contact_tag_assignments')
            .select(`
                tag:contact_tags (
                    id,
                    name,
                    color
                )
            `)
            .eq('contact_id', contact.id)

        const tags = tagAssignments?.map(t => t.tag).filter(Boolean) || []

        // Get agent settings (from main DB)
        const { data: agentSettings } = await mainDb
            .from('contact_agent_settings')
            .select('agent_enabled, disabled_at, disabled_reason')
            .eq('connection_id', auth.connectionId)
            .eq('whatsapp_number', normalizedPhone)
            .single()

        // Get active sequence subscriptions (from chat DB)
        const { data: subscriptions } = await chatDb
            .from('automation_sequence_subscriptions')
            .select('id, sequence_id, status, current_step, started_at, next_step_at')
            .eq('contact_id', contact.id)
            .eq('status', 'active')

        return NextResponse.json({
            success: true,
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number,
                name: contact.name,
                profilePicUrl: contact.profile_pic_url,
                createdAt: contact.created_at,
                lastMessageAt: contact.last_message_at,
                firstMessageAt: contact.first_message_at,
                metadata: contact.metadata,
                origin: contact.origin,
                tags,
                conversation: conversation ? {
                    id: conversation.id,
                    funnelStage: conversation.funnel_stage,
                    funnelPosition: conversation.funnel_position,
                    lastMessageAt: conversation.last_message_at,
                    lastMessagePreview: conversation.last_message_preview,
                    isArchived: conversation.is_archived,
                    agentPaused: conversation.agent_paused
                } : null,
                agentEnabled: agentSettings?.agent_enabled !== false,
                agentDisabledAt: agentSettings?.disabled_at,
                agentDisabledReason: agentSettings?.disabled_reason,
                activeSequences: subscriptions || []
            }
        })

    } catch (error) {
        console.error('[API v1] Get contact by phone error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/v1/contact/phone/{phone}
 * Update contact by phone number (name and/or metadata)
 * 
 * Body: { name?: string, metadata?: object }
 */
export async function PATCH(request, { params }) {
    try {
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { phone } = await params
        const body = await request.json()

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'phone is required' },
                { status: 400 }
            )
        }

        const { name, metadata } = body

        if (!name && !metadata) {
            return NextResponse.json(
                { success: false, error: 'At least one of name or metadata is required' },
                { status: 400 }
            )
        }

        const normalizedPhone = phone.replace(/\D/g, '')
        const chatDb = getChatDb()

        // Find contact
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name, metadata')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Build update object
        const updateData = { updated_at: new Date().toISOString() }

        if (name) {
            updateData.name = name
        }

        if (metadata && typeof metadata === 'object') {
            // Merge with existing metadata
            updateData.metadata = { ...(contact.metadata || {}), ...metadata }
        }

        // Update contact
        const { error: updateError } = await chatDb
            .from('whatsapp_contacts')
            .update(updateData)
            .eq('id', contact.id)

        if (updateError) {
            console.error('[API v1] Error updating contact by phone:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to update contact' },
                { status: 500 }
            )
        }

        console.log(`📝 [API v1] Contact ${normalizedPhone} updated:`, Object.keys(updateData))

        return NextResponse.json({
            success: true,
            message: 'Contact updated successfully',
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number,
                name: name || contact.name,
                metadata: updateData.metadata || contact.metadata
            }
        })

    } catch (error) {
        console.error('[API v1] Update contact by phone error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
