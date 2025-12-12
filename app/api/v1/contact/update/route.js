/**
 * API v1: Comprehensive Contact Update
 * 
 * POST /api/v1/contact/update - Update contact with multiple fields
 * 
 * Accepts contactId OR phone as identifier
 * Can update: name, originId, funnelStage, metadata, tags, agentEnabled
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

// Valid funnel stages
const VALID_STAGES = ['novo', 'apresentacao', 'negociacao', 'fechamento']

/**
 * POST /api/v1/contact/update
 * 
 * Body: {
 *   contactId?: string,          // UUID - one identifier is required
 *   phone?: string,              // Phone number - one identifier is required
 *   name?: string,               // Update contact name
 *   originId?: string,           // Set origin (must exist)
 *   funnelStage?: string,        // Move to funnel stage
 *   metadata?: object,           // Merge with existing metadata
 *   addTags?: string[],          // Tag IDs to add
 *   removeTags?: string[],       // Tag IDs to remove
 *   agentEnabled?: boolean       // Enable/disable AI agent
 * }
 */
export async function POST(request) {
    try {
        // Validate API Key
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            contactId,
            phone,
            name,
            originId,
            funnelStage,
            metadata,
            addTags,
            removeTags,
            agentEnabled
        } = body

        // Validate identifier
        if (!contactId && !phone) {
            return NextResponse.json(
                { success: false, error: 'Either contactId or phone is required' },
                { status: 400 }
            )
        }

        // Validate funnelStage if provided
        if (funnelStage && !VALID_STAGES.includes(funnelStage)) {
            return NextResponse.json(
                { success: false, error: `Invalid funnelStage. Must be one of: ${VALID_STAGES.join(', ')}` },
                { status: 400 }
            )
        }

        const chatDb = getChatDb()
        const mainDb = getMainDb()
        const updates = {}

        // 1. Find contact
        let contact
        if (contactId) {
            const { data, error } = await chatDb
                .from('whatsapp_contacts')
                .select('id, whatsapp_number, name, metadata, origin_id')
                .eq('id', contactId)
                .single()

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'Contact not found' },
                    { status: 404 }
                )
            }
            contact = data
        } else {
            // Normalize phone
            const normalizedPhone = phone.replace(/\D/g, '')
            const { data, error } = await chatDb
                .from('whatsapp_contacts')
                .select('id, whatsapp_number, name, metadata, origin_id')
                .eq('whatsapp_number', normalizedPhone)
                .single()

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'Contact not found with this phone number' },
                    { status: 404 }
                )
            }
            contact = data
        }

        // Build contact update data
        const contactUpdateData = {}

        // 2. Update name
        if (name !== undefined && name !== contact.name) {
            contactUpdateData.name = name
            updates.name = true
        }

        // 3. Update origin
        if (originId !== undefined) {
            // Validate origin exists
            const { data: origin, error: originError } = await chatDb
                .from('contact_origins')
                .select('id, name')
                .eq('id', originId)
                .eq('user_id', auth.userId)
                .single()

            if (originError || !origin) {
                return NextResponse.json(
                    { success: false, error: 'Origin not found or does not belong to you' },
                    { status: 400 }
                )
            }

            contactUpdateData.origin_id = originId
            updates.origin = true
        }

        // 4. Update metadata (merge mode)
        if (metadata !== undefined && typeof metadata === 'object') {
            const existingMetadata = contact.metadata || {}
            contactUpdateData.metadata = { ...existingMetadata, ...metadata }
            updates.metadata = true
        }

        // Apply contact updates
        if (Object.keys(contactUpdateData).length > 0) {
            contactUpdateData.updated_at = new Date().toISOString()

            const { error: updateError } = await chatDb
                .from('whatsapp_contacts')
                .update(contactUpdateData)
                .eq('id', contact.id)

            if (updateError) {
                console.error('[API v1] Error updating contact:', updateError)
                return NextResponse.json(
                    { success: false, error: 'Failed to update contact' },
                    { status: 500 }
                )
            }
        }

        // 5. Update funnel stage (via conversation)
        if (funnelStage !== undefined) {
            // Find conversation for this contact
            const { data: conversation, error: convError } = await chatDb
                .from('whatsapp_conversations')
                .select('id, funnel_stage')
                .eq('contact_id', contact.id)
                .eq('instance_name', auth.instanceName)
                .single()

            if (convError || !conversation) {
                console.warn('[API v1] No conversation found for contact, skipping funnel stage update')
            } else if (conversation.funnel_stage !== funnelStage) {
                const fromStage = conversation.funnel_stage || 'novo'

                // Update conversation
                const { error: stageError } = await chatDb
                    .from('whatsapp_conversations')
                    .update({
                        funnel_stage: funnelStage,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', conversation.id)

                if (stageError) {
                    console.error('[API v1] Error updating funnel stage:', stageError)
                } else {
                    // Log to history
                    await chatDb
                        .from('funnel_stage_history')
                        .insert({
                            entity_type: 'conversation',
                            entity_id: conversation.id,
                            from_stage: fromStage,
                            to_stage: funnelStage,
                            notes: 'Updated via API v1'
                        })

                    updates.funnelStage = true
                }
            }
        }

        // 6. Add tags
        if (addTags && Array.isArray(addTags) && addTags.length > 0) {
            let tagsAdded = 0

            for (const tagId of addTags) {
                // Validate tag exists
                const { data: tag } = await chatDb
                    .from('contact_tags')
                    .select('id')
                    .eq('id', tagId)
                    .single()

                if (!tag) continue

                // Check if already has tag
                const { data: existing } = await chatDb
                    .from('whatsapp_contact_tags')
                    .select('id')
                    .eq('contact_id', contact.id)
                    .eq('tag_id', tagId)
                    .single()

                if (!existing) {
                    const { error: insertError } = await chatDb
                        .from('whatsapp_contact_tags')
                        .insert({
                            contact_id: contact.id,
                            tag_id: tagId
                        })

                    if (!insertError) tagsAdded++
                }
            }

            if (tagsAdded > 0) {
                updates.tagsAdded = tagsAdded
            }
        }

        // 7. Remove tags
        if (removeTags && Array.isArray(removeTags) && removeTags.length > 0) {
            const { data: removed, error: removeError } = await chatDb
                .from('whatsapp_contact_tags')
                .delete()
                .eq('contact_id', contact.id)
                .in('tag_id', removeTags)
                .select()

            if (!removeError && removed?.length > 0) {
                updates.tagsRemoved = removed.length
            }
        }

        // 8. Update agent settings
        if (agentEnabled !== undefined) {
            // Check if settings exist
            const { data: existingSettings } = await mainDb
                .from('contact_agent_settings')
                .select('id')
                .eq('contact_id', contact.id)
                .eq('instance_name', auth.instanceName)
                .single()

            if (existingSettings) {
                // Update existing
                await mainDb
                    .from('contact_agent_settings')
                    .update({
                        agent_enabled: agentEnabled,
                        disabled_at: agentEnabled ? null : new Date().toISOString(),
                        disabled_reason: agentEnabled ? null : 'Disabled via API v1',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingSettings.id)
            } else {
                // Insert new
                await mainDb
                    .from('contact_agent_settings')
                    .insert({
                        contact_id: contact.id,
                        instance_name: auth.instanceName,
                        user_id: auth.userId,
                        agent_enabled: agentEnabled,
                        disabled_at: agentEnabled ? null : new Date().toISOString(),
                        disabled_reason: agentEnabled ? null : 'Disabled via API v1'
                    })
            }

            updates.agentEnabled = agentEnabled
        }

        console.log(`📝 [API v1] Contact ${contact.whatsapp_number} updated:`, Object.keys(updates))

        return NextResponse.json({
            success: true,
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number,
                name: name || contact.name
            },
            updates
        })

    } catch (error) {
        console.error('[API v1] Contact update error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
