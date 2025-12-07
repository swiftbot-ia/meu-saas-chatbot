// app/api/conversation-analysis/knowledge/[connectionId]/route.js
// ============================================================================
// GET /api/conversation-analysis/knowledge/:connectionId
// Get knowledge base for SwiftBot IA consumption
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

        // Get the latest completed report with knowledge base
        const { data: report, error } = await supabaseAdmin
            .from('conversation_analysis_reports')
            .select('id, connection_id, connection_name, analysis_date, knowledge_base')
            .eq('connection_id', connectionId)
            .eq('status', 'completed')
            .order('analysis_date', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'No knowledge base found. Please analyze conversations first.' },
                    { status: 404 }
                )
            }
            throw new Error(error.message)
        }

        const kb = report.knowledge_base || {}

        // Build quick lookups for the agent
        const faq_lookup = {}
        const pricing_lookup = {}

        if (kb.faqs) {
            kb.faqs.forEach(faq => {
                // Normalize question as key
                const key = faq.question?.toLowerCase().trim()
                if (key) {
                    faq_lookup[key] = faq.answer
                }
            })
        }

        if (kb.pricing) {
            kb.pricing.forEach(p => {
                const key = p.item?.toLowerCase().trim()
                if (key) {
                    pricing_lookup[key] = p.price
                }
            })
        }

        return NextResponse.json({
            connection_id: report.connection_id,
            connection_name: report.connection_name,
            last_updated: report.analysis_date,
            knowledge_base: kb,
            prompt_context: kb.prompt_context || '',
            faq_lookup,
            pricing_lookup
        })

    } catch (error) {
        console.error('Error fetching knowledge base:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
