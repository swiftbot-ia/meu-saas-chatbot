// =============================================================================
// Facebook Data Deletion Request Callback
// POST /api/facebook/data-deletion
// 
// Este endpoint recebe solicitações de exclusão de dados do Facebook
// quando um usuário remove o app e solicita exclusão de seus dados.
// =============================================================================

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/server'
import { DataDeletionService } from '@/lib/DataDeletionService'

// Disable body parsing - we need raw body for signature verification
export const dynamic = 'force-dynamic'

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://swiftbot.com.br'

/**
 * Parse Facebook signed_request
 * @param {string} signedRequest - The signed_request from Facebook
 * @returns {object|null} Parsed payload or null if invalid
 */
function parseSignedRequest(signedRequest) {
    if (!signedRequest || !FACEBOOK_APP_SECRET) {
        console.error('❌ [FacebookDeletion] Missing signed_request or FACEBOOK_APP_SECRET')
        return null
    }

    try {
        const [encodedSig, payload] = signedRequest.split('.', 2)

        if (!encodedSig || !payload) {
            console.error('❌ [FacebookDeletion] Invalid signed_request format')
            return null
        }

        // Decode the signature
        const sig = base64UrlDecode(encodedSig)

        // Decode the payload
        const data = JSON.parse(base64UrlDecode(payload).toString('utf-8'))

        // Verify the signature using HMAC-SHA256
        const expectedSig = crypto
            .createHmac('sha256', FACEBOOK_APP_SECRET)
            .update(payload)
            .digest()

        // Constant-time comparison to prevent timing attacks
        if (!crypto.timingSafeEqual(sig, expectedSig)) {
            console.error('❌ [FacebookDeletion] Invalid signature')
            return null
        }

        console.log('✅ [FacebookDeletion] Signature verified successfully')
        return data

    } catch (error) {
        console.error('❌ [FacebookDeletion] Error parsing signed_request:', error.message)
        return null
    }
}

/**
 * Base64 URL decode (Facebook uses URL-safe base64)
 */
function base64UrlDecode(input) {
    // Replace URL-safe characters with standard base64 characters
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if necessary
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    return Buffer.from(padded, 'base64')
}

/**
 * Generate unique confirmation code
 */
function generateConfirmationCode() {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `DEL-${random}`
}

/**
 * POST /api/facebook/data-deletion
 * 
 * Receives data deletion requests from Facebook
 */
export async function POST(request) {
    console.log('📥 [FacebookDeletion] Received deletion request')

    try {
        // Check if FACEBOOK_APP_SECRET is configured
        if (!FACEBOOK_APP_SECRET) {
            console.error('❌ [FacebookDeletion] FACEBOOK_APP_SECRET not configured')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Parse form data (Facebook sends as application/x-www-form-urlencoded)
        const formData = await request.formData()
        const signedRequest = formData.get('signed_request')

        if (!signedRequest) {
            console.error('❌ [FacebookDeletion] Missing signed_request')
            return NextResponse.json(
                { error: 'Missing signed_request' },
                { status: 400 }
            )
        }

        // Parse and verify the signed request
        const data = parseSignedRequest(signedRequest)

        if (!data) {
            return NextResponse.json(
                { error: 'Invalid signed_request' },
                { status: 400 }
            )
        }

        const facebookUserId = data.user_id

        if (!facebookUserId) {
            console.error('❌ [FacebookDeletion] No user_id in payload')
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            )
        }

        console.log(`👤 [FacebookDeletion] Processing deletion for Facebook User: ${facebookUserId}`)

        // Get client info for logging
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Find the corresponding Supabase user
        const { data: supabaseUserId, error: userError } = await supabaseAdmin
            .rpc('get_user_by_facebook_id', { p_facebook_id: facebookUserId })

        let userId = supabaseUserId

        // Generate confirmation code
        const confirmationCode = generateConfirmationCode()

        // Create deletion request record
        const { data: deletionRequest, error: insertError } = await supabaseAdmin
            .from('data_deletion_requests')
            .insert({
                user_id: userId || null,
                facebook_user_id: facebookUserId,
                confirmation_code: confirmationCode,
                status: 'pending',
                ip_address: ipAddress,
                user_agent: userAgent
            })
            .select()
            .single()

        if (insertError) {
            console.error('❌ [FacebookDeletion] Error creating deletion request:', insertError)
            return NextResponse.json(
                { error: 'Failed to create deletion request' },
                { status: 500 }
            )
        }

        console.log(`📝 [FacebookDeletion] Created deletion request: ${confirmationCode}`)

        // Process deletion immediately (as requested by user)
        if (userId) {
            // Start deletion in background (don't await to respond quickly to Facebook)
            DataDeletionService.processDeletion(deletionRequest.id, userId)
                .then(() => console.log(`✅ [FacebookDeletion] Deletion completed for ${confirmationCode}`))
                .catch(err => console.error(`❌ [FacebookDeletion] Deletion failed for ${confirmationCode}:`, err))
        } else {
            console.log(`⚠️ [FacebookDeletion] No Supabase user found for Facebook ID: ${facebookUserId}`)

            // Mark as completed (no data to delete)
            await supabaseAdmin
                .from('data_deletion_requests')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    deleted_tables: [],
                    retained_tables: []
                })
                .eq('id', deletionRequest.id)
        }

        // Return response in the format Facebook expects
        const statusUrl = `${SITE_URL}/data-deletion-status?code=${confirmationCode}`

        console.log(`✅ [FacebookDeletion] Returning status URL: ${statusUrl}`)

        return NextResponse.json({
            url: statusUrl,
            confirmation_code: confirmationCode
        })

    } catch (error) {
        console.error('❌ [FacebookDeletion] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/facebook/data-deletion
 * 
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Facebook Data Deletion Callback is active',
        configured: !!FACEBOOK_APP_SECRET
    })
}
