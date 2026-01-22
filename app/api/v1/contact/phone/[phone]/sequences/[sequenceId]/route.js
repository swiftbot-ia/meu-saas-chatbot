/**
 * API v1: Sequence Enrollment for Contact by Phone
 * 
 * POST /api/v1/contact/phone/{phone}/sequences/{sequenceId} - Add contact to sequence
 * DELETE /api/v1/contact/phone/{phone}/sequences/{sequenceId} - Remove contact from sequence
 * 
 * Authentication: X-API-KEY header
 */

import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import SequenceService from '@/lib/SequenceService'

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
 * POST /api/v1/contact/phone/{phone}/sequences/{sequenceId}
 * Add contact to a sequence by phone number
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

        const { phone, sequenceId } = await params

        if (!phone || !sequenceId) {
            return NextResponse.json(
                { success: false, error: 'phone and sequenceId are required' },
                { status: 400 }
            )
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        const chatDb = getChatDb()
        const mainDb = getMainDb()

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

        // Verify sequence exists and belongs to this connection
        const { data: sequence, error: seqError } = await mainDb
            .from('automation_sequences')
            .select('id, name, connection_id, is_active')
            .eq('id', sequenceId)
            .eq('connection_id', auth.connectionId)
            .single()

        if (seqError || !sequence) {
            return NextResponse.json(
                { success: false, error: 'Sequence not found' },
                { status: 404 }
            )
        }

        if (!sequence.is_active) {
            return NextResponse.json(
                { success: false, error: 'Sequence is not active' },
                { status: 400 }
            )
        }

        // Enroll contact in sequence
        const result = await SequenceService.enrollContact(
            sequenceId,
            contact.id,
            auth.connectionId
        )

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.reason === 'already_enrolled'
                    ? 'Contact is already enrolled in this sequence'
                    : (result.error || 'Failed to enroll contact')
            }, { status: 400 })
        }

        console.log(`📋 [API v1] Contact ${contact.whatsapp_number} enrolled in sequence: ${sequence.name}`)

        return NextResponse.json({
            success: true,
            message: `Contact enrolled in sequence: ${sequence.name}`,
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number
            },
            nextStepAt: result.nextStepAt
        })

    } catch (error) {
        console.error('[API v1] Sequence enrollment error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/v1/contact/phone/{phone}/sequences/{sequenceId}
 * Remove contact from a sequence by phone number
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

        const { phone, sequenceId } = await params

        if (!phone || !sequenceId) {
            return NextResponse.json(
                { success: false, error: 'phone and sequenceId are required' },
                { status: 400 }
            )
        }

        // Normalize phone number
        const normalizedPhone = phone.replace(/\D/g, '')

        const chatDb = getChatDb()
        const mainDb = getMainDb()

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

        // Verify sequence belongs to this connection
        const { data: sequence, error: seqError } = await mainDb
            .from('automation_sequences')
            .select('id, name, connection_id')
            .eq('id', sequenceId)
            .eq('connection_id', auth.connectionId)
            .single()

        if (seqError || !sequence) {
            return NextResponse.json(
                { success: false, error: 'Sequence not found' },
                { status: 404 }
            )
        }

        // Unenroll contact from sequence
        const result = await SequenceService.unenrollContact(sequenceId, contact.id)

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to unenroll contact'
            }, { status: 500 })
        }

        console.log(`📋 [API v1] Contact ${contact.whatsapp_number} removed from sequence: ${sequence.name}`)

        return NextResponse.json({
            success: true,
            message: `Contact removed from sequence: ${sequence.name}`,
            contact: {
                id: contact.id,
                phone: contact.whatsapp_number
            }
        })

    } catch (error) {
        console.error('[API v1] Sequence unenrollment error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
