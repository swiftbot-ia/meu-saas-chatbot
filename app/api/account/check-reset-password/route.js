// =============================================================================
// API Route: /api/account/check-reset-password
// =============================================================================
// GET - Check if current user must reset their password
// POST - Clear the must_reset_password flag after reset
// =============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mustResetPassword, clearMustResetPassword } from '@/lib/account-service'

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
// GET - Check if user must reset password
// =============================================================================
export async function GET() {
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
        const mustReset = await mustResetPassword(userId)

        return NextResponse.json({
            success: true,
            mustResetPassword: mustReset
        })

    } catch (error) {
        console.error('❌ [API] Error checking reset password:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// =============================================================================
// POST - Clear the must_reset_password flag
// =============================================================================
export async function POST() {
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
        const cleared = await clearMustResetPassword(userId)

        if (!cleared) {
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar flag' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Flag de reset limpa'
        })

    } catch (error) {
        console.error('❌ [API] Error clearing reset password flag:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
