/**
 * Global Custom Field API
 * 
 * GET /api/contacts/global-field - List existing custom fields
 * POST /api/contacts/global-field - Add custom field to all contacts
 * 
 * Uses PostgreSQL RPC for instant bulk updates
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

async function getAuthAndOwner() {
    const supabase = await createAuthClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
        return { error: 'Não autorizado', status: 401 }
    }

    const userId = session.user.id
    let ownerUserId = userId

    try {
        const ownerFromService = await getOwnerUserIdFromMember(userId)
        if (ownerFromService) ownerUserId = ownerFromService
    } catch (err) {
        console.log('⚠️ Account check failed:', err.message)
    }

    return { userId, ownerUserId }
}

/**
 * GET /api/contacts/global-field
 * List existing custom fields for a connection
 */
export async function GET(request) {
    try {
        const auth = await getAuthAndOwner()
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { searchParams } = new URL(request.url)
        const instanceName = searchParams.get('instanceName')

        if (!instanceName) {
            return NextResponse.json({
                success: false,
                error: 'instanceName é obrigatório'
            }, { status: 400 })
        }

        const chatSupabase = createChatSupabaseAdminClient()

        // Try RPC first
        const { data: fields, error: rpcError } = await chatSupabase.rpc('get_metadata_fields', {
            p_instance_name: instanceName,
            p_user_id: auth.ownerUserId
        })

        if (!rpcError && fields) {
            return NextResponse.json({
                success: true,
                fields: fields.map(f => ({
                    name: f.field_name,
                    sampleValue: f.sample_value,
                    contactCount: f.contact_count
                }))
            })
        }

        // Fallback: sample a few contacts to get field names
        console.log('⚠️ [Global Field] RPC not available, using fallback to get fields')

        const { data: sampleContacts } = await chatSupabase
            .from('whatsapp_conversations')
            .select('contact:whatsapp_contacts(metadata)')
            .eq('instance_name', instanceName)
            .eq('user_id', auth.ownerUserId)
            .not('contact_id', 'is', null)
            .limit(100)

        const fieldSet = new Set()
        for (const conv of sampleContacts || []) {
            if (conv.contact?.metadata) {
                Object.keys(conv.contact.metadata).forEach(k => fieldSet.add(k))
            }
        }

        return NextResponse.json({
            success: true,
            fields: Array.from(fieldSet).map(name => ({
                name,
                sampleValue: '',
                contactCount: null // Unknown without RPC
            }))
        })

    } catch (error) {
        console.error('Error in global-field GET:', error)
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 })
    }
}

/**
 * POST /api/contacts/global-field
 * Add custom field to all contacts (uses RPC for instant bulk update)
 */
export async function POST(request) {
    try {
        const auth = await getAuthAndOwner()
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { connectionId, instanceName, fieldName, defaultValue } = await request.json()

        if (!connectionId || !instanceName || !fieldName) {
            return NextResponse.json({
                success: false,
                error: 'connectionId, instanceName e fieldName são obrigatórios'
            }, { status: 400 })
        }

        // Validate field name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
            return NextResponse.json({
                success: false,
                error: 'Nome do campo inválido. Use apenas letras, números e underscore.'
            }, { status: 400 })
        }

        const chatSupabase = createChatSupabaseAdminClient()

        console.log(`📝 [Global Field] Adding "${fieldName}" via RPC for ${instanceName}...`)

        // Try RPC first (instant, single SQL query)
        const { data: rpcResult, error: rpcError } = await chatSupabase.rpc('add_global_metadata_field', {
            p_instance_name: instanceName,
            p_user_id: auth.ownerUserId,
            p_field_name: fieldName,
            p_field_value: defaultValue || ''
        })

        if (!rpcError && rpcResult && rpcResult.length > 0) {
            const result = rpcResult[0]
            console.log(`✅ [Global Field] RPC Success: Updated ${result.updated_count} of ${result.total_count} contacts`)

            return NextResponse.json({
                success: true,
                message: `Campo "${fieldName}" adicionado a ${result.updated_count} contatos`,
                updatedCount: result.updated_count,
                totalContacts: result.total_count
            })
        }

        // Fallback if RPC not available
        console.log(`⚠️ [Global Field] RPC failed or not available, using SQL fallback...`)

        if (rpcError) {
            console.error('RPC Error:', rpcError.message)
        }

        // Direct SQL via admin client update
        // Count contacts first
        const { count: totalCount } = await chatSupabase
            .from('whatsapp_conversations')
            .select('contact_id', { count: 'exact', head: true })
            .eq('instance_name', instanceName)
            .eq('user_id', auth.ownerUserId)
            .not('contact_id', 'is', null)

        // Get distinct contact IDs and update them
        // Using a single batch update with .in()
        const { data: convs } = await chatSupabase
            .from('whatsapp_conversations')
            .select('contact_id')
            .eq('instance_name', instanceName)
            .eq('user_id', auth.ownerUserId)
            .not('contact_id', 'is', null)
            .limit(5000) // Higher limit for fallback

        const contactIds = [...new Set(convs?.map(c => c.contact_id) || [])]

        if (contactIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Nenhum contato encontrado'
            }, { status: 404 })
        }

        // In fallback mode, just add the field to all contacts with COALESCE
        // We can't use jsonb_set directly, so we'll use a batch approach
        let updatedCount = 0
        const BATCH = 200

        for (let i = 0; i < contactIds.length; i += BATCH) {
            const batch = contactIds.slice(i, i + BATCH)

            // Fetch and update
            const { data: contacts } = await chatSupabase
                .from('whatsapp_contacts')
                .select('id, metadata')
                .in('id', batch)

            const updates = contacts?.filter(c => {
                const meta = c.metadata || {}
                return !(fieldName in meta)
            }).map(c => ({
                id: c.id,
                metadata: { ...(c.metadata || {}), [fieldName]: defaultValue || '' }
            })) || []

            for (const upd of updates) {
                await chatSupabase
                    .from('whatsapp_contacts')
                    .update({ metadata: upd.metadata })
                    .eq('id', upd.id)
                updatedCount++
            }
        }

        console.log(`✅ [Global Field] Fallback updated ${updatedCount} of ${contactIds.length} contacts`)

        return NextResponse.json({
            success: true,
            message: `Campo "${fieldName}" adicionado a ${updatedCount} contatos (modo fallback)`,
            updatedCount,
            totalContacts: contactIds.length
        })

    } catch (error) {
        console.error('Error in global-field POST:', error)
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 })
    }
}
