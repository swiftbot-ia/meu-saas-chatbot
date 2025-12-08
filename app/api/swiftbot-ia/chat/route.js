// app/api/swiftbot-ia/chat/route.js
// ============================================================================
// POST /api/swiftbot-ia/chat - Send message and get AI response
// ============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import chatService from '../../../../lib/swiftbot-ia/chat-service'
import creditsService from '../../../../lib/swiftbot-ia/credits-service'

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

export async function POST(request) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, connectionId, message, history } = body

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
        }

        if (!message?.trim()) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 })
        }

        // Check credits first
        const hasCredits = await creditsService.hasCredits(user.id, 1)
        if (!hasCredits) {
            return NextResponse.json({
                error: 'Créditos insuficientes',
                code: 'INSUFFICIENT_CREDITS',
                balance: 0
            }, { status: 402 })
        }

        // Process message
        const result = await chatService.processMessage({
            userId: user.id,
            conversationId,
            connectionId,
            userMessage: message,
            conversationHistory: history || []
        })

        // Get updated balance
        const { balance } = await creditsService.getBalance(user.id)

        return NextResponse.json({
            success: true,
            message: result.message,
            tokensUsed: result.tokensUsed,
            creditsCharged: result.creditsCharged,
            newBalance: balance,
            formattedBalance: balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        })

    } catch (error) {
        console.error('[API] Chat error:', error)

        if (error.message === 'INSUFFICIENT_CREDITS') {
            return NextResponse.json({
                error: 'Créditos insuficientes',
                code: 'INSUFFICIENT_CREDITS'
            }, { status: 402 })
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
