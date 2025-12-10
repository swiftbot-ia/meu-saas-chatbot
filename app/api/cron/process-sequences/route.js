// app/api/cron/process-sequences/route.js
/**
 * Cron endpoint for processing pending sequence messages
 * This should be called by an external cron job (crontab, PM2, etc.)
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import SequenceService from '@/lib/SequenceService'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function POST(request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.warn('⚠️ [Cron] Unauthorized access attempt')
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🕐 [Cron] Starting sequence processing...')
        const startTime = Date.now()

        // Process pending subscriptions
        const result = await SequenceService.processPendingSubscriptions()

        const duration = Date.now() - startTime
        console.log(`✅ [Cron] Completed in ${duration}ms`, result)

        return Response.json({
            success: true,
            ...result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('❌ [Cron] Error processing sequences:', error)
        return Response.json({
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

// Also support GET for easier testing
export async function GET(request) {
    return POST(request)
}
