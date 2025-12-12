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

        // Get all contact IDs for this instance via conversations
        const { data: conversations, error: convError } = await chatSupabase
            .from('whatsapp_conversations')
            .select('contact_id')
            .eq('instance_name', instanceName)
            .eq('user_id', ownerUserId)
            .not('contact_id', 'is', null)

        if (convError) {
            console.error('Error fetching conversations:', convError)
            return NextResponse.json({
                success: false,
                error: 'Erro ao buscar contatos'
            }, { status: 500 })
        }

        const contactIds = [...new Set(conversations?.map(c => c.contact_id).filter(Boolean) || [])]

        if (contactIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Nenhum contato encontrado para esta conexão'
            }, { status: 404 })
        }

        console.log(`📝 [Global Field] Adding "${fieldName}" to ${contactIds.length} contacts`)

        // Update contacts in batches
        let updatedCount = 0
        const BATCH_SIZE = 100

        for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
            const batch = contactIds.slice(i, i + BATCH_SIZE)

            // Use RPC or raw SQL via function to update JSONB
            // Since Supabase doesn't support jsonb_set in update, we'll fetch and update each
            const { data: contacts, error: fetchError } = await chatSupabase
                .from('whatsapp_contacts')
                .select('id, metadata')
                .in('id', batch)

            if (fetchError) {
                console.error('Error fetching batch:', fetchError)
                continue
            }

            for (const contact of contacts || []) {
                const existingMetadata = contact.metadata || {}

                // Only add if field doesn't exist
                if (!(fieldName in existingMetadata)) {
                    const updatedMetadata = {
                        ...existingMetadata,
                        [fieldName]: defaultValue || ''
                    }

                    const { error: updateError } = await chatSupabase
                        .from('whatsapp_contacts')
                        .update({ metadata: updatedMetadata })
                        .eq('id', contact.id)

                    if (!updateError) {
                        updatedCount++
                    }
                }
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
