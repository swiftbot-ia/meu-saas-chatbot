/**
 * Global Custom Field API
 * POST /api/contacts/global-field
 * 
 * Adds a custom field to all contacts for a specific connection
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server'
import { getOwnerUserIdFromMember } from '@/lib/account-service'

export const dynamic = 'force-dynamic'

async function createAuthClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value },
                set(name, value, options) { cookieStore.set({ name, value, ...options }) },
                remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
            },
        }
    )
}

export async function POST(request) {
    try {
        // Auth check
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const userId = session.user.id

        // Get owner user ID
        let ownerUserId = userId
        try {
            const ownerFromService = await getOwnerUserIdFromMember(userId)
            if (ownerFromService) ownerUserId = ownerFromService
        } catch (err) {
            console.log('⚠️ Account check failed:', err.message)
        }

        // Parse body
        const { connectionId, instanceName, fieldName, defaultValue } = await request.json()

        if (!connectionId || !instanceName || !fieldName) {
            return NextResponse.json({
                success: false,
                error: 'connectionId, instanceName e fieldName são obrigatórios'
            }, { status: 400 })
        }

        // Validate field name (no spaces, alphanumeric + underscore)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
            return NextResponse.json({
                success: false,
                error: 'Nome do campo inválido. Use apenas letras, números e underscore, começando com letra.'
            }, { status: 400 })
        }

        const chatSupabase = createChatSupabaseAdminClient()

        // Batch fetch ALL contact IDs to bypass Supabase 1000 row limit
        let allContactIds = []
        const BATCH_SIZE = 1000
        let offset = 0
        let hasMore = true

        console.log(`📝 [Global Field] Fetching all contact IDs for ${instanceName}...`)

        while (hasMore) {
            const { data: batch, error: batchError } = await chatSupabase
                .from('whatsapp_conversations')
                .select('contact_id')
                .eq('instance_name', instanceName)
                .eq('user_id', ownerUserId)
                .not('contact_id', 'is', null)
                .range(offset, offset + BATCH_SIZE - 1)

            if (batchError) {
                console.error('Error fetching batch:', batchError)
                break
            }

            if (batch && batch.length > 0) {
                allContactIds = allContactIds.concat(batch.map(c => c.contact_id))
                offset += BATCH_SIZE
                hasMore = batch.length === BATCH_SIZE
            } else {
                hasMore = false
            }

            // Safety limit
            if (offset > 50000) {
                console.warn('⚠️ [Global Field] Safety limit reached')
                break
            }
        }

        // Deduplicate contact IDs
        const contactIds = [...new Set(allContactIds)]

        if (contactIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Nenhum contato encontrado para esta conexão'
            }, { status: 404 })
        }

        console.log(`📝 [Global Field] Adding "${fieldName}" to ${contactIds.length} contacts`)

        // Update all contacts using bulk update with JSONB merge
        // Use a more efficient approach: update in larger batches without fetching first
        let updatedCount = 0
        const UPDATE_BATCH_SIZE = 500

        for (let i = 0; i < contactIds.length; i += UPDATE_BATCH_SIZE) {
            const batchIds = contactIds.slice(i, i + UPDATE_BATCH_SIZE)

            // Use PostgreSQL's jsonb_set to efficiently add the field
            // This updates metadata by merging the new field
            const { data: updated, error: updateError } = await chatSupabase.rpc('add_metadata_field', {
                contact_ids: batchIds,
                field_name: fieldName,
                field_value: defaultValue || ''
            })

            if (updateError) {
                // Fallback to individual updates if RPC doesn't exist
                console.log(`⚠️ [Global Field] RPC not available, using fallback...`)

                // Simple fallback: just update metadata with raw SQL approach
                for (const contactId of batchIds) {
                    const { data: contact } = await chatSupabase
                        .from('whatsapp_contacts')
                        .select('metadata')
                        .eq('id', contactId)
                        .single()

                    const existingMetadata = contact?.metadata || {}
                    if (!(fieldName in existingMetadata)) {
                        await chatSupabase
                            .from('whatsapp_contacts')
                            .update({ metadata: { ...existingMetadata, [fieldName]: defaultValue || '' } })
                            .eq('id', contactId)
                        updatedCount++
                    }
                }
            } else {
                updatedCount += batchIds.length
            }
        }

        console.log(`✅ [Global Field] Updated ${updatedCount} of ${contactIds.length} contacts`)

        return NextResponse.json({
            success: true,
            message: `Campo "${fieldName}" adicionado a ${updatedCount} contatos`,
            updatedCount,
            totalContacts: contactIds.length
        })

    } catch (error) {
        console.error('Error in global-field API:', error)
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 })
    }
}

