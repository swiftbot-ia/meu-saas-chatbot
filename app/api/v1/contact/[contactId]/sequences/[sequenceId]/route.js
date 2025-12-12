/**
 * API v1: Sequence Enrollment for Contact
 * 
 * POST /api/v1/contact/{contactId}/sequences/{sequenceId} - Add contact to sequence
 * DELETE /api/v1/contact/{contactId}/sequences/{sequenceId} - Remove contact from sequence
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
 * POST /api/v1/contact/{contactId}/sequences/{sequenceId}
 * Add contact to a sequence
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

        const { contactId, sequenceId } = await params

        if (!contactId || !sequenceId) {
            return NextResponse.json(
                { success: false, error: 'contactId and sequenceId are required' },
                { status: 400 }
            )
        }

        const chatDb = getChatDb()
        const mainDb = getMainDb()

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
            contactId,
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
 * DELETE /api/v1/contact/{contactId}/sequences/{sequenceId}
 * Remove contact from a sequence
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

        const { contactId, sequenceId } = await params

        if (!contactId || !sequenceId) {
            return NextResponse.json(
                { success: false, error: 'contactId and sequenceId are required' },
                { status: 400 }
            )
        }

        const mainDb = getMainDb()

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
        const result = await SequenceService.unenrollContact(sequenceId, contactId)

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to unenroll contact'
            }, { status: 500 })
        }

        console.log(`📋 [API v1] Contact removed from sequence: ${sequence.name}`)

        return NextResponse.json({
            success: true,
            message: `Contact removed from sequence: ${sequence.name}`
        })

    } catch (error) {
        console.error('[API v1] Sequence unenrollment error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
