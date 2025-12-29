import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import creditsService from '../../../../lib/swiftbot-ia/credits-service'

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

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

        const { text, context } = await request.json()

        if (!text?.trim()) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        // Cost for improvement is 1 credit (simplified)
        const COST = 1

        // Check credits
        const hasCredits = await creditsService.hasCredits(user.id, COST)
        if (!hasCredits) {
            return NextResponse.json({
                error: 'Créditos insuficientes',
                code: 'INSUFFICIENT_CREDITS'
            }, { status: 402 })
        }

        // Improve text using OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Você é um especialista em copywriting para WhatsApp.
                    Sua tarefa é melhorar o texto fornecido pelo usuário para torná-lo mais engajador, persuasivo e natural.
                    
                    Regras:
                    1. Mantenha o sentido original da mensagem.
                    2. Mantenha TODAS as variáveis como {{name}}, {{phone}}, etc., EXATAMENTE como estão.
                    3. Use emojis adequados se fizer sentido, mas não exagere.
                    4. O tom deve ser profissional mas amigável.
                    5. Retorne APENAS o texto melhorado, sem explicações.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        })

        const improvedText = completion.choices[0].message.content.trim()

        // Deduct credits
        await creditsService.deductCredits(user.id, COST, 'ai_improvement', 'Melhoria de texto com IA')

        // Get updated balance
        const { balance } = await creditsService.getBalance(user.id)

        return NextResponse.json({
            success: true,
            improvedText,
            creditsCharged: COST,
            newBalance: balance
        })

    } catch (error) {
        console.error('Error improving text:', error)
        return NextResponse.json({ error: 'Failed to improve text' }, { status: 500 })
    }
}
