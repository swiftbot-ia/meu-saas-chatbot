/**
 * API to migrate existing metadata fields to custom_field_definitions table
 * GET /api/contacts/migrate-fields - Migrate fields for a connection
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server'
import { getOwnerUserIdFromMember } from '@/lib/account-service'

export const dynamic = 'force-dynamic'

// Main DB Admin
function getMainDbAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
}

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

/**
 * GET /api/contacts/migrate-fields
 * Reads unique field names from contact metadata and creates them in custom_field_definitions
 */
export async function GET(request) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        let ownerUserId = session.user.id
        try {
            const ownerFromService = await getOwnerUserIdFromMember(session.user.id)
            if (ownerFromService) ownerUserId = ownerFromService
        } catch (err) { }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json({ success: false, error: 'connectionId é obrigatório' }, { status: 400 })
        }

        const mainDb = getMainDbAdmin()
        const chatDb = createChatSupabaseAdminClient()

        // 1. Get connection info
        const { data: conn } = await mainDb
            .from('whatsapp_connections')
            .select('id, instance_name')
            .eq('id', connectionId)
            .single()

        if (!conn) {
            return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 })
        }

        // 2. Sample contacts to extract field names from metadata
        const { data: conversations } = await chatDb
            .from('whatsapp_conversations')
            .select('contact_id')
            .eq('instance_name', conn.instance_name)
            .eq('user_id', ownerUserId)
            .not('contact_id', 'is', null)
            .limit(500)

        const contactIds = [...new Set(conversations?.map(c => c.contact_id) || [])]

        if (contactIds.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhum contato encontrado', migratedCount: 0 })
        }

        // 3. Get metadata from contacts
        const { data: contacts } = await chatDb
            .from('whatsapp_contacts')
            .select('metadata')
            .in('id', contactIds.slice(0, 200))

        // 4. Extract unique field names
        const fieldSet = new Set()
        for (const contact of (contacts || [])) {
            if (contact.metadata && typeof contact.metadata === 'object') {
                Object.keys(contact.metadata).forEach(key => {
                    // Skip system fields
                    if (!['whatsapp_number', 'profile_pic_url', 'id', ''].includes(key)) {
                        fieldSet.add(key)
                    }
                })
            }
        }

        const fieldNames = Array.from(fieldSet)
        console.log(`📋 [Migrate Fields] Found ${fieldNames.length} unique fields: ${fieldNames.join(', ')}`)

        // 5. Insert into custom_field_definitions (skip duplicates)
        let migratedCount = 0
        for (const name of fieldNames) {
            const { error } = await mainDb
                .from('custom_field_definitions')
                .insert({
                    connection_id: connectionId,
                    name: name,
                    display_name: name,
                    field_type: 'text',
                    default_value: ''
                })

            if (!error) {
                migratedCount++
                console.log(`✅ Created field: ${name}`)
            } else if (error.code === '23505') {
                // Duplicate - already exists
                console.log(`⏭️ Field already exists: ${name}`)
            } else {
                console.error(`❌ Error creating field ${name}:`, error.message)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migração concluída: ${migratedCount} campos criados`,
            totalFieldsFound: fieldNames.length,
            migratedCount,
            fields: fieldNames
        })

    } catch (error) {
        console.error('Error in migrate-fields:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
