// app/api/conversation-analysis/reports/route.js
// ============================================================================
// GET /api/conversation-analysis/reports
// List all reports (with optional connection filter)
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connection_id')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = supabaseAdmin
            .from('conversation_analysis_reports')
            .select('id, connection_id, connection_name, analysis_date, status, total_messages, total_contacts, processing_time_ms')
            .order('analysis_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (connectionId) {
            query = query.eq('connection_id', connectionId)
        }

        const { data: reports, error } = await query

        if (error) {
            throw new Error(error.message)
        }

        // Get total count
        let countQuery = supabaseAdmin
            .from('conversation_analysis_reports')
            .select('id', { count: 'exact', head: true })

        if (connectionId) {
            countQuery = countQuery.eq('connection_id', connectionId)
        }

        const { count } = await countQuery

        return NextResponse.json({
            reports: reports || [],
            total: count || 0,
            limit,
            offset
        })

    } catch (error) {
        console.error('Error listing reports:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
