/**
 * API v1: Contact Metadata (Custom Fields) Management
 * 
 * GET /api/v1/contact/{contactId}/metadata - Get all custom fields
 * PATCH /api/v1/contact/{contactId}/metadata - Update/add custom fields (merge)
 * PUT /api/v1/contact/{contactId}/metadata - Replace all custom fields
 * DELETE /api/v1/contact/{contactId}/metadata - Clear all custom fields
 * 
 * Authentication: X-API-KEY header
 */

import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let chatDbClient = null
async function getChatDb() {
    if (!chatDbClient) {
        const url = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
        const key = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY
        if (url && key) {
            const { createClient } = await import('@supabase/supabase-js')
            chatDbClient = createClient(url, key, { auth: { persistSession: false } })
        }
    }
    return chatDbClient
}

/**
 * GET /api/v1/contact/{contactId}/metadata
 * Get all custom fields for a contact
 */
export async function GET(request, { params }) {
    try {
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { contactId } = await params

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'contactId is required' },
                { status: 400 }
            )
        }

        const chatDb = await getChatDb()

        const { data: contact, error } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name, metadata')
            .eq('id', contactId)
            .single()

        if (error || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            contactId: contact.id,
            phone: contact.whatsapp_number,
            name: contact.name,
            metadata: contact.metadata || {}
        })

    } catch (error) {
        console.error('[API v1] Get metadata error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/v1/contact/{contactId}/metadata
 * Update/add custom fields (merges with existing)
 * 
 * Body: { [key]: value, ... }
 * Example: { "idCRM": "12345", "source": "landing_page" }
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

        const { contactId } = await params
        const body = await request.json()

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'contactId is required' },
                { status: 400 }
            )
        }

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json(
                { success: false, error: 'Body must be an object with key-value pairs' },
                { status: 400 }
            )
        }

        const chatDb = await getChatDb()

        // Get existing contact
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, metadata')
            .eq('id', contactId)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Merge existing metadata with new fields
        const existingMetadata = contact.metadata || {}
        const updatedMetadata = { ...existingMetadata, ...body }

        // Update contact
        const { error: updateError } = await chatDb
            .from('whatsapp_contacts')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', contactId)

        if (updateError) {
            console.error('[API v1] Error updating metadata:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to update metadata' },
                { status: 500 }
            )
        }

        console.log(`📝 [API v1] Metadata updated for contact ${contact.whatsapp_number}:`, Object.keys(body))

        return NextResponse.json({
            success: true,
            message: 'Metadata updated successfully',
            contactId,
            metadata: updatedMetadata
        })

    } catch (error) {
        console.error('[API v1] Update metadata error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/v1/contact/{contactId}/metadata
 * Replace all custom fields (overwrites existing)
 * 
 * Body: { [key]: value, ... }
 */
export async function PUT(request, { params }) {
    try {
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { contactId } = await params
        const body = await request.json()

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'contactId is required' },
                { status: 400 }
            )
        }

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json(
                { success: false, error: 'Body must be an object with key-value pairs' },
                { status: 400 }
            )
        }

        const chatDb = await getChatDb()

        // Verify contact exists
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('id', contactId)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Replace metadata entirely
        const { error: updateError } = await chatDb
            .from('whatsapp_contacts')
            .update({
                metadata: body,
                updated_at: new Date().toISOString()
            })
            .eq('id', contactId)

        if (updateError) {
            console.error('[API v1] Error replacing metadata:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to replace metadata' },
                { status: 500 }
            )
        }

        console.log(`📝 [API v1] Metadata replaced for contact ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            message: 'Metadata replaced successfully',
            contactId,
            metadata: body
        })

    } catch (error) {
        console.error('[API v1] Replace metadata error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/v1/contact/{contactId}/metadata
 * Clear all custom fields
 */
export async function DELETE(request, { params }) {
    try {
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { contactId } = await params

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'contactId is required' },
                { status: 400 }
            )
        }

        const chatDb = await getChatDb()

        // Verify contact exists
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('id', contactId)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            )
        }

        // Clear metadata
        const { error: updateError } = await chatDb
            .from('whatsapp_contacts')
            .update({
                metadata: {},
                updated_at: new Date().toISOString()
            })
            .eq('id', contactId)

        if (updateError) {
            console.error('[API v1] Error clearing metadata:', updateError)
            return NextResponse.json(
                { success: false, error: 'Failed to clear metadata' },
                { status: 500 }
            )
        }

        console.log(`📝 [API v1] Metadata cleared for contact ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            message: 'Metadata cleared successfully',
            contactId
        })

    } catch (error) {
        console.error('[API v1] Clear metadata error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
