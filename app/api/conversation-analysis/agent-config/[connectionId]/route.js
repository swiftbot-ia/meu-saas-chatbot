// app/api/conversation-analysis/agent-config/[connectionId]/route.js
// ============================================================================
// GET /api/conversation-analysis/agent-config/:connectionId
// Get suggested agent configuration for Agent Config "Gerar com IA" button
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function GET(request, { params }) {
    try {
        const { connectionId } = await params

        if (!connectionId) {
            return NextResponse.json(
                { error: 'connectionId is required' },
                { status: 400 }
            )
        }

        // Get the latest completed report with suggested agent config
        const { data: report, error } = await supabaseAdmin
            .from('conversation_analysis_reports')
            .select('id, connection_id, connection_name, analysis_date, suggested_agent_config')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    {
                        error: 'Nenhuma análise encontrada para esta conexão.',
                        has_report: false,
                        message: 'Sincronize suas conversas primeiro para gerar a configuração com IA.'
                    },
                    { status: 404 }
                )
            }
            throw new Error(error.message)
        }

        const config = report.suggested_agent_config || {}

        return NextResponse.json({
            connection_id: report.connection_id,
            connection_name: report.connection_name,
            last_updated: report.analysis_date,
            has_report: true,
            suggested_config: config,
            form_values: config.form_values || {}
        })

    } catch (error) {
        console.error('Error fetching agent config:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
