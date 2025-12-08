// app/api/swiftbot-ia/credits/route.js
// ============================================================================
// GET /api/swiftbot-ia/credits - Get user's credit balance
// POST /api/swiftbot-ia/credits - Initialize credits (if needed)
// ============================================================================

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

export async function GET() {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { balance, exists } = await creditsService.getBalance(user.id)

        return NextResponse.json({
            balance,
            exists,
            formatted: balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        })

    } catch (error) {
        console.error('[API] Credits GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST() {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await creditsService.initializeCredits(user.id)

        return NextResponse.json({
            balance: result.balance,
            created: result.created,
            formatted: result.balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        })

    } catch (error) {
        console.error('[API] Credits POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
