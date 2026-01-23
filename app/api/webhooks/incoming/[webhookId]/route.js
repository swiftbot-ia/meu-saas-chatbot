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
import TriggerEngine from '@/lib/TriggerEngine'

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
            console.warn(`[Incoming Webhook] Phone field not found. Payload saved for debugging.`)
            return NextResponse.json(
                {
                    success: false,
                    message: 'Payload received and saved. Processing skipped because "phone" field was not found. Please check your Field Mapping in Settings.',
                    payload_saved: true
                },
                { status: 200 } // Return 200 to acknowledge receipt
            )
        }

        // Normalize phone
        const normalizedPhone = String(phone).replace(/\D/g, '')

        if (!normalizedPhone || normalizedPhone.length < 10) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid phone number extracted',
                    payload_saved: true
                },
                { status: 200 } // Return 200 to acknowledge receipt
            )
        }

        // Execute actions
        const actions = webhook.actions || []
        const results = {
            contact: null,
            actionsExecuted: []
        }

        // Initialize origin_id with extracted value
        let targetOriginId = extractedData.origin_id

        // If no mapped origin, check for "set_origin" action
        const setOriginAction = actions.find(a =>
            a === 'set_origin' ||
            (typeof a === 'object' && a.type === 'set_origin')
        )

        if (!targetOriginId && setOriginAction && setOriginAction.origin_id) {
            targetOriginId = setOriginAction.origin_id
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

            // Update origin if we have a target and it's different
            if (targetOriginId && targetOriginId !== contact.origin_id) {
                updates.origin_id = targetOriginId
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

                // Fire Trigger: custom_field_changed (for updated fields)
                if (Object.keys(metadataToUpdate).length > 0) {
                    for (const [key, value] of Object.entries(metadataToUpdate)) {
                        await TriggerEngine.processEvent('custom_field_changed', {
                            fieldKey: key,
                            newValue: value,
                            contact,
                            connection: { id: auth.connectionId }
                        }, auth.connectionId)
                    }
                }
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
                    metadata: metadataToUpdate || {}
                }

                if (email) newContactData.email = email
                if (targetOriginId) newContactData.origin_id = targetOriginId

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

                    // Fire Trigger: contact_created
                    await TriggerEngine.processEvent('contact_created', {
                        contact,
                        connection: { id: auth.connectionId }
                    }, auth.connectionId)

                    // Fire Trigger: custom_field_changed (for new fields)
                    if (Object.keys(metadataToUpdate).length > 0) {
                        for (const [key, value] of Object.entries(metadataToUpdate)) {
                            await TriggerEngine.processEvent('custom_field_changed', {
                                fieldKey: key,
                                newValue: value,
                                contact,
                                connection: { id: auth.connectionId }
                            }, auth.connectionId)
                        }
                    }
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
            // Skip set_origin as it's handled above (unless we want to force re-verify, but we shouldn't need to)
            if (actionType === 'set_origin') continue

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

                            // Fire Trigger: tag_added
                            await TriggerEngine.processEvent('tag_added', {
                                tagId: action.tag_id,
                                contact,
                                connection: { id: auth.connectionId }
                            }, auth.connectionId)
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
