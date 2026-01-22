
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import ConversationService from '@/lib/ConversationService'

export const dynamic = 'force-dynamic'

import { getMemberPermissions } from '@/lib/account-service'

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

export async function PATCH(request, { params }) {
    try {
        const supabase = await createAuthClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const { id: conversationId } = await params
        const body = await request.json()
        const { assignedTo } = body

        // Check Permissions
        const permissions = await getMemberPermissions(session.user.id)

        if (permissions && permissions.role === 'consultant') {
            const isAssigningToSelf = assignedTo === session.user.id

            if (isAssigningToSelf) {
                if (!permissions.canAssignSelf) {
                    return NextResponse.json(
                        { error: 'Você não tem permissão para atribuir conversas a si mesmo.' },
                        { status: 403 }
                    )
                }
            } else {
                // Assigning to others OR unassigning (null)
                if (!permissions.canAssignOthers) {
                    return NextResponse.json(
                        { error: 'Você não tem permissão para atribuir conversas a outros membros.' },
                        { status: 403 }
                    )
                }
            }
        }

        console.log(`👤 [Assign] Atribuindo conversa ${conversationId} para ${assignedTo || 'ninguém'}`)

        const result = await ConversationService.assignConversation(conversationId, assignedTo)

        return NextResponse.json({
            success: true,
            conversation: result,
            message: assignedTo ? 'Conversa atribuída com sucesso' : 'Conversa devolvida para a fila'
        })

    } catch (error) {
        console.error('❌ [Assign] Erro:', error)
        return NextResponse.json(
            { error: 'Erro ao atribuir conversa: ' + error.message },
            { status: 500 }
        )
    }
}
