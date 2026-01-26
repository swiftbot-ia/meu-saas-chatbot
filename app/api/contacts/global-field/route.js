/**
 * Global Custom Field API
 * 
 * Uses `custom_field_definitions` table as field registry.
 * Contact values continue to be stored in whatsapp_contacts.metadata JSONB.
 * 
 * GET /api/contacts/global-field - List field definitions
 * POST /api/contacts/global-field - Create field definition
 * PUT /api/contacts/global-field - Update field definition (rename)
 * DELETE /api/contacts/global-field - Delete field definition
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getOwnerUserIdFromMember } from '@/lib/account-service'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Main DB Admin (has custom_field_definitions table)
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

async function getAuthAndConnection(request) {
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

    // Get connectionId from query params or body
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    return { userId, ownerUserId, connectionId }
}

/**
 * GET /api/contacts/global-field
 * List field definitions from custom_field_definitions table
 */
export async function GET(request) {
    try {
        const auth = await getAuthAndConnection(request)
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')
        const instanceName = searchParams.get('instanceName')

        if (!connectionId && !instanceName) {
            return NextResponse.json({
                success: false,
                error: 'connectionId ou instanceName é obrigatório'
            }, { status: 400 })
        }

        const mainDb = getMainDbAdmin()

        // If we have connectionId, use it directly
        let targetConnectionId = connectionId

        // If only instanceName provided, lookup connectionId
        if (!targetConnectionId && instanceName) {
            const { data: conn } = await mainDb
                .from('whatsapp_connections')
                .select('id')
                .eq('instance_name', instanceName)
                .eq('user_id', auth.ownerUserId)
                .single()

            if (conn) targetConnectionId = conn.id
        }

        if (!targetConnectionId) {
            return NextResponse.json({
                success: false,
                error: 'Conexão não encontrada'
            }, { status: 404 })
        }

        // Query field definitions
        const { data: fields, error } = await mainDb
            .from('custom_field_definitions')
            .select('id, name, display_name, field_type, default_value, is_required, created_at')
            .eq('connection_id', targetConnectionId)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching custom fields:', error)
            return NextResponse.json({ success: false, error: 'Erro ao buscar campos' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            fields: (fields || []).map(f => ({
                id: f.id,
                name: f.name,
                displayName: f.display_name || f.name,
                fieldType: f.field_type,
                defaultValue: f.default_value,
                isRequired: f.is_required
            }))
        })

    } catch (error) {
        console.error('Error in global-field GET:', error)
        return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
    }
}

/**
 * POST /api/contacts/global-field
 * Create a new field definition (instant, no contact updates needed)
 */
export async function POST(request) {
    try {
        const auth = await getAuthAndConnection(request)
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const body = await request.json()
        const { connectionId, name, displayName, fieldType, defaultValue, isRequired } = body

        // Also support legacy 'fieldName' parameter
        const fieldName = name || body.fieldName

        if (!connectionId || !fieldName) {
            return NextResponse.json({
                success: false,
                error: 'connectionId e name são obrigatórios'
            }, { status: 400 })
        }

        // Validate field name format
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
            return NextResponse.json({
                success: false,
                error: 'Nome do campo inválido. Use apenas letras, números e underscore, começando com letra.'
            }, { status: 400 })
        }

        const mainDb = getMainDbAdmin()

        // Insert field definition
        const { data: field, error } = await mainDb
            .from('custom_field_definitions')
            .insert({
                connection_id: connectionId,
                name: fieldName,
                display_name: displayName || fieldName,
                field_type: fieldType || 'text',
                default_value: defaultValue || '',
                is_required: isRequired || false
            })
            .select()
            .single()

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') {
                return NextResponse.json({
                    success: false,
                    error: `Campo "${fieldName}" já existe`
                }, { status: 409 })
            }
            console.error('Error creating custom field:', error)
            return NextResponse.json({ success: false, error: 'Erro ao criar campo' }, { status: 500 })
        }

        console.log(`✅ [Custom Field] Created field "${fieldName}" for connection ${connectionId}`)

        return NextResponse.json({
            success: true,
            message: `Campo "${fieldName}" criado com sucesso`,
            field: {
                id: field.id,
                name: field.name,
                displayName: field.display_name,
                fieldType: field.field_type,
                defaultValue: field.default_value
            }
        })

    } catch (error) {
        console.error('Error in global-field POST:', error)
        return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
    }
}

