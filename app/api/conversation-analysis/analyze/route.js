// app/api/conversation-analysis/analyze/route.js
// ============================================================================
// POST /api/conversation-analysis/analyze
// Starts analysis for a connection
// ============================================================================

import { NextResponse } from 'next/server'
import { ConversationAnalyzer } from '../../../../lib/conversation-analysis/analyzer.js'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function POST(request) {
    try {
        const body = await request.json()
        const { connection_id, period } = body

        if (!connection_id) {
            return NextResponse.json(
                { error: 'connection_id is required' },
                { status: 400 }
            )
        }

        // Verify connection exists and get user_id
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, user_id, instance_name')
            .eq('id', connection_id)
            .single()

        if (connError || !connection) {
            return NextResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            )
        }

        // Start analysis
        const analyzer = new ConversationAnalyzer()
        const job = await analyzer.startAnalysis(connection_id, connection.user_id, {
            period: period || {}
        })

        return NextResponse.json({
            success: true,
            job_id: job.id,
            status: job.status,
            message: 'Análise iniciada. Use o job_id para verificar o status.'
        })

    } catch (error) {
        console.error('Error starting analysis:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
