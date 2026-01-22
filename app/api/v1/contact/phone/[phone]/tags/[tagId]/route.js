/**
 * API v1: Tag Management for Contact by Phone
 * 
 * POST /api/v1/contact/phone/{phone}/tags/{tagId} - Add tag to contact
 * DELETE /api/v1/contact/phone/{phone}/tags/{tagId} - Remove tag from contact
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

function getChatDb() {
    return createClient(chatSupabaseUrl, chatSupabaseServiceKey, {
        auth: { persistSession: false }
    })
}

/**
 * POST /api/v1/contact/phone/{phone}/tags/{tagId}
 * Add tag to a contact by phone number
 */
export async function POST(request, { params }) {
    try {
        // Validate API Key
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { phone, tagId } = await params

        if (!phone || !tagId) {
            return NextResponse.json(
                { success: false, error: 'phone and tagId are required' },
                { status: 400 }
            )
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        const chatDb = getChatDb()

        // Find contact by phone
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found with this phone number' },
                { status: 404 }
            )
        }

        // Verify tag exists and belongs to this instance
        const { data: tag, error: tagError } = await chatDb
            .from('contact_tags')
            .select('id, name, color, instance_name')
            .eq('id', tagId)
            .eq('instance_name', auth.instanceName)
            .single()

        if (tagError || !tag) {
            return NextResponse.json(
                { success: false, error: 'Tag not found' },
                { status: 404 }
            )
        }

        // Check if assignment already exists
        const { data: existingAssignment } = await chatDb
            .from('contact_tag_assignments')
            .select('id')
            .eq('contact_id', contact.id)
            .eq('tag_id', tagId)
            .single()

        if (existingAssignment) {
            return NextResponse.json({
                success: true,
                message: 'Tag already assigned to contact',
                contact: { id: contact.id, phone: contact.whatsapp_number },
                tag: { id: tag.id, name: tag.name, color: tag.color }
            })
        }

        // Create assignment
        const { error: insertError } = await chatDb
            .from('contact_tag_assignments')
            .insert({
                contact_id: contact.id,
                tag_id: tagId,
                assigned_by: auth.userId
            })

        if (insertError) {
            console.error('[API v1] Error adding tag:', insertError)
            return NextResponse.json(
                { success: false, error: 'Failed to add tag' },
                { status: 500 }
            )
        }

        console.log(`🏷️ [API v1] Tag "${tag.name}" added to contact: ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            message: `Tag "${tag.name}" added to contact`,
            contact: { id: contact.id, phone: contact.whatsapp_number },
            tag: { id: tag.id, name: tag.name, color: tag.color }
        })

    } catch (error) {
        console.error('[API v1] Add tag error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/v1/contact/phone/{phone}/tags/{tagId}
 * Remove tag from a contact by phone number
 */
export async function DELETE(request, { params }) {
    try {
        // Validate API Key
        const auth = await validateApiKey(request)
        if (!auth.valid) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: 401 }
            )
        }

        const { phone, tagId } = await params

        if (!phone || !tagId) {
            return NextResponse.json(
                { success: false, error: 'phone and tagId are required' },
                { status: 400 }
            )
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        const chatDb = getChatDb()

        // Find contact by phone
        const { data: contact, error: contactError } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (contactError || !contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found with this phone number' },
                { status: 404 }
            )
        }

        // Verify tag belongs to this instance
        const { data: tag, error: tagError } = await chatDb
            .from('contact_tags')
            .select('id, name, instance_name')
            .eq('id', tagId)
            .eq('instance_name', auth.instanceName)
            .single()

        if (tagError || !tag) {
            return NextResponse.json(
                { success: false, error: 'Tag not found' },
                { status: 404 }
            )
        }

        // Remove assignment
        const { error: deleteError } = await chatDb
            .from('contact_tag_assignments')
            .delete()
            .eq('contact_id', contact.id)
            .eq('tag_id', tagId)

        if (deleteError) {
            console.error('[API v1] Error removing tag:', deleteError)
            return NextResponse.json(
                { success: false, error: 'Failed to remove tag' },
                { status: 500 }
            )
        }

        console.log(`🏷️ [API v1] Tag "${tag.name}" removed from contact: ${contact.whatsapp_number}`)

        return NextResponse.json({
            success: true,
            message: `Tag "${tag.name}" removed from contact`,
            contact: { id: contact.id, phone: contact.whatsapp_number }
        })

    } catch (error) {
        console.error('[API v1] Remove tag error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
