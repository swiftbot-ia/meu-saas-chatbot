// app/api/swiftbot-ia/conversations/[id]/route.js
// ============================================================================
// GET /api/swiftbot-ia/conversations/[id] - Get conversation with messages
// DELETE /api/swiftbot-ia/conversations/[id] - Delete conversation
// ============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import chatService from '../../../../../lib/swiftbot-ia/chat-service'

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

export async function GET(request, { params }) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const conversation = await chatService.getConversation(id, user.id)

        return NextResponse.json({ conversation })

    } catch (error) {
        console.error('[API] Conversation GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        await chatService.deleteConversation(id, user.id)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[API] Conversation DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
