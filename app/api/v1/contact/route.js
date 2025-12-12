/**
 * API v1: Contact Endpoints
 * 
 * POST /api/v1/contact - Create a new contact
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
 * POST /api/v1/contact
 * Create a new contact
 * 
 * Body: { phone: string, name?: string }
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

        // Parse body
        const body = await request.json()
        const { phone, name } = body

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'phone is required' },
                { status: 400 }
            )
        }

        // Normalize phone number (remove non-digits)
        const normalizedPhone = phone.replace(/\D/g, '')

        if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format' },
                { status: 400 }
            )
        }

        const chatDb = getChatDb()

        // Check if contact already exists
        const { data: existingContact } = await chatDb
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name')
            .eq('whatsapp_number', normalizedPhone)
            .single()

        if (existingContact) {
            // Update name if provided
            if (name && name !== existingContact.name) {
                await chatDb
                    .from('whatsapp_contacts')
                    .update({ name, updated_at: new Date().toISOString() })
                    .eq('id', existingContact.id)

                existingContact.name = name
            }

            return NextResponse.json({
                success: true,
                contact: existingContact,
                created: false
            })
        }

        // Create new contact
        const { data: newContact, error: insertError } = await chatDb
            .from('whatsapp_contacts')
            .insert({
                whatsapp_number: normalizedPhone,
                name: name || null,
                first_message_at: new Date().toISOString()
            })
            .select('id, whatsapp_number, name')
            .single()

        if (insertError) {
            console.error('[API v1] Error creating contact:', insertError)
            return NextResponse.json(
                { success: false, error: 'Failed to create contact' },
                { status: 500 }
            )
        }

        // Create conversation for this contact
        const { data: conversation, error: convError } = await chatDb
            .from('whatsapp_conversations')
            .insert({
                instance_name: auth.instanceName,
                connection_id: auth.connectionId,
                user_id: auth.userId,
                contact_id: newContact.id,
                funnel_stage: 'novo'
            })
            .select('id')
            .single()

        if (convError) {
            console.error('[API v1] Error creating conversation:', convError)
        }

        return NextResponse.json({
            success: true,
            contact: {
                ...newContact,
                conversation_id: conversation?.id
            },
            created: true
        })

    } catch (error) {
        console.error('[API v1] Contact POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
