// =============================================================================
// API Route: /api/account/team/[memberId]
// =============================================================================
// DELETE - Remove a team member
// =============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    getAccountForUser,
    removeMember,
    isAccountOwner
} from '@/lib/account-service'

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
// DELETE - Remove team member
// =============================================================================
export async function DELETE(request, { params }) {
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

        // Check if user is owner
        const isOwner = await isAccountOwner(userId)
        if (!isOwner) {
            return NextResponse.json(
                { success: false, error: 'Apenas o proprietário pode remover membros' },
                { status: 403 }
            )
        }

        // Get user's account
        const account = await getAccountForUser(userId)
        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Conta não encontrada' },
                { status: 404 }
            )
        }

        // Remove member (memberId here is the user_id of the member to remove)
        const result = await removeMember(account.id, memberId)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        console.log('✅ [API] Team member removed:', memberId)

        return NextResponse.json({
            success: true,
            message: 'Membro removido com sucesso'
        })

    } catch (error) {
        console.error('❌ [API] Error removing team member:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
