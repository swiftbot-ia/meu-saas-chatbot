// =============================================================================
// API Route: /api/account/connections
// =============================================================================
// GET - List all WhatsApp connections for the account
// =============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAccountForUser, getAccountConnections, getMemberAllowedConnections } from '@/lib/account-service'

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
// GET - List all connections
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

        // Get user's account
        const account = await getAccountForUser(userId)

        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Conta não encontrada' },
                { status: 404 }
            )
        }

        // Get connections (only owners can see all connections)
        const connections = await getAccountConnections(account.owner_user_id)

        // Filter based on permissions
        const { connectionIds, hasRestrictions } = await getMemberAllowedConnections(userId)

        let visibleConnections = connections
        if (hasRestrictions) {
            visibleConnections = connections.filter(c => connectionIds.includes(c.id))
        }

        return NextResponse.json({
            success: true,
            connections: visibleConnections.map(conn => ({
                id: conn.id,
                phoneNumber: conn.phone_number,
                status: conn.status,
                name: conn.profile_name || conn.instance_name || conn.phone_number,
                createdAt: conn.created_at
            }))
        })

    } catch (error) {
        console.error('❌ [API] Error listing connections:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