/**
 * PUT /api/contacts/global-field
 * Update field definition (rename, change type, etc.)
 */
export async function PUT(request) {
    try {
        const auth = await getAuthAndConnection(request)
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const body = await request.json()
        const { connectionId, fieldId, oldFieldName, newFieldName, displayName, fieldType, defaultValue, isRequired } = body

        if (!connectionId) {
            return NextResponse.json({ success: false, error: 'connectionId é obrigatório' }, { status: 400 })
        }

        const mainDb = getMainDbAdmin()

        // Build update object
        const updateData = { updated_at: new Date().toISOString() }

        if (newFieldName) {
            // Validate new field name
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newFieldName)) {
                return NextResponse.json({
                    success: false,
                    error: 'Nome do campo inválido'
                }, { status: 400 })
            }
            updateData.name = newFieldName
        }
        if (displayName !== undefined) updateData.display_name = displayName
        if (fieldType !== undefined) updateData.field_type = fieldType
        if (defaultValue !== undefined) updateData.default_value = defaultValue
        if (isRequired !== undefined) updateData.is_required = isRequired

        // Find field by ID or oldFieldName
        let query = mainDb.from('custom_field_definitions').update(updateData)

        if (fieldId) {
            query = query.eq('id', fieldId)
        } else if (oldFieldName) {
            query = query.eq('connection_id', connectionId).eq('name', oldFieldName)
        } else {
            return NextResponse.json({ success: false, error: 'fieldId ou oldFieldName é obrigatório' }, { status: 400 })
        }

        const { data: updatedField, error } = await query.select().single()

        if (error) {
            console.error('Error updating custom field:', error)
            return NextResponse.json({ success: false, error: 'Erro ao atualizar campo' }, { status: 500 })
        }

        console.log(`✅ [Custom Field] Updated field ${fieldId || oldFieldName}`)

        return NextResponse.json({
            success: true,
            message: 'Campo atualizado com sucesso',
            field: updatedField
        })

    } catch (error) {
        console.error('Error in global-field PUT:', error)
        return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
    }
}

/**
 * DELETE /api/contacts/global-field
 * Delete field definition
 */
export async function DELETE(request) {
    try {
        const auth = await getAuthAndConnection(request)
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')
        const fieldId = searchParams.get('fieldId')
        const fieldName = searchParams.get('fieldName')

        if (!connectionId) {
            return NextResponse.json({ success: false, error: 'connectionId é obrigatório' }, { status: 400 })
        }

        if (!fieldId && !fieldName) {
            return NextResponse.json({ success: false, error: 'fieldId ou fieldName é obrigatório' }, { status: 400 })
        }

        const mainDb = getMainDbAdmin()

        // Delete by ID or name
        let query = mainDb.from('custom_field_definitions').delete()

        if (fieldId) {
            query = query.eq('id', fieldId)
        } else {
            query = query.eq('connection_id', connectionId).eq('name', fieldName)
        }

        const { error } = await query

        if (error) {
            console.error('Error deleting custom field:', error)
            return NextResponse.json({ success: false, error: 'Erro ao deletar campo' }, { status: 500 })
        }

        console.log(`✅ [Custom Field] Deleted field ${fieldId || fieldName}`)

        return NextResponse.json({
            success: true,
            message: 'Campo deletado com sucesso'
        })

    } catch (error) {
        console.error('Error in global-field DELETE:', error)
        return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
    }
}
