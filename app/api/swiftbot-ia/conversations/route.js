// app/api/swiftbot-ia/conversations/route.js
// ============================================================================
// GET /api/swiftbot-ia/conversations - List user's conversations
// POST /api/swiftbot-ia/conversations - Create new conversation
// ============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import chatService from '../../../../lib/swiftbot-ia/chat-service'

async function getUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                }
            }
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function GET(request) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Ler connectionId da query string
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        const conversations = await chatService.getConversations(user.id, connectionId)

        // Format dates for display
        const formatted = conversations.map(conv => ({
            ...conv,
            date: formatDate(conv.updated_at || conv.created_at)
        }))

        return NextResponse.json({ conversations: formatted })

    } catch (error) {
        console.error('[API] Conversations GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const connectionId = body.connectionId || null

        const conversation = await chatService.createConversation(user.id, connectionId)

        return NextResponse.json({
            conversation: {
                ...conversation,
                date: 'Agora'
            }
        })

    } catch (error) {
        console.error('[API] Conversations POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`

    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}
