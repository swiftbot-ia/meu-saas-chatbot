// app/api/whatsapp/sync/route.js
// ============================================================================
// API Route: Iniciar Sincronização em Background
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import SyncService from '@/lib/SyncService'
import { getSyncJob, getActiveJobByConnection } from '@/lib/syncJobManager'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/sync
 * Inicia sincronização completa de contatos e mensagens em background
 */
export async function POST(request) {
    try {
        const body = await request.json()
        const { connectionId } = body

        if (!connectionId) {
            return NextResponse.json(
                { success: false, error: 'connectionId é obrigatório' },
                { status: 400 }
            )
        }

        console.log('🔄 [Sync API] Iniciando sincronização para:', connectionId)

        // Buscar conexão com token
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_token, is_connected, instance_name')
            .eq('id', connectionId)
            .single()

        if (connError || !connection) {
            return NextResponse.json(
                { success: false, error: 'Conexão não encontrada' },
                { status: 404 }
            )
        }

        if (!connection.is_connected) {
            return NextResponse.json(
                { success: false, error: 'Instância não está conectada' },
                { status: 400 }
            )
        }

        if (!connection.instance_token) {
            return NextResponse.json(
                { success: false, error: 'Token da instância não encontrado' },
                { status: 400 }
            )
        }

        // Verificar se já existe sync em andamento
        const existingJob = getActiveJobByConnection(connectionId)
        if (existingJob) {
            return NextResponse.json({
                success: true,
                message: 'Sincronização já em andamento',
                jobId: existingJob.id,
                job: existingJob
            })
        }

        // Iniciar sincronização em background
        const job = await SyncService.runFullSync(connectionId, connection.instance_token)

        return NextResponse.json({
            success: true,
            message: 'Sincronização iniciada em background',
            jobId: job.id
        })

    } catch (error) {
        console.error('❌ [Sync API] Erro:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

/**
 * GET /api/whatsapp/sync?connectionId=xxx
 * Busca status do sync ativo para uma conexão
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json(
                { success: false, error: 'connectionId é obrigatório' },
                { status: 400 }
            )
        }

        const job = getActiveJobByConnection(connectionId)

        if (!job) {
            return NextResponse.json({
                success: true,
                hasActiveSync: false,
                job: null
            })
        }

        return NextResponse.json({
            success: true,
            hasActiveSync: true,
            job: {
                id: job.id,
                status: job.status,
                progress: job.progress,
                stats: job.stats,
                startTime: job.startTime,
                updatedAt: job.updatedAt
            }
        })

    } catch (error) {
        console.error('❌ [Sync API] Erro ao buscar status:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
