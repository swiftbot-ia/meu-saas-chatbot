// app/api/whatsapp/sync/status/[jobId]/route.js
// ============================================================================
// API Route: Verificar Status de um Job de Sincronização
// ============================================================================

import { NextResponse } from 'next/server'
import { getSyncJob } from '@/lib/syncJobManager'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/sync/status/:jobId
 * Retorna status detalhado de um job específico
 */
export async function GET(request, { params }) {
    try {
        const { jobId } = await params

        if (!jobId) {
            return NextResponse.json(
                { success: false, error: 'jobId é obrigatório' },
                { status: 400 }
            )
        }

        const job = getSyncJob(jobId)

        if (!job) {
            return NextResponse.json(
                { success: false, error: 'Job não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                connectionId: job.connectionId,
                type: job.type,
                status: job.status,
                progress: job.progress,
                stats: job.stats,
                errors: job.errors.slice(-5), // Últimos 5 erros
                startTime: job.startTime,
                endTime: job.endTime,
                updatedAt: job.updatedAt
            }
        })

    } catch (error) {
        console.error('❌ [Sync Status] Erro:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
