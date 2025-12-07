// app/api/conversation-analysis/analyze/[jobId]/route.js
// ============================================================================
// GET /api/conversation-analysis/analyze/:jobId
// Check status of an analysis job
// ============================================================================

import { NextResponse } from 'next/server'
import { getAnalysisJob } from '../../../../../lib/conversation-analysis/analyzer.js'

export async function GET(request, { params }) {
    try {
        const { jobId } = await params

        if (!jobId) {
            return NextResponse.json(
                { error: 'jobId is required' },
                { status: 400 }
            )
        }

        const job = getAnalysisJob(jobId)

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found or expired' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            job_id: job.id,
            status: job.status,
            progress: job.progress,
            current_step: job.currentStep,
            report_id: job.reportId,
            error: job.error,
            created_at: job.createdAt
        })

    } catch (error) {
        console.error('Error getting job status:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
