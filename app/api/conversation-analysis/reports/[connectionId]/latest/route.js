// app/api/conversation-analysis/reports/[connectionId]/latest/route.js
// ============================================================================
// GET /api/conversation-analysis/reports/:connectionId/latest
// Get the latest completed report for a connection
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase/server'

export async function GET(request, { params }) {
    try {
        const { connectionId } = await params

        if (!connectionId) {
            return NextResponse.json(
                { error: 'connectionId is required' },
                { status: 400 }
            )
        }

        const { data: report, error } = await supabaseAdmin
            .from('conversation_analysis_reports')
            .select('*')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'No completed report found for this connection' },
                    { status: 404 }
                )
            }
            throw new Error(error.message)
        }

        return NextResponse.json(report)

    } catch (error) {
        console.error('Error fetching latest report:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
