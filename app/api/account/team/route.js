// =============================================================================
// API Route: /api/account/team
// =============================================================================
// GET - List all team members
// POST - Create a new team member
// =============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    getAccountForUser,
    getAccountMembers,
    createMember,
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
// GET - List team members
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

        // Get members
        const members = await getAccountMembers(account.id)

        return NextResponse.json({
            success: true,
            account: {
                id: account.id,
                name: account.name,
                maxMembers: account.max_members
            },
            members,
            currentUserId: userId,
            isOwner: account.userRole === 'owner'
        })

    } catch (error) {
        console.error('❌ [API] Error listing team members:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// =============================================================================
// POST - Create new team member
// =============================================================================
export async function POST(request) {
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

        // Check if user is owner
        const isOwner = await isAccountOwner(userId)
        if (!isOwner) {
            return NextResponse.json(
                { success: false, error: 'Apenas o proprietário pode adicionar membros' },
                { status: 403 }
            )
        }

        // Get request body
        const body = await request.json()
        const { email, password, fullName } = body

        // Validate required fields
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { success: false, error: 'Email, senha e nome são obrigatórios' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Email inválido' },
                { status: 400 }
            )
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
                { status: 400 }
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

        // Create member
        const result = await createMember(
            account.id,
            email,
            password,
            fullName,
            userId
        )

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        console.log('✅ [API] Team member created:', result.member.email)

        return NextResponse.json({
            success: true,
            member: result.member,
            message: 'Membro adicionado com sucesso'
        })

    } catch (error) {
        console.error('❌ [API] Error creating team member:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
