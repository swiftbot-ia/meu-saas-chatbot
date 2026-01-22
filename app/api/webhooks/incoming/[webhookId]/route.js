/**
 * Incoming Webhooks API - Receive data from external platforms
 * 
 * POST /api/webhooks/incoming/{webhookId} - Receive webhook payload
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
 * Extract value from object using dot notation path
 * Supports: $.field, $.nested.field, $.array[0].field
 */
function extractValue(obj, path) {
    if (!path || typeof path !== 'string') return null

    // Remove leading $. if present
    let cleanPath = path.startsWith('$.') ? path.slice(2) : path
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const parts = cleanPath.split(/\.|\[|\]/).filter(Boolean)
    let current = obj

    for (const part of parts) {
        if (current === null || current === undefined) return null
        current = current[part]
    }

    return current
}

/**
 * POST /api/webhooks/incoming/{webhookId}
 * Receive and process webhook payload from external platforms
 */
export async function POST(request, { params }) {
    const startTime = Date.now()

    try {
        // Validate API Key
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { webhookId } = await params

        if (!webhookId) {
            return NextResponse.json(
                { success: false, error: 'webhookId is required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()
        const chatDb = getChatDb()

        // Fetch webhook configuration
        const { data: webhook, error: webhookError } = await mainDb
            .from('incoming_webhooks')
            .select('*')
            .eq('id', webhookId)
            .eq('connection_id', auth.connectionId)
            .single()

        if (webhookError || !webhook) {
            return NextResponse.json(
                { success: false, error: 'Webhook not found' },
                { status: 404 }
            )
        }

        if (!webhook.is_active) {
            return NextResponse.json(
                { success: false, error: 'Webhook is inactive' },
                { status: 400 }
            )
        }

        // Parse incoming payload
        let payload = {}
        try {
            payload = await request.json()
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON payload' },
                { status: 400 }
            )
        }

        console.log(`📥 [Incoming Webhook] Received payload for "${webhook.name}":`, JSON.stringify(payload).slice(0, 500))

        // Update stats and save payload immediately (so it's available for mapping even if processing fails)
        await mainDb
            .from('incoming_webhooks')
            .update({
                total_received: webhook.total_received + 1,
                last_received_at: new Date().toISOString(),
                last_payload: payload
            })
            .eq('id', webhookId)

        // Extract mapped fields
        const fieldMapping = webhook.field_mapping || {}
        const extractedData = {}

        for (const [field, path] of Object.entries(fieldMapping)) {
            const value = extractValue(payload, path)
            if (value !== null && value !== undefined) {
                extractedData[field] = value
            }
        }

        console.log(`📥 [Incoming Webhook] Extracted data:`, extractedData)

        // Separate standard fields from custom fields
        const { phone, name, email, origin_id, ...customFields } = extractedData

        // Prepare metadata: merge existing mapped metadata (if any) with other custom fields
        // If the user mapped "campanha" -> $.campanha, it will be in customFields and go into metadata
        const metadataToUpdate = {
            ...(extractedData.metadata || {}),
            ...customFields
        }

        // Validate required phone field
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone field not found in payload. Check your field mapping.' },
                { status: 400 }
            )
        }

        // Normalize phone
        const normalizedPhone = String(phone).replace(/\D/g, '')

        if (!normalizedPhone || normalizedPhone.length < 10) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number extracted' },
                { status: 400 }
            )
        }

        // Execute actions
        const actions = webhook.actions || []
        const results = {
            contact: null,
            actionsExecuted: []
        }

        // 1. Find or create contact
        let contact = null
        const { data: existingContact } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name, metadata, origin_id')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (existingContact) {
            contact = existingContact
            results.contact = { id: contact.id, phone: contact.whatsapp_number, created: false }

            // Determine updates
            const updates = { updated_at: new Date().toISOString() }
            let hasUpdates = false

            // Update name if provided and different
            if (name && name !== contact.name) {
                updates.name = name
                hasUpdates = true
            }

            // Update email if provided
            if (email) {
                updates.email = email
                hasUpdates = true
            }

            // Update origin if mapped directly
            if (origin_id && origin_id !== contact.origin_id) {
                updates.origin_id = origin_id
                hasUpdates = true
            }

            // Update metadata (merge with existing)
            if (Object.keys(metadataToUpdate).length > 0) {
                updates.metadata = { ...(contact.metadata || {}), ...metadataToUpdate }
                hasUpdates = true
            }

            if (hasUpdates) {
                await chatDb
                    .from('whatsapp_contacts')
                    .update(updates)
                    .eq('id', contact.id)
                console.log(`📥 [Incoming Webhook] Updated contact info`)
            }
        } else {
            // Check if "create_contact" action is enabled
            const shouldCreateContact = actions.some(a =>
                a === 'create_contact' ||
                (typeof a === 'object' && a.type === 'create_contact')
            )

            if (shouldCreateContact) {
                // Prepare new contact data
                const newContactData = {
                    whatsapp_number: normalizedPhone,
                    name: name || normalizedPhone,
                    instance_name: auth.instanceName,
                    metadata: metadataToUpdate || {} // Include custom fields
                }

                if (email) newContactData.email = email
                if (origin_id) newContactData.origin_id = origin_id

                const { data: newContact, error: createError } = await chatDb
                    .from('whatsapp_contacts')
                    .insert(newContactData)
                    .select()
                    .single()

                if (!createError && newContact) {
                    contact = newContact
                    results.contact = { id: contact.id, phone: contact.whatsapp_number, created: true }
                    results.actionsExecuted.push('create_contact')
                    console.log(`📥 [Incoming Webhook] Created contact: ${normalizedPhone}`)
                }
            } else {
                return NextResponse.json(
                    { success: false, error: 'Contact not found and create_contact action not enabled' },
                    { status: 404 }
                )
            }
        }

        // 2. Execute other actions
        for (const action of actions) {
            const actionType = typeof action === 'string' ? action : action.type

            // Skip create_contact as it's already handled
            if (actionType === 'create_contact') continue

            try {
                if (actionType === 'add_tag' && action.tag_id) {
                    // Add tag
                    const { data: tag } = await chatDb
                        .from('contact_tags')
                        .select('id, name')
                        .eq('id', action.tag_id)
                        .single()

                    if (tag) {
                        // Check if already has tag
                        const { data: existingTag } = await chatDb
                            .from('contact_tag_assignments')
                            .select('id')
                            .eq('contact_id', contact.id)
                            .eq('tag_id', action.tag_id)
                            .single()

                        if (!existingTag) {
                            await chatDb
                                .from('contact_tag_assignments')
                                .insert({
                                    contact_id: contact.id,
                                    tag_id: action.tag_id,
                                    assigned_by: auth.userId
                                })
                            results.actionsExecuted.push(`add_tag:${tag.name}`)
                            console.log(`📥 [Incoming Webhook] Added tag "${tag.name}" to contact`)
                        }
                    }
                }

                if (actionType === 'subscribe_sequence' && action.sequence_id) {
                    // Subscribe to sequence
                    const { data: sequence } = await mainDb
                        .from('automation_sequences')
                        .select('id, name, is_active')
                        .eq('id', action.sequence_id)
                        .eq('connection_id', auth.connectionId)
                        .single()

                    if (sequence && sequence.is_active) {
                        // Dynamic import to avoid circular dependencies
                        const { default: SequenceService } = await import('@/lib/SequenceService')
                        const enrollResult = await SequenceService.enrollContact(
                            action.sequence_id,
                            contact.id,
                            auth.connectionId
                        )

                        if (enrollResult.success) {
                            results.actionsExecuted.push(`subscribe_sequence:${sequence.name}`)
                            console.log(`📥 [Incoming Webhook] Enrolled contact in sequence "${sequence.name}"`)
                        }
                    }
                }

                if (actionType === 'set_agent' && typeof action.enabled === 'boolean') {
                    // Enable/disable agent
                    const { data: existingSettings } = await mainDb
                        .from('contact_agent_settings')
                        .select('id')
                        .eq('contact_id', contact.id)
                        .eq('instance_name', auth.instanceName)
                        .single()

                    if (existingSettings) {
                        await mainDb
                            .from('contact_agent_settings')
                            .update({
                                agent_enabled: action.enabled,
                                disabled_at: action.enabled ? null : new Date().toISOString(),
                                disabled_reason: action.enabled ? null : 'Disabled via incoming webhook',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', existingSettings.id)
                    } else {
                        await mainDb
                            .from('contact_agent_settings')
                            .insert({
                                contact_id: contact.id,
                                instance_name: auth.instanceName,
                                user_id: auth.userId,
                                agent_enabled: action.enabled,
                                disabled_at: action.enabled ? null : new Date().toISOString(),
                                disabled_reason: action.enabled ? null : 'Disabled via incoming webhook'
                            })
                    }
                    results.actionsExecuted.push(`set_agent:${action.enabled}`)
                }

                if (actionType === 'set_origin' && action.origin_id) {
                    // Set contact origin
                    const { data: origin } = await chatDb
                        .from('contact_origins')
                        .select('id, name')
                        .eq('id', action.origin_id)
                        .single()

                    if (origin) {
                        await chatDb
                            .from('whatsapp_contacts')
                            .update({
                                origin_id: action.origin_id,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', contact.id)
                        results.actionsExecuted.push(`set_origin:${origin.name}`)
                        console.log(`📥 [Incoming Webhook] Set origin "${origin.name}" for contact`)
                    }
                }
            } catch (actionError) {
                console.error(`📥 [Incoming Webhook] Error executing action ${actionType}:`, actionError)
            }
        }



        const processingTime = Date.now() - startTime
        console.log(`📥 [Incoming Webhook] Completed in ${processingTime}ms. Actions: ${results.actionsExecuted.join(', ')}`)

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully',
            ...results,
            processingTime: `${processingTime}ms`
        })

    } catch (error) {
        console.error('[Incoming Webhook] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
