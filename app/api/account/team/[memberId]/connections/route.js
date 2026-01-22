// =============================================================================
// API Route: /api/account/team/[memberId]/connections
// =============================================================================
// GET - Get connections for a specific member
// PATCH - Update connections for a member
// =============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    canManageTeam,
    getMemberConnections,
    updateMemberConnections,
    getAccountConnections,
    getAccountForUser
} from '@/lib/account-service'
import { supabaseAdmin } from '@/lib/supabase/server.js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper to create auth client
async function createAuthClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )
}

// =============================================================================
// GET - Get member's connections
// =============================================================================
export async function GET(request, { params }) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const userId = session.user.id
        const { memberId } = await params

        if (!memberId) {
            return NextResponse.json(
                { success: false, error: 'ID do membro é obrigatório' },
                { status: 400 }
            )
        }

        // Check if user can manage team
        const canManage = await canManageTeam(userId)
        if (!canManage) {
            return NextResponse.json(
                { success: false, error: 'Sem permissão para ver conexões' },
                { status: 403 }
            )
        }

        // Get member info to get account_id
        const { data: member } = await supabaseAdmin
            .from('account_members')
            .select('user_id, role')
            .eq('id', memberId)
            .single()

        if (!member) {
            return NextResponse.json(
                { success: false, error: 'Membro não encontrado' },
                { status: 404 }
            )
        }

        // Get member's connection IDs
        const connectionIds = await getMemberConnections(memberId)

        return NextResponse.json({
            success: true,
            connectionIds,
            role: member.role
        })

    } catch (error) {
        console.error('❌ [API] Error getting member connections:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// =============================================================================
// PATCH - Update member's connections
// =============================================================================
export async function PATCH(request, { params }) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const userId = session.user.id
        const { memberId } = await params

        if (!memberId) {
            return NextResponse.json(
                { success: false, error: 'ID do membro é obrigatório' },
                { status: 400 }
            )
        }

        // Check if user can manage team
        const canManage = await canManageTeam(userId)
        if (!canManage) {
            return NextResponse.json(
                { success: false, error: 'Sem permissão para editar conexões' },
                { status: 403 }
            )
        }

        // Get request body
        const body = await request.json()
        const { connectionIds } = body

        if (!Array.isArray(connectionIds)) {
            return NextResponse.json(
                { success: false, error: 'connectionIds deve ser um array' },
                { status: 400 }
            )
        }

        // Update connections
        const result = await updateMemberConnections(memberId, connectionIds)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        console.log('✅ [API] Member connections updated:', memberId)

        return NextResponse.json({
            success: true,
            message: 'Conexões atualizadas com sucesso'
        })

    } catch (error) {
        console.error('❌ [API] Error updating member connections:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
