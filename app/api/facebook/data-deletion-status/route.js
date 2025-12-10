// =============================================================================
// Data Deletion Status API
// GET /api/facebook/data-deletion-status
// 
// Retorna o status de uma solicitação de exclusão de dados
// =============================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/facebook/data-deletion-status?code=XXX
 * 
 * Retorna o status de uma solicitação de exclusão
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const confirmationCode = searchParams.get('code')

        if (!confirmationCode) {
            return NextResponse.json(
                { error: 'Código de confirmação não fornecido' },
                { status: 400 }
            )
        }

        // Buscar solicitação
        const { data, error } = await supabaseAdmin
            .from('data_deletion_requests')
            .select(`
        id,
        status,
        requested_at,
        processed_at,
        completed_at,
        deleted_tables,
        retained_tables
      `)
            .eq('confirmation_code', confirmationCode)
            .single()

        if (error || !data) {
            return NextResponse.json(
                {
                    found: false,
                    error: 'Solicitação não encontrada'
                },
                { status: 404 }
            )
        }

        // Mapear status para português
        const statusMap = {
            'pending': 'Pendente',
            'processing': 'Em processamento',
            'completed': 'Concluída',
            'partial': 'Parcialmente concluída',
            'failed': 'Falhou'
        }

        // Contar tabelas
        const deletedCount = Array.isArray(data.deleted_tables) ? data.deleted_tables.length : 0
        const retainedCount = Array.isArray(data.retained_tables) ? data.retained_tables.length : 0

        return NextResponse.json({
            found: true,
            confirmationCode,
            status: data.status,
            statusLabel: statusMap[data.status] || data.status,
            requestedAt: data.requested_at,
            processedAt: data.processed_at,
            completedAt: data.completed_at,
            summary: {
                tablesDeleted: deletedCount,
                tablesRetained: retainedCount,
                retentionReason: retainedCount > 0 ?
                    'Alguns dados foram mantidos por obrigação legal (LGPD Art. 16, II - CTN Art. 173)' :
                    null
            }
        })

    } catch (error) {
        console.error('❌ [DeletionStatus] Error:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
